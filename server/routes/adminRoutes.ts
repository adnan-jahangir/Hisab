import { Router, Response } from 'express';
import { User } from '../models/User';
import { Business } from '../models/Business';
import { Product } from '../models/Product';
import { Sale } from '../models/Sale';
import { Notification } from '../models/Notification';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();

// GET /api/admin/stats - Platform overall metrics
router.get('/stats', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalBusinesses = await Business.countDocuments();
    const totalProducts = await Product.countDocuments();
    const totalSalesCount = await Sale.countDocuments();

    const salesAggregation = await Sale.aggregate([
      { $group: { _id: null, totalVolume: { $sum: '$totalAmount' } } }
    ]);
    const totalSalesVolume = salesAggregation.length > 0 ? salesAggregation[0].totalVolume : 0;

    return res.json({
      totalUsers,
      totalBusinesses,
      totalProducts,
      totalSalesCount,
      totalSalesVolume,
      systemStatus: 'Operational',
      uptime: '99.9%'
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

// GET /api/admin/users - All registered users
router.get('/users', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    const businesses = await Business.find();

    const result = users.map(u => {
      const userBiz = businesses.filter(b => b.ownerId && b.ownerId.toString() === u._id.toString());
      return {
        id: u._id.toString(),
        fullName: u.fullName || 'N/A',
        email: u.email,
        phone: u.phone || 'N/A',
        address: u.address || 'N/A',
        businessCount: userBiz.length,
        businessNames: userBiz.map(b => b.name).join(', ') || 'No business',
        createdAt: u.createdAt ? u.createdAt.toISOString() : new Date().toISOString()
      };
    });

    return res.json(result);
  } catch (error: any) {
    console.error('Error fetching admin users:', error);
    return res.status(500).json({ error: error.message });
  }
});

// GET /api/admin/businesses - All registered businesses
router.get('/businesses', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const businesses = await Business.find().sort({ createdAt: -1 });
    const users = await User.find();

    const result = businesses.map(b => {
      const owner = users.find(u => b.ownerId && u._id.toString() === b.ownerId.toString());
      return {
        id: b._id.toString(),
        name: b.name,
        type: b.type,
        currency: b.currency,
        address: b.address || 'N/A',
        ownerName: owner ? owner.fullName : 'Unknown',
        ownerEmail: owner ? owner.email : 'Unknown',
        createdAt: b.createdAt ? b.createdAt.toISOString() : new Date().toISOString()
      };
    });

    return res.json(result);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

// DELETE /api/admin/users/:id - Delete user
router.delete('/users/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    await User.findByIdAndDelete(id);
    await Business.deleteMany({ ownerId: id });
    return res.json({ message: 'User and associated businesses deleted successfully' });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

// POST /api/admin/announcement - Broadcast notification
router.post('/announcement', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { title, message, priority } = req.body;
    if (!title || !message) {
      return res.status(400).json({ error: 'Title and message are required' });
    }

    const users = await User.find();
    const notifications = users.map(u => ({
      userId: u._id,
      title,
      body: message,
      type: 'info',
      priority: priority || 'medium',
      read: false
    }));

    await Notification.insertMany(notifications);
    return res.status(201).json({ message: `Announcement sent to ${users.length} users successfully!` });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

export default router;
