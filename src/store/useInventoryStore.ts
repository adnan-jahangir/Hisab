import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { createScopedStorage } from '../utils/roleScope';
import { supabase } from '../lib/supabase';
import { useSettingsStore } from './useSettingsStore';

export interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  buy_price: number;
  sell_price: number;
  current_stock: number;
  min_stock_level: number;
  supplier_name?: string;
  supplier_phone?: string;
  created_at: string;
}

export interface StockMovement {
  id: string;
  product_id: string;
  date: string;
  type: 'sale' | 'restock' | 'manual';
  quantity_change: number;
  remaining_stock: number;
  notes?: string;
}

interface InventoryStore {
  products: Product[];
  stockMovements: StockMovement[];
  fetchProducts: () => Promise<void>;
  addProduct: (product: Omit<Product, 'id' | 'created_at'>) => Promise<Product | null>;
  updateProduct: (id: string, updates: Partial<Product>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  addStock: (productId: string, qty: number, cost: number, supplier?: string) => Promise<void>;
  deductStock: (productId: string, qty: number, reason: string) => Promise<void>;
  getLowStockProducts: () => Product[];
  getOutOfStockProducts: () => Product[];
  getTotalStockValue: () => number;
}

export const useInventoryStore = create<InventoryStore>()(
  persist(
    (set, get) => ({
      products: [],
      stockMovements: [],

      fetchProducts: async () => {
        const businessId = useSettingsStore.getState().activeBusiness;
        if (!businessId) return;

        const { data, error } = await supabase
          .from('products')
          .select('*')
          .eq('business_id', businessId)
          .order('created_at', { ascending: false });

        if (!error && data) {
          set({ products: data });
        }
      },

      addProduct: async (product) => {
        const business_id = useSettingsStore.getState().activeBusiness;
        if (!business_id) {
          console.error('Cannot add product: No active business found. Please complete onboarding or create a business.');
          return null;
        }
        const { data, error } = await supabase.from('products').insert([{ ...product, business_id }]).select().single();
        if (error) {
          console.error('Error adding product:', error);
          return null;
        }
        set((state) => ({ products: [data, ...state.products] }));
        return data;
      },

      updateProduct: async (id, updates) => {
        const { error } = await supabase.from('products').update(updates).eq('id', id);
        if (error) console.error('Error updating product:', error);
        // Local state will be updated by Realtime listener or manually here
        set((state) => ({
          products: state.products.map(p => p.id === id ? { ...p, ...updates } : p)
        }));
      },

      deleteProduct: async (id) => {
        const { error } = await supabase.from('products').delete().eq('id', id);
        if (error) console.error('Error deleting product:', error);
        set((state) => ({
          products: state.products.filter(p => p.id !== id)
        }));
      },

      addStock: async (productId, qty, cost, supplier) => {
        const product = get().products.find(p => p.id === productId);
        if (!product) return;

        const remaining_stock = product.current_stock + qty;
        
        // Update product stock
        await get().updateProduct(productId, { current_stock: remaining_stock, buy_price: cost });

        // Add movement record (if you have a stock_movements table)
        const movement = {
          product_id: productId,
          business_id: useSettingsStore.getState().activeBusiness,
          date: new Date().toISOString(),
          type: 'restock',
          quantity_change: qty,
          remaining_stock,
          notes: supplier ? `Supplier: ${supplier}` : 'Manual restock'
        };
        
        await supabase.from('stock_movements').insert([movement]);
        
        set((state) => ({
          stockMovements: [{ ...movement, id: Date.now().toString() } as any, ...state.stockMovements]
        }));
      },

      deductStock: async (productId, qty, reason) => {
        const product = get().products.find(p => p.id === productId);
        if (!product) return;

        const remaining_stock = Math.max(0, product.current_stock - qty);
        
        // Update product stock
        await get().updateProduct(productId, { current_stock: remaining_stock });

        const movement = {
          product_id: productId,
          business_id: useSettingsStore.getState().activeBusiness,
          date: new Date().toISOString(),
          type: 'sale',
          quantity_change: -qty,
          remaining_stock,
          notes: reason
        };

        await supabase.from('stock_movements').insert([movement]);

        set((state) => ({
          stockMovements: [{ ...movement, id: Date.now().toString() } as any, ...state.stockMovements]
        }));
      },

      getLowStockProducts: () => {
        const { products } = get();
        return products.filter(p => p.current_stock <= p.min_stock_level && p.current_stock > 0);
      },

      getOutOfStockProducts: () => {
        const { products } = get();
        return products.filter(p => p.current_stock === 0);
      },

      getTotalStockValue: () => {
        const { products } = get();
        return products.reduce((total, p) => total + (p.current_stock * p.buy_price), 0);
      }
    }),
    { name: 'hisab-inventory', storage: createScopedStorage('hisab-inventory') }
  )
);
