import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';

import { AuthLayout } from '../components/layout/AuthLayout';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Select } from '../components/ui/Select';
import { useAuthStore } from '../store/useAuthStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { rehydrateScopedStores } from '../utils/rehydrateScopedStores';

const registerSchema = z.object({
  fullName: z.string().min(2, 'Enter your name'),
  businessName: z.string().min(2, 'Enter business name'),
  businessType: z.string().min(1, 'Select business type'),
  email: z.string().email('Enter a valid email'),
  phone: z.string().min(11, 'Enter a valid phone number'),
  address: z.string().min(3, 'Enter address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
  terms: z.boolean().refine(val => val === true, 'Terms must be accepted')
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword']
});

type RegisterForm = z.infer<typeof registerSchema>;

import { useToastStore } from '../store/useToastStore';

export default function Register() {
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const registerOwner = useAuthStore((state) => state.registerOwner);
  const setOwnerProfile = useSettingsStore((state) => state.setOwnerProfile);
  const addToast = useToastStore(state => state.addToast);

  const { register, handleSubmit, watch, formState: { errors } } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  });

  const passwordVal = watch('password', '');
  const getPasswordStrength = (pass: string) => {
    if (!pass) return { label: '', color: 'bg-transparent', w: '0%' };
    if (pass.length < 6) return { label: 'Weak', color: 'bg-danger', w: '33%' };
    if (pass.length < 10) return { label: 'Medium', color: 'bg-warning', w: '66%' };
    return { label: 'Strong', color: 'bg-success', w: '100%' };
  };
  const strength = getPasswordStrength(passwordVal);

  const onSubmit = async (data: RegisterForm) => {
    setLoading(true);
    const { error } = await registerOwner({
      fullName: data.fullName,
      businessName: data.businessName,
      businessType: data.businessType,
      email: data.email,
      password: data.password,
      phone: data.phone,
      address: data.address,
    });

    if (error) {
      console.error('Registration failed:', error);
      addToast(error.message || 'Registration failed. Check console for details.', 'error');
      setLoading(false);
      return;
    }

    setOwnerProfile({
      fullName: data.fullName,
      businessName: data.businessName,
      businessType: data.businessType,
      email: data.email,
      phone: data.phone,
      address: data.address,
    });

    await rehydrateScopedStores();
    setLoading(false);
    navigate('/app');
  };

  return (
    <AuthLayout>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-bg-elevated p-8 rounded-2xl border border-border shadow-xl">
        <h2 className="text-2xl font-bold text-white mb-2">Start for Free</h2>
        <p className="text-text-muted mb-6">Start your business's digital journey</p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input label="Your Name" placeholder="Full Name" {...register('fullName')} error={errors.fullName?.message} />
          <Input label="Business Name" placeholder="Shop or Company Name" {...register('businessName')} error={errors.businessName?.message} />
          <Select label="Business Type" {...register('businessType')} error={errors.businessType?.message}>
            <option value="">Select</option>
            <option value="retail">Retail</option>
            <option value="service">Service</option>
            <option value="manufacturing">Manufacturing</option>
            <option value="other">Other</option>
          </Select>
          <Input label="Email" placeholder="Your Email" {...register('email')} error={errors.email?.message} />
          <Input label="Phone Number" placeholder="01XXXXXXXXX" {...register('phone')} error={errors.phone?.message} />
          <Input label="Address" placeholder="Shop Address" {...register('address')} error={errors.address?.message} />

          <div>
            <div className="relative">
              <Input 
                label="Password" 
                type={showPassword ? 'text' : 'password'} 
                placeholder="••••••••" 
                {...register('password')} 
                error={errors.password?.message} 
              />
              <button 
                type="button" 
                onClick={() => setShowPassword(!showPassword)} 
                className="absolute right-3 top-[34px] text-text-muted hover:text-white"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {passwordVal && (
              <div className="mt-2 flex items-center justify-between text-xs">
                <div className="flex-1 h-1.5 bg-bg-base rounded-full overflow-hidden mr-2">
                  <div className={`h-full transition-all duration-300 ${strength.color}`} style={{ width: strength.w }} />
                </div>
                <span className={`font-medium ${strength.color.replace('bg-', 'text-')}`}>{strength.label}</span>
              </div>
            )}
          </div>

          <Input 
            label="Confirm Password" 
            type={showPassword ? 'text' : 'password'} 
            placeholder="••••••••" 
            {...register('confirmPassword')} 
            error={errors.confirmPassword?.message} 
          />

          <label className="flex items-start gap-2 cursor-pointer mt-4">
            <input type="checkbox" {...register('terms')} className="mt-1" />
            <span className="text-sm text-text-muted">
              I agree to the <Link to="/terms" className="text-accent-primary hover:underline">Terms</Link>
            </span>
          </label>
          {errors.terms && <p className="text-danger text-xs">{errors.terms.message}</p>}

          <Button type="submit" className="w-full mt-2" loading={loading} disabled={loading}>
            Create Account
          </Button>
        </form>

        <div className="my-6 flex items-center gap-4">
          <div className="flex-1 h-px bg-border" />
          <span className="text-sm text-text-muted">OR</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        <button className="w-full flex items-center justify-center gap-3 px-4 py-2.5 rounded-lg border border-border bg-white text-gray-900 font-medium hover:bg-gray-50 transition-colors">
          <svg className="w-5 h-5" viewBox="0 0 24 24">
             <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
             <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
             <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
             <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          Sign up with Google
        </button>

        <p className="text-center text-sm text-text-muted mt-6">
          Already have an account? <Link to="/login" className="text-accent-primary hover:underline font-medium">Login</Link>
        </p>
      </motion.div>
    </AuthLayout>
  );
}
