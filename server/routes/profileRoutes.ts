import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import { User } from '../models/User';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();

// GET user profile
router.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findById(req.user?.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    return res.json({
      id: user._id.toString(),
      fullName: user.fullName,
      email: user.email,
      phone: user.phone || '',
      address: user.address || ''
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

// Update user profile
router.put('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { full_name, fullName, phone, address } = req.body;
    const updates: any = {};
    const nameToUpdate = fullName || full_name;

    if (nameToUpdate !== undefined) updates.fullName = nameToUpdate;
    if (phone !== undefined) updates.phone = phone;
    if (address !== undefined) updates.address = address;

    const user = await User.findByIdAndUpdate(req.user?.id, updates, { new: true });
    if (!user) return res.status(404).json({ error: 'User not found' });

    return res.json({
      id: user._id.toString(),
      fullName: user.fullName,
      phone: user.phone,
      address: user.address,
      email: user.email
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

// Update password
router.put('/password', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Both current password and new password are required' });
    }

    const user = await User.findById(req.user?.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isValid) {
      return res.status(400).json({ error: 'বর্তমান পাসওয়ার্ড ভুল দেওয়া হয়েছে।' });
    }

    const newHash = await bcrypt.hash(newPassword, 10);
    user.passwordHash = newHash;
    await user.save();

    return res.json({ message: 'Password updated successfully' });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

export default router;
