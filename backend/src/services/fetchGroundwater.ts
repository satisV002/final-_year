// src/services/fetchGroundwater.ts
import axios from 'axios';
import NodeCache from 'node-cache';
import logger from '../utils/logger';
import { Groundwater } from '../models/Groundwater';
import { getRedisClient } from '../config/redis';

const pinCache = new NodeCache({ stdTTL: 86400, checkperiod: 120 });

// Redis fallback helpers
async function getCachedPin(key: string): Promise<string | null> {
  try {
    const redis = await getRedisClient();
    const value = await redis.get(`pin:${key}`);
    return value;
  } catch (err) {
    logger.warn('Redis get failed - falling back to local cache', { error: (err as Error).message });
    return null;
  }
}

async function setCachedPin(key: string, pin: string): Promise<void> {
  try {
    const redis = await getRedisClient();
    await redis.set(`pin:${key}`, pin, { EX: 86400 });
  } catch (err) {
    logger.warn('Redis set failed - using local cache only', { error: (err as Error).message });
  }
}

// Get PIN code (cached + Redis fallback)
async function getPinCode(village: string, district?: string): Promise<string | null> {
  if (!village?.trim()) return null;

  const cacheKey = `${village.trim().toLowerCase()}-${(district || '').trim().toLowerCase()}`;

  // 1. Redis first
  let pin = await getCachedPin(cacheKey);
  if (pin) return pin;

  // 2. Local NodeCache (returns string | undefined)
  const cachedPin = pinCache.get<string>(cacheKey);
  if (cachedPin !== undefined) return cachedPin;

  try {
    const url = `https://api.postalpincode.in/postoffice/${encodeURIComponent(village.trim())}`;
    const response = await axios.get(url, { timeout: 8000 });

    if (response.data?.[0]?.Status === 'Success' && response.data[0].PostOffice?.length > 0) {
      let office = response.data[0].PostOffice[0];

      if (district) {
        const matched = response.data[0].PostOffice.find((o: any) =>
          o.District?.toLowerCase() === district.toLowerCase()
        );
        if (matched) office = matched;
      }

      pin = office.Pincode;
      if (pin && /^\d{6}$/.test(pin)) {
        pinCache.set(cacheKey, pin);
        await setCachedPin(cacheKey, pin);
        logger.info(`PIN cached: ${pin} for ${village} (${district || 'no district'})`);
        return pin;
      }
    }

    logger.info(`No valid PIN found for ${village}`);
    return null;
  } catch (error: any) {
    logger.warn('PIN API call failed', {
      village,
      district,
      message: error.message,
    });
    return null;
  }
}

// Main fetch function - paginated & bulk save
export async function fetchAndSaveGroundwaterData(state: string, district?: string): Promise<void> {
  logger.info(`Starting WRIS fetch → State: ${state}${district ? ` | District: ${district}` : ''}`);

  const baseUrl = 'https://arc.indiawris.gov.in/server/rest/services/NWIC/Groundwater_Stations/MapServer/0/query';

  let offset = 0;
  const limit = 1000;
  let totalSaved = 0;

  while (true) {
    try {
      const params = {
        where: `state_name='${state.replace(/'/g, "\\'")}'${district ? ` AND district_name='${district.replace(/'/g, "\\'")}'` : ''}`,
        outFields: '*',
        returnGeometry: true,
        f: 'json',
        resultRecordCount: limit,
        resultOffset: offset,
      };

      const response = await axios.get(baseUrl, { params, timeout: 20000 });

      const features = response.data?.features || [];
      if (!features.length) {
        logger.info(`No more records (offset ${offset})`);
        break;
      }

      logger.info(`Page fetched: ${features.length} records (offset ${offset})`);

      const bulkOps = await Promise.all(
        features.map(async (feature: any) => {
          const attrs = feature.attributes || {};
          const geom = feature.geometry;

          const village = attrs.village_name || attrs.place_name || null;
          const pinCode = village ? await getPinCode(village, attrs.district_name) : null;

          const doc = {
            location: {
              state: attrs.state_name?.trim(),
              district: attrs.district_name?.trim(),
              block: attrs.block_name?.trim(),
              village: village?.trim(),
              pinCode,
              stationId: attrs.station_code || attrs.id || null,
              coordinates: geom
                ? { type: 'Point' as const, coordinates: [geom.x, geom.y] }
                : undefined,
            },
            date: attrs.measurement_date ? new Date(attrs.measurement_date) : new Date(),
            waterLevelMbgl: attrs.water_level ?? attrs.depth_to_water_level ?? null,
            availabilityBcm: attrs.availability_bcm ?? null,
            trend: attrs.trend ?? null,
            source: 'WRIS',
          };

          if (!doc.location.state || doc.waterLevelMbgl === null) {
            return null;
          }

          return {
            updateOne: {
              filter: {
                'location.stationId': doc.location.stationId,
                date: doc.date,
              },
              update: { $set: doc },
              upsert: true,
            },
          };
        })
      );

      const validOps = bulkOps.filter((op): op is any => op !== null);

      if (validOps.length > 0) {
        const result = await Groundwater.bulkWrite(validOps, { ordered: false });
        totalSaved += result.modifiedCount + result.upsertedCount;
        logger.info(`Bulk write: ${result.modifiedCount + result.upsertedCount} saved/updated`);
      }

      offset += limit;
      if (features.length < limit) break;
    } catch (error: any) {
      logger.error('WRIS fetch failed', {
        state,
        district,
        offset,
        message: error.message,
      });
      break;
    }
  }

  if (totalSaved > 0) {
    logger.info(`Completed: ${totalSaved} records saved/updated for ${state}`);
  } else {
    logger.warn(`No valid records saved for ${state}${district ? ` (district: ${district})` : ''}`);
  }
}