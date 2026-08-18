import { Router, Response } from 'express';
import { Sale } from '../models/Sale';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();

const formatSale = (s: any) => ({
  id: s._id.toString(),
  business_id: s.businessId.toString(),
  product_id: s.productId.toString(),
  quantity: s.quantity,
  sell_price: s.sellPrice,
  total_amount: s.totalAmount,
  profit: s.profit,
  payment_method: s.paymentMethod,
  customer_name: s.customerName || '',
  status: s.status,
  created_at: s.createdAt ? s.createdAt.toISOString() : new Date().toISOString()
});

// Get sales for business
router.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { businessId } = req.query;
    const filter = businessId ? { businessId } : {};
    const sales = await Sale.find(filter);
    return res.json(sales.map(formatSale));
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

// Create single sale
router.post('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { business_id, product_id, quantity, sell_price, total_amount, profit, payment_method, customer_name, status } = req.body;
    const sale = await Sale.create({
      businessId: business_id,
      productId: product_id,
      quantity,
      sellPrice: sell_price,
      totalAmount: total_amount,
      profit: profit || 0,
      paymentMethod: payment_method || 'cash',
      customerName: customer_name || 'Cash Customer',
      status: status || 'Completed'
    });

    return res.status(201).json(formatSale(sale));
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

// Bulk insert sales
router.post('/bulk', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const sales = req.body;
    const payload = sales.map((s: any) => ({
      businessId: s.business_id,
      productId: s.product_id,
      quantity: s.quantity,
      sellPrice: s.sell_price,
      totalAmount: s.total_amount,
      profit: s.profit,
      paymentMethod: s.payment_method,
      customerName: s.customer_name,
      status: s.status
    }));

    const inserted = await Sale.insertMany(payload);
    return res.status(201).json(inserted.map(formatSale));
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

// Update sale
router.put('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const updates: any = {};
    if (req.body.quantity !== undefined) updates.quantity = req.body.quantity;
    if (req.body.sell_price !== undefined) updates.sellPrice = req.body.sell_price;
    if (req.body.total_amount !== undefined) updates.totalAmount = req.body.total_amount;
    if (req.body.profit !== undefined) updates.profit = req.body.profit;
    if (req.body.payment_method !== undefined) updates.paymentMethod = req.body.payment_method;
    if (req.body.customer_name !== undefined) updates.customerName = req.body.customer_name;
    if (req.body.status !== undefined) updates.status = req.body.status;

    const sale = await Sale.findByIdAndUpdate(id, updates, { new: true });
    if (!sale) return res.status(404).json({ error: 'Sale record not found' });

    return res.json(formatSale(sale));
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

// Delete sale
router.delete('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    await Sale.findByIdAndDelete(id);
    return res.json({ message: 'Sale record deleted' });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

export default router;
