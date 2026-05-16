import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { PlusCircle, Search, FilterX, Edit3, Trash2 } from 'lucide-react';
import { GlassCard, Button, Input, Select, Modal, Badge } from '../components/ui';
import { AddSaleForm } from '../components/forms';
import { formatCurrency, formatDate } from '../utils/formatters';
import { useSalesStore, SaleRecord } from '../store/useSalesStore';

const section = (d = 0) => ({ initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0, transition: { delay: d, duration: 0.35 } } });

export default function Sales() {
  const [addOpen, setAddOpen] = useState(false);
  const { sales, deleteSale } = useSalesStore();

  // Filters
  const [search, setSearch] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const filteredSales = useMemo(() => {
    return sales.filter(s => {
      const dateVal = s.created_at || s.date || new Date().toISOString();
      const matchSearch = (s.product_name || '').toLowerCase().includes(search.toLowerCase()) || 
                          (s.customer_name && s.customer_name.toLowerCase().includes(search.toLowerCase()));
      const matchPayment = paymentFilter === 'all' || s.payment_method === paymentFilter;
      const matchDateFrom = !dateFrom || new Date(dateVal) >= new Date(dateFrom);
      // to include end of day, we can just do simple string compare or set hours
      const matchDateTo = !dateTo || new Date(dateVal) <= new Date(new Date(dateTo).setHours(23, 59, 59));
      
      return matchSearch && matchPayment && matchDateFrom && matchDateTo;
    }).sort((a,b) => {
      const dateB = b.created_at || b.date || new Date().toISOString();
      const dateA = a.created_at || a.date || new Date().toISOString();
      return new Date(dateB).getTime() - new Date(dateA).getTime();
    });
  }, [sales, search, paymentFilter, dateFrom, dateTo]);

  const hasActiveFilters = search || paymentFilter !== 'all' || dateFrom || dateTo;

  const resetFilters = () => {
    setSearch('');
    setPaymentFilter('all');
    setDateFrom('');
    setDateTo('');
  };

  return (
    <div className="space-y-6">
      <motion.div {...section()} className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-semibold">Sales</h2>
        <Button onClick={() => setAddOpen(true)} className="flex items-center gap-2">
          <PlusCircle className="w-5 h-5" /> New Sale
        </Button>
      </motion.div>

      {/* Filter Bar */}
      <motion.div {...section(0.1)}>
        <GlassCard className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
          <div className="relative lg:col-span-2">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <Input 
              placeholder="Search product or customer..." 
              value={search} 
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select 
            options={[
              { label: 'All Payments', value: 'all' },
              { label: 'Cash', value: 'cash' },
              { label: 'bKash', value: 'bkash' },
              { label: 'Nagad', value: 'nagad' },
              { label: 'Card', value: 'card' }
            ]}
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
          />
          <Input 
            type="date" 
            value={dateFrom} 
            onChange={(e) => setDateFrom(e.target.value)} 
          />
          <div className="flex gap-2">
            <Input 
              type="date" 
              value={dateTo} 
              onChange={(e) => setDateTo(e.target.value)} 
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
        <GlassCard className="p-0 overflow-hidden border-none sm:border-solid">
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-bg-elevated border-b border-border">
                <tr className="text-left text-text-muted">
                  <th className="p-4 font-medium whitespace-nowrap">Date</th>
                  <th className="p-4 font-medium whitespace-nowrap">Product</th>
                  <th className="p-4 font-medium whitespace-nowrap">Customer</th>
                  <th className="p-4 font-medium text-right whitespace-nowrap">Qty</th>
                  <th className="p-4 font-medium text-right whitespace-nowrap">Total</th>
                  <th className="p-4 font-medium whitespace-nowrap">Payment</th>
                  <th className="p-4 font-medium text-right whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {filteredSales.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-text-muted">No sales found.</td>
                  </tr>
                ) : (
                  filteredSales.map((sale) => (
                    <tr key={sale.id} className="hover:bg-bg-elevated/30 transition-colors">
                      <td className="p-4 whitespace-nowrap">{formatDate(sale.created_at || sale.date)}</td>
                      <td className="p-4 whitespace-nowrap font-medium">{sale.product_name}</td>
                      <td className="p-4 whitespace-nowrap text-text-muted">{sale.customer_name || '-'}</td>
                      <td className="p-4 text-right whitespace-nowrap">{sale.quantity}</td>
                      <td className="p-4 text-right font-bold text-success whitespace-nowrap">{formatCurrency(sale.total_amount)}</td>
                      <td className="p-4 whitespace-nowrap">
                        <Badge variant={sale.payment_method === 'cash' ? 'success' : 'primary'} size="sm" className="capitalize">
                          {sale.payment_method}
                        </Badge>
                      </td>
                      <td className="p-4 text-right whitespace-nowrap">
                        <Button variant="ghost" size="sm" onClick={() => deleteSale(sale.id)} className="text-danger hover:text-danger hover:bg-danger/10">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden divide-y divide-border/50">
            {filteredSales.length === 0 ? (
              <div className="p-8 text-center text-text-muted">No sales found.</div>
            ) : (
              filteredSales.map((sale) => (
                <div key={sale.id} className="p-4 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-bold text-lg">{sale.product_name}</p>
                      <p className="text-xs text-text-muted">{formatDate(sale.created_at || sale.date)}</p>
                    </div>
                    <Badge variant={sale.payment_method === 'cash' ? 'success' : 'primary'} size="sm" className="capitalize">
                      {sale.payment_method}
                    </Badge>
                  </div>
                  
                  <div className="flex justify-between items-center text-sm">
                    <div className="text-text-muted">
                      <span>{sale.customer_name || 'Guest'}</span>
                      <span className="mx-2">•</span>
                      <span>Qty: {sale.quantity}</span>
                    </div>
                    <p className="font-bold text-success text-lg">{formatCurrency(sale.total_amount)}</p>
                  </div>

                  <div className="flex justify-end pt-1">
                    <Button variant="ghost" size="sm" onClick={() => deleteSale(sale.id)} className="text-danger hover:text-danger hover:bg-danger/10 px-2 h-8">
                      <Trash2 className="w-4 h-4 mr-1" /> Delete
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </GlassCard>
      </motion.div>

      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="New Sale" size="md">
        <AddSaleForm onSuccess={() => setAddOpen(false)} />
      </Modal>
    </div>
  );
}
