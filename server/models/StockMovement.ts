import mongoose, { Schema, Document } from 'mongoose';

export interface IStockMovement extends Document {
  productId: mongoose.Types.ObjectId | string;
  businessId: mongoose.Types.ObjectId | string;
  type: 'sale' | 'restock' | 'manual';
  quantityChange: number;
  remainingStock: number;
  notes?: string;
  createdAt: Date;
}

const StockMovementSchema = new Schema<IStockMovement>({
  productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
  businessId: { type: Schema.Types.ObjectId, ref: 'Business', required: true },
  type: { type: String, enum: ['sale', 'restock', 'manual'], required: true },
  quantityChange: { type: Number, required: true },
  remainingStock: { type: Number, required: true },
  notes: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
});

export const StockMovement = mongoose.model<IStockMovement>('StockMovement', StockMovementSchema);
