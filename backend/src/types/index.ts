// src/types/index.ts
// ────────────────────────────────────────────────────────────────
// Shared Type Definitions for Groundwater Analysis & Prediction System
// Used by both backend (Mongoose) and frontend (API responses, props)
// ────────────────────────────────────────────────────────────────

import { InferSchemaType, Schema } from 'mongoose';

// ======================
// Location / Address Structure
// ======================
export interface ILocation {
  state: string;                    // "Andhra Pradesh", "Tamil Nadu", etc.
  district?: string;                // "East Godavari", "Chennai", etc.
  block?: string;                   // Mandal / Block / Taluk
  village?: string;                 // Village / Place / Town name
  pinCode?: string;                 // "533001", "600001", etc.
  stationId?: string;               // WRIS/CGWB monitoring station code
  coordinates?: {                   // GeoJSON Point format for maps
    type: 'Point';
    coordinates: [number, number];  // [longitude, latitude]
  };
}

// ======================
// Core Groundwater Measurement
// ======================
export interface IGroundwaterData {
  _id?: string;                     // MongoDB _id (string in responses)
  location: ILocation;
  date: Date | string;              // ISO string in API responses, Date in DB
  waterLevelMbgl: number;           // Depth in meters below ground level
  availabilityBcm?: number;         // Billion cubic meters (district/state level)
  trend?: 'Rising' | 'Falling' | 'Stable' | null;
  source: 'WRIS' | 'CGWB' | 'StatePortal' | 'Manual' | 'Other';
  quality?: Record<string, number>; // Flexible: pH, TDS, EC, etc. (future)
  createdAt?: Date;
  updatedAt?: Date;
}

// ======================
// Query / Filter Parameters (for GET /api/groundwater)
// ======================
export interface IGroundwaterFilter {
  state?: string;
  district?: string;
  block?: string;
  village?: string;
  pinCode?: string;
  stationId?: string;
  fromDate?: string;                // ISO date string
  toDate?: string;
  pastDays?: number;                // e.g. 3 → last 3 months/days
  futureDays?: number;              // for showing prediction range
  limit?: number;                   // pagination
  page?: number;
  sort?: string;                    // e.g. "date:-1", "waterLevelMbgl:1"
}

// ======================
// ML Prediction Output
// ======================
export interface IPredictionPoint {
  date: Date | string;
  predictedMbgl: number;
  lowerBound?: number;              // optional confidence interval
  upperBound?: number;
  confidence?: number;              // 0–100%
  note?: string;                    // "Based on ARIMA / LSTM"
}

export interface IPredictionResult {
  points: IPredictionPoint[];
  summary: {
    currentAvgMbgl: number;
    predictedAvgMbgl: number;
    trend: 'Improving' | 'Declining' | 'Stable' | 'Uncertain';
    riskLevel: 'Safe' | 'Semi-Critical' | 'Critical' | 'Over-Exploited';
  };
}

// ======================
// API Response Shapes
// ======================
export interface GroundwaterApiResponse {
  success: boolean;
  data: IGroundwaterData[];
  predictions?: IPredictionResult;
  summary?: {
    averageMbgl: number;
    minMbgl: number;
    maxMbgl: number;
    status: 'Safe' | 'Semi-Critical' | 'Critical' | 'Over-Exploited';
    totalRecords: number;
    filteredCount: number;
  };
  pagination?: {
    page: number;
    limit: number;
    totalPages: number;
    total: number;
  };
  error?: string;
}

// ======================
// Mongoose Schema Definition (used in models)
// ======================
export const GroundwaterSchemaDefinition = {
  location: {
    state: { type: String, required: true, trim: true, index: true },
    district: { type: String, trim: true, sparse: true, index: true },
    block: { type: String, trim: true, sparse: true, index: true },
    village: { type: String, trim: true, sparse: true, index: true },
    pinCode: { type: String, trim: true, sparse: true, index: true },
    stationId: { type: String, sparse: true, index: true },
    coordinates: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], default: undefined }, // [lng, lat]
    },
  },
  date: { type: Date, required: true, index: true },
  waterLevelMbgl: { type: Number, required: true },
  availabilityBcm: { type: Number, sparse: true },
  trend: {
    type: String,
    enum: ['Rising', 'Falling', 'Stable'],
    sparse: true,
  },
  source: {
    type: String,
    required: true,
    enum: ['WRIS', 'CGWB', 'StatePortal', 'Manual', 'Other'],
  },
  quality: { type: Map, of: Number, sparse: true },
} as const;

// Full schema instance (exported for models)
export const GroundwaterSchema = new Schema(GroundwaterSchemaDefinition, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// Compound indexes (very important for performance)
GroundwaterSchema.index({ 'location.state': 1, date: -1 });
GroundwaterSchema.index({ 'location.district': 1, 'location.village': 1, date: -1 });
GroundwaterSchema.index({ 'location.pinCode': 1, date: -1 });
GroundwaterSchema.index({ 'location.coordinates': '2dsphere' }); // geo queries later

// Inferred document type (use in services/controllers)
export type IGroundwaterDocument = InferSchemaType<typeof GroundwaterSchema> & {
  _id: string;
};