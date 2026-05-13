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
import { subDays, getDay, format } from 'date-fns';
import { GlassCard } from '../components/ui/GlassCard';
import { KPICard } from '../components/ui/KPICard';
import { Skeleton } from '../components/ui/Skeleton';

// --- MOCK DATA GENERATION ---
const generateDailyData = () => {
  const data = [];
  let cumulativeCash = 50000;
  const today = new Date();

  // 365 days of data
  for (let i = 364; i >= 0; i--) {
    const date = subDays(today, i);
    const dayOfWeek = getDay(date);
    const isWeekend = dayOfWeek === 5 || dayOfWeek === 6; // Weekend (Fri/Sat or Sat/Sun depending on logic)
    const isMonthEnd = date.getDate() >= 28;

    let baseRevenue = isWeekend ? 1500 + Math.random() * 1000 : 3000 + Math.random() * 2000;
    if (isMonthEnd) baseRevenue += 2000; // Month-end spike

    const baseExpense = 2000 + Math.random() * 1000;
    
    const profit = baseRevenue - baseExpense;
    cumulativeCash += profit;

    data.push({
      date: format(date, 'yyyy-MM-dd'),
      displayDate: format(date, 'MMM dd'),
      month: format(date, 'yyyy-MM'),
      displayMonth: format(date, 'MMM yyyy'),
      revenue: Math.round(baseRevenue),
      expense: Math.round(baseExpense),
      profit: Math.round(profit),
      cashFlow: Math.round(cumulativeCash),
    });
  }
  return data;
};

const MOCK_DAILY_DATA = generateDailyData();

// Monthly aggregation for bar charts
const MOCK_MONTHLY_DATA = Object.values(MOCK_DAILY_DATA.reduce((acc: any, curr) => {
  if (acc[curr.month]) {
    acc[curr.month].revenue += curr.revenue;
    acc[curr.month].expense += curr.expense;
    acc[curr.month].profit += curr.profit;
  } else {
    acc[curr.month] = { ...curr };
  }
  return acc;
}, {}));

const MOCK_CATEGORIES = [
  { name: 'Payroll', value: 45000, color: '#ef4444' }, // danger
  { name: 'Marketing', value: 25000, color: '#f59e0b' }, // warning
  { name: 'Software', value: 15000, color: '#3b82f6' }, // primary
  { name: 'Office', value: 10000, color: '#8b5cf6' },
  { name: 'Miscellaneous', value: 5000, color: '#6b7280' }, // muted
];

const MOCK_PRODUCTS = [
  { name: 'Enterprise Plan', revenue: 120000, units: 120 },
  { name: 'Pro Plan', revenue: 85000, units: 425 },
  { name: 'Basic Plan', revenue: 45000, units: 900 },
  { name: 'Addon Modules', revenue: 20000, units: 150 },
];

