import axios from 'axios';
import NodeCache from 'node-cache';
import logger from '../utils/logger';
import { Groundwater } from '../models/groundwater';
import { getRedisClient } from '../config/redis';

const pinCache = new NodeCache({ stdTTL: 86400 });

async function getPinCode(village: string, district?: string): Promise<string | null> {
  const key = `${village.toLowerCase()}-${district?.toLowerCase() || ''}`;
  let pin = pinCache.get<string>(key);
  if (pin) return pin;

  try {
    const res = await axios.get(`https://api.postalpincode.in/postoffice/${encodeURIComponent(village)}`);
    if (res.data?.[0]?.Status === 'Success') {
      let office = res.data[0].PostOffice[0];
      if (district) {
        office = res.data[0].PostOffice.find((o: any) => o.District.toLowerCase() === district.toLowerCase()) || office;
      }
      pin = office?.Pincode;
      if (pin) {
        pinCache.set(key, pin);
        return pin;
      }
    }
  } catch (e) {
    logger.error('PIN fetch failed', { village, error: (e as Error).message });
  }
  return null;
}

export async function fetchAndSave(state: string, district?: string) {
  try {
    const url = 'https://arc.indiawris.gov.in/server/rest/services/NWIC/Groundwater_Stations/MapServer/0/query';
    const params = {
      where: `state_name='${state}'${district ? ` AND district_name='${district}'` : ''}`,
      outFields: '*',
      returnGeometry: true,
      f: 'json',
    };

    const { data } = await axios.get(url, { params });

    if (!data.features?.length) return;

    const ops = data.features.map(async (f: any) => {
      const attrs = f.attributes;
      const geom = f.geometry;
      const village = attrs.village_name || null;
      const pinCode = village ? await getPinCode(village, attrs.district_name) : null;

      return {
        updateOne: {
          filter: { 'location.stationId': attrs.station_code, date: new Date() },
          update: {
            $set: {
              location: {
                state: attrs.state_name,
                district: attrs.district_name,
                village,
                pinCode,
                stationId: attrs.station_code,
                coordinates: geom ? { type: 'Point', coordinates: [geom.x, geom.y] } : undefined,
              },
              date: new Date(),
              waterLevelMbgl: attrs.water_level,
              source: 'WRIS',
            },
          },
          upsert: true,
        },
      };
    });

    const bulk = await Promise.all(ops);
    await Groundwater.bulkWrite(bulk);
    logger.info(`Saved data for ${state}`);
  } catch (err) {
    logger.error('Fetch failed', { err });
  }
}