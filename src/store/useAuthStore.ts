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
  signInWithGoogle: () => Promise<{ error: any }>;
  resetPassword: (email: string) => Promise<{ error: any }>;
  logout: () => Promise<void>;
  checkSession: () => Promise<void>;
  initializeListener: () => void;
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
        try {
          console.log('1. Starting signUp with email:', account.email);
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

          if (error) {
            console.error('SignUp Error:', error);
            return { error };
          }

          console.log('2. SignUp Success, User ID:', data.user?.id);

          if (data.user) {
            console.log('3. Attempting to create profile...');
            const { error: profileError } = await supabase.from('profiles').insert([
              {
                id: data.user.id,
                full_name: account.fullName,
                email: account.email,
                phone: account.phone,
                address: account.address
              }
            ]);

            if (profileError) {
              console.error('Profile creation error:', profileError);
              return { error: profileError };
            }

            console.log('4. Profile created successfully. Attempting to create business...');
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
            
            console.log('5. Business created successfully. Setting state...');
            setDataScope('owner');
            set({ 
              role: 'owner', 
              isAuthenticated: true, 
              ownerAccount: { ...account, password: undefined } 
            });

            if (bizData) {
              useSettingsStore.setState({ activeBusiness: bizData.id });
            }
            console.log('6. Registration process complete!');
          }

          return { error: null };
        } catch (err: any) {
          console.error('Registration operation failed unexpectedly:', err);
          return { error: err };
        }
      },

      loginOwner: async (email, password) => {
        try {
          console.log('loginOwner: signing in...');
          
          const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
          });

          if (error) {
            console.error('loginOwner error:', error);
            return { error };
          }

          if (data.user) {
            console.log('loginOwner: user found, fetching profile...');
            const { data: profile } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', data.user.id)
              .single();

            setDataScope('owner');
            set({ 
              role: 'owner', 
              isAuthenticated: true,
              ownerAccount: {
                fullName: profile?.full_name || data.user.user_metadata.full_name || '',
                businessName: data.user.user_metadata.business_name || '',
                email: data.user.email || '',
                phone: profile?.phone || '',
                address: profile?.address || '',
                businessType: '' 
              }
            });
            console.log('loginOwner: success!');
          }
          return { error: null };
        } catch (err: any) {
          console.error('loginOwner exception:', err);
          return { error: err };
        }
      },

      loginAdmin: (email, password) => {
        if (email !== ADMIN_EMAIL || password !== ADMIN_PASSWORD) {
          return false;
        }
        setDataScope('owner');
        set({ 
          role: 'admin', 
          isAuthenticated: true,
          ownerAccount: {
            fullName: 'Administrator',
            businessName: 'System Admin Access',
            email: ADMIN_EMAIL,
            phone: '',
            address: '',
            businessType: 'system'
          }
        });
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

      signInWithGoogle: async () => {
        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: window.location.origin
          }
        });
        return { error };
      },

      resetPassword: async (email: string) => {
        try {
          const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/update-password`,
          });
          return { error };
        } catch (err: any) {
          return { error: err };
        }
      },

      logout: async () => {
        // Clear all local storage keys first
        clearDataScope();
        Object.keys(localStorage).forEach(key => {
          if (key.startsWith('hisab-')) {
            localStorage.removeItem(key);
          }
        });
        
        // Sign out from supabase
        supabase.auth.signOut().catch(console.error);
        
        // Reset state
        set({ role: null, isAuthenticated: false, ownerAccount: null });
        
        // Immediate redirect
        window.location.href = '/login';
      },

      checkSession: async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          // Fetch profile details to ensure UI has data
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

          set({ 
            isAuthenticated: true, 
            role: 'owner',
            ownerAccount: {
              fullName: profile?.full_name || session.user.user_metadata.full_name || '',
              businessName: session.user.user_metadata.business_name || '',
              email: session.user.email || '',
              phone: profile?.phone || '',
              address: profile?.address || '',
              businessType: ''
            }
          });
          setDataScope('owner');
        } else {
          // If we are currently a local role (admin/viewer), don't clear it just because Supabase has no session
          const currentRole = get().role;
          if (currentRole !== 'admin' && currentRole !== 'viewer') {
            set({ isAuthenticated: false, role: null, ownerAccount: null });
            clearDataScope();
          }
        }
      },

      initializeListener: () => {
        supabase.auth.onAuthStateChange(async (event, session) => {
          if (event === 'SIGNED_IN' && session) {
            // Fetch profile data
            const { data: profile } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .single();

            set({ 
              isAuthenticated: true, 
              role: 'owner',
              ownerAccount: {
                fullName: profile?.full_name || session.user.user_metadata.full_name || '',
                businessName: session.user.user_metadata.business_name || '',
                email: session.user.email || '',
                phone: profile?.phone || '',
                address: profile?.address || '',
                businessType: ''
              }
            });
            setDataScope('owner');
          } else if (event === 'SIGNED_OUT') {
            set({ role: null, isAuthenticated: false, ownerAccount: null });
            clearDataScope();
          }
        });
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