// src/services/pincodeService.ts
import axios from 'axios';
import NodeCache from 'node-cache';
import logger from '../utils/logger';

const pinCache = new NodeCache({ stdTTL: 86400 }); // 24 hours

/**
 * Place/Village name base chesi anni possible PIN codes teesukuntundi
 * @param placeName Village or place name (e.g., "Kakinada", "Koyambedu")
 * @param district Optional - better accuracy kosam
 * @returns Array of { pincode: string, postOffice: string, district: string }
 */
export async function getAllPincodesForPlace(
  placeName: string,
  district?: string
): Promise<Array<{ pincode: string; postOffice: string; district: string }>> {
  if (!placeName?.trim()) return [];

  const cacheKey = `allpins_${placeName.toLowerCase()}_${(district || '').toLowerCase()}`;
  const cached = pinCache.get<Array<any>>(cacheKey);
  if (cached) return cached;

  try {
    const url = `https://api.postalpincode.in/postoffice/${encodeURIComponent(placeName.trim())}`;
    const response = await axios.get(url, { timeout: 8000 });

    if (response.data?.[0]?.Status !== 'Success' || !response.data[0].PostOffice?.length) {
      logger.info(`No PINs found for place: ${placeName}`);
      return [];
    }

    let offices = response.data[0].PostOffice;

    // District filter if provided
    if (district) {
      offices = offices.filter((office: any) =>
        office.District?.toLowerCase().includes(district.toLowerCase())
      );
    }

    const pincodes = offices.map((office: any) => ({
      pincode: office.Pincode,
      postOffice: office.Name,
      district: office.District,
    }));

    pinCache.set(cacheKey, pincodes);
    logger.info(`Found ${pincodes.length} PINs for ${placeName}`);
    return pincodes;
  } catch (error: any) {
    logger.error('PIN API error', { place: placeName, error: error.message });
    return [];
  }
}