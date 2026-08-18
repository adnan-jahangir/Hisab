const mongoose = require('mongoose');
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const nodemailer = require('nodemailer');

// ─── Config ───────────────────────────────────────────
const ATLAS_URI = process.env.MONGODB_URI || 'mongodb+srv://adnan:23154@cluster0.qffk0tp.mongodb.net/amr-hisab?retryWrites=true&w=majority&appName=Cluster0';
const JWT_SECRET = process.env.JWT_SECRET || 'hisab_secret_key_123456_super_secure';
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '294246347496-3qkq5ki9v23nivch9guh64lj1n35ll69.apps.googleusercontent.com';
const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

// ─── MongoDB connection (reuse in serverless) ─────────
let dbConnected = false;
async function connectDB() {
  if (dbConnected || mongoose.connection.readyState >= 1) {
    return;
  }
  await mongoose.connect(ATLAS_URI, {
    serverSelectionTimeoutMS: 10000,
    socketTimeoutMS: 45000,
  });
  dbConnected = true;
  console.log('MongoDB Atlas Connected!');
}

// ─── Mongoose Schemas ─────────────────────────────────
const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  fullName: { type: String, default: '' },
  phone: { type: String, default: '' },
  address: { type: String, default: '' },
  resetOtp: { type: String, default: null },
  resetOtpExpires: { type: Date, default: null },
  createdAt: { type: Date, default: Date.now }
});
const User = mongoose.models.User || mongoose.model('User', UserSchema);

const BusinessSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { type: String, default: 'retail' },
  currency: { type: String, default: 'BDT' },
  address: { type: String, default: '' },
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now }
});
const Business = mongoose.models.Business || mongoose.model('Business', BusinessSchema);

const ProductSchema = new mongoose.Schema({
  name: { type: String, required: true },
  sku: { type: String, default: '' },
  category: { type: String, default: '' },
  buyPrice: { type: Number, default: 0 },
  sellPrice: { type: Number, default: 0 },
  stock: { type: Number, default: 0 },
  unit: { type: String, default: 'piece' },
  businessId: { type: mongoose.Schema.Types.ObjectId, ref: 'Business', required: true },
  createdAt: { type: Date, default: Date.now }
});
const Product = mongoose.models.Product || mongoose.model('Product', ProductSchema);

const SaleSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  productName: { type: String, required: true },
  quantity: { type: Number, required: true },
  unitPrice: { type: Number, required: true },
  totalPrice: { type: Number, required: true },
  buyPrice: { type: Number, default: 0 },
  profit: { type: Number, default: 0 },
  customerName: { type: String, default: '' },
  businessId: { type: mongoose.Schema.Types.ObjectId, ref: 'Business', required: true },
  date: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now }
});
const Sale = mongoose.models.Sale || mongoose.model('Sale', SaleSchema);

const ExpenseSchema = new mongoose.Schema({
  title: { type: String, required: true },
  amount: { type: Number, required: true },
  category: { type: String, default: 'other' },
  description: { type: String, default: '' },
  businessId: { type: mongoose.Schema.Types.ObjectId, ref: 'Business', required: true },
  date: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now }
});
const Expense = mongoose.models.Expense || mongoose.model('Expense', ExpenseSchema);

const NotificationSchema = new mongoose.Schema({
  title: { type: String, required: true },
  message: { type: String, required: true },
  type: { type: String, default: 'info' },
  read: { type: Boolean, default: false },
  businessId: { type: mongoose.Schema.Types.ObjectId, ref: 'Business', required: true },
  createdAt: { type: Date, default: Date.now }
});
const Notification = mongoose.models.Notification || mongoose.model('Notification', NotificationSchema);

const StockMovementSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  type: { type: String, enum: ['in', 'out', 'adjustment'], required: true },
  quantity: { type: Number, required: true },
  reason: { type: String, default: '' },
  businessId: { type: mongoose.Schema.Types.ObjectId, ref: 'Business', required: true },
  createdAt: { type: Date, default: Date.now }
});
const StockMovement = mongoose.models.StockMovement || mongoose.model('StockMovement', StockMovementSchema);

