// src/routes/groundwater.ts
import express from 'express';
import { Groundwater } from '../models/Groundwater';
import { validateQueryParams } from '../middleware/validate'; // fixed path
import logger from '../utils/logger';
import { getAllPincodesForPlace } from '../services/pincodeService'; // adjust if needed
import { sendDataToML } from '../services/mlService'; // ML call
// import { authJWT } from '../middlewares/authJWT'; // optional – uncomment to protect

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
      page = '1',
      limit = '20',
      sort = 'date:-1',
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

    const pageNum = parseInt(page as string, 10) || 1;
    const limitNum = Math.min(parseInt(limit as string, 10) || 20, 100);
    const skip = (pageNum - 1) * limitNum;

    const sortObj: any = {};
    const [sortField, sortOrder] = (sort as string).split(':');
    sortObj[sortField || 'date'] = sortOrder === '1' ? 1 : -1;

    const data = await Groundwater.find(query)
      .select('location date waterLevelMbgl trend source')
      .sort(sortObj)
      .skip(skip)
      .limit(limitNum)
      .lean();

    // Send to ML (placeholder)
    const mlResult = await sendDataToML(data as any); // type cast if needed

    const total = await Groundwater.countDocuments(query);

    res.json({
      success: true,
      data,
      predictions: mlResult.predictions,
      summary: mlResult.summary,
      pagination: {
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
        totalRecords: total,
      },
      message: data.length ? 'Data retrieved' : 'No records found',
    });
  } catch (err: any) {
    logger.error('Groundwater route error', { error: err.message, query: req.query });
    res.status(500).json({ success: false, error: 'Failed to fetch data' });
  }
});

// GET /api/v1/pincodes/suggest
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
      message: pincodes.length ? `${pincodes.length} PIN code(s) found` : 'No PIN codes found',
    });
  } catch (err: any) {
    logger.error('PIN suggest error', { error: err.message });
    res.status(500).json({ success: false, error: 'Failed to suggest PIN codes' });
  }
});

export default router;