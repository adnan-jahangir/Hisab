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
      const matchSearch = s.product_name.toLowerCase().includes(search.toLowerCase()) || 
                          (s.customer_name && s.customer_name.toLowerCase().includes(search.toLowerCase()));
      const matchPayment = paymentFilter === 'all' || s.payment_method === paymentFilter;
      const matchDateFrom = !dateFrom || new Date(s.date) >= new Date(dateFrom);
      // to include end of day, we can just do simple string compare or set hours
      const matchDateTo = !dateTo || new Date(s.date) <= new Date(new Date(dateTo).setHours(23, 59, 59));
      
      return matchSearch && matchPayment && matchDateFrom && matchDateTo;
    }).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
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
        <GlassCard className="p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-bg-elevated border-b border-border">
                <tr className="text-left text-text-muted">
                  <th className="p-4 font-medium">Date</th>
                  <th className="p-4 font-medium">Product</th>
                  <th className="p-4 font-medium">Customer</th>
                  <th className="p-4 font-medium text-right">Qty</th>
                  <th className="p-4 font-medium text-right">Total</th>
                  <th className="p-4 font-medium">Payment</th>
                  <th className="p-4 font-medium text-right">Actions</th>
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
                      <td className="p-4 whitespace-nowrap">{formatDate(sale.date)}</td>
                      <td className="p-4">{sale.product_name}</td>
                      <td className="p-4">{sale.customer_name || '-'}</td>
                      <td className="p-4 text-right">{sale.quantity}</td>
                      <td className="p-4 text-right font-medium text-success">{formatCurrency(sale.total_amount)}</td>
                      <td className="p-4">
                        <Badge variant="primary" size="sm" className="capitalize">{sale.payment_method}</Badge>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="ghost" size="sm" onClick={() => deleteSale(sale.id)} className="text-danger hover:text-danger hover:bg-danger/10">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </GlassCard>
      </motion.div>

      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="New Sale" size="md">
        <AddSaleForm onSuccess={() => setAddOpen(false)} />
      </Modal>
    </div>
  );
}
