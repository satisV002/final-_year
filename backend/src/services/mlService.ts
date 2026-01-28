// src/services/mlService.ts
import logger from '../utils/logger';
import { IGroundwaterData } from '../types';

// Placeholder: Send data to ML model
export async function sendDataToML(data: IGroundwaterData[]): Promise<any> {
  logger.info(`Sending ${data.length} records to ML model (placeholder)`);

  // Format data for ML – handle date as string or Date
  const mlInput = data.map(item => ({
    date: item.date instanceof Date ? item.date.toISOString() : item.date, // FIXED: safe conversion
    waterLevelMbgl: item.waterLevelMbgl,
    location: item.location.village || item.location.district || item.location.state || 'Unknown',
  }));

  try {
    // Future: Replace with real ML call (Python script, API, etc.)
    // Example:
    // const response = await axios.post('http://ml-server/predict', mlInput);
    // return response.data;

    // Mock predictions (placeholder)
    const predictions = mlInput.map(item => ({
      date: item.date,
      predictedMbgl: item.waterLevelMbgl * 0.95, // mock lower level
      confidence: 75,
    }));

    logger.info('ML placeholder response ready');
    return {
      predictions,
      summary: {
        trend: 'Stable',
        riskLevel: 'Semi-Critical',
      },
    };
  } catch (err: any) {
    logger.error('ML send failed', { error: err.message });
    throw new Error('ML prediction failed');
  }
}