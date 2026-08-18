import { Router, Response } from 'express';
import { Expense } from '../models/Expense';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();

const formatExpense = (e: any) => ({
  id: e._id.toString(),
  business_id: e.businessId.toString(),
  category: e.category,
  amount: e.amount,
  description: e.description || '',
  date: e.date,
  created_at: e.createdAt ? e.createdAt.toISOString() : new Date().toISOString()
});

// Get expenses for business
router.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { businessId } = req.query;
    const filter = businessId ? { businessId } : {};
    const expenses = await Expense.find(filter);
    return res.json(expenses.map(formatExpense));
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

// Create expense
router.post('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { business_id, category, amount, description, date } = req.body;
    const expense = await Expense.create({
      businessId: business_id,
      category,
      amount,
      description,
      date: date || new Date().toISOString().split('T')[0]
    });

    return res.status(201).json(formatExpense(expense));
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

// Bulk insert expenses
router.post('/bulk', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const expenses = req.body;
    const payload = expenses.map((e: any) => ({
      businessId: e.business_id,
      category: e.category,
      amount: e.amount,
      description: e.description,
      date: e.date
    }));

    const inserted = await Expense.insertMany(payload);
    return res.status(201).json(inserted.map(formatExpense));
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

// Update expense
router.put('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const updates: any = {};
    if (req.body.category !== undefined) updates.category = req.body.category;
    if (req.body.amount !== undefined) updates.amount = req.body.amount;
    if (req.body.description !== undefined) updates.description = req.body.description;
    if (req.body.date !== undefined) updates.date = req.body.date;

    const expense = await Expense.findByIdAndUpdate(id, updates, { new: true });
    if (!expense) return res.status(404).json({ error: 'Expense not found' });

    return res.json(formatExpense(expense));
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

// Delete expense
router.delete('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    await Expense.findByIdAndDelete(id);
    return res.json({ message: 'Expense deleted' });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

export default router;
