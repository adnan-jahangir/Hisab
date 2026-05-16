import React from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input, Button } from '../ui';
import { useExpenseStore } from '../../store/useExpenseStore';
import { useDashboardStore } from '../../store/useDashboardStore';
import { useToastStore } from '../../store/useToastStore';
import { useTranslation } from '../../hooks/useTranslation';

export function AddExpenseForm({ onSuccess }: { onSuccess: () => void }) {
  const { t } = useTranslation();
  const { addExpense } = useExpenseStore();
  const recalculateKpis = useDashboardStore(state => state.recalculate);
  const addToast = useToastStore(state => state.addToast);
  const [loading, setLoading] = React.useState(false);

  const expenseSchema = z.object({
    category: z.string().min(1, t('categoryRequired') || 'Category is required'),
    amount: z.number().min(1, t('quantityRequired') || 'Amount must be greater than 0'),
    description: z.string().min(1, t('descriptionRequired') || 'Description is required'),
    date: z.string().min(1, t('dateRequired') || 'Date is required'),
  });

  type ExpenseFormValues = z.infer<typeof expenseSchema>;

  const { register, handleSubmit, watch, formState: { errors } } = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      category: '',
      amount: 0,
      description: '',
      date: new Date().toISOString().slice(0, 10),
    }
  });

  const onSubmit = async (data: ExpenseFormValues) => {
    if (loading) return;
    setLoading(true);

    try {
      const expensePromise = addExpense({
        category: data.category,
        amount: data.amount,
        description: data.description,
        date: data.date,
        type: 'one_time'
      });

      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Operation timed out. Please check your connection and try again.')), 10000)
      );

      await Promise.race([expensePromise, timeoutPromise]);

      recalculateKpis();
      addToast(t('expenseAddedSuccess') || 'Expense added successfully', 'success');
      onSuccess();
    } catch (error: any) {
      console.error('[AddExpenseForm] Failed to add expense:', error);
      addToast(error?.message || 'Failed to add expense. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-4">
      <Input 
        label={t('category') || 'Category'} 
        placeholder="E.g. Electricity Bill, Rent, Salary..." 
        {...register('category')} 
        error={errors.category?.message} 
      />
      
      <Input type="number" label={`${t('amount') || 'Amount'} (৳)`} {...register('amount', { valueAsNumber: true })} error={errors.amount?.message} />

      {watch('amount') > 0 && (
        <div className="p-3 bg-danger/10 rounded-xl border border-danger/20 flex justify-between items-center">
          <span className="text-sm font-medium text-danger/80">Total Expense</span>
          <span className="text-xl font-black text-danger">৳{watch('amount')?.toLocaleString()}</span>
        </div>
      )}
      
      <Input label={t('description') || 'Description'} {...register('description')} error={errors.description?.message} />

      <Input type="date" label={t('date') || 'Date'} {...register('date')} error={errors.date?.message} />

      <div className="flex justify-end pt-4">
        <Button type="submit" loading={loading}>{t('add') || 'Add'}</Button>
      </div>
    </form>
  );
}

