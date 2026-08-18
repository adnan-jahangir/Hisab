import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Mail, KeyRound, Lock, ArrowLeft, CheckCircle2 } from 'lucide-react';

import { AuthLayout } from '../components/layout/AuthLayout';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { useToastStore } from '../store/useToastStore';
import { apiFetch } from '../lib/api';

function maskEmail(email: string): string {
  if (!email || !email.includes('@')) return 'your registered email';
  const parts = email.split('@');
  const name = parts[0];
  const domain = parts[1];
  if (name.length <= 2) return `${name[0]}*@${domain}`;
  const maskedName = `${name.slice(0, 2)}${'*'.repeat(Math.min(name.length - 2, 4))}`;
  return `${maskedName}@${domain}`;
}

export default function ForgotPassword() {
  const [searchParams] = useSearchParams();
  const emailQuery = searchParams.get('email') || '';

  const [step, setStep] = useState<1 | 2>(emailQuery ? 2 : 1);
  const [email, setEmail] = useState(emailQuery);
  const [maskedEmail, setMaskedEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const addToast = useToastStore((state) => state.addToast);
  const navigate = useNavigate();

  // Auto-send OTP if email query param exists from Login page
  useEffect(() => {
    if (emailQuery && emailQuery.trim() !== '') {
      setLoading(true);
      apiFetch('/auth/forgot-password', {
        method: 'POST',
        body: { email: emailQuery.trim() }
      })
        .then((res) => {
          if (res.maskedEmail) setMaskedEmail(res.maskedEmail);
          addToast(res.message || 'OTP code sent to your email!', 'success');
          setStep(2);
        })
        .catch((err) => {
          addToast(err?.message || 'No account found with this email.', 'error');
          setStep(1);
        })
        .finally(() => setLoading(false));
    } else {
      setStep(1);
    }
  }, [emailQuery]);

  // Manual Step 1: Request OTP
  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      addToast('Email address is required.', 'error');
      return;
    }

    setLoading(true);
    try {
      const res = await apiFetch('/auth/forgot-password', {
        method: 'POST',
        body: { email }
      });
      if (res.maskedEmail) setMaskedEmail(res.maskedEmail);
      addToast(res.message || 'OTP code sent to your email!', 'success');
      setStep(2);
    } catch (err: any) {
      addToast(err.message || 'Failed to send OTP. Please check the email address.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP & Reset Password
  const handleVerifyOtpAndReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp.trim() || !newPassword.trim()) {
      addToast('OTP and new password are required.', 'error');
      return;
    }

    if (newPassword.length < 6) {
      addToast('New password must be at least 6 characters.', 'error');
      return;
    }

    setLoading(true);
    try {
      const res = await apiFetch('/auth/verify-otp-reset-password', {
        method: 'POST',
        body: { email, otp, newPassword }
      });
      addToast(res.message || 'Password reset successfully!', 'success');
      setSuccess(true);
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err: any) {
      addToast(err.message || 'Invalid OTP code. Password reset failed.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const displayMasked = maskedEmail || maskEmail(email);

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
              Your password has been reset. Redirecting to login page...
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
                <p className="text-xs text-text-muted">Enter your registered email to receive OTP</p>
              </div>
            </div>

            <p className="text-text-secondary text-sm mb-6 mt-4">
              Please enter your registered email address below. We will send a 6-digit OTP code to verify your request.
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
                <h2 className="text-2xl font-bold text-text-primary">Enter Verification OTP</h2>
                <p className="text-xs text-text-muted">OTP code sent to: <span className="text-accent-primary font-mono font-bold">{displayMasked}</span></p>
              </div>
            </div>

            <p className="text-text-secondary text-sm mb-6 mt-4">
              Enter the 6-digit verification code sent to your email <strong className="text-accent-primary">{displayMasked}</strong> along with your new password.
            </p>

            <form onSubmit={handleVerifyOtpAndReset} className="space-y-5">
              <Input
                label="6-Digit Verification OTP Code"
                placeholder="e.g. 849201"
                prefix={KeyRound}
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className="font-mono text-xl tracking-widest text-center font-bold"
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

              <Button type="submit" className="w-full gap-2 py-3 shadow-lg" loading={loading} disabled={loading}>
                Reset Password & Confirm
              </Button>
            </form>

            <div className="mt-8 text-center border-t border-border pt-4 flex justify-between items-center text-sm">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="text-text-muted hover:text-text-primary font-medium text-xs underline"
              >
                Use Another Email
              </button>

              <Link to="/login" className="text-accent-primary hover:underline font-semibold flex items-center gap-1 text-xs">
                <ArrowLeft className="w-4 h-4" /> Back to Login
              </Link>
            </div>
          </>
        )}
      </motion.div>
    </AuthLayout>
  );
}
