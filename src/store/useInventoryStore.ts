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

function normalizeProduct(p: any): Product {
  const buy_price = Number(p.buy_price ?? p.buyPrice ?? 0) || 0;
  const sell_price = Number(p.sell_price ?? p.sellPrice ?? 0) || 0;
  const current_stock = Number(p.current_stock ?? p.stock ?? 0) || 0;
  const min_stock_level = Number(p.min_stock_level ?? p.minStockLevel ?? 5) || 5;

  return {
    id: p.id || p._id || '',
    name: p.name || '',
    sku: p.sku || '',
    category: p.category || 'General',
    buy_price,
    sell_price,
    current_stock,
    min_stock_level,
    supplier_name: p.supplier_name || p.supplierName || '',
    supplier_phone: p.supplier_phone || p.supplierPhone || '',
    created_at: p.created_at || p.createdAt || new Date().toISOString(),
  };
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
          const data = await apiFetch<any[]>(`/products?businessId=${businessId}`);
          if (Array.isArray(data)) {
            set({ products: data.map(normalizeProduct) });
          }
        } catch (error) {
          console.error('Error fetching products:', error);
        }
      },

      addProduct: async (product) => {
        console.log('[addProduct] Starting...');
        const role = getCurrentRole();
        if (role === 'viewer') {
          const mockData = normalizeProduct({ ...product, id: `mock-prod-${Date.now()}`, created_at: new Date().toISOString() });
          set((state) => ({ products: [mockData, ...state.products] }));
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
          businessId: business_id,
          name: product.name,
          sku: product.sku,
          category: product.category,
          buy_price: product.buy_price,
          buyPrice: product.buy_price,
          sell_price: product.sell_price,
          sellPrice: product.sell_price,
          current_stock: product.current_stock,
          stock: product.current_stock,
          min_stock_level: product.min_stock_level,
          minStockLevel: product.min_stock_level,
          supplier_name: product.supplier_name,
          supplier_phone: product.supplier_phone
        };

        try {
          const raw = await apiFetch<any>('/products', {
            method: 'POST',
            body: payload
          });

          const normalized = normalizeProduct(raw || payload);
          set((state) => ({ products: [normalized, ...state.products] }));
          return normalized;
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
        return products.reduce((total, p) => total + ((Number(p.current_stock) || 0) * (Number(p.buy_price) || 0)), 0);
      }
    }),
    { name: 'hisab-inventory-v2' }
  )
);
