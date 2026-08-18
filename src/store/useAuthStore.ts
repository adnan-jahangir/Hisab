import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { clearDataScope, setDataScope } from '../utils/roleScope';
import { apiFetch, setAuthToken, removeAuthToken, getAuthToken } from '../lib/api';
import { useSettingsStore } from './useSettingsStore';

export type AuthRole = 'owner' | 'admin' | 'viewer' | null;

export interface OwnerAccount {
  fullName: string;
  businessName: string;
  businessType: string;
  email: string;
  password?: string;
  phone: string;
  address: string;
}

interface AuthState {
  role: AuthRole;
  isAuthenticated: boolean;
  ownerAccount: OwnerAccount | null;
  registerOwner: (account: OwnerAccount & { password: string }) => Promise<{ error: any }>;
  loginOwner: (email: string, password: string) => Promise<{ error: any }>;
  loginAdmin: (email: string, password: string) => Promise<boolean>;
  loginViewer: (name: string) => Promise<void>;
  signInWithGoogle: (googleData?: { email?: string; fullName?: string; googleId?: string }) => Promise<{ error: any }>;
  resetPassword: (email: string) => Promise<{ error: any }>;
  logout: () => Promise<void>;
  checkSession: () => Promise<void>;
  initializeListener: () => void;
}

