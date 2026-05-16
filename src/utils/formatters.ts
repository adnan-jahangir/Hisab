import { format } from 'date-fns';
import { bn, enUS } from 'date-fns/locale';

export const formatCurrency = (amount: number, locale: 'en' | 'bn' = 'en'): string => {
  return new Intl.NumberFormat(locale === 'bn' ? 'bn-BD' : 'en-US', {
    style: 'currency',
    currency: 'BDT',
    minimumFractionDigits: 0,
  }).format(amount);
};

export const formatDate = (dateString: string | Date | undefined | null, locale: 'en' | 'bn' = 'en'): string => {
  if (!dateString) return '-';
  const dateObj = typeof dateString === 'string' ? new Date(dateString) : dateString;
  if (isNaN(dateObj.getTime())) return '-';
  return format(dateObj, 'dd MMM yyyy', {
    locale: locale === 'bn' ? bn : enUS
  });
};

export const formatNumber = (num: number): string => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
  }
  return num.toString();
};

export const calcGrowth = (current: number, previous: number): number => {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Number((((current - previous) / previous) * 100).toFixed(2));
};
