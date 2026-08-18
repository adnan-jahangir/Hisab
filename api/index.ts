import { connectDB } from '../server/config/db';
import app from '../server/index';

export default async function handler(req: any, res: any) {
  try {
    await connectDB();
    return app(req, res);
  } catch (error: any) {
    console.error('Vercel Serverless Function Error:', error);
    return res.status(500).json({ 
      error: 'Internal Server Error', 
      message: error.message || 'Unknown error',
      stack: process.env.NODE_ENV !== 'production' ? error.stack : undefined
    });
  }
}
