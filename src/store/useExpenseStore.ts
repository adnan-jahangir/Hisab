import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { createScopedStorage } from '../utils/roleScope';
import { supabase } from '../lib/supabase';
import { useSettingsStore } from './useSettingsStore';

export type ExpenseCategory = string;

export interface Expense {
  id: string;
  business_id?: string;
  category: string;
  amount: number;
  description: string;
  date: string;
  type?: 'one_time' | 'recurring';
  created_at?: string;
}

interface ExpenseStore {
  expenses: Expense[];
  budgetLimits: Record<string, number>;
  fetchExpenses: () => Promise<void>;
  addExpense: (expense: Omit<Expense, 'id'>) => Promise<void>;
  updateExpense: (id: string, updates: Partial<Expense>) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
  setBudgetLimit: (category: string, amount: number) => void;
  getTotalExpenses: (from?: Date, to?: Date) => number;
  getExpensesByCategory: () => Record<string, number>;
}

// Helper to get the role without importing useAuthStore (avoids potential circular dep)
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

export const useExpenseStore = create<ExpenseStore>()(
  persist(
    (set, get) => ({
      expenses: [],
      budgetLimits: {},

      fetchExpenses: async () => {
        const businessId = useSettingsStore.getState().activeBusiness;
        if (!businessId) return;

        const { data, error } = await supabase
          .from('expenses')
          .select('*')
          .eq('business_id', businessId)
          .order('created_at', { ascending: false });
          
        if (!error && data) {
          set({ expenses: data });
        }
      },

      addExpense: async (expense) => {
        console.log('[addExpense] Starting...');
        
        const role = getCurrentRole();
        console.log('[addExpense] Current role:', role);
        if (role === 'viewer') {
          const mockData = { ...expense, id: `mock-exp-${Date.now()}`, created_at: new Date().toISOString() };
          set((state) => ({ expenses: [mockData as Expense, ...state.expenses] }));
          console.log('[addExpense] Viewer mock done');
          return;
        }

        let business_id = useSettingsStore.getState().activeBusiness;
        console.log('[addExpense] activeBusiness:', business_id);

        if (!business_id) {
          console.log('[addExpense] No activeBusiness, fetching from Supabase...');
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) throw new Error('Not authenticated');
          const { data } = await supabase.from('businesses').select('id').eq('owner_id', user.id).limit(1).maybeSingle();
          if (data) {
            business_id = data.id;
            useSettingsStore.getState().setActiveBusiness(business_id);
            console.log('[addExpense] Resolved business_id:', business_id);
          } else {
            throw new Error('No active business selected. Please complete onboarding.');
          }
        }

        // Only send fields that exist in the database schema
        const payload = {
          business_id,
          category: expense.category,
          amount: expense.amount,
          description: expense.description,
          date: expense.date
        };

        console.log('[addExpense] Inserting payload:', payload);
        const { data, error } = await supabase.from('expenses').insert([payload]).select().single();
        
        if (error) {
          console.error('[addExpense] Supabase error:', error);
          throw error;
        }

        console.log('[addExpense] Insert success:', data);
        if (data) {
          set((state) => ({
            expenses: [data, ...state.expenses]
          }));
        }
      },

      updateExpense: async (id, updates) => {
        const role = getCurrentRole();
        if (role !== 'viewer') {
          const { error } = await supabase.from('expenses').update(updates).eq('id', id);
          if (error) return;
        }
        set((state) => ({
          expenses: state.expenses.map(e => e.id === id ? { ...e, ...updates } : e)
        }));
      },

      deleteExpense: async (id) => {
        const role = getCurrentRole();
        if (role !== 'viewer') {
          const { error } = await supabase.from('expenses').delete().eq('id', id);
          if (error) return;
        }
        set((state) => ({
          expenses: state.expenses.filter(e => e.id !== id)
        }));
      },

      setBudgetLimit: (category, amount) => set((state) => ({
        budgetLimits: { ...state.budgetLimits, [category]: amount }
      })),

      getTotalExpenses: (from, to) => {
        const { expenses } = get();
        return expenses.reduce((total, e) => {
          const dateVal = e.date || e.created_at || new Date().toISOString();
          const d = new Date(dateVal);
          if (from && d < from) return total;
          if (to && d > to) return total;
          return total + e.amount;
        }, 0);
      },

      getExpensesByCategory: () => {
        const { expenses } = get();
        const categorized: Record<string, number> = {};
        expenses.forEach(e => {
          categorized[e.category] = (categorized[e.category] || 0) + e.amount;
        });
        return categorized;
      },
    }),
    { name: 'hisab-expenses-v2' }
  )
);
