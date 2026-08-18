import { Router, Response } from 'express';
import { Notification } from '../models/Notification';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();

// Get notifications for user
router.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const notifications = await Notification.find({ userId: req.user?.id }).sort({ createdAt: -1 });
    return res.json(notifications.map(n => ({
      id: n._id.toString(),
      title: n.title,
      body: n.body,
      type: n.type,
      priority: n.priority,
      read: n.read,
      relatedId: n.relatedId || '',
      createdAt: n.createdAt.toISOString()
    })));
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

// Mark notification read
router.put('/:id/read', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const notification = await Notification.findByIdAndUpdate(id, { read: true }, { new: true });
    if (!notification) return res.status(404).json({ error: 'Notification not found' });
    return res.json({ message: 'Notification marked as read' });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

export default router;
