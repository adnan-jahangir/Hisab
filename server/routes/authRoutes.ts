import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import { sendOtpEmail } from '../utils/mailer';
import { User } from '../models/User';
import { Business } from '../models/Business';
import { Viewer } from '../models/Viewer';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'hisab_secret_key_123456_super_secure';
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID || '294246347496-3qkq5ki9v23nivch9guh64lj1n35ll69.apps.googleusercontent.com');

// Helper to format user payload
const formatUserResponse = (user: any, activeBusinessId?: string) => ({
  id: user._id.toString(),
  email: user.email,
  fullName: user.fullName,
  phone: user.phone || '',
  address: user.address || '',
  activeBusinessId: activeBusinessId || ''
});

// Google OAuth Sign In / Sign Up
router.post('/google', async (req: Request, res: Response) => {
  try {
    let email = req.body.email;
    let fullName = req.body.fullName;
    const { idToken } = req.body;

    if (idToken) {
      try {
        const ticket = await googleClient.verifyIdToken({
          idToken,
          audience: process.env.GOOGLE_CLIENT_ID || '294246347496-3qkq5ki9v23nivch9guh64lj1n35ll69.apps.googleusercontent.com',
        });
        const payload = ticket.getPayload();
        if (payload) {
          email = payload.email || email;
          fullName = payload.name || fullName;
        }
      } catch (err) {
        console.warn('Google ID token verification notice:', err);
      }
    }

    if (!email) {
      return res.status(400).json({ error: 'Email is required for Google Sign In' });
    }

    let user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      return res.status(404).json({ error: 'এই ইমেইলের অধীনে কোনো একাউন্ট খুঁজে পাওয়া যায়নি। অনুগ্রহ করে আগে রেজিস্ট্রেশন ফর্ম পূরণ করুন।' });
    }

    let business = await Business.findOne({ ownerId: user._id });
    if (!business) {
      business = await Business.create({
        ownerId: user._id,
        name: `${user.fullName || 'My'}'s Store`,
        type: 'Retail / Store',
        address: user.address || '',
        currency: 'BDT'
      });
    }

    const token = jwt.sign({ id: user._id.toString(), email: user.email }, JWT_SECRET, { expiresIn: '7d' });

    return res.json({
      token,
      user: formatUserResponse(user, business._id.toString()),
      business: {
        id: business._id.toString(),
        name: business.name,
        type: business.type,
        currency: business.currency,
        address: business.address,
        owner_id: user._id.toString()
      }
    });
  } catch (error: any) {
    console.error('Google Sign In error:', error);
    return res.status(500).json({ error: error.message || 'Server error during Google Sign In' });
  }
});
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { email, password, fullName, phone, address, businessName, businessType } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({
      email: email.toLowerCase(),
      passwordHash,
      fullName: fullName || '',
      phone: phone || '',
      address: address || ''
    });

    const business = await Business.create({
      ownerId: user._id,
      name: businessName || 'My Pharmacy',
      type: businessType || 'retail',
      address: address || '',
      currency: 'BDT'
    });

    const token = jwt.sign({ id: user._id.toString(), email: user.email }, JWT_SECRET, { expiresIn: '7d' });

    return res.status(201).json({
      token,
      user: formatUserResponse(user, business._id.toString()),
      business: {
        id: business._id.toString(),
        name: business.name,
        type: business.type,
        currency: business.currency,
        address: business.address,
        owner_id: user._id.toString()
      }
    });
  } catch (error: any) {
    console.error('Registration error:', error);
    return res.status(500).json({ error: error.message || 'Server error during registration' });
  }
});

// Login Owner
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    const business = await Business.findOne({ ownerId: user._id });
    const token = jwt.sign({ id: user._id.toString(), email: user.email }, JWT_SECRET, { expiresIn: '7d' });

    return res.json({
      token,
      user: formatUserResponse(user, business ? business._id.toString() : ''),
      business: business ? {
        id: business._id.toString(),
        name: business.name,
        type: business.type,
        currency: business.currency,
        address: business.address,
        owner_id: user._id.toString()
      } : null
    });
  } catch (error: any) {
    console.error('Login error:', error);
    return res.status(500).json({ error: error.message || 'Server error during login' });
  }
});

