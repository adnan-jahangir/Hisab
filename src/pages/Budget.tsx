import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  Area,
  BarChart,
} from 'recharts';
import {
  Target,
  Sparkles,
  CheckCircle,
  AlertTriangle,
  XCircle,
  TrendingUp,
  DollarSign,
  Activity,
  Edit2,
  RefreshCw,
  Download,
  CalendarDays,
  FileText,
  Table as TableIcon
} from 'lucide-react';
import { GlassCard } from '../components/ui/GlassCard';
import { KPICard } from '../components/ui/KPICard';
import { Skeleton } from '../components/ui/Skeleton';
import { generateForecast, BudgetForecastInput, SeasonalityTag } from '../utils/budgetPredictor';
import { format, addMonths } from 'date-fns';
import { cn } from '../utils/cn';

// --- MOCK DATA ---
const MOCK_CATEGORIES = ['Payroll', 'Marketing', 'Software', 'Office', 'Travel'];
const MOCK_EXPENSE_HISTORY = MOCK_CATEGORIES.map(cat => ({
  category: cat,
  monthlyData: [
    Math.round(4000 + Math.random() * 2000), 
    Math.round(4200 + Math.random() * 2000), 
    Math.round(4500 + Math.random() * 2000)
  ] // Trending up slightly generally
}));

const MOCK_REVENUE_HISTORY = [50000, 52000, 51000];

// Generate last 3 months
const today = new Date();
const last3Months = [
  format(addMonths(today, -3), 'MMM'),
  format(addMonths(today, -2), 'MMM'),
  format(addMonths(today, -1), 'MMM')
];

