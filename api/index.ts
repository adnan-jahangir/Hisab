import app from '../server/index';
import { connectDB } from '../server/config/db';

// Vercel Serverless Function handler
// MUST await database connection before every request
export default async function handler(req: any, res: any) {
  await connectDB();
  return app(req, res);
}
