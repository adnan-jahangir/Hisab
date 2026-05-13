export type SeasonalityTag = 'High' | 'Normal' | 'Low';

export interface CategoryData {
  category: string;
  monthlyData: number[]; // e.g. [month-3, month-2, month-1] -> oldest to newest
}

export interface PredictionResult {
  categoryId: string;
  categoryName: string;
  predictedValue: number;
  confidence: 'Low' | 'Medium' | 'High';
  lowerBound: number;
  upperBound: number;
}

export interface BudgetForecastInput {
  revenueHistory: number[]; // Last 3 months revenue
  expenseHistory: CategoryData[]; // Last 3 months expenses per category
  horizon: number; // 1, 3, 6, or 12 months
  seasonality: SeasonalityTag[]; // length must match horizon (or we just use a flat factor)
}

export interface BudgetForecastOutput {
  predictedRevenue: number;
  predictedExpenses: number;
  expectedProfit: number;
  confidenceScore: 'Low' | 'Medium' | 'High';
  categoryPredictions: PredictionResult[];
}

function calculateTrend(data: number[]): { slope: number; variance: number } {
  if (data.length < 2) return { slope: 0, variance: 0 };
  
  // Linear regression slope
  const n = data.length;
  let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
  
  for (let i = 0; i < n; i++) {
    sumX += i;
    sumY += data[i];
    sumXY += i * data[i];
    sumXX += i * i;
  }
  
  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  
  // Calculate variance for confidence
  const mean = sumY / n;
  let variance = 0;
  for (let i = 0; i < n; i++) {
    variance += Math.pow(data[i] - mean, 2);
  }
  variance = variance / n;
  
  return { slope, variance };
}

function getConfidence(variance: number, mean: number): 'Low' | 'Medium' | 'High' {
  if (mean === 0) return 'High';
  const cv = Math.sqrt(variance) / mean; // Coefficient of variation
  if (cv < 0.1) return 'High';
  if (cv < 0.3) return 'Medium';
  return 'Low';
}

function getSeasonalityMultiplier(tag: SeasonalityTag): number {
  switch (tag) {
    case 'High': return 1.25;
    case 'Low': return 0.8;
    case 'Normal':
    default: return 1.0;
  }
}

export function generateForecast(input: BudgetForecastInput): BudgetForecastOutput {
  const { revenueHistory, expenseHistory, horizon, seasonality } = input;

  // Revenue Prediction
  const revTrend = calculateTrend(revenueHistory);
  const revMean = revenueHistory.reduce((a, b) => a + b, 0) / revenueHistory.length;
  
  // Average seasonality for the horizon
  const avgSeasonality = seasonality.slice(0, horizon).reduce((sum, tag) => sum + getSeasonalityMultiplier(tag), 0) / horizon || 1;
  
  // Predict total for the horizon, then average per month 
  // Slope is per month. Next month is n, n+1...
  let totalRevPredicted = 0;
  for (let i = 0; i < horizon; i++) {
    const monthPredicted = revMean + revTrend.slope * (revenueHistory.length + i);
    totalRevPredicted += Math.max(0, monthPredicted * getSeasonalityMultiplier(seasonality[i] || 'Normal'));
  }
  const predictedMonthlyRevenue = totalRevPredicted / horizon;
  
  const overallConfidenceList: ('Low'|'Medium'|'High')[] = [];
  overallConfidenceList.push(getConfidence(revTrend.variance, revMean));

  // Category Predictions
  let totalExpPredicted = 0;
  const categoryPredictions: PredictionResult[] = [];

  for (const cat of expenseHistory) {
    const trend = calculateTrend(cat.monthlyData);
    const mean = cat.monthlyData.reduce((a, b) => a + b, 0) / cat.monthlyData.length;
    const conf = getConfidence(trend.variance, mean);
    overallConfidenceList.push(conf);

    let catTotalPredicted = 0;
    for (let i = 0; i < horizon; i++) {
      const monthPredicted = mean + trend.slope * (cat.monthlyData.length + i);
      catTotalPredicted += Math.max(0, monthPredicted * getSeasonalityMultiplier(seasonality[i] || 'Normal'));
    }
    const catMonthlyPredicted = catTotalPredicted / horizon;
    totalExpPredicted += catMonthlyPredicted;

    // Bounds based on variance
    const stdDev = Math.sqrt(trend.variance);
    const margin = conf === 'High' ? stdDev * 0.5 : conf === 'Medium' ? stdDev : stdDev * 1.5;

    categoryPredictions.push({
      categoryId: cat.category.toLowerCase().replace(/\s+/g, '_'),
      categoryName: cat.category,
      predictedValue: Math.round(catMonthlyPredicted),
      confidence: conf,
      lowerBound: Math.max(0, Math.round(catMonthlyPredicted - margin)),
      upperBound: Math.round(catMonthlyPredicted + margin)
    });
  }

  // Aggregate confidence
  const lowCount = overallConfidenceList.filter(c => c === 'Low').length;
  const highCount = overallConfidenceList.filter(c => c === 'High').length;
  
  let overallConfidence: 'Low' | 'Medium' | 'High' = 'Medium';
  if (lowCount > overallConfidenceList.length / 3) overallConfidence = 'Low';
  else if (highCount > overallConfidenceList.length / 2) overallConfidence = 'High';

  return {
    predictedRevenue: Math.round(predictedMonthlyRevenue * horizon),
    predictedExpenses: Math.round(totalExpPredicted * horizon),
    expectedProfit: Math.round((predictedMonthlyRevenue - totalExpPredicted) * horizon),
    confidenceScore: overallConfidence,
    categoryPredictions
  };
}