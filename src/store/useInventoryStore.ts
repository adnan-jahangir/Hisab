import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { apiFetch } from '../lib/api';
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

        try {
          const data = await apiFetch<Product[]>(`/products?businessId=${businessId}`);
          if (data) {
            set({ products: data });
          }
        } catch (error) {
          console.error('Error fetching products:', error);
        }
      },

      addProduct: async (product) => {
        console.log('[addProduct] Starting...');
        const role = getCurrentRole();
        if (role === 'viewer') {
          const mockData = { ...product, id: `mock-prod-${Date.now()}`, created_at: new Date().toISOString() };
          set((state) => ({ products: [mockData as Product, ...state.products] }));
          return mockData as Product;
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
          name: product.name,
          sku: product.sku,
          category: product.category,
          buy_price: product.buy_price,
          sell_price: product.sell_price,
          current_stock: product.current_stock,
          min_stock_level: product.min_stock_level,
          supplier_name: product.supplier_name,
          supplier_phone: product.supplier_phone
        };

        try {
          const data = await apiFetch<Product>('/products', {
            method: 'POST',
            body: payload
          });

          set((state) => ({ products: [data, ...state.products] }));
          return data;
        } catch (error) {
          console.error('[addProduct] Error:', error);
          throw error;
        }
      },

      updateProduct: async (id, updates) => {
        const role = getCurrentRole();
        if (role !== 'viewer') {
          try {
            await apiFetch(`/products/${id}`, {
              method: 'PUT',
              body: updates
            });
          } catch (error) {
            console.error('Error updating product:', error);
            throw error;
          }
        }
        set((state) => ({
          products: state.products.map(p => p.id === id ? { ...p, ...updates } : p)
        }));
      },

      deleteProduct: async (id) => {
        const role = getCurrentRole();
        if (role !== 'viewer') {
          try {
            await apiFetch(`/products/${id}`, { method: 'DELETE' });
          } catch (error) {
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
          await get().updateProduct(productId, { current_stock: remaining_stock, buy_price: cost });
        } catch (err) {
          return;
        }

        const businessId = useSettingsStore.getState().activeBusiness;
        const movementPayload = {
          product_id: productId,
          business_id: businessId,
          type: 'restock',
          quantity_change: qty,
          remaining_stock,
          notes: supplier ? `Supplier: ${supplier}` : 'Restock'
        };

        const role = getCurrentRole();
        if (role !== 'viewer') {
          try {
            await apiFetch('/products/stock-movement', {
              method: 'POST',
              body: movementPayload
            });
          } catch (e) {
            console.error('Error recording stock movement:', e);
          }
        }

        set((state) => ({
          stockMovements: [{ ...movementPayload, id: Date.now().toString(), date: new Date().toISOString().slice(0, 10) } as any, ...state.stockMovements]
        }));
      },

      deductStock: async (productId, qty, reason) => {
        const product = get().products.find(p => p.id === productId);
        if (!product) return;

        const remaining_stock = Math.max(0, product.current_stock - qty);
        
        try {
          await get().updateProduct(productId, { current_stock: remaining_stock });
        } catch (err) {
          return;
        }

        const businessId = useSettingsStore.getState().activeBusiness;
        const movementPayload = {
          product_id: productId,
          business_id: businessId,
          type: 'manual',
          quantity_change: -qty,
          remaining_stock,
          notes: reason
        };

        const role = getCurrentRole();
        if (role !== 'viewer') {
          try {
            await apiFetch('/products/stock-movement', {
              method: 'POST',
              body: movementPayload
            });
          } catch (e) {
            console.error('Error recording stock movement:', e);
          }
        }

        set((state) => ({
          stockMovements: [{ ...movementPayload, id: Date.now().toString(), date: new Date().toISOString().slice(0, 10) } as any, ...state.stockMovements]
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