const ViewerSchema = new mongoose.Schema({
  email: { type: String, required: true },
  businessId: { type: mongoose.Schema.Types.ObjectId, ref: 'Business', required: true },
  createdAt: { type: Date, default: Date.now }
});
const Viewer = mongoose.models.Viewer || mongoose.model('Viewer', ViewerSchema);

// ─── Auth Middleware ──────────────────────────────────
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;
  if (!token) return res.status(401).json({ error: 'Access token missing' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
}

// ─── Mailer Helpers ───────────────────────────────────
async function sendOtpEmail(to, otp) {
  try {
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;
    if (!smtpUser || !smtpPass) {
      console.log(`[OTP Logged] Code: ${otp} for ${to}`);
      return true;
    }
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      secure: process.env.SMTP_PORT === '465',
      auth: { user: smtpUser, pass: smtpPass },
    });
    await transporter.sendMail({
      from: `"Amar Hisab" <${smtpUser}>`,
      to,
      subject: `[Amar Hisab] ${otp} is your Password Reset Code`,
      html: `<div style="font-family:Arial;max-width:500px;margin:auto;padding:24px;border:1px solid #e2e8f0;border-radius:16px;background:#fff"><div style="background:#4f46e5;padding:20px;border-radius:12px;text-align:center;color:#fff"><h1 style="margin:0;font-size:24px">Amar Hisab</h1></div><div style="padding:24px 0;text-align:center"><p>Your verification code:</p><div style="display:inline-block;padding:16px 32px;background:#f1f5f9;border:2px dashed #4f46e5;border-radius:12px"><span style="font-family:monospace;font-size:32px;font-weight:900;letter-spacing:8px;color:#4f46e5">${otp}</span></div><p style="color:#64748b;font-size:12px">Valid for 15 minutes</p></div></div>`,
    });
    return true;
  } catch (error) {
    console.error('OTP email error:', error);
    return false;
  }
}

// ─── Helper ───────────────────────────────────────────
function formatUserResponse(user, activeBusinessId) {
  return {
    id: user._id.toString(),
    email: user.email,
    fullName: user.fullName,
    phone: user.phone || '',
    address: user.address || '',
    activeBusinessId: activeBusinessId || ''
  };
}

// ─── Express App ──────────────────────────────────────
const app = express();
app.use(cors());
app.use(express.json());

// Health
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Hisab Backend Running' });
});

// ─── AUTH ROUTES ──────────────────────────────────────
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, fullName, businessName, phone, address, businessType } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) return res.status(400).json({ error: 'An account with this email already exists' });
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    const user = await User.create({ email: email.toLowerCase(), passwordHash, fullName: fullName || '', phone: phone || '', address: address || '' });
    const business = await Business.create({ name: businessName || 'My Business', type: businessType || 'retail', address: address || '', ownerId: user._id });
    const token = jwt.sign({ id: user._id.toString(), email: user.email }, JWT_SECRET, { expiresIn: '7d' });
    return res.status(201).json({ token, user: formatUserResponse(user, business._id.toString()), business: { id: business._id.toString(), name: business.name, type: business.type, currency: business.currency, address: business.address, owner_id: user._id.toString() } });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ error: error.message || 'Server error' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(400).json({ error: 'Invalid email or password' });
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) return res.status(400).json({ error: 'Invalid email or password' });
    const business = await Business.findOne({ ownerId: user._id });
    const token = jwt.sign({ id: user._id.toString(), email: user.email }, JWT_SECRET, { expiresIn: '7d' });
    return res.json({ token, user: formatUserResponse(user, business ? business._id.toString() : ''), business: business ? { id: business._id.toString(), name: business.name, type: business.type, currency: business.currency, address: business.address, owner_id: user._id.toString() } : null });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: error.message || 'Server error' });
  }
});

