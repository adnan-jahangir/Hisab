import { Router, Response } from 'express';
import { Product } from '../models/Product';
import { StockMovement } from '../models/StockMovement';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();

const formatProduct = (p: any) => ({
  id: p._id.toString(),
  business_id: p.businessId.toString(),
  name: p.name,
  sku: p.sku || '',
  category: p.category,
  buy_price: p.buyPrice,
  sell_price: p.sellPrice,
  current_stock: p.currentStock,
  min_stock_level: p.minStockLevel,
  supplier_name: p.supplierName || '',
  supplier_phone: p.supplierPhone || '',
  created_at: p.createdAt ? p.createdAt.toISOString() : new Date().toISOString()
});

// Get products for business
router.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { businessId } = req.query;
    const filter = businessId ? { businessId } : {};
    const products = await Product.find(filter);
    return res.json(products.map(formatProduct));
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

// Create single product
router.post('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { business_id, name, sku, category, buy_price, sell_price, current_stock, min_stock_level, supplier_name, supplier_phone } = req.body;
    const product = await Product.create({
      businessId: business_id,
      name,
      sku,
      category,
      buyPrice: buy_price,
      sellPrice: sell_price,
      currentStock: current_stock,
      minStockLevel: min_stock_level,
      supplierName: supplier_name,
      supplierPhone: supplier_phone
    });

    return res.status(201).json(formatProduct(product));
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

// Bulk insert products
router.post('/bulk', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const products = req.body;
    const payload = products.map((p: any) => ({
      businessId: p.business_id,
      name: p.name,
      sku: p.sku,
      category: p.category,
      buyPrice: p.buy_price,
      sellPrice: p.sell_price,
      currentStock: p.current_stock,
      minStockLevel: p.min_stock_level,
      supplierName: p.supplier_name,
      supplierPhone: p.supplier_phone
    }));

    const inserted = await Product.insertMany(payload);
    return res.status(201).json(inserted.map(formatProduct));
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

// Update product
router.put('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const updates: any = {};
    if (req.body.name !== undefined) updates.name = req.body.name;
    if (req.body.sku !== undefined) updates.sku = req.body.sku;
    if (req.body.category !== undefined) updates.category = req.body.category;
    if (req.body.buy_price !== undefined) updates.buyPrice = req.body.buy_price;
    if (req.body.sell_price !== undefined) updates.sellPrice = req.body.sell_price;
    if (req.body.current_stock !== undefined) updates.currentStock = req.body.current_stock;
    if (req.body.min_stock_level !== undefined) updates.minStockLevel = req.body.min_stock_level;
    if (req.body.supplier_name !== undefined) updates.supplierName = req.body.supplier_name;
    if (req.body.supplier_phone !== undefined) updates.supplierPhone = req.body.supplier_phone;

    const product = await Product.findByIdAndUpdate(id, updates, { new: true });
    if (!product) return res.status(404).json({ error: 'Product not found' });

    return res.json(formatProduct(product));
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

// Delete product
router.delete('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    await Product.findByIdAndDelete(id);
    return res.json({ message: 'Product deleted' });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

// Record Stock Movement
router.post('/stock-movement', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { product_id, business_id, type, quantity_change, remaining_stock, notes } = req.body;
    const movement = await StockMovement.create({
      productId: product_id,
      businessId: business_id,
      type,
      quantityChange: quantity_change,
      remainingStock: remaining_stock,
      notes
    });

    return res.status(201).json({
      id: movement._id.toString(),
      product_id: movement.productId.toString(),
      type: movement.type,
      quantity_change: movement.quantityChange,
      remaining_stock: movement.remainingStock,
      notes: movement.notes
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

export default router;
