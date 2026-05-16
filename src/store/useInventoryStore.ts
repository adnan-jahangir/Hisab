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
        console.log('[addProduct] Starting...');
        
        const role = getCurrentRole();
        console.log('[addProduct] Current role:', role);
        if (role === 'viewer') {
          const mockData = { ...product, id: `mock-prod-${Date.now()}`, created_at: new Date().toISOString() };
          set((state) => ({ products: [mockData as Product, ...state.products] }));
          console.log('[addProduct] Viewer mock done');
          return mockData as Product;
        }

        let business_id = useSettingsStore.getState().activeBusiness;
        console.log('[addProduct] activeBusiness:', business_id);

        if (!business_id) {
          console.log('[addProduct] No activeBusiness, fetching from Supabase...');
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) throw new Error('Not authenticated');
          const { data } = await supabase.from('businesses').select('id').eq('owner_id', user.id).limit(1).maybeSingle();
          if (data) {
            business_id = data.id;
            useSettingsStore.getState().setActiveBusiness(business_id);
            console.log('[addProduct] Resolved business_id:', business_id);
          } else {
            throw new Error('No active business selected. Please complete onboarding.');
          }
        }

        // Only send fields that exist in the database schema
        const payload = {
          business_id,
          name: product.name,
          sku: product.sku,
          category: product.category,
          buy_price: product.buy_price,
          sell_price: product.sell_price,
          current_stock: product.current_stock,
          min_stock_level: product.min_stock_level
        };

        console.log('[addProduct] Inserting payload:', payload);
        const { data, error } = await supabase.from('products').insert([payload]).select().single();
        
        if (error) {
          console.error('[addProduct] Supabase error:', error);
          throw error;
        }

        console.log('[addProduct] Insert success:', data);
        set((state) => ({ products: [data, ...state.products] }));
        return data;
      },

      updateProduct: async (id, updates) => {
        const role = getCurrentRole();
        if (role !== 'viewer') {
          const { error } = await supabase.from('products').update(updates).eq('id', id);
          if (error) {
            console.error('Error updating product:', error);
            throw error;
          }
        }
        // Local state will be updated by Realtime listener or manually here
        set((state) => ({
          products: state.products.map(p => p.id === id ? { ...p, ...updates } : p)
        }));
      },

      deleteProduct: async (id) => {
        const role = getCurrentRole();
        if (role !== 'viewer') {
          const { error } = await supabase.from('products').delete().eq('id', id);
          if (error) {
            console.error('Error deleting product:', error);
            throw error;
          }
        }
        set((state) => ({
          products: state.products.filter(p => p.id !== id)
        }));
      },

      addStock: async (productId, qty, cost, supplier) => {
        const product = get().products.find(p => p.id === productId);
        if (!product) return;

        const remaining_stock = product.current_stock + qty;
        
        try {
          // Update product stock
          await get().updateProduct(productId, { current_stock: remaining_stock, buy_price: cost });
        } catch (err) {
          return; // Don't add movement if update failed
        }

        // Add movement record
        const movementPayload = {
          product_id: productId,
          business_id: useSettingsStore.getState().activeBusiness,
          quantity_change: qty,
          remaining_stock,
          date: new Date().toISOString().slice(0, 10)
        };
        
        const role = getCurrentRole();
        if (role !== 'viewer') {
          await supabase.from('stock_movements').insert([movementPayload]);
        }
        
        set((state) => ({
          stockMovements: [{ ...movementPayload, id: Date.now().toString() } as any, ...state.stockMovements]
        }));
      },

      deductStock: async (productId, qty, reason) => {
        const product = get().products.find(p => p.id === productId);
        if (!product) return;

        const remaining_stock = Math.max(0, product.current_stock - qty);
        
        try {
          // Update product stock
          await get().updateProduct(productId, { current_stock: remaining_stock });
        } catch (err) {
          return; // Don't add movement if update failed
        }

        const movementPayload = {
          product_id: productId,
          business_id: useSettingsStore.getState().activeBusiness,
          quantity_change: -qty,
          remaining_stock,
          date: new Date().toISOString().slice(0, 10)
        };

        const role = getCurrentRole();
        if (role !== 'viewer') {
          await supabase.from('stock_movements').insert([movementPayload]);
        }

        set((state) => ({
          stockMovements: [{ ...movementPayload, id: Date.now().toString() } as any, ...state.stockMovements]
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
    { name: 'hisab-inventory-v2' }
  )
);