// Google Sign-In
router.post('/google', async (req: Request, res: Response) => {
  try {
    let email = '';
    let fullName = '';

    if (req.body.credential) {
      const ticket = await googleClient.verifyIdToken({ idToken: req.body.credential, audience: process.env.GOOGLE_CLIENT_ID || '294246347496-3qkq5ki9v23nivch9guh64lj1n35ll69.apps.googleusercontent.com' });
      const payload = ticket.getPayload();
      if (!payload?.email) {
        return res.status(400).json({ error: 'Google email not found in token payload' });
      }
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
      const randomPass = Math.random().toString(36).slice(-10) + Math.random().toString(36).slice(-10);
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(randomPass, salt);

      user = await User.create({
        email,
        passwordHash,
        fullName: fullName || '',
        phone: '',
        address: ''
      });

      business = await Business.create({
        name: `${fullName}'s Business`,
        type: 'retail',
        address: '',
        ownerId: user._id
      });
    } else {
      business = await Business.findOne({ ownerId: user._id });
      if (!business) {
        business = await Business.create({
          name: `${user.fullName || 'My'}'s Business`,
          type: 'retail',
          address: '',
          ownerId: user._id
        });
      }
    }

    const token = jwt.sign({ id: user._id.toString(), email: user.email }, JWT_SECRET, { expiresIn: '7d' });

    return res.json({
      token,
      user: formatUserResponse(user, business ? business._id.toString() : ''),
      business: business ? {
        id: business._id.toString(),
        name: business.name,
        type: business.type,
        currency: business.currency,
        address: business.address,
        owner_id: user._id.toString()
      } : null
    });
  } catch (error: any) {
    console.error('Google auth error:', error);
    return res.status(500).json({ error: error.message || 'Google auth failed' });
  }
});

// Get Current User Profile
router.get('/me', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findById(req.user?.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const businesses = await Business.find({ ownerId: user._id });
    const activeBusinessId = businesses.length > 0 ? businesses[0]._id.toString() : '';

    return res.json({
      user: formatUserResponse(user, activeBusinessId),
      businesses: businesses.map(b => ({
        id: b._id.toString(),
        name: b.name,
        type: b.type,
        currency: b.currency,
        address: b.address,
        owner_id: user._id.toString()
      }))
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

function maskEmail(email: string): string {
  const parts = email.split('@');
  if (parts.length !== 2) return email;
  const name = parts[0];
  const domain = parts[1];
  if (name.length <= 2) return `${name[0]}*@${domain}`;
  const maskedName = `${name.slice(0, 2)}${'*'.repeat(Math.min(name.length - 2, 4))}`;
  return `${maskedName}@${domain}`;
}

// POST /api/auth/forgot-password - Request OTP email
router.post('/forgot-password', async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email address is required.' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({ error: 'No account found with this email.' });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.resetOtp = otp;
    user.resetOtpExpires = new Date(Date.now() + 15 * 60 * 1000);
    await user.save();

    await sendOtpEmail(user.email, otp);

    const masked = maskEmail(user.email);
    return res.json({
      message: `OTP code sent to ${masked}!`,
      maskedEmail: masked
    });
  } catch (error: any) {
    console.error('Forgot password error:', error);
    return res.status(500).json({ error: error.message || 'Failed to send OTP.' });
  }
});

// POST /api/auth/verify-otp-reset-password - Verify OTP and Reset Password
router.post('/verify-otp-reset-password', async (req: Request, res: Response) => {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) {
      return res.status(400).json({ error: 'Email, OTP, এবং নতুন পাসওয়ার্ড প্রদান করা আবশ্যক।' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({ error: 'ব্যবহারকারী খুঁজে পাওয়া যায়নি।' });
    }

    if (!user.resetOtp || user.resetOtp !== otp.trim()) {
      return res.status(400).json({ error: 'ভুল OTP প্রদান করা হয়েছে। অনুগ্রহ করে সঠিক ৬ ডিজিটের কোডটি দিন।' });
    }

    if (!user.resetOtpExpires || user.resetOtpExpires.getTime() < Date.now()) {
      return res.status(400).json({ error: 'OTP কোডের মেয়াদ শেষ হয়ে গেছে। অনুগ্রহ করে আবার চেষ্টা করুন।' });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    user.passwordHash = passwordHash;
    user.resetOtp = undefined;
    user.resetOtpExpires = undefined;
    await user.save();

    return res.json({ message: 'আপনার পাসওয়ার্ড সফলভাবে পরিবর্তন করা হয়েছে! এখন লগইন করুন।' });
  } catch (error: any) {
    console.error('Reset password error:', error);
    return res.status(500).json({ error: error.message || 'পাসওয়ার্ড রিসেট করতে ব্যর্থ হয়েছে।' });
  }
});

export default router;
