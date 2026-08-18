import { Router, Response } from 'express';
import { User } from '../models/User';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();

// Update user profile
router.put('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { full_name, phone, address } = req.body;
    const updates: any = {};
    if (full_name !== undefined) updates.fullName = full_name;
    if (phone !== undefined) updates.phone = phone;
    if (address !== undefined) updates.address = address;

    const user = await User.findByIdAndUpdate(req.user?.id, updates, { new: true });
    if (!user) return res.status(404).json({ error: 'User not found' });

    return res.json({
      id: user._id.toString(),
      full_name: user.fullName,
      phone: user.phone,
      address: user.address,
      email: user.email
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

export default router;
