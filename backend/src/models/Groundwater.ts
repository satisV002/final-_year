import mongoose, { Schema, Document, Model } from 'mongoose';
import { GroundwaterSchemaDefinition } from '../types'; // adjust path if needed

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
      coordinates: [number, number]; // [lng, lat]
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

const GroundwaterSchema = new Schema<IGroundwater>(
  {
    ...GroundwaterSchemaDefinition,
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Important indexes for performance (India-wide queries)
GroundwaterSchema.index({ 'location.state': 1, date: -1 });
GroundwaterSchema.index({ 'location.district': 1, 'location.village': 1, date: -1 });
GroundwaterSchema.index({ 'location.pinCode': 1 });
GroundwaterSchema.index({ 'location.coordinates': '2dsphere' });

// Optional: Unique compound index to prevent duplicates (state + district + village + date)
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

// Pre-save middleware – async style (no next() needed!)
GroundwaterSchema.pre<IGroundwater>('save', async function () {
  // 'this' is the document being saved

  // Trim strings safely (prevent dirty data)
  if (this.location?.state) this.location.state = this.location.state.trim();
  if (this.location?.district) this.location.district = this.location.district.trim();
  if (this.location?.block) this.location.block = this.location.block.trim();
  if (this.location?.village) this.location.village = this.location.village.trim();
  if (this.location?.pinCode) this.location.pinCode = this.location.pinCode.trim();

  // Optional: Add simple business logic (example)
  // if (this.isNew) { ... }
  // if (this.isModified('waterLevelMbgl')) { ... }

  // No need to call next() — just let the async function finish
  // If you throw here → Mongoose catches it and fails the save
});

// Export the model
export const Groundwater: Model<IGroundwater> = mongoose.model<IGroundwater>(
  'Groundwater',
  GroundwaterSchema
);