export default function Budget() {
  const [horizon, setHorizon] = useState<number>(1);
  const [isLoading, setIsLoading] = useState(true);
  const [seasonality, setSeasonality] = useState<Record<string, SeasonalityTag>>({});
  
  // Custom edits for suggested budget
  const [customBudgets, setCustomBudgets] = useState<Record<string, number>>({});
  const [editingCat, setEditingCat] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>('');

  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => setIsLoading(false), 800);
    return () => clearTimeout(timer);
  }, [horizon, seasonality]);

  // Generate seasonality array for the next 12 months based on user tags
  const nextMonthsTags = useMemo(() => {
    const tags: SeasonalityTag[] = [];
    for (let i = 0; i < 12; i++) {
      const monthKey = format(addMonths(today, i), 'MMM');
      tags.push(seasonality[monthKey] || 'Normal');
    }
    return tags;
  }, [seasonality]);

  const forecastInput: BudgetForecastInput = useMemo(() => ({
    revenueHistory: MOCK_REVENUE_HISTORY,
    expenseHistory: MOCK_EXPENSE_HISTORY,
    horizon,
    seasonality: nextMonthsTags
  }), [horizon, nextMonthsTags]);

  const forecast = useMemo(() => generateForecast(forecastInput), [forecastInput]);

  // Derived current metrics vs predictions
  const currentTotalSpend = MOCK_EXPENSE_HISTORY.reduce((sum, cat) => sum + cat.monthlyData[2], 0);
  const predictedMonthlyExpense = forecast.predictedExpenses / horizon;
  
  let healthState: 'onTrack' | 'atRisk' | 'overspent' = 'onTrack';
  if (currentTotalSpend > predictedMonthlyExpense) healthState = 'overspent';
  else if (currentTotalSpend > predictedMonthlyExpense * 0.9) healthState = 'atRisk';

  const handleEditSave = (catId: string) => {
    const val = parseInt(editValue, 10);
    if (!isNaN(val)) {
      setCustomBudgets(prev => ({ ...prev, [catId]: val }));
    }
    setEditingCat(null);
  };

  const handleReset = (catId: string) => {
    setCustomBudgets(prev => {
      const next = { ...prev };
      delete next[catId];
      return next;
    });
  };

  const toggleSeasonality = (monthKey: string) => {
    setSeasonality(prev => {
      const current = prev[monthKey] || 'Normal';
      const next = current === 'Normal' ? 'High' : current === 'High' ? 'Low' : 'Normal';
      return { ...prev, [monthKey]: next };
    });
  };

  // Chart Data preparation
  const combinedChartData = useMemo(() => {
    const data = [];
    // Actuals
    for (let i = 0; i < 3; i++) {
      data.push({
        month: last3Months[i],
        actualSpend: MOCK_EXPENSE_HISTORY.reduce((sum, cat) => sum + cat.monthlyData[i], 0),
        actualRevenue: MOCK_REVENUE_HISTORY[i],
        predictedSpend: null,
        lowerBound: null,
        upperBound: null
      });
    }
    // Projected
    for (let i = 0; i < horizon; i++) {
        const pSpends = forecast.categoryPredictions.reduce((sum, cp) => sum + cp.predictedValue, 0);
        const lBounds = forecast.categoryPredictions.reduce((sum, cp) => sum + cp.lowerBound, 0);
        const uBounds = forecast.categoryPredictions.reduce((sum, cp) => sum + cp.upperBound, 0);

      data.push({
        month: format(addMonths(today, i), 'MMM'),
        actualSpend: null,
        actualRevenue: null,
        predictedSpend: pSpends,
        lowerBound: lBounds,
        upperBound: uBounds,
        ...forecast.categoryPredictions.reduce((acc, cp) => ({...acc, [cp.categoryId]: cp.predictedValue}), {})
      });
    }
    return data;
  }, [horizon, forecast]);


  const CHART_COLORS = {
    actual: '#9ca3af',
    predicted: '#a855f7',
    bounds: '#a855f720',
    grid: '#2A2A3D',
    text: '#9ca3af',
    categories: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']
  };

  // Renderers
  const ConfidenceBadge = ({ score }: { score: string }) => {
    const colors = {
      High: 'bg-success/20 text-success border-success/30',
      Medium: 'bg-warning/20 text-warning border-warning/30',
      Low: 'bg-danger/20 text-danger border-danger/30'
    };
    return (
      <span className={cn('px-2 py-0.5 rounded text-xs font-medium border', colors[score as keyof typeof colors] || colors.Medium)}>
        {score} Confidence
      </span>
    );
  };

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto pb-24 text-text-primary">
      
      {/* 1. Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-accent-primary to-accent-light">
              বাজেট পরিকল্পনা | Budget Planner
            </h1>
            <span className="flex items-center gap-1.5 px-3 py-1 bg-accent-primary/10 text-accent-light border border-accent-primary/20 rounded-full text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              AI ভিত্তিক পূর্বানুমান
            </span>
          </div>
          <p className="text-text-secondary text-sm mt-1">Smart predictive budgeting and forecasting</p>
        </div>

        <div className="flex bg-bg-elevated p-1 rounded-lg border border-border">
          {[1, 3, 6, 12].map(m => (
            <button
              key={m}
              onClick={() => setHorizon(m)}
              className={cn(
                'px-4 py-1.5 text-sm font-medium rounded-md transition-all',
                horizon === m ? 'bg-accent-primary text-white shadow-md' : 'text-text-muted hover:text-text-primary hover:bg-bg-base'
              )}
            >
              {m} Month{m > 1 && 's'}
            </button>
          ))}
        </div>
      </div>

      {/* 2. Budget Health Banner */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          "w-full rounded-xl p-4 flex items-center gap-4 border",
          healthState === 'onTrack' && 'bg-success/10 border-success/20 text-success',
          healthState === 'atRisk' && 'bg-warning/10 border-warning/20 text-warning',
          healthState === 'overspent' && 'bg-danger/10 border-danger/20 text-danger'
        )}
      >
        <div className="p-2 bg-white/10 rounded-full flex-shrink-0">
          {healthState === 'onTrack' && <CheckCircle className="w-6 h-6" />}
          {healthState === 'atRisk' && <AlertTriangle className="w-6 h-6" />}
          {healthState === 'overspent' && <XCircle className="w-6 h-6" />}
        </div>
        <div>
          <h3 className="font-semibold text-lg">
            {healthState === 'onTrack' && 'Budget is on Track!'}
            {healthState === 'atRisk' && 'Budget at Risk'}
            {healthState === 'overspent' && 'Overspent Warning'}
          </h3>
          <p className="text-sm opacity-90">
            {healthState === 'onTrack' && 'Current spending aligns perfectly with AI predictions.'}
            {healthState === 'atRisk' && 'You are within 10% of exceeding the AI predicted budget limit.'}
            {healthState === 'overspent' && 'Current spending has exceeded predictions in key categories.'}
          </p>
        </div>
      </motion.div>

      {/* 3. Forecast Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard 
          title={`Predicted Revenue (${horizon}M)`}
          value={forecast.predictedRevenue}
          prefix="~৳ "
          icon={DollarSign}
          variant="success"
          loading={isLoading}
        />
        <KPICard 
          title={`Predicted Expenses (${horizon}M)`}
          value={forecast.predictedExpenses}
          prefix="~৳ "
          icon={Activity}
          variant="danger"
          loading={isLoading}
        />
        <KPICard 
          title={`Expected Profit (${horizon}M)`}
          value={forecast.expectedProfit}
          prefix="~৳ "
          icon={TrendingUp}
          variant={forecast.expectedProfit >= 0 ? "primary" : "warning"}
          loading={isLoading}
        />
        <GlassCard className="p-6 flex flex-col justify-center items-center text-center">
          <p className="text-sm font-medium text-text-secondary mb-2">AI Confidence Score</p>
          {isLoading ? <Skeleton className="w-24 h-8 rounded-full" /> : (
            <div className={cn(
              "text-3xl font-bold mb-1",
              forecast.confidenceScore === 'High' ? 'text-success' : 
              forecast.confidenceScore === 'Medium' ? 'text-warning' : 'text-danger'
            )}>
              {forecast.confidenceScore}
            </div>
          )}
          <p className="text-xs text-text-muted">Based on historical data consistency</p>
        </GlassCard>
      </div>

      {/* 4. Budget Allocation Table */}
      <GlassCard className="overflow-hidden">
        <div className="p-5 border-b border-border flex justify-between items-center bg-bg-surface/50">
          <div>
            <h3 className="font-semibold text-lg">Category Budget Allocation</h3>
            <p className="text-sm text-text-muted">AI predicted limits vs your custom targets (Monthly Avg)</p>
          </div>
        </div>
        <div className="w-full overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border bg-bg-base/50 text-text-secondary text-sm">
                <th className="p-4 font-medium">Category</th>
                <th className="p-4 font-medium">Last Month</th>
                <th className="p-4 font-medium">Predicted (Avg/Mo)</th>
                <th className="p-4 font-medium">Confidence</th>
                <th className="p-4 font-medium">Suggested Budget</th>
                <th className="p-4 font-medium">Variance</th>
                <th className="p-4 font-medium w-24">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-border/50"><td colSpan={7} className="p-4"><Skeleton className="h-6 w-full" /></td></tr>
                ))
              ) : (
                forecast.categoryPredictions.map((cp, idx) => {
                  const lastActual = MOCK_EXPENSE_HISTORY[idx].monthlyData[2];
                  const activeBudget = customBudgets[cp.categoryId] ?? cp.predictedValue;
                  const isCustom = cp.categoryId in customBudgets;
                  const variance = activeBudget - lastActual;
                  
                  return (
                    <tr key={cp.categoryId} className="border-b border-border/50 hover:bg-bg-elevated/50 transition-colors group">
                      <td className="p-4 font-medium">{cp.categoryName}</td>
                      <td className="p-4 text-text-muted">৳ {lastActual.toLocaleString()}</td>
                      <td className="p-4 text-accent-light">৳ {cp.predictedValue.toLocaleString()}</td>
                      <td className="p-4"><ConfidenceBadge score={cp.confidence} /></td>
                      <td className="p-4 font-semibold">
                        {editingCat === cp.categoryId ? (
                          <div className="flex items-center gap-2">
                             <input 
                               type="number" 
                               autoFocus
                               value={editValue} 
                               onChange={e => setEditValue(e.target.value)}
                               onKeyDown={e => e.key === 'Enter' && handleEditSave(cp.categoryId)}
                               className="w-24 bg-bg-base border-b-2 border-accent-primary px-1 py-0.5 outline-none text-text-primary"
                             />
                             <button onClick={() => handleEditSave(cp.categoryId)} className="text-success text-xs">Save</button>
                          </div>
                        ) : (
                          <div 
                            onClick={() => { setEditingCat(cp.categoryId); setEditValue(activeBudget.toString()); }}
                            className="flex items-center gap-2 cursor-pointer border-b border-dashed border-transparent hover:border-text-muted w-max"
                          >
                            <span className={cn(isCustom ? 'text-primary' : 'text-text-primary')}>
                              ৳ {activeBudget.toLocaleString()}
                            </span>
                            <Edit2 className="w-3 h-3 text-text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                        )}
                      </td>
                      <td className="p-4">
                        <span className={cn("px-2 py-1 rounded text-xs font-medium", variance >= 0 ? "bg-success/10 text-success" : "bg-danger/10 text-danger")}>
                          {variance >= 0 ? '+' : ''}৳ {variance.toLocaleString()}
                        </span>
                      </td>
                      <td className="p-4">
                        <AnimatePresence>
                          {isCustom && (
                            <motion.button 
                              initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}
                              onClick={() => handleReset(cp.categoryId)} 
                              className="p-1.5 text-text-muted hover:text-accent-light hover:bg-accent-primary/10 rounded-md transition-colors"
                              title="Reset to AI suggestion"
                            >
                              <RefreshCw className="w-4 h-4" />
                            </motion.button>
                          )}
                        </AnimatePresence>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </GlassCard>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 5. Projected vs Actual Chart */}
        <GlassCard className="p-6 h-[400px] flex flex-col">
          <div className="mb-6">
             <h3 className="font-semibold text-lg">Projected vs Actual Spend</h3>
             <p className="text-text-muted text-sm">Historical actuals flowing into AI confidence bounds</p>
          </div>
          <div className="flex-1 w-full min-h-0">
            {isLoading ? <Skeleton className="w-full h-full rounded-xl" /> : (
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={combinedChartData} margin={{ top: 20, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} vertical={false} />
                  <XAxis dataKey="month" stroke={CHART_COLORS.text} fontSize={12} tickLine={false} />
                  <YAxis stroke={CHART_COLORS.text} fontSize={12} tickLine={false} tickFormatter={(v) => `৳${v/1000}k`} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1E1E2E', borderColor: '#2A2A3D', borderRadius: '8px' }}
                    itemStyle={{ color: '#fff' }}
                  />
                  {/* Confidence Interval Area for Future */}
                  <Area type="monotone" dataKey="upperBound" stroke="none" fill={CHART_COLORS.bounds} />
                  <Area type="monotone" dataKey="lowerBound" stroke="none" fill="#1E1E2E" /> {/* Blanking out inside to simulate band */}
                  
                  {/* Historical Solid Line */}
                  <Line type="monotone" dataKey="actualSpend" name="Actual Spend" stroke={CHART_COLORS.actual} strokeWidth={3} dot={{ r: 4 }} connectNulls />
                  
                  {/* Predicted Dashed Line */}
                  <Line type="monotone" dataKey="predictedSpend" name="AI Predicted Spend" stroke={CHART_COLORS.predicted} strokeWidth={3} strokeDasharray="5 5" dot={{ r: 4 }} connectNulls />

                  <ReferenceLine x={last3Months[2]} stroke={CHART_COLORS.text} strokeDasharray="3 3" label={{ position: 'top', value: 'Today', fill: CHART_COLORS.text, fontSize: 12 }} />
                </ComposedChart>
              </ResponsiveContainer>
            )}
          </div>
        </GlassCard>

        {/* 6. Category Forecast Breakdown */}
        <GlassCard className="p-6 h-[400px] flex flex-col">
          <div className="mb-6">
             <h3 className="font-semibold text-lg">Category Breakdown</h3>
             <p className="text-text-muted text-sm">Stacked view of predicted expense structure</p>
          </div>
          <div className="flex-1 w-full min-h-0">
             {isLoading ? <Skeleton className="w-full h-full rounded-xl" /> : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={combinedChartData.filter(d => d.predictedSpend !== null)} margin={{ top: 20, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} vertical={false} />
                  <XAxis dataKey="month" stroke={CHART_COLORS.text} fontSize={12} tickLine={false} />
                  <YAxis stroke={CHART_COLORS.text} fontSize={12} tickLine={false} tickFormatter={(v) => `৳${v/1000}k`} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1E1E2E', borderColor: '#2A2A3D', borderRadius: '8px' }}
                    itemStyle={{ color: '#fff' }}
                  />
                  <Legend />
                  {/* Stacked bars for each category. Using CSS pattern for dashed effect would be ideal, but for Recharts SVG we use semi-transparency as proxy for now */}
                   {forecast.categoryPredictions.map((cp, idx) => (
                     <Bar 
                       key={cp.categoryId}
                       dataKey={cp.categoryId} 
                       name={cp.categoryName} 
                       stackId="a" 
                       fill={CHART_COLORS.categories[idx % CHART_COLORS.categories.length]}
                       fillOpacity={0.8}
                     />
                   ))}
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </GlassCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 7. Seasonal Planner */}
        <GlassCard className="p-6 lg:col-span-2">
           <div className="flex items-center gap-2 mb-6">
             <CalendarDays className="w-5 h-5 text-accent-primary" />
             <div>
               <h3 className="font-semibold text-lg">Seasonality Tags</h3>
               <p className="text-text-muted text-sm">Tag upcoming months to automatically adjust AI predictions</p>
             </div>
           </div>
           
           <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
             {Array.from({ length: 12 }).map((_, i) => {
               const mDate = addMonths(today, i);
               const mKey = format(mDate, 'MMM');
               const activeTag = seasonality[mKey] || 'Normal';
               
               return (
                 <button
                   key={mKey}
                   onClick={() => toggleSeasonality(mKey)}
                   className={cn(
                     "relative p-3 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all hover:scale-105",
                     activeTag === 'High' ? 'bg-success/10 border-success/30' :
                     activeTag === 'Low' ? 'bg-danger/10 border-danger/30' :
                     'bg-bg-base border-border/50 hover:border-border'
                   )}
                 >
                   <span className="font-semibold text-sm">{mKey}</span>
                   <span className={cn(
                     "text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded",
                     activeTag === 'High' ? 'text-success bg-success/20' :
                     activeTag === 'Low' ? 'text-danger bg-danger/20' :
                     'text-text-muted bg-bg-elevated'
                   )}>
                     {activeTag}
                   </span>
                 </button>
               )
             })}
           </div>
        </GlassCard>

        {/* 8. Export Section */}
        <GlassCard className="p-6 flex flex-col items-center justify-center text-center">
           <Download className="w-8 h-8 text-text-muted mb-4" />
           <h3 className="font-semibold text-lg mb-2">Export Forecast Plan</h3>
           <p className="text-text-muted text-sm mb-6">Download your AI generated budget plan for offline use or presentations.</p>
           
           <div className="flex flex-col gap-3 w-full max-w-[200px]">
             <button className="flex items-center justify-center gap-2 w-full py-2.5 px-4 bg-accent-primary hover:bg-accent-light text-white rounded-lg transition-colors font-medium text-sm">
               <FileText className="w-4 h-4" />
               Export as PDF
             </button>
             <button className="flex items-center justify-center gap-2 w-full py-2.5 px-4 bg-success/10 hover:bg-success/20 text-success border border-success/20 rounded-lg transition-colors font-medium text-sm">
               <TableIcon className="w-4 h-4" />
               Export to Excel
             </button>
           </div>
        </GlassCard>
      </div>

    </div>
  );
}
