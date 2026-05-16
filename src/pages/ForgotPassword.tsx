import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Link } from 'react-router-dom';

import { AuthLayout } from '../components/layout/AuthLayout';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { useAuthStore } from '../store/useAuthStore';
import { useToastStore } from '../store/useToastStore';

const forgotPasswordSchema = z.object({
  email: z.string().email('Enter a valid email'),
});

type ForgotPasswordForm = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPassword() {
  const [loading, setLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);
  
  const resetPassword = useAuthStore((state) => state.resetPassword);
  const addToast = useToastStore((state) => state.addToast);

  const { register, handleSubmit, formState: { errors } } = useForm<ForgotPasswordForm>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordForm) => {
    setLoading(true);
    try {
      const { error } = await resetPassword(data.email);
      
      if (error) {
        addToast(error.message || 'Failed to send reset email. Please try again.', 'error');
        setLoading(false);
        return;
      }

      setIsSent(true);
      addToast('Password reset link sent to your email!', 'success');
    } catch (error) {
      console.error('Reset password exception:', error);
      addToast('Something went wrong, please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-bg-elevated p-8 rounded-2xl border border-border shadow-xl">
        {isSent ? (
          <div className="text-center">
            <div className="w-16 h-16 bg-success/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Check your email</h2>
            <p className="text-text-muted mb-6">
              We've sent a password reset link to your email address. Please check your inbox.
            </p>
            <Button 
              type="button" 
              variant="secondary"
              className="w-full" 
              onClick={() => setIsSent(false)}
            >
              Try another email
            </Button>
            <p className="text-center text-sm text-text-muted mt-6">
              <Link to="/login" className="text-accent-primary hover:underline font-medium">Back to Login</Link>
            </p>
          </div>
        ) : (
          <>
            <h2 className="text-2xl font-bold text-white mb-2">Reset Password</h2>
            <p className="text-text-muted mb-8">Enter your email address and we'll send you a link to reset your password.</p>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <Input 
                label="Email" 
                placeholder="Your Email" 
                {...register('email')} 
                error={errors.email?.message} 
              />

              <Button type="submit" className="w-full" loading={loading} disabled={loading}>
                Send Reset Link
              </Button>
            </form>

            <div className="mt-8 text-center">
              <Link to="/login" className="text-sm text-accent-primary hover:underline font-medium">
                Back to Login
              </Link>
            </div>
          </>
        )}
      </motion.div>
    </AuthLayout>
  );
}
