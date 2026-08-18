import React, { useState } from 'react';
import { useGoogleLogin } from '@react-oauth/google';
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

  const onSubmit = async (data: LoginForm) => {
    console.log('Login attempt started for:', data.email);
    setLoading(true);

    try {
      if (data.email.toLowerCase() === 'admin@iiuc.ac.bd') {
        const isAdminLoggedIn = await loginAdmin(data.email, data.password);
        if (isAdminLoggedIn) {
          addToast('Logged in as Super Admin!', 'success');
          navigate('/app');
          return;
        }
      }

      console.log('Attempting MongoDB backend signIn...');
      const { error } = await loginOwner(data.email, data.password);
      if (error) {
        console.error('MongoDB backend signIn error:', error);
        addToast(typeof error === 'string' ? error : error.message || 'Login failed. Check your credentials.', 'error');
        setLoading(false);
        return;
      }

      // Rehydrate stores with a timeout so it doesn't hang
      try {
        await Promise.race([
          rehydrateScopedStores(),
          new Promise(resolve => setTimeout(resolve, 3000))
        ]);
        if (data.email.toLowerCase() !== 'admin@iiuc.ac.bd') {
          await Promise.all([
            useSettingsStore.getState().fetchProfile(),
            useSettingsStore.getState().fetchBusinesses()
          ]);
        }
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

  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setLoading(true);
      try {
        const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
        });
        const userInfo = await userInfoRes.json();

        const { error } = await signInWithGoogle({
          email: userInfo.email,
          fullName: userInfo.name || userInfo.given_name,
          googleId: userInfo.sub
        });

        if (error) {
          addToast(typeof error === 'string' ? error : 'Google Sign-In failed', 'error');
          return;
        }

        addToast(`Welcome ${userInfo.name || 'User'}! Signed in with Google.`, 'success');
        navigate('/app');
      } catch (err: any) {
        console.error('Google OAuth error:', err);
        addToast('Google login failed. Please try again.', 'error');
      } finally {
        setLoading(false);
      }
    },
    onError: (error) => {
      console.error('Google OAuth popup error:', error);
      addToast('Google popup was closed or cancelled', 'error');
    }
  });

  return (
    <AuthLayout>
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="lg:hidden flex items-center justify-center gap-2 mb-8">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-accent-primary to-purple-600 flex items-center justify-center font-bold text-xl text-white">H</div>
        <span className="text-3xl font-bold">Hisab</span>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-bg-elevated p-8 rounded-2xl border border-border shadow-xl">
        <h2 className="text-2xl font-bold text-text-primary mb-2">Welcome Back!</h2>
        <p className="text-text-muted mb-5">Login as an owner or use viewer mode for demo.</p>

        {/* Google Sign-In Button */}
        <button
          type="button"
          onClick={() => googleLogin()}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-xl border border-border bg-bg-base hover:bg-bg-elevated text-text-primary text-sm font-semibold transition-all shadow-sm mb-5 cursor-pointer"
        >
          <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
          </svg>
          Sign in with Google
        </button>

        <div className="relative flex items-center justify-center mb-5">
          <div className="border-t border-border w-full" />
          <span className="bg-bg-elevated px-3 text-[11px] font-bold tracking-wider text-text-muted uppercase absolute">or sign in with email</span>
        </div>

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
                <button
                  type="button"
                  onClick={() => {
                    const currentEmail = watch('email') || '';
                    navigate(`/forgot-password?email=${encodeURIComponent(currentEmail)}`);
                  }}
                  className="text-sm text-accent-primary hover:underline font-medium cursor-pointer"
                >
                  Forgot Password?
                </button>
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
