import mongoose, { Schema, Document } from 'mongoose';

export interface ISale extends Document {
  businessId: mongoose.Types.ObjectId | string;
  productId: mongoose.Types.ObjectId | string;
  quantity: number;
  sellPrice: number;
  totalAmount: number;
  profit: number;
  paymentMethod: string;
  customerName?: string;
  status: string;
  createdAt: Date;
}

const SaleSchema = new Schema<ISale>({
  businessId: { type: Schema.Types.ObjectId, ref: 'Business', required: true, index: true },
  productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
  quantity: { type: Number, required: true },
  sellPrice: { type: Number, required: true },
  totalAmount: { type: Number, required: true },
  profit: { type: Number, default: 0 },
  paymentMethod: { type: String, default: 'cash' },
  customerName: { type: String, default: 'Cash Customer' },
  status: { type: String, default: 'Completed' },
  createdAt: { type: Date, default: Date.now }
});

export const Sale = mongoose.model<ISale>('Sale', SaleSchema);