app.post('/api/auth/google', async (req, res) => {
  try {
    let email = '';
    let fullName = '';

    if (req.body.credential) {
      const ticket = await googleClient.verifyIdToken({ idToken: req.body.credential, audience: GOOGLE_CLIENT_ID });
      const payload = ticket.getPayload();
      email = payload.email.toLowerCase();
      fullName = payload.name || payload.given_name || 'Google User';
    } else if (req.body.email) {
      email = req.body.email.toLowerCase();
      fullName = req.body.fullName || 'Google User';
    } else {
      return res.status(400).json({ error: 'Google email or credential required' });
    }

    let user = await User.findOne({ email });
    let business = null;
    if (!user) {
      const randomPass = require('crypto').randomBytes(32).toString('hex');
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(randomPass, salt);
      user = await User.create({ email, passwordHash, fullName: fullName || '', phone: '', address: '' });
      business = await Business.create({ name: `${fullName}'s Business`, type: 'retail', address: '', ownerId: user._id });
    } else {
      business = await Business.findOne({ ownerId: user._id });
      if (!business) {
        business = await Business.create({ name: `${user.fullName || 'My'}'s Business`, type: 'retail', address: '', ownerId: user._id });
      }
    }
    const token = jwt.sign({ id: user._id.toString(), email: user.email }, JWT_SECRET, { expiresIn: '7d' });
    return res.json({ token, user: formatUserResponse(user, business ? business._id.toString() : ''), business: business ? { id: business._id.toString(), name: business.name, type: business.type, currency: business.currency, address: business.address, owner_id: user._id.toString() } : null });
  } catch (error) {
    console.error('Google auth error:', error);
    return res.status(500).json({ error: error.message || 'Google auth failed' });
  }
});

app.post('/api/auth/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email required' });
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(400).json({ error: 'No account found with this email' });
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.resetOtp = otp;
    user.resetOtpExpires = new Date(Date.now() + 15 * 60 * 1000);
    await user.save();
    await sendOtpEmail(user.email, otp);
    const masked = email.substring(0, 2) + '****@' + email.split('@')[1];
    return res.json({ message: 'OTP sent', maskedEmail: masked });
  } catch (error) {
    console.error('Forgot password error:', error);
    return res.status(500).json({ error: error.message || 'Server error' });
  }
});

app.post('/api/auth/verify-otp-reset-password', async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) return res.status(400).json({ error: 'All fields required' });
    const user = await User.findOne({ email: email.toLowerCase(), resetOtp: otp, resetOtpExpires: { $gt: new Date() } });
    if (!user) return res.status(400).json({ error: 'Invalid or expired OTP' });
    const salt = await bcrypt.genSalt(10);
    user.passwordHash = await bcrypt.hash(newPassword, salt);
    user.resetOtp = null;
    user.resetOtpExpires = null;
    await user.save();
    return res.json({ message: 'Password reset successful' });
  } catch (error) {
    console.error('OTP reset error:', error);
    return res.status(500).json({ error: error.message || 'Server error' });
  }
});

