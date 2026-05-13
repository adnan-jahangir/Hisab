import React from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input, Select, Button } from '../ui';
import { useExpenseStore } from '../../store/useExpenseStore';
import { useDashboardStore } from '../../store/useDashboardStore';
import { useToastStore } from '../../store/useToastStore';
import { useTranslation } from '../../hooks/useTranslation';

const EXPENSE_CATEGORIES = [
  'Utilities', 'Rent', 'Salaries', 'Marketing', 'Supplies', 'Others'
];

export function AddExpenseForm({ onSuccess }: { onSuccess: () => void }) {
  const { t } = useTranslation();
  const { addExpense } = useExpenseStore();
  const recalculateKpis = useDashboardStore(state => state.recalculate);
  const addToast = useToastStore(state => state.addToast);
  const [isManualCategory, setIsManualCategory] = React.useState(false);

  const expenseSchema = z.object({
    category: z.string().optional(),
    manualCategory: z.string().optional(),
    amount: z.number().min(1, t('quantityRequired')),
    description: z.string().min(1, t('descriptionRequired')),
    date: z.string().min(1, t('dateRequired')),
  }).refine((data) => isManualCategory ? !!data.manualCategory : !!data.category, {
    message: t('categoryRequired'),
    path: [isManualCategory ? 'manualCategory' : 'category'],
  });

  type ExpenseFormValues = z.infer<typeof expenseSchema>;

  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      category: '',
      manualCategory: '',
      amount: 0,
      description: '',
      date: new Date().toISOString().slice(0, 10),
    }
  });

  const onSubmit = async (data: ExpenseFormValues) => {
    await addExpense({
      category: isManualCategory ? data.manualCategory! : data.category!,
      amount: data.amount,
      description: data.description,
      date: data.date,
      type: 'one_time'
    });

    recalculateKpis();
    addToast(t('expenseAddedSuccess'), 'success');
    onSuccess();
  };

  const categoryOptions = EXPENSE_CATEGORIES.map(c => ({ label: c, value: c }));

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-4">
      <div className="flex items-center justify-between mb-1">
        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
          {t('category')}
        </label>
        <button
          type="button"
          onClick={() => setIsManualCategory(!isManualCategory)}
          className="text-xs text-indigo-600 hover:text-indigo-500 font-medium"
        >
          {isManualCategory ? t('selectFromList') : t('addCategoryManually')}
        </button>
      </div>

      {isManualCategory ? (
        <Input 
          placeholder={t('enterCategoryName')} 
          {...register('manualCategory')} 
          error={errors.manualCategory?.message} 
        />
      ) : (
        <Select 
          options={[{ label: t('choose'), value: '' }, ...categoryOptions]} 
          {...register('category')} 
          error={errors.category?.message} 
        />
      )}
      
      <Input type="number" label={`${t('amount')} (৳)`} {...register('amount', { valueAsNumber: true })} error={errors.amount?.message} />
      
      <Input label={t('description')} {...register('description')} error={errors.description?.message} />

      <Input type="date" label={t('date')} {...register('date')} error={errors.date?.message} />

      <div className="flex justify-end pt-4">
        <Button type="submit" loading={isSubmitting}>{t('add')}</Button>
      </div>
    </form>
  );
}
