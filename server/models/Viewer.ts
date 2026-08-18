import mongoose, { Schema, Document } from 'mongoose';

export interface IViewer extends Document {
  name: string;
  createdAt: Date;
}

const ViewerSchema = new Schema<IViewer>({
  name: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

export const Viewer = mongoose.model<IViewer>('Viewer', ViewerSchema);
