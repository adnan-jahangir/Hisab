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
import { supabase } from '../lib/supabase';

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
  const signInWithGoogle = useAuthStore((state) => state.signInWithGoogle);
  const addToast = useToastStore(state => state.addToast);

  const { register, handleSubmit, watch, formState: { errors } } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  });

  // Explicit check for OAuth redirect result
  React.useEffect(() => {
    const check = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        addToast('Welcome back!', 'success');
        navigate('/app');
      }
    };
    check();
  }, [navigate, addToast]);

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
    try {
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
      navigate('/app');
    } catch (err: any) {
      console.error('Unexpected registration error:', err);
      addToast(err.message || 'An unexpected error occurred during registration.', 'error');
    } finally {
      setLoading(false);
    }
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
          <span className="text-sm text-text-muted">Already have an account?</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        <Button 
          type="button" 
          variant="secondary"
          className="w-full" 
          onClick={() => navigate('/login')}
        >
          Login to your Account
        </Button>
      </motion.div>
    </AuthLayout>
  );
}