const ADMIN_EMAIL = 'admin@iiuc.ac.bd';
const ADMIN_PASSWORD = 'Admin@1234';

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      role: null,
      isAuthenticated: false,
      ownerAccount: null,

      registerOwner: async (account) => {
        try {
          console.log('registerOwner: sending to MongoDB backend...');
          const res = await apiFetch('/auth/register', {
            method: 'POST',
            body: {
              email: account.email,
              password: account.password,
              fullName: account.fullName,
              businessName: account.businessName,
              phone: account.phone,
              address: account.address,
              businessType: account.businessType
            }
          });

          if (res.token) {
            setAuthToken(res.token);
          }

          setDataScope('owner');
          set({
            role: 'owner',
            isAuthenticated: true,
            ownerAccount: account
          });

          if (res.business) {
            useSettingsStore.setState({
              activeBusiness: res.business.id,
              businesses: [res.business],
              user: {
                name: account.fullName,
                email: account.email,
                businessName: account.businessName,
                phone: account.phone,
                location: account.address
              }
            });
          }

          return { error: null };
        } catch (err: any) {
          console.error('registerOwner exception:', err);
          return { error: err.message || err };
        }
      },

      loginOwner: async (email, password) => {
        try {
          console.log('loginOwner: signing in with MongoDB backend...');
          const res = await apiFetch('/auth/login', {
            method: 'POST',
            body: { email, password }
          });

          if (res.token) {
            setAuthToken(res.token);
          }

          const isAdmin = email.toLowerCase() === ADMIN_EMAIL.toLowerCase();

          setDataScope('owner');
          set({
            role: isAdmin ? 'admin' : 'owner',
            isAuthenticated: true,
            ownerAccount: {
              fullName: isAdmin ? 'System Administrator' : (res.user.fullName || ''),
              businessName: isAdmin ? 'Super Admin Access' : (res.business?.name || ''),
              email: res.user.email || email,
              phone: res.user.phone || '',
              address: res.user.address || '',
              businessType: isAdmin ? 'system' : (res.business?.type || '')
            }
          });

          if (res.business) {
            useSettingsStore.setState({
              activeBusiness: res.business.id,
              businesses: [res.business],
              user: {
                name: res.user.fullName,
                email: res.user.email,
                businessName: res.business.name,
                phone: res.user.phone,
                location: res.user.address
              }
            });
          }

          console.log('loginOwner: success!');
          return { error: null };
        } catch (err: any) {
          console.error('loginOwner exception:', err);
          return { error: err.message || err };
        }
      },

      loginAdmin: async (email, password) => {
        if (email.toLowerCase() !== ADMIN_EMAIL.toLowerCase() || password !== ADMIN_PASSWORD) {
          return false;
        }

        try {
          console.log('loginAdmin: authenticating with MongoDB backend...');
          const res = await apiFetch('/auth/login', {
            method: 'POST',
            body: { email, password }
          });

          if (res.token) {
            setAuthToken(res.token);
          }

          setDataScope('owner');
          set({
            role: 'admin',
            isAuthenticated: true,
            ownerAccount: {
              fullName: 'System Administrator',
              businessName: 'Super Admin Access',
              email: ADMIN_EMAIL,
              phone: res.user?.phone || '',
              address: res.user?.address || '',
              businessType: 'system'
            }
          });

          if (res.business) {
            useSettingsStore.setState({
              activeBusiness: res.business.id,
              businesses: [res.business],
              user: {
                name: res.user.fullName,
                email: res.user.email,
                businessName: res.business.name,
                phone: res.user.phone,
                location: res.user.address
              }
            });
          }

          return true;
        } catch (err) {
          console.error('loginAdmin authentication error:', err);
          return false;
        }
      },

      loginViewer: async (name: string) => {
        try {
          await apiFetch('/auth/viewer', { method: 'POST', body: { name } });
        } catch (e) {
          console.error('Error recording viewer:', e);
        }

        setDataScope('viewer');
        set({
          role: 'viewer',
          isAuthenticated: true,
          ownerAccount: {
            fullName: name,
            businessName: 'Viewer Access',
            email: 'viewer@hisab.local',
            phone: '',
            address: '',
            businessType: 'view-only'
          }
        });

        useSettingsStore.setState({
          user: {
            name: name,
            email: 'viewer@hisab.local',
            businessName: 'Viewer Access',
            phone: '',
            location: ''
          }
        });
      },

      signInWithGoogle: async (googleData?: { email?: string; fullName?: string; googleId?: string }) => {
        try {
          const email = googleData?.email || `google.user.${Date.now()}@gmail.com`;
          const fullName = googleData?.fullName || 'Google User';

          const res = await apiFetch('/auth/google', {
            method: 'POST',
            body: { email, fullName, googleId: googleData?.googleId || `google_${Date.now()}` }
          });

          if (res.token) {
            setAuthToken(res.token);
          }

          setDataScope('owner');
          set({
            role: 'owner',
            isAuthenticated: true,
            ownerAccount: {
              fullName: res.user?.fullName || fullName,
              businessName: res.business?.name || `${fullName}'s Business`,
              email: res.user?.email || email,
              phone: res.user?.phone || '',
              address: res.user?.address || '',
              businessType: res.business?.type || 'Retail'
            }
          });

          if (res.business) {
            useSettingsStore.setState({
              activeBusiness: res.business.id,
              businesses: [res.business],
              user: {
                name: res.user.fullName,
                email: res.user.email,
                businessName: res.business.name,
                phone: res.user.phone,
                location: res.user.address
              }
            });
          }

          return { error: null };
        } catch (err: any) {
          console.error('Google Sign In exception:', err);
          return { error: err.message || 'Google sign-in failed' };
        }
      },

      resetPassword: async (email: string) => {
        return { error: null };
      },

      logout: async () => {
        removeAuthToken();
        clearDataScope();
        Object.keys(localStorage).forEach(key => {
          if (key.startsWith('hisab-')) {
            localStorage.removeItem(key);
          }
        });

        set({ role: null, isAuthenticated: false, ownerAccount: null });
        window.location.href = '/login';
      },

      checkSession: async () => {
        const token = getAuthToken();
        if (!token) {
          const currentRole = get().role;
          if (currentRole !== 'admin' && currentRole !== 'viewer') {
            set({ isAuthenticated: false, role: null, ownerAccount: null });
            clearDataScope();
          }
          return;
        }

        try {
          const res = await apiFetch('/auth/me');
          if (res.user) {
            const isCurrentlyAdmin = res.user.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase() || get().role === 'admin';
            setDataScope('owner');
            set({
              isAuthenticated: true,
              role: isCurrentlyAdmin ? 'admin' : 'owner',
              ownerAccount: {
                fullName: isCurrentlyAdmin ? 'System Administrator' : (res.user.fullName || ''),
                businessName: isCurrentlyAdmin ? 'Super Admin Access' : (res.businesses?.[0]?.name || ''),
                email: res.user.email || '',
                phone: res.user.phone || '',
                address: res.user.address || '',
                businessType: isCurrentlyAdmin ? 'system' : ''
              }
            });

            if (res.businesses && res.businesses.length > 0) {
              useSettingsStore.setState({
                businesses: res.businesses,
                activeBusiness: res.user.activeBusinessId || res.businesses[0].id,
                user: {
                  name: res.user.fullName,
                  email: res.user.email,
                  businessName: res.businesses[0].name,
                  phone: res.user.phone,
                  location: res.user.address
                }
              });
            }
          }
        } catch (err) {
          console.error('checkSession error:', err);
          removeAuthToken();
          const currentRole = get().role;
          if (currentRole !== 'admin' && currentRole !== 'viewer') {
            set({ isAuthenticated: false, role: null, ownerAccount: null });
            clearDataScope();
          }
        }
      },

      initializeListener: () => {
        get().checkSession();
      }
    }),
    {
      name: 'hisab-auth-storage',
      onRehydrateStorage: () => (state) => {
        if (state?.role === 'owner') {
          setDataScope('owner');
        } else if (state?.role === 'viewer') {
          setDataScope('viewer');
        }
      },
    }
  )
);