import axios from 'axios';
import NodeCache from 'node-cache';
import logger from '../utils/logger';
import { Groundwater } from '../models/Groundwater';
import { getRedisClient } from '../config/redis';

// ────────────────────────────────────────────────
// SSL fix for dev (common India network issue)
// ────────────────────────────────────────────────
if (process.env.NODE_ENV !== 'production') {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
  logger.warn('⚠️ SSL verification disabled for dev (WRIS fetch)');
}

const pinCache = new NodeCache({ stdTTL: 86400, checkperiod: 120 });

// Redis fallback helpers
async function getCachedPin(key: string): Promise<string | null> {
  try {
    const redis = await getRedisClient();
    const value = await redis.get(`pin:${key}`);
    return value;
  } catch (err) {
    logger.warn('Redis get failed - using local cache', { error: (err as Error).message });
    return null;
  }
}

async function setCachedPin(key: string, pin: string): Promise<void> {
  try {
    const redis = await getRedisClient();
    await redis.set(`pin:${key}`, pin, { EX: 86400 });
  } catch (err) {
    logger.warn('Redis set failed - local cache only', { error: (err as Error).message });
  }
}

// Get PIN code with district fallback
async function getPinCode(village: string, district?: string): Promise<string | null> {
  if (!village?.trim()) return null;

  const cacheKey = `${village.trim().toLowerCase()}-${(district || '').trim().toLowerCase()}`;

  let pin = await getCachedPin(cacheKey);
  if (pin) return pin;

  const cachedPin = pinCache.get<string>(cacheKey);
  if (cachedPin !== undefined) return cachedPin;

  try {
    // Primary: Village name
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
        logger.info(`PIN cached: ${pin} for village ${village} (${district || 'no district'})`);
        return pin;
      }
    }

    // Fallback: District name if village failed
    if (district) {
      logger.info(`Village PIN failed - trying district fallback for ${village} in ${district}`);
      const districtUrl = `https://api.postalpincode.in/postoffice/${encodeURIComponent(district.trim())}`;
      const districtResp = await axios.get(districtUrl, { timeout: 8000 });

      if (districtResp.data?.[0]?.Status === 'Success' && districtResp.data[0].PostOffice?.length > 0) {
        pin = districtResp.data[0].PostOffice[0].Pincode;
        if (pin && /^\d{6}$/.test(pin)) {
          pinCache.set(cacheKey, pin);
          await setCachedPin(cacheKey, pin);
          logger.info(`District fallback PIN cached: ${pin} for ${village} in ${district}`);
          return pin;
        }
      }
    }

    logger.info(`No valid PIN found for ${village} (village & district fallback failed)`);
    return null;
  } catch (error: any) {
    logger.warn('PIN API failed', { village, district, message: error.message });
    return null;
  }
}

// Main fetch function (safe, no crash, limited data load)
export async function fetchAndSaveGroundwaterData(state: string, district?: string): Promise<void> {
  logger.info(`Starting WRIS fetch → State: ${state}${district ? ` | District: ${district}` : ''}`);

  const baseUrl = 'https://arc.indiawris.gov.in/server/rest/services/NWIC/Groundwater_Stations/MapServer/0/query';

  const stateClauses = [
    `state_name='${state.replace(/'/g, "\\'")}'`,
    `STATE_NAME='${state.toUpperCase().replace(/'/g, "\\'")}'`,
    `State_Name='${state}'`,
    `state='${state}'`,
    `1=1`
  ];

  let totalSaved = 0;
  let fetchedAny = false;
  const maxRecordsPerState = 5000; // safety limit to avoid overload
  let fetchedCount = 0;

  for (const stateClause of stateClauses) {
    logger.info(`Trying clause: ${stateClause}`);

    let offset = 0;
    const limit = 300; // lowered from 500 → safer for free cluster & memory
    const maxRetries = 3;

    while (true) {
      if (fetchedCount >= maxRecordsPerState) {
        logger.warn(`Reached max records limit (${maxRecordsPerState}) for ${state} - stopping fetch`);
        break;
      }

      let retryCount = 0;
      let success = false;

      while (retryCount < maxRetries && !success) {
        try {
          const params = {
            where: stateClause + (district ? ` AND district_name='${district.replace(/'/g, "\\'")}'` : ''),
            outFields: '*',
            returnGeometry: true,
            f: 'json',
            resultRecordCount: limit,
            resultOffset: offset,
          };

          const response = await axios.get(baseUrl, { params, timeout: 30000 });

          const features = response.data?.features || [];

          logger.info(`Fetched page: ${features.length} records (offset ${offset})`, {
            clauseUsed: stateClause,
            sampleFeature: features.length > 0 ? features[0].attributes : null
          });

          if (features.length === 0) {
            break;
          }

          fetchedAny = true;

          const bulkOps = await Promise.all(
            features.map(async (feature: any) => {
              const attrs = feature.attributes || {};
              const geom = feature.geometry;

              const village = attrs.village_name || attrs.place_name || attrs.Village || null;
              const pinCode = village ? await getPinCode(village, attrs.district_name) : null;

              const waterLevel = attrs.water_level ?? attrs.depth_to_water_level ?? attrs.Water_Level ?? null;

              const doc = {
                location: {
                  state: attrs.state_name?.trim() || attrs.STATE_NAME?.trim() || attrs.State || '',
                  district: attrs.district_name?.trim() || attrs.DISTRICT_NAME?.trim(),
                  block: attrs.block_name?.trim(),
                  village: village?.trim(),
                  pinCode,
                  stationId: attrs.station_code || attrs.id || attrs.Station_Code || null,
                  coordinates: geom ? { type: 'Point' as const, coordinates: [geom.x, geom.y] } : undefined,
                },
                date: attrs.measurement_date ? new Date(attrs.measurement_date) : new Date(),
                waterLevelMbgl: waterLevel,
                availabilityBcm: attrs.availability_bcm ?? null,
                trend: attrs.trend ?? null,
                source: 'WRIS',
              };

              if (!doc.location.state) {
                logger.debug('Skipped - no state', { attrsState: attrs.state_name || attrs.STATE_NAME });
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

          const validOps = bulkOps.filter(Boolean);

          if (validOps.length > 0) {
            const result = await Groundwater.bulkWrite(validOps, { ordered: false });
            totalSaved += result.modifiedCount + result.upsertedCount;
            logger.info(`Bulk write: ${result.modifiedCount + result.upsertedCount} saved`);
          }

          fetchedCount += features.length;
          offset += limit;
          if (features.length < limit) break;

          success = true;
        } catch (error: any) {
          retryCount++;
          logger.error(`WRIS page failed (attempt ${retryCount}/${maxRetries})`, {
            clause: stateClause,
            offset,
            message: error.message,
            code: error.code,
            responseStatus: error.response?.status
          });

          if (retryCount >= maxRetries) break;

          await new Promise(resolve => setTimeout(resolve, 2000 * retryCount));
        }
      }

      if (!success) break;
    }

    if (fetchedAny) break;
  }

  logger.info(totalSaved > 0 
    ? `Completed: ${totalSaved} records saved for ${state}`
    : `No valid records saved for ${state} after all attempts`);
}