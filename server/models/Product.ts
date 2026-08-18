import mongoose, { Schema, Document } from 'mongoose';

export interface IProduct extends Document {
  businessId: mongoose.Types.ObjectId | string;
  name: string;
  sku?: string;
  category: string;
  buyPrice: number;
  sellPrice: number;
  currentStock: number;
  minStockLevel: number;
  supplierName?: string;
  supplierPhone?: string;
  createdAt: Date;
}

const ProductSchema = new Schema<IProduct>({
  businessId: { type: Schema.Types.ObjectId, ref: 'Business', required: true, index: true },
  name: { type: String, required: true },
  sku: { type: String, default: '' },
  category: { type: String, default: 'General' },
  buyPrice: { type: Number, default: 0 },
  sellPrice: { type: Number, default: 0 },
  currentStock: { type: Number, default: 0 },
  minStockLevel: { type: Number, default: 5 },
  supplierName: { type: String, default: '' },
  supplierPhone: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
});

export const Product = mongoose.model<IProduct>('Product', ProductSchema);
