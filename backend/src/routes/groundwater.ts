// src/routes/groundwater.ts
import express from 'express';
import { Groundwater } from '../models/Groundwater';
import { validateQueryParams } from '../middleware/validate';
import logger from '../utils/logger';
import { getAllPincodesForPlace } from '../services/pincodeService'; // adjust path if different

const router = express.Router();

// GET /api/v1/groundwater
router.get('/groundwater', validateQueryParams, async (req, res) => {
  try {
    const {
      state,
      district,
      village,
      pinCode,
      fromDate,
      toDate,
    } = req.query;

    const query: any = {
      'location.state': state as string,
    };

    if (district) query['location.district'] = district;
    if (village) query['location.village'] = village;
    if (pinCode) query['location.pinCode'] = pinCode;

    if (fromDate || toDate) {
      query.date = {};
      if (fromDate) query.date.$gte = new Date(fromDate as string);
      if (toDate) query.date.$lte = new Date(toDate as string);
    }

    const data = await Groundwater.find(query)
      .select('location date waterLevelMbgl trend source')
      .sort({ date: -1 })
      .limit(200) // safety limit
      .lean();

    res.json({
      success: true,
      total: data.length,
      data,
      message: data.length ? 'Data retrieved successfully' : 'No records found for these filters',
    });
  } catch (err: any) {
    logger.error('Groundwater route error', { error: err.message, query: req.query });
    res.status(500).json({ success: false, error: 'Failed to fetch groundwater data' });
  }
});

// GET /api/v1/pincodes/suggest
// Example: /api/v1/pincodes/suggest?place=Kakinada&district=East Godavari
router.get('/pincodes/suggest', async (req, res) => {
  const { place, district } = req.query;

  if (!place || typeof place !== 'string') {
    return res.status(400).json({ success: false, error: 'Place name is required' });
  }

  try {
    const pincodes = await getAllPincodesForPlace(place, district as string | undefined);

    res.json({
      success: true,
      pincodes,
      message: pincodes.length ? `${pincodes.length} PIN code(s) found` : 'No PIN codes found for this place',
    });
  } catch (err: any) {
    logger.error('PIN suggest error', { error: err.message });
    res.status(500).json({ success: false, error: 'Failed to suggest PIN codes' });
  }
});

export default router;