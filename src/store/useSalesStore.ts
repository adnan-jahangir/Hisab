import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { apiFetch } from '../lib/api';
import { useSettingsStore } from './useSettingsStore';

export interface SaleRecord {
  id: string;
  product_id: string;
  product_name?: string;
  quantity: number;
  sell_price: number;
  total_amount: number;
  profit: number;
  customer_name?: string;
  customer_phone?: string;
  payment_method: 'cash' | 'bkash' | 'nagad' | 'card';
  date?: string;
  notes?: string;
  created_at: string;
  status: 'Completed' | 'Pending' | 'Refunded';
}

interface SalesStore {
  sales: SaleRecord[];
  fetchSales: () => Promise<void>;
  addSale: (sale: Omit<SaleRecord, 'id' | 'created_at'>) => Promise<any>;
  updateSale: (id: string, updates: Partial<SaleRecord>) => Promise<void>;
  deleteSale: (id: string) => Promise<void>;
  
  // Derived
  getTotalRevenue: (from?: Date, to?: Date) => number;
  getTotalProfit: (from?: Date, to?: Date) => number;
  getSalesByDateRange: (from: Date, to: Date) => SaleRecord[];
  getDailySales: (days: number) => { date: string, revenue: number, profit: number }[];
}

function getCurrentRole(): string | null {
  try {
    const raw = localStorage.getItem('hisab-auth-storage');
    if (raw) {
      const parsed = JSON.parse(raw);
      return parsed?.state?.role || null;
    }
  } catch {}
  return null;
}

export const useSalesStore = create<SalesStore>()(
  persist(
    (set, get) => ({
      sales: [],

      fetchSales: async () => {
        const businessId = useSettingsStore.getState().activeBusiness;
        if (!businessId) return;

        try {
          const data = await apiFetch<SaleRecord[]>(`/sales?businessId=${businessId}`);
          if (data) {
            set({ sales: data });
          }
        } catch (error) {
          console.error('Error fetching sales:', error);
        }
      },

      addSale: async (sale) => {
        console.log('[addSale] Starting...');
        const role = getCurrentRole();
        if (role === 'viewer') {
          const mockData = { ...sale, id: `mock-sale-${Date.now()}`, created_at: new Date().toISOString() };
          set((state) => ({ sales: [mockData as SaleRecord, ...state.sales] }));
          return mockData;
        }

        let business_id = useSettingsStore.getState().activeBusiness;
        if (!business_id) {
          const businesses = useSettingsStore.getState().businesses;
          if (businesses && businesses.length > 0) {
            business_id = businesses[0].id;
          } else {
            throw new Error('No active business selected.');
          }
        }

        const payload = {
          business_id,
          product_id: sale.product_id,
          quantity: sale.quantity,
          sell_price: sale.sell_price,
          total_amount: sale.total_amount,
          profit: sale.profit,
          customer_name: sale.customer_name || 'Cash Customer',
          payment_method: sale.payment_method || 'cash',
          status: sale.status || 'Completed'
        };

        try {
          const data = await apiFetch<SaleRecord>('/sales', {
            method: 'POST',
            body: payload
          });

          if (data) {
            set((state) => ({
              sales: [data, ...state.sales]
            }));
          }
          return data;
        } catch (error) {
          console.error('[addSale] Error:', error);
          throw error;
        }
      },

      updateSale: async (id, updates) => {
        const role = getCurrentRole();
        if (role !== 'viewer') {
          try {
            await apiFetch(`/sales/${id}`, {
              method: 'PUT',
              body: updates
            });
          } catch (e) {
            console.error('Error updating sale:', e);
          }
        }
        set((state) => ({
          sales: state.sales.map(s => s.id === id ? { ...s, ...updates } : s)
        }));
      },

      deleteSale: async (id) => {
        const role = getCurrentRole();
        if (role !== 'viewer') {
          try {
            await apiFetch(`/sales/${id}`, { method: 'DELETE' });
          } catch (e) {
            console.error('Error deleting sale:', e);
          }
        }
        set((state) => ({
          sales: state.sales.filter(s => s.id !== id)
        }));
      },

      getTotalRevenue: (from, to) => {
        const { sales } = get();
        return sales.reduce((total, s) => {
          const dateVal = s.created_at || s.date || new Date().toISOString();
          const d = new Date(dateVal);
          if (from && d < from) return total;
          if (to && d > to) return total;
          if (s.status !== 'Completed') return total;
          return total + s.total_amount;
        }, 0);
      },

      getTotalProfit: (from, to) => {
        const { sales } = get();
        return sales.reduce((total, s) => {
          const dateVal = s.created_at || s.date || new Date().toISOString();
          const d = new Date(dateVal);
          if (from && d < from) return total;
          if (to && d > to) return total;
          if (s.status !== 'Completed') return total;
          return total + s.profit;
        }, 0);
      },

      getSalesByDateRange: (from, to) => {
        const { sales } = get();
        return sales.filter(s => {
          const dateVal = s.created_at || s.date || new Date().toISOString();
          const d = new Date(dateVal);
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
          
          const dateVal = s.created_at || s.date || new Date().toISOString();
          const d = new Date(dateVal);
          
          if (!isNaN(d.getTime()) && d >= cutoff) {
            const dateStr = d.toISOString().slice(0, 10);
            if (!result[dateStr]) result[dateStr] = { revenue: 0, profit: 0 };
            result[dateStr].revenue += s.total_amount;
            result[dateStr].profit += s.profit;
          }
        });

        return Object.keys(result)
          .sort((a, b) => new Date(a).getTime() - new Date(b).getTime())
          .map(date => ({ date, ...result[date] }));
      }
    }),
    { name: 'hisab-sales-v2' }
  )
);
