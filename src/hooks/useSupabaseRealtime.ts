import { useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useInventoryStore } from '../store/useInventoryStore';
import { useSalesStore } from '../store/useSalesStore';
import { useExpenseStore } from '../store/useExpenseStore';
import { useNotificationStore } from '../store/useNotificationStore';

export function useSupabaseRealtime() {
  const { products, updateProduct, addProduct, deleteProduct } = useInventoryStore();
  const { sales, addSale, updateSale, deleteSale } = useSalesStore();
  const { expenses, addExpense, updateExpense, deleteExpense } = useExpenseStore();
  const { addNotification } = useNotificationStore();

  useEffect(() => {
    // 1. Listen to Products
    const productsChannel = supabase
      .channel('public:products')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'products' },
        (payload) => {
          console.log('Product change received!', payload);
          if (payload.eventType === 'INSERT') {
            // Check if already exists to avoid duplicates (Zustand might have it if added locally)
            const exists = useInventoryStore.getState().products.some(p => p.id === payload.new.id);
            if (!exists) {
              // We need to map payload.new to our store format if necessary
              // But we already matched field names!
              useInventoryStore.setState((state) => ({
                products: [payload.new as any, ...state.products]
              }));
            }
          } else if (payload.eventType === 'UPDATE') {
            useInventoryStore.setState((state) => ({
              products: state.products.map(p => p.id === payload.new.id ? { ...p, ...payload.new } : p)
            }));
          } else if (payload.eventType === 'DELETE') {
            useInventoryStore.setState((state) => ({
              products: state.products.filter(p => p.id !== payload.old.id)
            }));
          }
        }
      )
      .subscribe();

    // 2. Listen to Sales
    const salesChannel = supabase
      .channel('public:sales')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'sales' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const exists = useSalesStore.getState().sales.some(s => s.id === payload.new.id);
            if (!exists) {
              useSalesStore.setState((state) => ({
                sales: [payload.new as any, ...state.sales]
              }));
            }
          } else if (payload.eventType === 'UPDATE') {
            useSalesStore.setState((state) => ({
              sales: state.sales.map(s => s.id === payload.new.id ? { ...s, ...payload.new } : s)
            }));
          } else if (payload.eventType === 'DELETE') {
            useSalesStore.setState((state) => ({
              sales: state.sales.filter(s => s.id !== payload.old.id)
            }));
          }
        }
      )
      .subscribe();

    // 3. Listen to Expenses
    const expensesChannel = supabase
      .channel('public:expenses')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'expenses' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const exists = useExpenseStore.getState().expenses.some(e => e.id === payload.new.id);
            if (!exists) {
              useExpenseStore.setState((state) => ({
                expenses: [payload.new as any, ...state.expenses]
              }));
            }
          } else if (payload.eventType === 'UPDATE') {
            useExpenseStore.setState((state) => ({
              expenses: state.expenses.map(e => e.id === payload.new.id ? { ...e, ...payload.new } : e)
            }));
          } else if (payload.eventType === 'DELETE') {
            useExpenseStore.setState((state) => ({
              expenses: state.expenses.filter(e => e.id !== payload.old.id)
            }));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(productsChannel);
      supabase.removeChannel(salesChannel);
      supabase.removeChannel(expensesChannel);
    };
  }, []);
}
