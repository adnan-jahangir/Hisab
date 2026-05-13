import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { PlusCircle, Search, FilterX, Edit3, Trash2, AlertTriangle } from 'lucide-react';
import { GlassCard, Button, Input, Select, Modal, Badge } from '../components/ui';
import { AddStockForm } from '../components/forms';
import { formatCurrency, formatDate } from '../utils/formatters';
import { useInventoryStore, Product } from '../store/useInventoryStore';

const section = (d = 0) => ({ initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0, transition: { delay: d, duration: 0.35 } } });

export default function Inventory() {
  const [addOpen, setAddOpen] = useState(false);
  const { products, deleteProduct } = useInventoryStore();

  // Filters
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [stockStatus, setStockStatus] = useState('all');

  const categories = useMemo(() => {
    return Array.from(new Set(products.map(p => p.category)));
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) || 
                          p.sku.toLowerCase().includes(search.toLowerCase());
      const matchCategory = categoryFilter === 'all' || p.category === categoryFilter;
      
      let matchStatus = true;
      if (stockStatus === 'in-stock') matchStatus = p.current_stock > p.min_stock_level;
      else if (stockStatus === 'low-stock') matchStatus = p.current_stock > 0 && p.current_stock <= p.min_stock_level;
      else if (stockStatus === 'out-of-stock') matchStatus = p.current_stock === 0;

      return matchSearch && matchCategory && matchStatus;
    });
  }, [products, search, categoryFilter, stockStatus]);

  const hasActiveFilters = search || categoryFilter !== 'all' || stockStatus !== 'all';

  const resetFilters = () => {
    setSearch('');
    setCategoryFilter('all');
    setStockStatus('all');
  };

  return (
    <div className="space-y-6">
      <motion.div {...section()} className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-semibold">Inventory</h2>
        <Button onClick={() => setAddOpen(true)} className="flex items-center gap-2">
          <PlusCircle className="w-5 h-5" /> Add Stock
        </Button>
      </motion.div>

      {/* Filter Bar */}
      <motion.div {...section(0.1)}>
        <GlassCard className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
          <div className="relative lg:col-span-2">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <Input 
              placeholder="Search product name or SKU..." 
              value={search} 
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select 
            options={[
              { label: 'All Categories', value: 'all' },
              ...categories.map(c => ({ label: c, value: c }))
            ]}
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          />
          <div className="flex gap-2">
            <Select 
              options={[
                { label: 'All Status', value: 'all' },
                { label: 'In Stock', value: 'in-stock' },
                { label: 'Low Stock', value: 'low-stock' },
                { label: 'Out of Stock', value: 'out-of-stock' }
              ]}
              value={stockStatus}
              onChange={(e) => setStockStatus(e.target.value)}
              className="flex-1"
            />
            {hasActiveFilters && (
              <Button variant="ghost" className="px-3" onClick={resetFilters} title="Reset Filters">
                <FilterX className="w-5 h-5" />
              </Button>
            )}
          </div>
        </GlassCard>
      </motion.div>

      <motion.div {...section(0.2)}>
        <GlassCard className="p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-bg-elevated border-b border-border">
                <tr className="text-left text-text-muted">
                  <th className="p-4 font-medium">SKU</th>
                  <th className="p-4 font-medium">Product Name</th>
                  <th className="p-4 font-medium">Category</th>
                  <th className="p-4 font-medium text-right">Cost Price</th>
                  <th className="p-4 font-medium text-right">Sell Price</th>
                  <th className="p-4 font-medium text-right">Stock</th>
                  <th className="p-4 font-medium">Status</th>
                  <th className="p-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-text-muted">No products found.</td>
                  </tr>
                ) : (
                  filteredProducts.map((product) => {
                    const isLowStock = product.current_stock > 0 && product.current_stock <= product.min_stock_level;
                    const isOut = product.current_stock === 0;

                    return (
                      <tr key={product.id} className="hover:bg-bg-elevated/30 transition-colors">
                        <td className="p-4 whitespace-nowrap text-text-muted">{product.sku}</td>
                        <td className="p-4 font-medium">{product.name}</td>
                        <td className="p-4">{product.category}</td>
                        <td className="p-4 text-right">{formatCurrency(product.buy_price)}</td>
                        <td className="p-4 text-right font-medium">{formatCurrency(product.sell_price)}</td>
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {product.current_stock}
                            {isLowStock && <AlertTriangle className="w-4 h-4 text-warning" />}
                          </div>
                        </td>
                        <td className="p-4">
                          {isOut ? (
                            <Badge variant="danger" size="sm">Out of Stock</Badge>
                          ) : isLowStock ? (
                            <Badge variant="warning" size="sm">Low Stock</Badge>
                          ) : (
                            <Badge variant="success" size="sm">In Stock</Badge>
                          )}
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button variant="ghost" size="sm" onClick={() => deleteProduct(product.id)} className="text-danger hover:text-danger hover:bg-danger/10">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </GlassCard>
      </motion.div>

      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Add Stock" size="md">
        <AddStockForm onSuccess={() => setAddOpen(false)} />
      </Modal>
    </div>
  );
}
