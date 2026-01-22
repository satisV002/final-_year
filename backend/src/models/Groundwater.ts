// src/models/Groundwater.ts
import mongoose, { Schema, Document, Model } from 'mongoose';
import { GroundwaterSchemaDefinition, GroundwaterSchema } from '../types';

export interface IGroundwater extends Document {
  location: {
    state: string;
    district?: string;
    block?: string;
    village?: string;
    pinCode?: string;
    stationId?: string;
    coordinates?: {
      type: 'Point';
      coordinates: [number, number];
    };
  };
  date: Date;
  waterLevelMbgl: number;
  availabilityBcm?: number;
  trend?: 'Rising' | 'Falling' | 'Stable' | null;
  source: string;
  quality?: Map<string, number>;
  createdAt: Date;
  updatedAt: Date;
}

// Use shared schema (no duplicate definitions)
const GroundwaterSchemaInstance = new Schema<IGroundwater>(
  GroundwaterSchemaDefinition,
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Pre-save hook – trim strings
GroundwaterSchemaInstance.pre<IGroundwater>('save', async function () {
  if (this.location?.state) this.location.state = this.location.state.trim();
  if (this.location?.district) this.location.district = this.location.district.trim();
  if (this.location?.block) this.location.block = this.location.block.trim();
  if (this.location?.village) this.location.village = this.location.village.trim();
  if (this.location?.pinCode) this.location.pinCode = this.location.pinCode.trim();
});

// Export model
export const Groundwater: Model<IGroundwater> = mongoose.model<IGroundwater>(
  'Groundwater',
  GroundwaterSchemaInstance
);