export default function Analytics() {
  const [isLoading, setIsLoading] = useState(true);
  const [dateRange, setDateRange] = useState('30D');
  const [productView, setProductView] = useState<'revenue' | 'units' | 'profit'>('revenue');

  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => setIsLoading(false), 800);
    return () => clearTimeout(timer);
  }, [dateRange]);

  const displayData = useMemo(() => {
    let days = 30;
    if (dateRange === '7D') days = 7;
    if (dateRange === '3M') days = 90;
    if (dateRange === '6M') days = 180;
    if (dateRange === '1Y') days = 365;
    
    return MOCK_DAILY_DATA.slice(-days);
  }, [dateRange]);

  const totalRevenue = displayData.reduce((sum, item) => sum + item.revenue, 0);
  const totalExpense = displayData.reduce((sum, item) => sum + item.expense, 0);
  const netProfit = totalRevenue - totalExpense;
  const profitMargin = totalRevenue ? ((netProfit / totalRevenue) * 100).toFixed(1) : '0';
  const avgDaily = Math.round(totalRevenue / displayData.length);

  const CHART_COLORS = {
    revenue: '#3b82f6',
    expense: '#ef4444',
    profit: '#10b981',
    grid: '#2A2A3D',
    text: '#9ca3af',
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
                <BarChart data={MOCK_MONTHLY_DATA.slice(-8)} margin={{ top: 25, right: 0, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} vertical={false} />
                  <XAxis dataKey="displayMonth" stroke={CHART_COLORS.text} fontSize={12} tickLine={false} />
                  <YAxis stroke={CHART_COLORS.text} fontSize={12} tickLine={false} tickFormatter={(val) => `৳ ${val/1000}k`} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
                  <ReferenceLine y={0} stroke={CHART_COLORS.grid} strokeWidth={2} />
                  <Bar dataKey="profit" name="Net Profit" radius={[4, 4, 0, 0]}>
                    {MOCK_MONTHLY_DATA.slice(-8).map((entry: any, index: number) => (
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
            {isLoading ? <ChartSkeleton /> : (
              <>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={MOCK_CATEGORIES}
                      cx="50%"
                      cy="50%"
                      innerRadius={65}
                      outerRadius={90}
                      paddingAngle={5}
                      dataKey="value"
                      stroke="none"
                    >
                      {MOCK_CATEGORIES.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-xs text-text-muted">Total</span>
                  <span className="font-bold text-lg text-text-primary">৳ 100k</span>
                </div>
              </>
            )}
          </div>
          {!isLoading && (
            <div className="grid grid-cols-2 gap-x-2 gap-y-3 mt-4">
              {MOCK_CATEGORIES.map((cat, i) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }} />
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
            {isLoading ? <ChartSkeleton /> : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={MOCK_PRODUCTS} layout="vertical" margin={{ top: 0, right: 30, left: 40, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} horizontal={true} vertical={false} />
                  <XAxis type="number" stroke={CHART_COLORS.text} fontSize={12} tickLine={false} tickFormatter={(val) => productView === 'units' ? val : `৳ ${val/1000}k`} />
                  <YAxis dataKey="name" type="category" stroke={CHART_COLORS.text} fontSize={13} tickLine={false} width={100} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
                  <Bar 
                    dataKey={productView === 'profit' ? 'revenue' /* mock profit proxy */ : productView} 
                    name={productView === 'revenue' ? 'Revenue' : productView === 'units' ? 'Units' : 'Profit'} 
                    fill={productView === 'revenue' ? CHART_COLORS.revenue : productView === 'units' ? '#a855f7' : CHART_COLORS.profit} 
                    radius={[0, 4, 4, 0]} 
                    barSize={28} 
                  />
                  {productView === 'revenue' && (
                    <Bar dataKey="units" name="Units" fill="#a855f7" radius={[0, 4, 4, 0]} barSize={12} />
                  )}
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
          {isLoading ? <ChartSkeleton /> : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={MOCK_MONTHLY_DATA.slice(-6)} margin={{ top: 0, right: 0, left: 10, bottom: 0 }}>
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
              <svg width="100%" height={Math.ceil(MOCK_DAILY_DATA.length / 7) * 16} className="text-xs">
                {MOCK_DAILY_DATA.map((day, i) => {
                  const weekIndex = Math.floor(i / 7);
                  const dayOfWeek = i % 7;
                  const x = dayOfWeek * 16;
                  const y = weekIndex * 16;
                  
                  // Calculate color based on revenue
                  const maxRev = 8000; 
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
              +12.4%
            </h2>
            <TrendingUp className="w-6 h-6 text-success" />
          </div>
          
          <div className="mt-8 w-full h-24">
            {isLoading ? <ChartSkeleton /> : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={MOCK_MONTHLY_DATA.map((d: any) => ({ ...d, growth: Math.random() * 20 }))}>
                  <defs>
                    <linearGradient id="growthGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={CHART_COLORS.success} stopOpacity={0.3}/>
                      <stop offset="95%" stopColor={CHART_COLORS.success} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.1)' }} />
                  <Area type="monotone" dataKey="growth" name="Growth" stroke={CHART_COLORS.profit} strokeWidth={2} fillOpacity={1} fill="url(#growthGradient)" />
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
