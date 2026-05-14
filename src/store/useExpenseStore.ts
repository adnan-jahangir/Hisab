import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { createScopedStorage } from '../utils/roleScope';
import { supabase } from '../lib/supabase';
import { useSettingsStore } from './useSettingsStore';

export type ExpenseCategory = string;

export interface Expense {
  id: string;
  category: ExpenseCategory;
  amount: number;
  description: string;
  type: "one_time" | "recurring" | "planned";
  frequency?: "daily" | "weekly" | "monthly";
  due_date?: string;
  date: string;
  notes?: string;
  created_at: string;
}

interface ExpenseStore {
  expenses: Expense[];
  budgetLimits: Record<ExpenseCategory, number>;
  fetchExpenses: () => Promise<void>;
  addExpense: (expense: Omit<Expense, 'id' | 'created_at'>) => Promise<void>;
  updateExpense: (id: string, updates: Partial<Expense>) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
  setBudgetLimit: (category: ExpenseCategory, amount: number) => void;
  
  // Derived
  getTotalExpenses: (from?: Date, to?: Date) => number;
  getExpensesByCategory: () => Record<ExpenseCategory, number>;
  getCategoryBudgetStatus: () => { category: string; spent: number; limit: number; percent: number }[];
}

export const useExpenseStore = create<ExpenseStore>()(
  persist(
    (set, get) => ({
      expenses: [],
      budgetLimits: {
        facebook_ads: 5000,
        google_ads: 3000,
        packaging: 2000,
        delivery: 4000,
        content_creation: 10000,
        employee_salary: 50000,
        website_hosting: 1000,
        miscellaneous: 5000
      },

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
        let business_id = useSettingsStore.getState().activeBusiness;
        if (!business_id) {
          const { data } = await supabase.from('businesses').select('id').limit(1).maybeSingle();
          if (data) {
            business_id = data.id;
            useSettingsStore.getState().setActiveBusiness(business_id);
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

        const { data, error } = await supabase.from('expenses').insert([payload]).select().single();
        
        if (error) {
          console.error('Error adding expense:', error);
          throw error;
        }

        if (data) {
          set((state) => ({
            expenses: [data, ...state.expenses]
          }));
        }
      },

      updateExpense: async (id, updates) => {
        const { error } = await supabase.from('expenses').update(updates).eq('id', id);
        if (!error) {
          set((state) => ({
            expenses: state.expenses.map(e => e.id === id ? { ...e, ...updates } : e)
          }));
        }
      },

      deleteExpense: async (id) => {
        const { error } = await supabase.from('expenses').delete().eq('id', id);
        if (!error) {
          set((state) => ({
            expenses: state.expenses.filter(e => e.id !== id)
          }));
        }
      },

      setBudgetLimit: (category, amount) => set((state) => ({
        budgetLimits: { ...state.budgetLimits, [category]: amount }
      })),

      getTotalExpenses: (from, to) => {
        const { expenses } = get();
        return expenses.reduce((total, e) => {
          const d = new Date(e.date);
          if (from && d < from) return total;
          if (to && d > to) return total;
          if (e.type === 'planned') return total;
          return total + e.amount;
        }, 0);
      },

      getExpensesByCategory: () => {
        const { expenses } = get();
        return expenses.reduce((acc, e) => {
          if (e.type === 'planned') return acc;
          acc[e.category] = (acc[e.category] || 0) + e.amount;
          return acc;
        }, {} as Record<ExpenseCategory, number>);
      },

      getCategoryBudgetStatus: () => {
        const { budgetLimits } = get();
        const expensesByCategory = get().getExpensesByCategory();

        return Object.keys(budgetLimits).map(category => {
          const key = category as ExpenseCategory;
          const spent = expensesByCategory[key] || 0;
          const limit = budgetLimits[key];
          const percent = limit > 0 ? (spent / limit) * 100 : 0;
          return { category, spent, limit, percent };
        });
      }
    }),
    { name: 'hisab-expenses', storage: createScopedStorage('hisab-expenses') }
  )
);
