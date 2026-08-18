import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { apiFetch } from '../lib/api';
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

        try {
          const data = await apiFetch<Expense[]>(`/expenses?businessId=${businessId}`);
          if (data) {
            set({ expenses: data });
          }
        } catch (error) {
          console.error('Error fetching expenses:', error);
        }
      },

      addExpense: async (expense) => {
        console.log('[addExpense] Starting...');
        const role = getCurrentRole();
        if (role === 'viewer') {
          const mockData = { ...expense, id: `mock-exp-${Date.now()}`, created_at: new Date().toISOString() };
          set((state) => ({ expenses: [mockData as Expense, ...state.expenses] }));
          return;
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
          category: expense.category,
          amount: expense.amount,
          description: expense.description,
          date: expense.date
        };

        try {
          const data = await apiFetch<Expense>('/expenses', {
            method: 'POST',
            body: payload
          });

          if (data) {
            set((state) => ({
              expenses: [data, ...state.expenses]
            }));
          }
        } catch (error) {
          console.error('[addExpense] Error:', error);
          throw error;
        }
      },

      updateExpense: async (id, updates) => {
        const role = getCurrentRole();
        if (role !== 'viewer') {
          try {
            await apiFetch(`/expenses/${id}`, {
              method: 'PUT',
              body: updates
            });
          } catch (e) {
            console.error('Error updating expense:', e);
          }
        }
        set((state) => ({
          expenses: state.expenses.map(e => e.id === id ? { ...e, ...updates } : e)
        }));
      },

      deleteExpense: async (id) => {
        const role = getCurrentRole();
        if (role !== 'viewer') {
          try {
            await apiFetch(`/expenses/${id}`, { method: 'DELETE' });
          } catch (e) {
            console.error('Error deleting expense:', e);
          }
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
