// Minimal test endpoint - if this works, the issue is in server imports
export default function handler(req: any, res: any) {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
}
