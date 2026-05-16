import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  ResponsiveContainer,
  ComposedChart,
  AreaChart,
  Area,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  Brush
} from 'recharts';
import {
  Download,
  TrendingUp,
  Activity,
  DollarSign,
  PieChart as PieChartIcon,
  BarChart2,
  Calendar,
  Layers
} from 'lucide-react';
import { subDays, startOfDay, format } from 'date-fns';
import { GlassCard } from '../components/ui/GlassCard';
import { KPICard } from '../components/ui/KPICard';
import { Skeleton } from '../components/ui/Skeleton';
import { useSalesStore } from '../store/useSalesStore';
import { useExpenseStore } from '../store/useExpenseStore';

const CATEGORY_COLORS = ['#ef4444', '#f59e0b', '#3b82f6', '#8b5cf6', '#6b7280', '#10b981', '#ec4899'];

export default function Analytics() {
  const [isLoading, setIsLoading] = useState(true);
  const [dateRange, setDateRange] = useState('30D');
  const [productView, setProductView] = useState<'revenue' | 'units' | 'profit'>('revenue');

  const { sales } = useSalesStore();
  const { expenses } = useExpenseStore();

  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => setIsLoading(false), 800);
    return () => clearTimeout(timer);
  }, [dateRange, sales, expenses]);

  // Compute Daily Data dynamically based on actual stores
  const realDailyData = useMemo(() => {
    const data = [];
    const now = new Date();
    let cumulativeCash = 0; // Starts from 0 for current calculation

    // Generate last 365 days dynamically
    for (let i = 364; i >= 0; i--) {
      const date = subDays(now, i);
      const start = startOfDay(date).getTime();
      const end = start + 86400000;

      const daySales = sales.filter(s => {
        const t = new Date(s.created_at || s.date || new Date().toISOString()).getTime();
        return t >= start && t < end && s.status === 'Completed';
      }).reduce((sum, s) => sum + s.total_amount, 0);

      const dayExp = expenses.filter(e => {
        const t = new Date(e.created_at || e.date || new Date().toISOString()).getTime();
        return t >= start && t < end;
      }).reduce((sum, e) => sum + e.amount, 0);

      const profit = daySales - dayExp;
      cumulativeCash += profit;

      data.push({
        date: format(date, 'yyyy-MM-dd'),
        displayDate: format(date, 'MMM dd'),
        month: format(date, 'yyyy-MM'),
        displayMonth: format(date, 'MMM yyyy'),
        revenue: daySales,
        expense: dayExp,
        profit: profit,
        cashFlow: cumulativeCash,
      });
    }
    return data;
  }, [sales, expenses]);

  // Generate Monthly Aggregation
  const monthlyData = useMemo(() => {
    return Object.values(realDailyData.reduce((acc: any, curr) => {
      if (acc[curr.month]) {
        acc[curr.month].revenue += curr.revenue;
        acc[curr.month].expense += curr.expense;
        acc[curr.month].profit += curr.profit;
      } else {
        acc[curr.month] = { ...curr };
      }
      return acc;
    }, {}));
  }, [realDailyData]);

  // Aggregate Category Data
  const categoryData = useMemo(() => {
    const cats: Record<string, number> = {};
    expenses.forEach(e => {
      const cName = e.category || 'Other';
      cats[cName] = (cats[cName] || 0) + e.amount;
    });
    return Object.entries(cats)
      .map(([name, value], idx) => ({ 
        name: name.replace('_', ' '), 
        value, 
        color: CATEGORY_COLORS[idx % CATEGORY_COLORS.length] 
      }))
      .sort((a, b) => b.value - a.value);
  }, [expenses]);

  // Aggregate Product Data
  const productData = useMemo(() => {
    const prods: Record<string, {name: string, units: number, revenue: number, profit: number}> = {};
    sales.forEach(s => {
      if (s.status !== 'Completed') return;
      const pName = s.product_name || 'Unknown Product';
      if (!prods[pName]) prods[pName] = { name: pName, units: 0, revenue: 0, profit: 0 };
      prods[pName].units += s.quantity;
      prods[pName].revenue += s.total_amount;
      prods[pName].profit += s.profit;
    });
    return Object.values(prods).sort((a, b) => b.revenue - a.revenue).slice(0, 10);
  }, [sales]);

  const displayData = useMemo(() => {
    let days = 30;
    if (dateRange === '7D') days = 7;
    if (dateRange === '3M') days = 90;
    if (dateRange === '6M') days = 180;
    if (dateRange === '1Y') days = 365;
    
    return realDailyData.slice(-days);
  }, [dateRange, realDailyData]);

  const totalRevenue = displayData.reduce((sum, item) => sum + item.revenue, 0);
  const totalExpense = displayData.reduce((sum, item) => sum + item.expense, 0);
  const netProfit = totalRevenue - totalExpense;
  const profitMargin = totalRevenue ? ((netProfit / totalRevenue) * 100).toFixed(1) : '0';
  const avgDaily = displayData.length > 0 ? Math.round(totalRevenue / displayData.length) : 0;

  const CHART_COLORS = {
    revenue: '#3b82f6',
    expense: '#ef4444',
    profit: '#10b981',
    grid: '#2A2A3D',
    text: '#9ca3af',
    success: '#10b981'
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-bg-elevated border border-border p-3 rounded-lg shadow-xl backdrop-blur-md">
          <p className="text-text-primary text-sm font-medium mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center gap-4 justify-between text-sm">
              <span style={{ color: entry.color }} className="capitalize font-medium">{entry.name}:</span>
              <span className="font-semibold text-text-primary">
                {entry.name === 'Units' || entry.name === 'Growth' ? entry.value : `৳ ${entry.value.toLocaleString()}`}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  const ChartSkeleton = () => (
    <div className="w-full h-full flex flex-col items-center justify-center p-4">
      <Skeleton className="w-full h-full rounded-xl opacity-20" />
    </div>
  );

  const SectionEmptyState = ({ message }: { message: string }) => (
    <div className="w-full h-full flex flex-col items-center justify-center text-text-muted min-h-[200px]">
      <Layers className="w-8 h-8 mb-3 opacity-30" />
      <p className="text-sm font-medium">{message}</p>
    </div>
  );

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto pb-24">
      
      {/* 1. Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-accent-primary to-accent-light">
            আর্থিক বিশ্লেষণ | Financial Analytics
          </h1>
          <p className="text-text-secondary text-sm mt-1">Detailed breakdown of your financial metrics</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center bg-bg-elevated rounded-lg p-1 border border-border">
            {['7D', '30D', '3M', '6M', '1Y', 'Custom'].map(range => (
              <button
                key={range}
                onClick={() => setDateRange(range)}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                  dateRange === range 
                    ? 'bg-accent-primary text-white shadow-md' 
                    : 'text-text-muted hover:text-text-primary hover:bg-bg-base'
                }`}
              >
                {range}
              </button>
            ))}
          </div>
          
          <button className="flex items-center gap-2 px-4 py-2 bg-bg-elevated hover:bg-border transition-colors border border-border rounded-lg text-sm font-medium text-text-primary">
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Export Report</span>
          </button>
        </div>
      </div>

      {/* 2. Summary KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <KPICard 
          title="Total Revenue" 
          value={totalRevenue} 
          prefix="৳ "
          trend="up" trendValue={12.5}
          icon={DollarSign}
          variant="primary"
          loading={isLoading}
        />
        <KPICard 
          title="Total Expense" 
          value={totalExpense} 
          prefix="৳ "
          trend="down" trendValue={2.4}
          icon={Activity}
          variant="danger"
          loading={isLoading}
        />
        <KPICard 
          title="Net Profit" 
          value={netProfit} 
          prefix="৳ "
          trend="up" trendValue={18.2}
          icon={TrendingUp}
          variant="success"
          loading={isLoading}
        />
        <KPICard 
          title="Profit Margin" 
          value={parseFloat(profitMargin)} 
          suffix="%"
          trend="up" trendValue={1.2}
          icon={PieChartIcon}
          variant="success"
          loading={isLoading}
        />
        <KPICard 
          title="Avg Daily Revenue" 
          value={avgDaily} 
          prefix="৳ "
          trend="up" trendValue={4.1}
          icon={BarChart2}
          variant="primary"
          loading={isLoading}
        />
      </div>

      {/* 3. Revenue vs Expense */}
      <GlassCard className="p-6 h-[450px] flex flex-col">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="font-semibold text-lg text-text-primary">Revenue vs Expense</h3>
            <p className="text-text-muted text-sm">Track income against spending over time.</p>
          </div>
          <div className="text-right hidden sm:block">
            <div className="text-xl font-bold text-text-primary">৳ {totalRevenue.toLocaleString()}</div>
            <div className="text-xs text-text-muted">Selected Range Total</div>
          </div>
        </div>
        <div className="flex-1 w-full min-h-0">
          {isLoading ? <ChartSkeleton /> : displayData.length === 0 ? <SectionEmptyState message="No data available for selected range" /> : (
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={displayData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={CHART_COLORS.revenue} stopOpacity={0.3}/>
                    <stop offset="95%" stopColor={CHART_COLORS.revenue} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} vertical={false} />
                <XAxis dataKey="displayDate" stroke={CHART_COLORS.text} fontSize={12} tickLine={false} minTickGap={40} />
                <YAxis yAxisId="left" stroke={CHART_COLORS.text} fontSize={12} tickLine={false} tickFormatter={(val) => `৳ ${val/1000}k`} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ paddingTop: '20px' }} />
                <Area yAxisId="left" type="monotone" dataKey="revenue" name="Revenue" stroke={CHART_COLORS.revenue} strokeWidth={2} fillOpacity={1} fill="url(#colorRev)" />
                <Line yAxisId="left" type="monotone" dataKey="expense" name="Expense" stroke={CHART_COLORS.expense} strokeWidth={2} dot={false} strokeDasharray="4 4" />
                <Brush dataKey="displayDate" height={30} stroke={CHART_COLORS.grid} fill="transparent" travellerWidth={10} tickFormatter={() => ''} />
              </ComposedChart>
            </ResponsiveContainer>
          )}
        </div>
      </GlassCard>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 4. Profit/Loss Trend */}
        <GlassCard className="p-6 h-[400px] flex flex-col">
          <div className="mb-6">
            <h3 className="font-semibold text-lg text-text-primary">Profit/Loss Trend</h3>
            <p className="text-text-muted text-sm">Monthly profit overview</p>
          </div>
          <div className="flex-1 w-full min-h-0">
            {isLoading ? <ChartSkeleton /> : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData.slice(-8)} margin={{ top: 25, right: 0, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} vertical={false} />
                  <XAxis dataKey="displayMonth" stroke={CHART_COLORS.text} fontSize={12} tickLine={false} />
                  <YAxis stroke={CHART_COLORS.text} fontSize={12} tickLine={false} tickFormatter={(val) => `৳ ${val/1000}k`} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
                  <ReferenceLine y={0} stroke={CHART_COLORS.grid} strokeWidth={2} />
                  <Bar dataKey="profit" name="Net Profit" radius={[4, 4, 0, 0]}>
                    {monthlyData.slice(-8).map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={entry.profit >= 0 ? CHART_COLORS.profit : CHART_COLORS.expense} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </GlassCard>

        {/* 5. Cash Flow Chart */}
        <GlassCard className="p-6 h-[400px] flex flex-col">
          <div className="mb-6">
            <h3 className="font-semibold text-lg text-text-primary">Cumulative Cash Flow</h3>
            <p className="text-text-muted text-sm">Net cash position over time</p>
          </div>
          <div className="flex-1 w-full min-h-0">
            {isLoading ? <ChartSkeleton /> : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={displayData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorCashFlow" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={CHART_COLORS.profit} stopOpacity={0.3}/>
                      <stop offset="95%" stopColor={CHART_COLORS.profit} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} vertical={false} />
                  <XAxis dataKey="displayDate" stroke={CHART_COLORS.text} fontSize={12} minTickGap={30} tickLine={false} />
                  <YAxis stroke={CHART_COLORS.text} fontSize={12} tickLine={false} tickFormatter={(val) => `৳ ${val/1000}k`} domain={['auto', 'auto']} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="cashFlow" name="Cash Flow" stroke={CHART_COLORS.profit} strokeWidth={3} fillOpacity={1} fill="url(#colorCashFlow)" activeDot={{ r: 6, fill: CHART_COLORS.profit, stroke: '#fff', strokeWidth: 2 }} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </GlassCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 6. Category Expense Breakdown */}
        <GlassCard className="p-6 h-[400px] flex flex-col">
          <div className="mb-2">
            <h3 className="font-semibold text-lg text-text-primary">Expense Categories</h3>
            <p className="text-text-muted text-sm">Top spending areas</p>
          </div>
          <div className="flex-1 w-full min-h-0 relative">
            {isLoading ? <ChartSkeleton /> : categoryData.length === 0 ? <SectionEmptyState message="No expenses found" /> : (
              <>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={65}
                      outerRadius={90}
                      paddingAngle={5}
                      dataKey="value"
                      stroke="none"
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-xs text-text-muted">Total</span>
                  <span className="font-bold text-lg text-text-primary">৳ {totalExpense >= 1000 ? (totalExpense/1000).toFixed(1) + 'k' : totalExpense}</span>
                </div>
              </>
            )}
          </div>
          {!isLoading && categoryData.length > 0 && (
            <div className="grid grid-cols-2 gap-x-2 gap-y-3 mt-4">
              {categoryData.map((cat, i) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                  <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                  <span className="text-text-secondary truncate flex-1">{cat.name}</span>
                </div>
              ))}
            </div>
          )}
        </GlassCard>

        {/* 7. Top Products Performance */}
        <GlassCard className="p-6 h-[400px] flex flex-col lg:col-span-2">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-4">
            <div>
              <h3 className="font-semibold text-lg text-text-primary">Top Products Performance</h3>
              <p className="text-text-muted text-sm">Sales breakdown by product</p>
            </div>
            <div className="flex bg-bg-base/50 rounded-lg p-1 border border-border">
              <button onClick={() => setProductView('revenue')} className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${productView === 'revenue' ? 'bg-bg-elevated text-text-primary shadow-sm' : 'text-text-muted'}`}>Revenue</button>
              <button onClick={() => setProductView('units')} className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${productView === 'units' ? 'bg-bg-elevated text-text-primary shadow-sm' : 'text-text-muted'}`}>Units</button>
              <button onClick={() => setProductView('profit')} className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${productView === 'profit' ? 'bg-bg-elevated text-text-primary shadow-sm' : 'text-text-muted'}`}>Profit</button>
            </div>
          </div>
          <div className="flex-1 w-full min-h-0">
            {isLoading ? <ChartSkeleton /> : productData.length === 0 ? <SectionEmptyState message="No sales found" /> : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={productData} layout="vertical" margin={{ top: 0, right: 30, left: 40, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} horizontal={true} vertical={false} />
                  <XAxis type="number" stroke={CHART_COLORS.text} fontSize={12} tickLine={false} tickFormatter={(val) => productView === 'units' ? val : `৳ ${val >= 1000 ? val/1000 + 'k' : val}`} />
                  <YAxis dataKey="name" type="category" stroke={CHART_COLORS.text} fontSize={13} tickLine={false} width={100} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
                  <Bar 
                    dataKey={productView} 
                    name={productView === 'revenue' ? 'Revenue' : productView === 'units' ? 'Units' : 'Profit'} 
                    fill={productView === 'revenue' ? CHART_COLORS.revenue : productView === 'units' ? '#a855f7' : CHART_COLORS.profit} 
                    radius={[0, 4, 4, 0]} 
                    barSize={28} 
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </GlassCard>
      </div>

      {/* 8. Monthly Comparison */}
      <GlassCard className="p-6 h-[450px] flex flex-col">
        <div className="mb-6">
          <h3 className="font-semibold text-lg text-text-primary">Monthly Comparison</h3>
          <p className="text-text-muted text-sm">Current month vs Previous periods</p>
        </div>
        <div className="flex-1 w-full min-h-0">
          {isLoading ? <ChartSkeleton /> : monthlyData.length === 0 ? <SectionEmptyState message="No data available" /> : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData.slice(-6)} margin={{ top: 0, right: 0, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} vertical={false} />
                <XAxis dataKey="displayMonth" stroke={CHART_COLORS.text} fontSize={12} tickLine={false} />
                <YAxis stroke={CHART_COLORS.text} fontSize={12} tickLine={false} tickFormatter={(val) => `৳ ${val/1000}k`} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
                <Legend wrapperStyle={{ paddingTop: '20px' }} />
                <Bar dataKey="revenue" name="Revenue" fill={CHART_COLORS.revenue} radius={[4, 4, 0, 0]} barSize={24} />
                <Bar dataKey="expense" name="Expense" fill={CHART_COLORS.expense} radius={[4, 4, 0, 0]} barSize={24} />
                <Bar dataKey="profit" name="Profit" fill={CHART_COLORS.profit} radius={[4, 4, 0, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </GlassCard>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* 9. Sales Heatmap (7 cols x N rows) */}
        <GlassCard className="p-6 flex flex-col lg:col-span-3">
          <div className="mb-6">
            <h3 className="font-semibold text-lg text-text-primary">Sales Activity Heatmap</h3>
            <p className="text-text-muted text-sm">Visualizing 365-day sales velocity mapped by day of the week.</p>
          </div>
          <div className="flex-1 w-full overflow-y-auto max-h-[300px] pe-2 styled-scrollbar">
            {isLoading ? <ChartSkeleton /> : (
              <svg width="100%" height={Math.ceil(realDailyData.length / 7) * 16} className="text-xs">
                {realDailyData.map((day, i) => {
                  const weekIndex = Math.floor(i / 7);
                  const dayOfWeek = i % 7;
                  const x = dayOfWeek * 16;
                  const y = weekIndex * 16;
                  
                  // Calculate color based on revenue
                  const maxRev = Math.max(...realDailyData.map(d => d.revenue), 1000); 
                  const intensity = Math.min(day.revenue / maxRev, 1);
                  let color = '#2A2A3D'; // Default empty/low
                  if (intensity > 0.8) color = '#10b981';
                  else if (intensity > 0.6) color = '#059669';
                  else if (intensity > 0.4) color = '#047857';
                  else if (intensity > 0.2) color = '#065f46';
                  else if (intensity > 0) color = '#064e3b';

                  return (
                    <g key={day.date}>
                      <rect 
                        x={x} 
                        y={y} 
                        width={12} 
                        height={12} 
                        rx={2}
                        fill={color}
                        className="transition-colors hover:stroke-white hover:stroke-[2px] cursor-pointer"
                      />
                      <title>{`${day.displayDate}: ৳ ${day.revenue.toLocaleString()}`}</title>
                    </g>
                  );
                })}
              </svg>
            )}
          </div>
          <div className="flex items-center gap-2 mt-4 text-xs text-text-muted">
            <span>Less</span>
            <div className="flex gap-1">
              {['#2A2A3D', '#064e3b', '#047857', '#059669', '#10b981'].map(c => (
                <div key={c} className="w-3 h-3 rounded-sm" style={{ backgroundColor: c }} />
              ))}
            </div>
            <span>More</span>
          </div>
        </GlassCard>

        {/* 10. Growth Rate Indicator */}
        <GlassCard className="p-6 flex flex-col justify-center items-center text-center">
          <p className="text-text-muted font-medium mb-2">MoM Growth Rate</p>
          <div className="flex items-center justify-center gap-2">
            <h2 className="text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-br from-success to-green-400 drop-shadow-sm">
              {monthlyData.length >= 2 
                ? `${monthlyData[monthlyData.length-1].revenue >= monthlyData[monthlyData.length-2].revenue ? '+' : ''}${(((monthlyData[monthlyData.length-1].revenue - monthlyData[monthlyData.length-2].revenue) / (monthlyData[monthlyData.length-2].revenue || 1)) * 100).toFixed(1)}%` 
                : '0.0%'}
            </h2>
            <TrendingUp className="w-6 h-6 text-success" />
          </div>
          
          <div className="mt-8 w-full h-24">
            {isLoading ? <ChartSkeleton /> : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyData.map((d: any) => ({ ...d, growth: d.revenue }))}>
                  <defs>
                    <linearGradient id="growthGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={CHART_COLORS.success} stopOpacity={0.3}/>
                      <stop offset="95%" stopColor={CHART_COLORS.success} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.1)' }} />
                  <Area type="monotone" dataKey="growth" name="Revenue" stroke={CHART_COLORS.profit} strokeWidth={2} fillOpacity={1} fill="url(#growthGradient)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
          <p className="text-xs text-text-muted mt-4">Last 12 months trajectory</p>
        </GlassCard>
      </div>

    </div>
  );
}
