import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, KeyRound, Lock, ArrowLeft, CheckCircle2 } from 'lucide-react';

import { AuthLayout } from '../components/layout/AuthLayout';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { useToastStore } from '../store/useToastStore';
import { apiFetch } from '../lib/api';

export default function ForgotPassword() {
  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const addToast = useToastStore((state) => state.addToast);
  const navigate = useNavigate();

  // Step 1: Request OTP
  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      addToast('ইমেইল এড্রেস দেওয়া আবশ্যক।', 'error');
      return;
    }

    setLoading(true);
    try {
      const res = await apiFetch('/auth/forgot-password', {
        method: 'POST',
        body: { email }
      });
      addToast(res.message || 'আপনার ইমেইলে ৬ ডিজিটের OTP পাঠানো হয়েছে!', 'success');
      setStep(2);
    } catch (err: any) {
      addToast(err.message || 'OTP পাঠাতে ব্যর্থ হয়েছে। ইমেইলটি চেক করুন।', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP & Reset Password
  const handleVerifyOtpAndReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp.trim() || !newPassword.trim()) {
      addToast('OTP এবং নতুন পাসওয়ার্ড প্রদান করা আবশ্যক।', 'error');
      return;
    }

    if (newPassword.length < 6) {
      addToast('নতুন পাসওয়ার্ড অন্তত ৬ অক্ষরের হতে হবে।', 'error');
      return;
    }

    setLoading(true);
    try {
      const res = await apiFetch('/auth/verify-otp-reset-password', {
        method: 'POST',
        body: { email, otp, newPassword }
      });
      addToast(res.message || 'পাসওয়ার্ড সফলভাবে রিস্টোর হয়েছে!', 'success');
      setSuccess(true);
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err: any) {
      addToast(err.message || 'ভুল OTP বা পাসওয়ার্ড রিসেট ব্যর্থ হয়েছে।', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-bg-elevated p-8 rounded-2xl border border-border shadow-xl">
        {success ? (
          <div className="text-center py-4 space-y-4">
            <div className="w-16 h-16 bg-success/20 text-success rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-10 h-10 animate-bounce" />
            </div>
            <h2 className="text-2xl font-bold text-text-primary">Password Reset Successful!</h2>
            <p className="text-text-secondary text-sm">
              আপনার পাসওয়ার্ড পরিবর্তন সম্পন্ন হয়েছে। লগইন পেজে রিডাইরেক্ট করা হচ্ছে...
            </p>
            <Button className="w-full mt-4" onClick={() => navigate('/login')}>
              Go to Login Page
            </Button>
          </div>
        ) : step === 1 ? (
          <>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-accent-primary/10 flex items-center justify-center text-accent-primary">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-text-primary">Forgot Password?</h2>
                <p className="text-xs text-text-muted">Enter your account email to receive 6-digit OTP code</p>
              </div>
            </div>

            <p className="text-text-secondary text-sm mb-6 mt-4">
              আপনার একাউন্টের পাসওয়ার্ড পুনরুদ্ধার করতে নিবন্ধিত ইমেইলটি টাইপ করুন। ইমেইলে একটি ৬ ডিজিটের OTP পাঠানো হবে।
            </p>

            <form onSubmit={handleRequestOtp} className="space-y-5">
              <Input
                label="Registered Email"
                placeholder="your.email@example.com"
                type="email"
                prefix={Mail}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />

              <Button type="submit" className="w-full gap-2 py-3" loading={loading} disabled={loading}>
                Send 6-Digit OTP Code
              </Button>
            </form>

            <div className="mt-8 text-center border-t border-border pt-4">
              <Link to="/login" className="text-sm text-text-muted hover:text-accent-primary font-semibold flex items-center justify-center gap-1">
                <ArrowLeft className="w-4 h-4" /> Back to Login
              </Link>
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-accent-primary/10 flex items-center justify-center text-accent-primary">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-text-primary">Verify Email OTP</h2>
                <p className="text-xs text-text-muted">OTP sent to: <span className="text-accent-primary font-mono">{email}</span></p>
              </div>
            </div>

            <p className="text-text-secondary text-sm mb-6 mt-4">
              আপনার ইমেইলে প্রাপ্ত ৬ ডিজিটের OTP কোড এবং আপনার নতুন পাসওয়ার্ড টাইপ করুন।
            </p>

            <form onSubmit={handleVerifyOtpAndReset} className="space-y-5">
              <Input
                label="6-Digit Verification OTP"
                placeholder="e.g. 849201"
                prefix={KeyRound}
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className="font-mono text-lg tracking-widest text-center"
                maxLength={6}
                required
              />

              <Input
                label="New Password"
                placeholder="••••••••"
                type="password"
                prefix={Lock}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                hint="Minimum 6 characters required"
                required
              />

              <Button type="submit" className="w-full gap-2 py-3" loading={loading} disabled={loading}>
                Reset Password & Submit
              </Button>
            </form>

            <div className="mt-8 text-center border-t border-border pt-4 flex justify-between items-center text-sm">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="text-text-muted hover:text-text-primary font-medium"
              >
                Change Email
              </button>

              <Link to="/login" className="text-accent-primary hover:underline font-semibold flex items-center gap-1">
                <ArrowLeft className="w-4 h-4" /> Back to Login
              </Link>
            </div>
          </>
        )}
      </motion.div>
    </AuthLayout>
  );
}
