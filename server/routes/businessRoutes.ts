import { Router, Response } from 'express';
import { Business } from '../models/Business';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();

// Get all businesses owned by user
router.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const businesses = await Business.find({ ownerId: req.user?.id });
    return res.json(businesses.map(b => ({
      id: b._id.toString(),
      name: b.name,
      type: b.type,
      currency: b.currency,
      address: b.address,
      owner_id: b.ownerId.toString(),
      created_at: b.createdAt.toISOString()
    })));
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

// Create business
router.post('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { name, type, currency, address } = req.body;
    const business = await Business.create({
      ownerId: req.user?.id,
      name,
      type: type || 'retail',
      currency: currency || 'BDT',
      address: address || ''
    });

    return res.status(201).json({
      id: business._id.toString(),
      name: business.name,
      type: business.type,
      currency: business.currency,
      address: business.address,
      owner_id: business.ownerId.toString(),
      created_at: business.createdAt.toISOString()
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

export default router;
