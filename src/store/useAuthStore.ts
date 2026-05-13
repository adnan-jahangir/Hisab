import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { clearDataScope, setDataScope } from '../utils/roleScope';
import { supabase } from '../lib/supabase';
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
  loginAdmin: (email: string, password: string) => boolean;
  loginViewer: (name: string) => Promise<void>;
  logout: () => Promise<void>;
  checkSession: () => Promise<void>;
}

const ADMIN_EMAIL = 'admin@hisab.local';
const ADMIN_PASSWORD = 'Admin@1234';

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      role: null,
      isAuthenticated: false,
      ownerAccount: null,

      registerOwner: async (account) => {
        // 1. Sign up with Supabase Auth
        const { data, error } = await supabase.auth.signUp({
          email: account.email,
          password: account.password,
          options: {
            data: {
              full_name: account.fullName,
              business_name: account.businessName
            }
          }
        });

        if (error) return { error };

        if (data.user) {
          // 2. Create profile entry in the 'profiles' table
          const { error: profileError } = await supabase.from('profiles').insert([
            {
              id: data.user.id,
              full_name: account.fullName,
              phone: account.phone,
              address: account.address,
              role: 'owner'
            }
          ]);

          if (profileError) {
            console.error('Profile creation error:', profileError);
            return { error: profileError };
          }

          // 3. Create business entry
          const { data: bizData, error: bizError } = await supabase.from('businesses').insert([
            {
              owner_id: data.user.id,
              name: account.businessName,
              type: account.businessType,
              address: account.address,
              currency: 'BDT'
            }
          ]).select().single();

          if (bizError) {
            console.error('Business creation error:', bizError);
            return { error: bizError };
          }
          
          setDataScope('owner');
          set({ 
            role: 'owner', 
            isAuthenticated: true, 
            ownerAccount: { ...account, password: undefined } 
          });

          // Set active business if created
          if (bizData) {
            useSettingsStore.setState({ activeBusiness: bizData.id });
          }
        }

        return { error: null };
      },

      loginOwner: async (email, password) => {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password
        });

        if (error) return { error };

        if (data.user) {
          setDataScope('owner');
          set({ 
            role: 'owner', 
            isAuthenticated: true,
            ownerAccount: {
              fullName: data.user.user_metadata.full_name || '',
              businessName: data.user.user_metadata.business_name || '',
              email: data.user.email || '',
              phone: '', // Fetch from profiles table if needed
              address: '',
              businessType: ''
            }
          });
        }
        return { error: null };
      },

      loginAdmin: (email, password) => {
        if (email !== ADMIN_EMAIL || password !== ADMIN_PASSWORD) {
          return false;
        }
        setDataScope('owner');
        set({ role: 'admin', isAuthenticated: true });
        return true;
      },

      loginViewer: async (name: string) => {
        const { error } = await supabase.from('viewers').insert([{ name }]);
        if (error) console.error('Error logging viewer:', error);

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
        
        // Also update settings store for the UI
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

      logout: async () => {
        await supabase.auth.signOut();
        clearDataScope();
        set({ role: null, isAuthenticated: false, ownerAccount: null });
      },

      checkSession: async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          set({ isAuthenticated: true, role: 'owner' });
          setDataScope('owner');
        } else {
          set({ isAuthenticated: false, role: null });
          clearDataScope();
        }
      }
    }),
    {
      name: 'hisab-auth-storage',
      onRehydrateStorage: () => (state) => {
        if (state?.role === 'owner' || state?.role === 'admin') {
          setDataScope('owner');
        } else if (state?.role === 'viewer') {
          setDataScope('viewer');
        }
      },
    }
  )
);