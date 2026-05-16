import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { createScopedStorage } from '../utils/roleScope';
import { supabase } from '../lib/supabase';

export interface User {
  name: string;
  email: string;
  businessName: string;
  phone?: string;
  location?: string;
}

export interface Business {
  id: string;
  name: string;
  type: string;
  currency: string;
  address?: string;
  owner_id?: string;
  created_at?: string;
}

export interface OwnerProfileInput {
  fullName: string;
  businessName: string;
  businessType: string;
  email: string;
  phone: string;
  address: string;
}

const emptyUser: User = { name: 'Loading...', email: '', businessName: '' };

interface SettingsStore {
  user: User;
  businesses: Business[];
  activeBusiness: string;
  fetchProfile: () => Promise<void>;
  fetchBusinesses: () => Promise<void>;
  updateUser: (updates: Partial<User>) => void;
  setActiveBusiness: (id: string) => void;
  addBusiness: (b: Omit<Business, 'id'>) => Promise<void>;
  setOwnerProfile: (profile: OwnerProfileInput) => void;
  resetToDemo: () => void;
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set, get) => ({
      user: emptyUser,
      businesses: [],
      activeBusiness: '',

      fetchProfile: async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (!error && data) {
          set((state) => ({
            user: {
              ...state.user,
              name: data.full_name || user.user_metadata?.full_name || state.user.name,
              email: user.email || '',
              phone: data.phone || '',
              location: data.address || '',
              businessName: user.user_metadata?.business_name || state.user.businessName
            }
          }));
        }
      },

      fetchBusinesses: async () => {
        console.log('Fetching businesses...');
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await supabase
          .from('businesses')
          .select('*')
          .eq('owner_id', user.id);
        
        if (error) {
          console.error('Error fetching businesses:', error);
          return;
        }

        console.log('Businesses found:', data?.length, data);

        if (data && data.length > 0) {
          set({ 
            businesses: data,
            activeBusiness: get().activeBusiness || data[0].id
          });
          set((state) => ({ user: { ...state.user, businessName: data[0].name } }));
        } else {
          // Auto create a default business if none exists
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            const defaultBusiness = {
              name: user.user_metadata?.business_name || 'My Business',
              type: 'Retail',
              currency: 'BDT',
              owner_id: user.id
            };
            await get().addBusiness(defaultBusiness);
          }
        }
      },

      updateUser: async (updates) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Update local state first for instant feedback
        set((state) => ({ user: { ...state.user, ...updates } }));

        // Update Supabase profiles table
        const { error } = await supabase
          .from('profiles')
          .update({
            full_name: updates.name,
            phone: updates.phone,
            address: updates.location
          })
          .eq('id', user.id);

        if (error) {
          console.error('Error updating profile in database:', error);
          throw error;
        }
      },
      setActiveBusiness: (id) => set({ activeBusiness: id }),
      
      addBusiness: async (b) => {
        const { data, error } = await supabase.from('businesses').insert([b]).select().single();
        if (!error && data) {
          set((state) => ({ 
            businesses: [...state.businesses, data],
            activeBusiness: data.id 
          }));
        }
      },

      setOwnerProfile: (profile) => {
        const newState = {
          user: {
            name: profile.fullName,
            email: profile.email,
            businessName: profile.businessName,
            phone: profile.phone,
            location: profile.address,
          } as User,
        };
        set(newState);
      },

      resetToDemo: () => set({ user: { name: 'Demo User', email: 'demo@hisab.local', businessName: 'Demo Store' }, businesses: [], activeBusiness: '' }),
    }),
    { name: 'hisab-settings-v2' }
  )
);
