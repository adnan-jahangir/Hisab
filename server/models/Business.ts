import mongoose, { Schema, Document } from 'mongoose';

export interface IBusiness extends Document {
  ownerId: mongoose.Types.ObjectId | string;
  name: string;
  type: string;
  currency: string;
  address?: string;
  createdAt: Date;
}

const BusinessSchema = new Schema<IBusiness>({
  ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  type: { type: String, default: 'retail' },
  currency: { type: String, default: 'BDT' },
  address: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
});

export const Business = mongoose.model<IBusiness>('Business', BusinessSchema);
