import { create } from 'zustand';
import { useSalesStore } from './useSalesStore';
import { useExpenseStore } from './useExpenseStore';

interface DashboardStore {
  kpis: {
    totalRevenue: number;
    totalExpense: number;
    cashBalance: number;
    netProfit: number;
    profitLoss: 'profit' | 'loss' | 'break_even';
    monthlyGrowth: number;
    healthScore: number;
  };
  recalculate: () => void;
}

export const useDashboardStore = create<DashboardStore>((set) => ({
  kpis: {
    totalRevenue: 0,
    totalExpense: 0,
    cashBalance: 0,
    netProfit: 0,
    profitLoss: 'break_even',
    monthlyGrowth: 0,
    healthScore: 0,
  },
  
  recalculate: () => {
    const salesStore = useSalesStore.getState();
    const expenseStore = useExpenseStore.getState();
    
    // Time boundaries
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfPrevMonth = new Date(now.getFullYear(), now.getMonth(), 0);
    
    // Revenue calculations
    const currentRevenue = salesStore.getTotalRevenue(startOfMonth);
    const prevRevenue = salesStore.getTotalRevenue(startOfPrevMonth, endOfPrevMonth);
    
    // Expense calculations
    const totalExpense = expenseStore.getTotalExpenses(startOfMonth);
    
    // Profit calculations
    const netProfit = currentRevenue - totalExpense;
    
    // Growth calculation
    let growth = 0;
    if (prevRevenue > 0) {
      growth = ((currentRevenue - prevRevenue) / prevRevenue) * 100;
    } else if (currentRevenue > 0) {
      growth = 100;
    }
    
    // Health score calculation
    let health = 50; // base score
    if (netProfit > 0) health += 20;
    if (growth > 0) health += 20;
    if (totalExpense < currentRevenue * 0.7) health += 10;
    health = Math.max(0, Math.min(health, 100)); // Clamp between 0-100
    
    set({
      kpis: {
        totalRevenue: currentRevenue,
        totalExpense: totalExpense,
        cashBalance: currentRevenue - totalExpense,
        netProfit: netProfit,
        profitLoss: netProfit > 0 ? 'profit' : netProfit < 0 ? 'loss' : 'break_even',
        monthlyGrowth: growth,
        healthScore: health
      }
    });
  }
}));
