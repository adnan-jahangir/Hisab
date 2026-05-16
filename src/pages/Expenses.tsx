import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { PlusCircle, Search, FilterX, Trash2 } from 'lucide-react';
import { GlassCard, Button, Input, Select, Modal, Badge } from '../components/ui';
import { AddExpenseForm } from '../components/forms';
import { formatCurrency, formatDate } from '../utils/formatters';
import { useExpenseStore, Expense } from '../store/useExpenseStore';

const section = (d = 0) => ({ initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0, transition: { delay: d, duration: 0.35 } } });

export default function Expenses() {
  const [addOpen, setAddOpen] = useState(false);
  const { expenses, deleteExpense } = useExpenseStore();

  // Filters
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Extract unique categories from expenses for the filter dropdown
  const categories = useMemo(() => {
    return Array.from(new Set(expenses.map(e => e.category)));
  }, [expenses]);

  const filteredExpenses = useMemo(() => {
    return expenses.filter(e => {
      const dateVal = e.created_at || e.date || new Date().toISOString();
      const matchSearch = e.description.toLowerCase().includes(search.toLowerCase());
      const matchCategory = categoryFilter === 'all' || e.category === categoryFilter;
      const matchDateFrom = !dateFrom || new Date(dateVal) >= new Date(dateFrom);
      const matchDateTo = !dateTo || new Date(dateVal) <= new Date(new Date(dateTo).setHours(23, 59, 59));
      
      return matchSearch && matchCategory && matchDateFrom && matchDateTo;
    }).sort((a,b) => {
      const dateB = b.created_at || b.date || new Date().toISOString();
      const dateA = a.created_at || a.date || new Date().toISOString();
      return new Date(dateB).getTime() - new Date(dateA).getTime();
    });
  }, [expenses, search, categoryFilter, dateFrom, dateTo]);

  const hasActiveFilters = search || categoryFilter !== 'all' || dateFrom || dateTo;

  const resetFilters = () => {
    setSearch('');
    setCategoryFilter('all');
    setDateFrom('');
    setDateTo('');
  };

  return (
    <div className="space-y-6">
      <motion.div {...section()} className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-semibold">Expenses</h2>
        <Button onClick={() => setAddOpen(true)} className="flex items-center gap-2">
          <PlusCircle className="w-5 h-5" /> New Expense
        </Button>
      </motion.div>

      {/* Filter Bar */}
      <motion.div {...section(0.1)}>
        <GlassCard className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
          <div className="relative lg:col-span-2">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <Input 
              placeholder="Search description..." 
              value={search} 
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select 
            options={[
              { label: 'All Categories', value: 'all' },
              ...categories.map(c => ({ label: c.replace('_', ' '), value: c }))
            ]}
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
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
                  <th className="p-4 font-medium">Date</th>
                  <th className="p-4 font-medium">Description</th>
                  <th className="p-4 font-medium">Category</th>
                  <th className="p-4 font-medium">Type</th>
                  <th className="p-4 font-medium text-right">Amount</th>
                  <th className="p-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {filteredExpenses.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-text-muted">No expenses found.</td>
                  </tr>
                ) : (
                  filteredExpenses.map((expense) => (
                    <tr key={expense.id} className="hover:bg-bg-elevated/30 transition-colors">
                      <td className="p-4 whitespace-nowrap">{formatDate(expense.created_at || expense.date)}</td>
                      <td className="p-4 capitalize font-medium">{expense.description}</td>
                      <td className="p-4 capitalize text-text-muted">{expense.category.replace('_', ' ')}</td>
                      <td className="p-4">
                        <Badge variant="primary" size="sm" className="capitalize">{(expense.type || 'one_time').replace('_', ' ')}</Badge>
                      </td>
                      <td className="p-4 text-right font-bold text-danger">{formatCurrency(expense.amount)}</td>
                      <td className="p-4 text-right">
                        <Button variant="ghost" size="sm" onClick={() => deleteExpense(expense.id)} className="text-danger hover:text-danger hover:bg-danger/10">
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
            {filteredExpenses.length === 0 ? (
              <div className="p-8 text-center text-text-muted">No expenses found.</div>
            ) : (
              filteredExpenses.map((expense) => (
                <div key={expense.id} className="p-4 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-bold text-lg capitalize">{expense.description}</p>
                      <p className="text-xs text-text-muted">{formatDate(expense.created_at || expense.date)}</p>
                    </div>
                    <Badge variant="primary" size="sm" className="capitalize">
                      {(expense.type || 'one_time').replace('_', ' ')}
                    </Badge>
                  </div>
                  
                  <div className="flex justify-between items-center text-sm">
                    <p className="text-text-muted capitalize">{expense.category.replace('_', ' ')}</p>
                    <p className="font-bold text-danger text-lg">{formatCurrency(expense.amount)}</p>
                  </div>

                  <div className="flex justify-end pt-1">
                    <Button variant="ghost" size="sm" onClick={() => deleteExpense(expense.id)} className="text-danger hover:text-danger hover:bg-danger/10 px-2 h-8">
                      <Trash2 className="w-4 h-4 mr-1" /> Delete
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </GlassCard>
      </motion.div>

      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="New Expense" size="md">
        <AddExpenseForm onSuccess={() => setAddOpen(false)} />
      </Modal>
    </div>
  );
}
