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
import { useAuthStore } from '../store/useAuthStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { useToastStore } from '../store/useToastStore';
import { rehydrateScopedStores } from '../utils/rehydrateScopedStores';
import { seedStores } from '../data/mockData';
import { supabase } from '../lib/supabase';

const loginSchema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function Login() {
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [mode, setMode] = useState<'owner' | 'viewer'>('owner');
  const navigate = useNavigate();
  const loginOwner = useAuthStore((state) => state.loginOwner);
  const loginAdmin = useAuthStore((state) => state.loginAdmin);
  const loginViewer = useAuthStore((state) => state.loginViewer);
  const signInWithGoogle = useAuthStore((state) => state.signInWithGoogle);
  const ownerAccount = useAuthStore((state) => state.ownerAccount);
  const setOwnerProfile = useSettingsStore((state) => state.setOwnerProfile);
  const resetToDemo = useSettingsStore((state) => state.resetToDemo);
  const addToast = useToastStore((state) => state.addToast);

  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
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

  const onSubmit = async (data: LoginForm) => {
    console.log('Login attempt started for:', data.email);
    setLoading(true);

    try {
      console.log('Attempting Supabase signIn...');
      const { error } = await loginOwner(data.email, data.password);
      if (error) {
        console.error('Supabase signIn error:', error);
        addToast(error.message || 'Login failed. Check your credentials.', 'error');
        setLoading(false);
        return;
      }

      // Rehydrate stores with a timeout so it doesn't hang
      try {
        await Promise.race([
          rehydrateScopedStores(),
          new Promise(resolve => setTimeout(resolve, 3000))
        ]);
        // Immediately fetch user profile and businesses so activeBusiness is set
        await Promise.all([
          useSettingsStore.getState().fetchProfile(),
          useSettingsStore.getState().fetchBusinesses()
        ]);
      } catch (_) {
        // ignore rehydration errors, navigate anyway
      }

      addToast('Login successful!', 'success');
      navigate('/app');
    } catch (error) {
      console.error('Login exception:', error);
      addToast('Something went wrong, please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const [viewerName, setViewerName] = useState('');

  const handleViewerEntry = async () => {
    if (!viewerName.trim()) return;
    setLoading(true);
    resetToDemo();
    await loginViewer(viewerName);
    await rehydrateScopedStores();
    seedStores();
    setLoading(false);
    navigate('/app');
  };

  return (
    <AuthLayout>
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="lg:hidden flex items-center justify-center gap-2 mb-8">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-accent-primary to-purple-600 flex items-center justify-center font-bold text-xl text-white">H</div>
        <span className="text-3xl font-bold">Hisab</span>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-bg-elevated p-8 rounded-2xl border border-border shadow-xl">
        <h2 className="text-2xl font-bold text-white mb-2">Welcome Back!</h2>
        <p className="text-text-muted mb-5">Login as an owner or use viewer mode for demo.</p>

        <div className="grid grid-cols-2 gap-2 mb-6">
          {([
            { id: 'owner', label: 'Owner Login' },
            { id: 'viewer', label: 'Viewer Demo' },
          ] as const).map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setMode(item.id)}
              className={`rounded-lg px-3 py-2 text-sm font-semibold border transition-colors ${mode === item.id ? 'bg-accent-primary text-white border-accent-primary' : 'bg-bg-base text-text-muted border-border hover:text-white'}`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {mode === 'viewer' ? (
          <div className="space-y-4">
            <div className="rounded-xl border border-border bg-bg-base p-4 text-sm text-text-muted">
              Viewer mode only shows demo data. Please enter your name to continue.
            </div>
            <Input 
              label="Your Name" 
              placeholder="Enter your name" 
              value={viewerName} 
              onChange={(e) => setViewerName(e.target.value)} 
            />
            <Button 
              type="button" 
              className="w-full" 
              loading={loading} 
              onClick={handleViewerEntry}
              disabled={!viewerName.trim()}
            >
              Continue as Viewer
            </Button>
            <p className="text-center text-xs text-text-muted">Owner registration is done on the separate register page.</p>
          </div>
        ) : (
          <>
            <p className="text-text-muted mb-8">Please enter your email and password</p>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <Input 
                label="Email" 
                placeholder="Your Email" 
                {...register('email')} 
                error={errors.email?.message} 
              />

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

              <div className="flex justify-end">
                <Link to="/forgot-password" className="text-sm text-accent-primary hover:underline">
                  Forgot Password?
                </Link>
              </div>

              <Button type="submit" className="w-full" loading={loading} disabled={loading}>
                Login
              </Button>
            </form>

            <div className="my-6 flex items-center gap-4">
              <div className="flex-1 h-px bg-border" />
              <span className="text-sm text-text-muted">New to Hisab?</span>
              <div className="flex-1 h-px bg-border" />
            </div>

            <Button 
              type="button" 
              variant="secondary"
              className="w-full" 
              onClick={() => navigate('/register')}
            >
              Create an Account
            </Button>
          </>
        )}
      </motion.div>
    </AuthLayout>
  );
}
