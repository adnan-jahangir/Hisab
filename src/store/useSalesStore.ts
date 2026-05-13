import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { createScopedStorage } from '../utils/roleScope';
import { supabase } from '../lib/supabase';
import { useSettingsStore } from './useSettingsStore';

export interface SaleRecord {
  id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  sell_price: number;
  total_amount: number;
  profit: number;
  customer_name?: string;
  customer_phone?: string;
  payment_method: 'cash' | 'bkash' | 'nagad' | 'card';
  date: string;
  notes?: string;
  created_at: string;
  status: 'Completed' | 'Pending' | 'Refunded';
}

interface SalesStore {
  sales: SaleRecord[];
  fetchSales: () => Promise<void>;
  addSale: (sale: Omit<SaleRecord, 'id' | 'created_at'>) => Promise<void>;
  updateSale: (id: string, updates: Partial<SaleRecord>) => Promise<void>;
  deleteSale: (id: string) => Promise<void>;
  
  // Derived
  getTotalRevenue: (from?: Date, to?: Date) => number;
  getTotalProfit: (from?: Date, to?: Date) => number;
  getSalesByDateRange: (from: Date, to: Date) => SaleRecord[];
  getDailySales: (days: number) => { date: string, revenue: number, profit: number }[];
}

export const useSalesStore = create<SalesStore>()(
  persist(
    (set, get) => ({
      sales: [],

      fetchSales: async () => {
        const { data, error } = await supabase.from('sales').select('*').order('created_at', { ascending: false });
        if (!error && data) {
          set({ sales: data });
        }
      },

      addSale: async (sale) => {
        const business_id = useSettingsStore.getState().activeBusiness;
        const { data, error } = await supabase.from('sales').insert([{ ...sale, business_id }]).select().single();
        if (!error && data) {
          set((state) => ({
            sales: [data, ...state.sales]
          }));
        } else {
          console.error('Error adding sale:', error);
        }
      },

      updateSale: async (id, updates) => {
        const { error } = await supabase.from('sales').update(updates).eq('id', id);
        if (!error) {
          set((state) => ({
            sales: state.sales.map(s => s.id === id ? { ...s, ...updates } : s)
          }));
        }
      },

      deleteSale: async (id) => {
        const { error } = await supabase.from('sales').delete().eq('id', id);
        if (!error) {
          set((state) => ({
            sales: state.sales.filter(s => s.id !== id)
          }));
        }
      },

      getTotalRevenue: (from, to) => {
        const { sales } = get();
        return sales.reduce((total, s) => {
          const d = new Date(s.date);
          if (from && d < from) return total;
          if (to && d > to) return total;
          if (s.status !== 'Completed') return total;
          return total + s.total_amount;
        }, 0);
      },

      getTotalProfit: (from, to) => {
        const { sales } = get();
        return sales.reduce((total, s) => {
          const d = new Date(s.date);
          if (from && d < from) return total;
          if (to && d > to) return total;
          if (s.status !== 'Completed') return total;
          return total + s.profit;
        }, 0);
      },

      getSalesByDateRange: (from, to) => {
        const { sales } = get();
        return sales.filter(s => {
          const d = new Date(s.date);
          return d >= from && d <= to;
        });
      },

      getDailySales: (days) => {
        const { sales } = get();
        const result: Record<string, { revenue: number; profit: number }> = {};
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - days);

        sales.forEach(s => {
          if (s.status !== 'Completed') return;
          const d = new Date(s.date);
          if (d >= cutoff) {
            if (!result[s.date]) result[s.date] = { revenue: 0, profit: 0 };
            result[s.date].revenue += s.total_amount;
            result[s.date].profit += s.profit;
          }
        });

        return Object.keys(result)
          .sort((a, b) => new Date(a).getTime() - new Date(b).getTime())
          .map(date => ({ date, ...result[date] }));
      }
    }),
    { name: 'hisab-sales', storage: createScopedStorage('hisab-sales') }
  )
);
