import React, { useMemo, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  AreaChart, Area, XAxis, YAxis, Tooltip as ReTooltip, ResponsiveContainer, TooltipProps
} from 'recharts';
import { format, subDays, startOfDay } from 'date-fns';
import { 
  TrendingUp, Receipt, Activity, Wallet, ArrowUpCircle, ArrowDownCircle
} from 'lucide-react';
import { KPICard, GlassCard, Modal, Button, Badge } from '../components/ui';
import { AddSaleForm, AddExpenseForm, AddStockForm } from '../components/forms';
import { formatCurrency, formatDate } from '../utils/formatters';
import { useDashboardStore } from '../store/useDashboardStore';
import { useSalesStore } from '../store/useSalesStore';
import { useExpenseStore } from '../store/useExpenseStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { useAuthStore } from '../store/useAuthStore';

const sectionVariant = (delay = 0) => ({
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { delay, duration: 0.4 } },
});

const radialColorForScore = (score: number) => {
  if (score > 70) return '#10B981';
  if (score >= 50) return '#F59E0B';
  return '#EF4444';
};

export default function Dashboard() {
  const [addSaleOpen, setAddSaleOpen] = useState(false);
  const [addExpenseOpen, setAddExpenseOpen] = useState(false);
  const [addStockOpen, setAddStockOpen] = useState(false);
  const [chartRange, setChartRange] = useState<'7D' | '30D' | '3M'>('30D');

  const { kpis, recalculate } = useDashboardStore();
  const { sales } = useSalesStore();
  const { expenses } = useExpenseStore();
  const { user } = useSettingsStore();
  const { ownerAccount } = useAuthStore();

  useEffect(() => {
    recalculate();
  }, [sales, expenses, recalculate]);

  const transactions = useMemo(() => {
      const all: any[] = [
        ...sales.map(s => ({ id: s.id, type: 'income', description: s.product_name || 'Product Sale', category: 'Sale', amount: s.total_amount, date: s.created_at || s.date || new Date().toISOString(), status: (s.status || 'Completed').toLowerCase() })),
        ...expenses.map(e => ({ id: e.id, type: 'expense', description: e.description, category: (e.category || '').replace('_', ' '), amount: e.amount, date: e.created_at || e.date || new Date().toISOString(), status: 'completed' }))
      ];
      return all.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 10);
    }, [sales, expenses]);

  const topProducts = useMemo(() => {
    const counts: Record<string, {name: string, units: number, revenue: number}> = {};
    sales.forEach(s => {
      if(!counts[s.product_id]) Object.assign(counts, { [s.product_id]: {id: s.product_id, name: s.product_name, units: 0, revenue: 0} });
      counts[s.product_id].units += s.quantity;
      counts[s.product_id].revenue += s.total_amount;
    });
    return Object.values(counts).sort((a,b) => b.revenue - a.revenue).slice(0, 5);
  }, [sales]);

  const areaSeries = useMemo(() => {
    const days = chartRange === '7D' ? 7 : (chartRange === '30D' ? 30 : 90);
    const data = [];
    const now = new Date();
    for (let i = days - 1; i >= 0; i--) {
      const dt = subDays(now, i);
      const start = startOfDay(dt).getTime();
      const end = start + 86400000;
      
      const daySales = sales.filter(s => {
        const t = new Date(s.created_at || s.date || new Date().toISOString()).getTime();
        return t >= start && t < end;
      }).reduce((sum, s) => sum + s.total_amount, 0);

      const dayExp = expenses.filter(e => {
        const t = new Date(e.created_at || e.date || new Date().toISOString()).getTime();
        return t >= start && t < end;
      }).reduce((sum, e) => sum + e.amount, 0);

      data.push({
        date: format(dt, 'dd MMM'),
        revenue: daySales,
        expense: dayExp
      });
    }
    return data;
  }, [sales, expenses, chartRange]);

  const CustomTooltipArea = ({ active, payload, label }: TooltipProps<number, string>) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-bg-elevated/90 border border-border p-3 rounded-lg shadow-xl backdrop-blur-md">
          <p className="text-text-secondary text-xs mb-2 font-medium">{label}</p>
          {payload.map((entry, index) => (
            <div key={index} className="flex items-center gap-2 text-sm font-semibold mt-1">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
              <span style={{ color: entry.color }}>
                {entry.name}: {formatCurrency(entry.value as number)}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <motion.div {...sectionVariant(0)} className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold">Welcome back, {ownerAccount?.fullName || user.name} !</h2>
          <p className="text-sm text-text-muted">{format(new Date(), 'EEEE, dd MMM yyyy')} {ownerAccount?.businessName || user.businessName}</p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={() => setAddSaleOpen(true)}>+ Sale</Button>
          <Button variant="secondary" onClick={() => setAddExpenseOpen(true)}>+ Expense</Button>
          <Button variant="secondary" onClick={() => setAddStockOpen(true)}>+ Stock</Button>
        </div>
      </motion.div>

      {/* KPI Row */}
      <motion.div {...sectionVariant(0.1)} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title="Total Revenue" value={kpis.totalRevenue} prefix="৳" icon={TrendingUp} variant="success" loading={false} />
        <KPICard title="Total Expenses" value={kpis.totalExpense} prefix="৳" icon={Receipt} variant="danger" />
        <KPICard title="Cash Balance" value={kpis.cashBalance} prefix="৳" icon={Wallet} variant="primary" />
        <KPICard title="Net Profit/Loss" value={Math.abs(kpis.netProfit)} prefix="৳" icon={Activity} variant={kpis.profitLoss === 'profit' ? 'success' : kpis.profitLoss === 'loss' ? 'danger' : 'primary'} />
      </motion.div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <motion.div {...sectionVariant(0.2)} className="lg:col-span-2">
          <GlassCard className="p-4 h-full overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <h3 className="text-lg font-semibold">Revenue & Expense</h3>
              <div className="flex items-center gap-1 bg-bg-elevated p-1 rounded-lg border border-border w-fit">
                <Button variant={chartRange === '7D' ? 'primary' : 'ghost'} size="sm" onClick={() => setChartRange('7D')} className="px-3">7D</Button>
                <Button variant={chartRange === '30D' ? 'primary' : 'ghost'} size="sm" onClick={() => setChartRange('30D')} className="px-3">30D</Button>
                <Button variant={chartRange === '3M' ? 'primary' : 'ghost'} size="sm" onClick={() => setChartRange('3M')} className="px-3">3M</Button>
              </div>
            </div>
            <div className="w-full h-[260px] sm:h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={areaSeries}>
                  <defs>
                    <linearGradient id="gradRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#6C63FF" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="#6C63FF" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gradExp" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#EF4444" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="#EF4444" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" tick={{ fill: 'var(--text-muted)' }} />
                  <YAxis tickFormatter={(v) => formatCurrency(Number(v))} tick={{ fill: 'var(--text-muted)' }} />
                  <ReTooltip content={<CustomTooltipArea />} />
                  <Area type="monotone" name="Revenue" dataKey="revenue" stroke="#6C63FF" fill="url(#gradRev)" />
                  <Area type="monotone" name="Expense" dataKey="expense" stroke="#EF4444" fill="url(#gradExp)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </GlassCard>
        </motion.div>

        <motion.div {...sectionVariant(0.25)}>
          <GlassCard className="p-6 h-full">
            <h4 className="text-md font-semibold mb-6">Business Health</h4>
            <div className="flex flex-col items-center gap-6">
              <div className="w-36 h-36 flex items-center justify-center relative">
                <svg viewBox="0 0 36 36" className="w-32 h-32 transform -rotate-90">
                  <circle cx="18" cy="18" r="16" strokeWidth="3" stroke="var(--border-color)" fill="transparent" />
                  <motion.circle
                    cx="18" cy="18" r="16"
                    strokeWidth="3"
                    stroke={radialColorForScore(kpis.healthScore)}
                    fill="transparent"
                    strokeLinecap="round"
                    style={{ strokeDasharray: 100 }}
                    initial={{ strokeDashoffset: 100 }}
                    animate={{ strokeDashoffset: 100 - kpis.healthScore }}
                    transition={{ duration: 1 }}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-bold">{Math.round(kpis.healthScore)}%</span>
                </div>
              </div>
              <p className="text-sm text-text-muted text-center max-w-[200px]">
                {kpis.healthScore > 70 ? 'Excellent! Keep up the good work.' : kpis.healthScore > 50 ? 'Fair. Try reducing expenses to improve profit margins.' : 'Warning: High expenses affecting profitability.'}
              </p>
            </div>
          </GlassCard>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <motion.div {...sectionVariant(0.35)} className="lg:col-span-2">
          <GlassCard className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Recent Transactions</h3>
            </div>
            {transactions.length === 0 ? (
              <div className="text-center p-8 text-text-muted">No recent transactions</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full table-auto text-sm">
                  <thead>
                    <tr className="text-text-muted text-left border-b border-border">
                      <th className="pb-3 px-2 font-medium">Type</th>
                      <th className="pb-3 px-2 font-medium">Description</th>
                      <th className="pb-3 px-2 font-medium">Category</th>
                      <th className="pb-3 px-2 font-medium">Amount</th>
                      <th className="pb-3 px-2 font-medium">Date</th>
                      <th className="pb-3 px-2 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((t, idx) => (
                      <tr key={`${t.id}-${idx}`} className="border-b border-border/50 last:border-0 hover:bg-bg-elevated/50 transition-colors">
                        <td className="py-3 px-2">
                          {t.type === 'income' ? <ArrowUpCircle className="text-success w-5 h-5" /> : <ArrowDownCircle className="text-danger w-5 h-5" />}
                        </td>
                        <td className="py-3 px-2 text-text-primary capitalize">{t.description}</td>
                        <td className="py-3 px-2 text-text-muted capitalize">{t.category}</td>
                        <td className={`py-3 px-2 font-semibold ${t.type === 'income' ? 'text-success' : 'text-danger'}`}>
                          {formatCurrency(t.amount)}
                        </td>
                        <td className="py-3 px-2 text-text-muted">{formatDate(t.date)}</td>
                        <td className="py-3 px-2">
                          <Badge variant={t.status === 'completed' ? 'success' : 'warning'} size="sm" className="capitalize">{t.status}</Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </GlassCard>
        </motion.div>

        <motion.div {...sectionVariant(0.4)}>
          <GlassCard className="p-4 h-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Top Products</h3>
            </div>
            {topProducts.length === 0 ? (
               <div className="text-center p-8 text-text-muted">No sales data</div>
            ) : (
              <div className="space-y-4">
                {topProducts.map((p) => (
                  <div key={p.id} className="flex items-center justify-between gap-4 p-2 rounded-lg hover:bg-bg-elevated/30 transition-colors">
                    <div className="flex-1">
                      <div className="text-sm font-medium text-text-primary">{p.name || 'Unknown'}</div>
                      <div className="text-xs text-text-muted">{p.units} units sold</div>
                    </div>
                    <div className="text-sm font-semibold text-accent-primary">{formatCurrency(p.revenue)}</div>
                  </div>
                ))}
              </div>
            )}
          </GlassCard>
        </motion.div>
      </div>

      <Modal open={addSaleOpen} onClose={() => setAddSaleOpen(false)} title="New Sale" size="md">
        <AddSaleForm onSuccess={() => setAddSaleOpen(false)} />
      </Modal>

      <Modal open={addExpenseOpen} onClose={() => setAddExpenseOpen(false)} title="New Expense" size="md">
        <AddExpenseForm onSuccess={() => setAddExpenseOpen(false)} />
      </Modal>

      <Modal open={addStockOpen} onClose={() => setAddStockOpen(false)} title="Add Stock" size="md">
        <AddStockForm onSuccess={() => setAddStockOpen(false)} />
      </Modal>
    </div>
  );
}
