import app from '../server/index';
import { connectDB } from '../server/config/db';

export default async function handler(req: any, res: any) {
  try {
    await connectDB();
  } catch (error) {
    console.error('Database connection error in Vercel Serverless handler:', error);
  }
  return app(req, res);
}