app.get('/api/auth/me', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    const business = await Business.findOne({ ownerId: user._id });
    return res.json({ user: formatUserResponse(user, business ? business._id.toString() : ''), business: business ? { id: business._id.toString(), name: business.name, type: business.type, currency: business.currency, address: business.address, owner_id: user._id.toString() } : null });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// ─── BUSINESS ROUTES ──────────────────────────────────
app.get('/api/businesses', authenticateToken, async (req, res) => {
  try {
    const businesses = await Business.find({ ownerId: req.user.id });
    return res.json(businesses.map(b => ({ id: b._id.toString(), name: b.name, type: b.type, currency: b.currency, address: b.address, owner_id: b.ownerId.toString() })));
  } catch (error) { return res.status(500).json({ error: error.message }); }
});

app.put('/api/businesses/:id', authenticateToken, async (req, res) => {
  try {
    const business = await Business.findOneAndUpdate({ _id: req.params.id, ownerId: req.user.id }, req.body, { new: true });
    if (!business) return res.status(404).json({ error: 'Business not found' });
    return res.json({ id: business._id.toString(), name: business.name, type: business.type, currency: business.currency, address: business.address, owner_id: business.ownerId.toString() });
  } catch (error) { return res.status(500).json({ error: error.message }); }
});

// ─── PRODUCT ROUTES ───────────────────────────────────
function formatProduct(p) {
  const buy_price = Number(p.buyPrice ?? p.buy_price ?? 0) || 0;
  const sell_price = Number(p.sellPrice ?? p.sell_price ?? 0) || 0;
  const current_stock = Number(p.stock ?? p.current_stock ?? 0) || 0;
  const min_stock_level = Number(p.minStockLevel ?? p.min_stock_level ?? 5) || 5;

  return {
    id: p._id ? p._id.toString() : (p.id || ''),
    name: p.name || '',
    sku: p.sku || '',
    category: p.category || 'General',
    buyPrice: buy_price,
    buy_price,
    sellPrice: sell_price,
    sell_price,
    stock: current_stock,
    current_stock,
    minStockLevel: min_stock_level,
    min_stock_level,
    unit: p.unit || 'piece',
    businessId: p.businessId ? p.businessId.toString() : (p.business_id || ''),
    createdAt: p.createdAt || p.created_at || new Date().toISOString()
  };
}

app.get('/api/products', authenticateToken, async (req, res) => {
  try {
    const business = await Business.findOne({ ownerId: req.user.id });
    if (!business) return res.json([]);
    const products = await Product.find({ businessId: business._id }).sort({ createdAt: -1 });
    return res.json(products.map(formatProduct));
  } catch (error) { return res.status(500).json({ error: error.message }); }
});

app.post('/api/products', authenticateToken, async (req, res) => {
  try {
    const business = await Business.findOne({ ownerId: req.user.id });
    if (!business) return res.status(400).json({ error: 'No business found' });

    const buyPrice = Number(req.body.buyPrice ?? req.body.buy_price ?? 0) || 0;
    const sellPrice = Number(req.body.sellPrice ?? req.body.sell_price ?? 0) || 0;
    const stock = Number(req.body.stock ?? req.body.current_stock ?? 0) || 0;

    const product = await Product.create({
      name: req.body.name,
      sku: req.body.sku || `SKU-${Date.now().toString().slice(-6)}`,
      category: req.body.category || 'General',
      buyPrice,
      sellPrice,
      stock,
      unit: req.body.unit || 'piece',
      businessId: business._id
    });
    return res.status(201).json(formatProduct(product));
  } catch (error) { return res.status(500).json({ error: error.message }); }
});

app.put('/api/products/:id', authenticateToken, async (req, res) => {
  try {
    const business = await Business.findOne({ ownerId: req.user.id });
    if (!business) return res.status(400).json({ error: 'No business' });

    const updates = { ...req.body };
    if ('buy_price' in req.body) updates.buyPrice = Number(req.body.buy_price) || 0;
    if ('sell_price' in req.body) updates.sellPrice = Number(req.body.sell_price) || 0;
    if ('current_stock' in req.body) updates.stock = Number(req.body.current_stock) || 0;

    const product = await Product.findOneAndUpdate({ _id: req.params.id, businessId: business._id }, updates, { new: true });
    if (!product) return res.status(404).json({ error: 'Product not found' });
    return res.json(formatProduct(product));
  } catch (error) { return res.status(500).json({ error: error.message }); }
});

app.delete('/api/products/:id', authenticateToken, async (req, res) => {
  try {
    const business = await Business.findOne({ ownerId: req.user.id });
    if (!business) return res.status(400).json({ error: 'No business' });
    await Product.findOneAndDelete({ _id: req.params.id, businessId: business._id });
    return res.json({ message: 'Product deleted' });
  } catch (error) { return res.status(500).json({ error: error.message }); }
});

// ─── SALES ROUTES ─────────────────────────────────────
app.get('/api/sales', authenticateToken, async (req, res) => {
  try {
    const business = await Business.findOne({ ownerId: req.user.id });
    if (!business) return res.json([]);
    const sales = await Sale.find({ businessId: business._id }).sort({ createdAt: -1 });
    return res.json(sales.map(s => ({ id: s._id.toString(), productId: s.productId?.toString(), productName: s.productName, quantity: s.quantity, unitPrice: s.unitPrice, totalPrice: s.totalPrice, buyPrice: s.buyPrice, profit: s.profit, customerName: s.customerName, businessId: s.businessId.toString(), date: s.date, createdAt: s.createdAt })));
  } catch (error) { return res.status(500).json({ error: error.message }); }
});

app.post('/api/sales', authenticateToken, async (req, res) => {
  try {
    const business = await Business.findOne({ ownerId: req.user.id });
    if (!business) return res.status(400).json({ error: 'No business' });
    const { productId, productName, quantity, unitPrice, totalPrice, customerName, date } = req.body;
    let buyPrice = 0, profit = 0;
    if (productId) {
      const product = await Product.findById(productId);
      if (product) {
        buyPrice = product.buyPrice || 0;
        profit = (unitPrice - buyPrice) * quantity;
        product.stock = Math.max(0, (product.stock || 0) - quantity);
        await product.save();
      }
    }
    const sale = await Sale.create({ productId, productName, quantity, unitPrice, totalPrice: totalPrice || unitPrice * quantity, buyPrice, profit, customerName: customerName || '', businessId: business._id, date: date || new Date() });
    return res.status(201).json({ id: sale._id.toString(), productId: sale.productId?.toString(), productName: sale.productName, quantity: sale.quantity, unitPrice: sale.unitPrice, totalPrice: sale.totalPrice, buyPrice: sale.buyPrice, profit: sale.profit, customerName: sale.customerName, businessId: sale.businessId.toString(), date: sale.date, createdAt: sale.createdAt });
  } catch (error) { return res.status(500).json({ error: error.message }); }
});

app.delete('/api/sales/:id', authenticateToken, async (req, res) => {
  try {
    const business = await Business.findOne({ ownerId: req.user.id });
    if (!business) return res.status(400).json({ error: 'No business' });
    await Sale.findOneAndDelete({ _id: req.params.id, businessId: business._id });
    return res.json({ message: 'Sale deleted' });
  } catch (error) { return res.status(500).json({ error: error.message }); }
});

// ─── EXPENSE ROUTES ───────────────────────────────────
app.get('/api/expenses', authenticateToken, async (req, res) => {
  try {
    const business = await Business.findOne({ ownerId: req.user.id });
    if (!business) return res.json([]);
    const expenses = await Expense.find({ businessId: business._id }).sort({ createdAt: -1 });
    return res.json(expenses.map(e => ({ id: e._id.toString(), title: e.title, amount: e.amount, category: e.category, description: e.description, businessId: e.businessId.toString(), date: e.date, createdAt: e.createdAt })));
  } catch (error) { return res.status(500).json({ error: error.message }); }
});

app.post('/api/expenses', authenticateToken, async (req, res) => {
  try {
    const business = await Business.findOne({ ownerId: req.user.id });
    if (!business) return res.status(400).json({ error: 'No business' });
    const expense = await Expense.create({ ...req.body, businessId: business._id });
    return res.status(201).json({ id: expense._id.toString(), title: expense.title, amount: expense.amount, category: expense.category, description: expense.description, businessId: expense.businessId.toString(), date: expense.date, createdAt: expense.createdAt });
  } catch (error) { return res.status(500).json({ error: error.message }); }
});

app.delete('/api/expenses/:id', authenticateToken, async (req, res) => {
  try {
    const business = await Business.findOne({ ownerId: req.user.id });
    if (!business) return res.status(400).json({ error: 'No business' });
    await Expense.findOneAndDelete({ _id: req.params.id, businessId: business._id });
    return res.json({ message: 'Expense deleted' });
  } catch (error) { return res.status(500).json({ error: error.message }); }
});

// ─── NOTIFICATION ROUTES ──────────────────────────────
app.get('/api/notifications', authenticateToken, async (req, res) => {
  try {
    const business = await Business.findOne({ ownerId: req.user.id });
    if (!business) return res.json([]);
    const notifications = await Notification.find({ businessId: business._id }).sort({ createdAt: -1 }).limit(50);
    return res.json(notifications.map(n => ({ id: n._id.toString(), title: n.title, message: n.message, type: n.type, read: n.read, businessId: n.businessId.toString(), createdAt: n.createdAt })));
  } catch (error) { return res.status(500).json({ error: error.message }); }
});

app.put('/api/notifications/:id/read', authenticateToken, async (req, res) => {
  try {
    const notification = await Notification.findByIdAndUpdate(req.params.id, { read: true }, { new: true });
    if (!notification) return res.status(404).json({ error: 'Not found' });
    return res.json({ id: notification._id.toString(), read: notification.read });
  } catch (error) { return res.status(500).json({ error: error.message }); }
});

app.put('/api/notifications/read-all', authenticateToken, async (req, res) => {
  try {
    const business = await Business.findOne({ ownerId: req.user.id });
    if (!business) return res.status(400).json({ error: 'No business' });
    await Notification.updateMany({ businessId: business._id }, { read: true });
    return res.json({ message: 'All marked read' });
  } catch (error) { return res.status(500).json({ error: error.message }); }
});

app.delete('/api/notifications/:id', authenticateToken, async (req, res) => {
  try {
    await Notification.findByIdAndDelete(req.params.id);
    return res.json({ message: 'Deleted' });
  } catch (error) { return res.status(500).json({ error: error.message }); }
});

// ─── PROFILE ROUTES ───────────────────────────────────
app.get('/api/profile', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    const business = await Business.findOne({ ownerId: user._id });
    return res.json({ user: formatUserResponse(user, business ? business._id.toString() : ''), business: business ? { id: business._id.toString(), name: business.name, type: business.type } : null });
  } catch (error) { return res.status(500).json({ error: error.message }); }
});

