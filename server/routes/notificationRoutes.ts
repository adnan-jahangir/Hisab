import { Router, Response } from 'express';
import { Notification } from '../models/Notification';
import { User } from '../models/User';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { sendNotificationEmail } from '../utils/mailer';

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

// Mark single notification read
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

// Mark all notifications read
router.put('/read-all', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    await Notification.updateMany({ userId: req.user?.id, read: false }, { read: true });
    return res.json({ message: 'All notifications marked as read' });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

// Delete a notification
router.delete('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    await Notification.findByIdAndDelete(id);
    return res.json({ message: 'Notification deleted' });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

// Create a new notification & dispatch email
router.post('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { title, body, type, priority, relatedId } = req.body;
    if (!title || !body) {
      return res.status(400).json({ error: 'Title and body are required' });
    }

    const notification = await Notification.create({
      userId: req.user?.id,
      title,
      body,
      type: type || 'info',
      priority: priority || 'medium',
      relatedId: relatedId || '',
      read: false
    });

    // Send email to user if email exists
    const user = await User.findById(req.user?.id);
    if (user && user.email) {
      sendNotificationEmail({
        to: user.email,
        subject: `[Amar Hisab Alert] ${title}`,
        title,
        message: body,
        priority: priority || 'medium'
      }).catch(err => console.error('Email notification error:', err));
    }

    return res.status(201).json({
      id: notification._id.toString(),
      title: notification.title,
      body: notification.body,
      type: notification.type,
      priority: notification.priority,
      read: notification.read,
      relatedId: notification.relatedId || '',
      createdAt: notification.createdAt.toISOString()
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

export default router;
