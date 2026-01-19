// src/routes/groundwater.ts
import express from 'express';
import { getAllPincodesForPlace } from '../services/pincodeService';
import { Groundwater } from '../models/groundwater';
import logger from '../utils/logger';

const router = express.Router();

// New endpoint: Place name base chesi PIN codes suggest cheyadam
router.get('/v1/pincodes/suggest', async (req, res) => {
  const { place, district } = req.query;

  if (!place) {
    return res.status(400).json({ success: false, error: 'Place name required' });
  }

  try {
    const pincodes = await getAllPincodesForPlace(place as string, district as string);

    res.json({
      success: true,
      pincodes,
      message: pincodes.length ? `${pincodes.length} PIN(s) found` : 'No PIN found for this place',
    });
  } catch (err) {
    logger.error('PIN suggest error', { err });
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// Existing groundwater data endpoint (PIN filter optional)
router.get('/v1/groundwater', async (req, res) => {
  const { state, district, village, pinCode, fromDate, toDate } = req.query;

  const query: any = {};

  if (state) query['location.state'] = state;
  if (district) query['location.district'] = district;
  if (village) query['location.village'] = village;
  if (pinCode) query['location.pinCode'] = pinCode; // optional

  // Date filter...
  if (fromDate || toDate) {
    query.date = {};
    if (fromDate) query.date.$gte = new Date(fromDate as string);
    if (toDate) query.date.$lte = new Date(toDate as string);
  }

  try {
    const data = await Groundwater.find(query)
      .select('location date waterLevelMbgl trend source')
      .sort({ date: -1 })
      .lean();

    res.json({
      success: true,
      data,
      total: data.length,
    });
  } catch (err) {
    logger.error('Groundwater query error', { err });
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

export default router;