app.put('/api/profile', authenticateToken, async (req, res) => {
  try {
    const { fullName, phone, address, businessName, businessType } = req.body;
    const user = await User.findByIdAndUpdate(req.user.id, { fullName, phone, address }, { new: true });
    if (businessName || businessType) {
      await Business.findOneAndUpdate({ ownerId: req.user.id }, { ...(businessName && { name: businessName }), ...(businessType && { type: businessType }) });
    }
    return res.json({ message: 'Profile updated', user: formatUserResponse(user) });
  } catch (error) { return res.status(500).json({ error: error.message }); }
});

app.put('/api/profile/password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user.id);
    const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isMatch) return res.status(400).json({ error: 'Current password is wrong' });
    const salt = await bcrypt.genSalt(10);
    user.passwordHash = await bcrypt.hash(newPassword, salt);
    await user.save();
    return res.json({ message: 'Password changed' });
  } catch (error) { return res.status(500).json({ error: error.message }); }
});

// ─── ADMIN ROUTES ─────────────────────────────────────
app.get('/api/admin/users', authenticateToken, async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    const result = [];
    for (const u of users) {
      const business = await Business.findOne({ ownerId: u._id });
      result.push({ id: u._id.toString(), email: u.email, fullName: u.fullName, phone: u.phone, address: u.address, createdAt: u.createdAt, business: business ? { id: business._id.toString(), name: business.name, type: business.type } : null });
    }
    return res.json(result);
  } catch (error) { return res.status(500).json({ error: error.message }); }
});

app.delete('/api/admin/users/:id', authenticateToken, async (req, res) => {
  try {
    const userId = req.params.id;
    const businesses = await Business.find({ ownerId: userId });
    for (const b of businesses) {
      await Product.deleteMany({ businessId: b._id });
      await Sale.deleteMany({ businessId: b._id });
      await Expense.deleteMany({ businessId: b._id });
      await Notification.deleteMany({ businessId: b._id });
      await StockMovement.deleteMany({ businessId: b._id });
      await Viewer.deleteMany({ businessId: b._id });
    }
    await Business.deleteMany({ ownerId: userId });
    await User.findByIdAndDelete(userId);
    return res.json({ message: 'User and all data deleted' });
  } catch (error) { return res.status(500).json({ error: error.message }); }
});

app.get('/api/admin/stats', authenticateToken, async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalBusinesses = await Business.countDocuments();
    const totalProducts = await Product.countDocuments();
    const totalSales = await Sale.countDocuments();
    return res.json({ totalUsers, totalBusinesses, totalProducts, totalSales });
  } catch (error) { return res.status(500).json({ error: error.message }); }
});

// ─── Export handler ───────────────────────────────────
module.exports = async function handler(req, res) {
  await connectDB();
  return app(req, res);
};
