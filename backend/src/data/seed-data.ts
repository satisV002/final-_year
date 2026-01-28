// src/scripts/seed-data.ts
import mongoose from 'mongoose';
import { connectDB } from '../config/db';
import { Groundwater } from '../models/Groundwater';
import logger from '../utils/logger';

// FIXED: JSON import (after tsconfig fix)
import initialData from '../data/initial-groundwater-data.json';

async function seedDatabase() {
  try {
    await connectDB();
    logger.info('Connected to MongoDB – starting seed...');

    // Optional: Clear old manual data
    // await Groundwater.deleteMany({ source: 'Manual' });

    // Format data to match model
    const formattedData = initialData.map((item: any) => ({
      location: {
        state: item.location.state,
        district: item.location.district,
        village: item.location.village,
        pinCode: item.location.pinCode,
      },
      date: new Date(item.date),
      waterLevelMbgl: item.waterLevelMbgl,
      trend: item.trend,
      source: item.source || 'Manual',
      // availabilityBcm, quality etc. if present
    }));

    // Bulk insert (safe – no duplicates if unique index exists)
    const result = await Groundwater.insertMany(formattedData, { ordered: false });

    logger.info(`Successfully seeded ${result.length} records from initial dataset`);
    process.exit(0);
  } catch (err: any) {
    logger.error('Seed failed', { error: err.message });
    process.exit(1);
  }
}

seedDatabase();