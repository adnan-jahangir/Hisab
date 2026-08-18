import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { apiFetch } from '../lib/api';

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

const emptyUser: User = { name: '', email: '', businessName: '' };

interface SettingsStore {
  user: User;
  businesses: Business[];
  activeBusiness: string;
  fetchProfile: () => Promise<void>;
  fetchBusinesses: () => Promise<void>;
  updateUser: (updates: Partial<User>) => Promise<void>;
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
        try {
          const res = await apiFetch('/auth/me');
          if (res.user) {
            set((state) => ({
              user: {
                ...state.user,
                name: res.user.fullName || state.user.name,
                email: res.user.email || state.user.email,
                phone: res.user.phone || state.user.phone,
                location: res.user.address || state.user.location,
                businessName: res.businesses?.[0]?.name || state.user.businessName
              }
            }));
          }
        } catch (e) {
          console.error('Error fetching profile:', e);
        }
      },

      fetchBusinesses: async () => {
        try {
          console.log('Fetching businesses from MongoDB backend...');
          const data = await apiFetch<Business[]>('/businesses');
          console.log('Businesses found:', data?.length, data);

          if (data && data.length > 0) {
            set({
              businesses: data,
              activeBusiness: get().activeBusiness || data[0].id
            });
            set((state) => ({ user: { ...state.user, businessName: data[0].name } }));
          }
        } catch (error) {
          console.error('Error fetching businesses:', error);
        }
      },

      updateUser: async (updates) => {
        set((state) => ({ user: { ...state.user, ...updates } }));

        try {
          await apiFetch('/profile', {
            method: 'PUT',
            body: {
              full_name: updates.name,
              phone: updates.phone,
              address: updates.location
            }
          });
        } catch (error) {
          console.error('Error updating profile:', error);
          throw error;
        }
      },

      setActiveBusiness: (id) => set({ activeBusiness: id }),

      addBusiness: async (b) => {
        try {
          const newBusiness = await apiFetch<Business>('/businesses', {
            method: 'POST',
            body: b
          });
          if (newBusiness) {
            set((state) => ({
              businesses: [...state.businesses, newBusiness],
              activeBusiness: newBusiness.id
            }));
          }
        } catch (e) {
          console.error('Error adding business:', e);
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
    { name: 'hisab-settings-v3' }
  )
);
