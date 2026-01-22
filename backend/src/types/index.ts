// src/types/index.ts
// Shared types for the entire project (backend + frontend)
// Updated with User types for authentication

import { InferSchemaType, Schema } from 'mongoose';

// ────────────────────────────────────────────────────────────────
// Location Structure (used in Groundwater)
// ────────────────────────────────────────────────────────────────
export interface ILocation {
  state: string;
  district?: string;
  block?: string;
  village?: string;
  pinCode?: string;
  stationId?: string;
  coordinates?: {
    type: 'Point';
    coordinates: [number, number]; // [lng, lat]
  };
}

// ────────────────────────────────────────────────────────────────
// Groundwater Data (core measurement)
// ────────────────────────────────────────────────────────────────
export interface IGroundwaterData {
  _id?: string;
  location: ILocation;
  date: Date | string;
  waterLevelMbgl: number;
  availabilityBcm?: number;
  trend?: 'Rising' | 'Falling' | 'Stable' | null;
  source: 'WRIS' | 'CGWB' | 'StatePortal' | 'Manual' | 'Other';
  quality?: Record<string, number>;
  createdAt?: Date;
  updatedAt?: Date;
}

// ────────────────────────────────────────────────────────────────
// Filter Interface for queries
// ────────────────────────────────────────────────────────────────
export interface IGroundwaterFilter {
  state?: string;
  district?: string;
  block?: string;
  village?: string;
  pinCode?: string;
  stationId?: string;
  fromDate?: string;
  toDate?: string;
  pastDays?: number;
  futureDays?: number;
  limit?: number;
  page?: number;
  sort?: string;
}

// ────────────────────────────────────────────────────────────────
// Prediction Types (placeholder for ML)
// ────────────────────────────────────────────────────────────────
export interface IPredictionPoint {
  date: Date | string;
  predictedMbgl: number;
  lowerBound?: number;
  upperBound?: number;
  confidence?: number;
  note?: string;
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

// ────────────────────────────────────────────────────────────────
// API Response Shape
// ────────────────────────────────────────────────────────────────
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
  };
  error?: string;
}

// ────────────────────────────────────────────────────────────────
// Mongoose Schema Definition (shared)
// ────────────────────────────────────────────────────────────────
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
      coordinates: { type: [Number], default: undefined },
    },
  },
  date: { type: Date, required: true, index: true },
  waterLevelMbgl: { type: Number, required: true },
  availabilityBcm: { type: Number, sparse: true },
  trend: { type: String, enum: ['Rising', 'Falling', 'Stable'], sparse: true },
  source: { type: String, required: true, enum: ['WRIS', 'CGWB', 'StatePortal', 'Manual', 'Other'] },
  quality: { type: Map, of: Number, sparse: true },
} as const;

// Shared schema instance
export const GroundwaterSchema = new Schema(GroundwaterSchemaDefinition, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// ────────────────────────────────────────────────────────────────
// Compound Indexes (no duplicates)
// ────────────────────────────────────────────────────────────────
GroundwaterSchema.index({ 'location.state': 1, date: -1 });
GroundwaterSchema.index({ 'location.district': 1, 'location.village': 1, date: -1 });
GroundwaterSchema.index({ 'location.coordinates': '2dsphere' });

// Unique index to prevent duplicate entries
GroundwaterSchema.index(
  {
    'location.state': 1,
    'location.district': 1,
    'location.village': 1,
    'location.pinCode': 1,
    date: 1,
  },
  { unique: true, sparse: true }
);

// ────────────────────────────────────────────────────────────────
// User Types (for authentication)
// ────────────────────────────────────────────────────────────────
export interface IUser {
  _id: string;
  fullname: string;
  email: string;
  password: string; // hashed
  createdAt: Date;
  updatedAt: Date;
}

export type IUserDocument = IUser & Document;

// ────────────────────────────────────────────────────────────────
// Auth Response (signup/login)
// ────────────────────────────────────────────────────────────────
export interface AuthResponse {
  success: boolean;
  token?: string;
  user?: {
    id: string;
    fullname: string;
    email: string;
  };
  message?: string;
  error?: string;
}