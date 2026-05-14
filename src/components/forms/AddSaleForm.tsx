import React from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input, Select, Button } from '../ui';
import { useInventoryStore } from '../../store/useInventoryStore';
import { useSalesStore } from '../../store/useSalesStore';
import { useDashboardStore } from '../../store/useDashboardStore';
import { useToastStore } from '../../store/useToastStore';
import { useNotificationStore } from '../../store/useNotificationStore';
import { useTranslation } from '../../hooks/useTranslation';

export function AddSaleForm({ onSuccess }: { onSuccess: () => void }) {
  const { t } = useTranslation();
  const { products, deductStock } = useInventoryStore();
  const { addSale } = useSalesStore();
  const recalculateKpis = useDashboardStore(state => state.recalculate);
  const addToast = useToastStore(state => state.addToast);
  const addNotification = useNotificationStore(state => state.addNotification);

  const saleSchema = z.object({
    productId: z.string().min(1, t('selectProduct')),
    quantity: z.number().min(1, t('quantityRequired')),
    sellPrice: z.number().min(1, t('priceRequired')),
    customerName: z.string().optional(),
    customerPhone: z.string().optional(),
    paymentMethod: z.enum(["cash", "bkash", "nagad", "card"]),
    date: z.string().min(1, t('dateRequired')),
    notes: z.string().optional(),
  });

  type SaleFormValues = z.infer<typeof saleSchema>;

  const { register, handleSubmit, formState: { errors, isSubmitting }, watch, setValue, setError } = useForm<SaleFormValues>({
    resolver: zodResolver(saleSchema),
    defaultValues: {
      productId: '',
      quantity: 1,
      sellPrice: 0,
      paymentMethod: 'cash',
      date: new Date().toISOString().slice(0, 10),
    }
  });

  const watchProductId = watch('productId');
  const watchQty = watch('quantity');
  const watchSellPrice = watch('sellPrice');

  React.useEffect(() => {
    if (watchProductId) {
      const product = products.find(p => p.id === watchProductId);
      if (product) {
        setValue('sellPrice', product.sell_price);
      }
    }
  }, [watchProductId, products, setValue]);

  const onSubmit = async (data: SaleFormValues) => {
    const product = products.find(p => p.id === data.productId);
    if (!product) return;

    if (data.quantity > product.current_stock) {
      setError('quantity', { message: t('insufficientStock') });
      return;
    }

    const totalAmount = data.quantity * data.sellPrice;
    const profit = (data.sellPrice - product.buy_price) * data.quantity;

    try {
      const result = await addSale({
        product_id: data.productId,
        product_name: product.name,
        quantity: data.quantity,
        sell_price: data.sellPrice,
        total_amount: totalAmount,
        profit,
        customer_name: data.customerName,
        customer_phone: data.customerPhone,
        payment_method: data.paymentMethod,
        date: data.date,
        notes: data.notes,
        status: 'Completed'
      });

      if (!result) throw new Error('Failed to add sale');

      await deductStock(data.productId, data.quantity, 'Sale added');
      
      // Check for low stock notification
      const currentStockAfterSale = product.current_stock - data.quantity;
      if (currentStockAfterSale <= product.min_stock_level) {
        addNotification({
          type: currentStockAfterSale === 0 ? 'stock_out' : 'stock_low',
          title: currentStockAfterSale === 0 ? 'Stock Out' : 'Low Stock',
          body: `${product.name} is ${currentStockAfterSale === 0 ? 'out of stock' : 'running low'}.`,
          priority: currentStockAfterSale === 0 ? 'high' : 'medium'
        });
      }

      recalculateKpis();
      addToast(t('saleAddedSuccess'), 'success');
      onSuccess();
    } catch (err) {
      addToast('Error processing sale. Please check stock and try again.', 'error');
    }
  };

  const productOptions = products.map(p => ({
    label: `${p.name} (${t('quantity')}: ${p.current_stock})`,
    value: p.id
  }));

  const paymentOptions = [
    { label: t('cash'), value: 'cash' },
    { label: t('bkash'), value: 'bkash' },
    { label: t('nagad'), value: 'nagad' },
    { label: t('card'), value: 'card' },
  ];

  const totalAmount = watchQty * watchSellPrice;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-4">
      <Select label={t('product')} options={[{ label: t('choose'), value: '' }, ...productOptions]} {...register('productId')} error={errors.productId?.message} />
      
      <div className="grid grid-cols-2 gap-4">
        <Input type="number" label={t('quantity')} {...register('quantity', { valueAsNumber: true })} error={errors.quantity?.message} />
        <Input type="number" label={t('sellPrice')} {...register('sellPrice', { valueAsNumber: true })} error={errors.sellPrice?.message} />
      </div>

      <div className="grid grid-cols-2 gap-4 p-3 bg-bg-elevated/50 rounded-xl border border-border/50">
        <div className="space-y-1">
          <p className="text-[10px] uppercase tracking-wider font-bold text-text-muted">{t('total')}</p>
          <p className="text-xl font-black text-accent-primary">৳{totalAmount.toLocaleString()}</p>
        </div>
        <div className="space-y-1 text-right border-l border-border/30 pl-4">
          <p className="text-[10px] uppercase tracking-wider font-bold text-text-muted">Estimated Profit</p>
          <p className="text-xl font-black text-success">৳{((watchSellPrice - (products.find(p => p.id === watchProductId)?.buy_price || 0)) * watchQty).toLocaleString()}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Input label={`${t('customerName')} (${t('optional')})`} {...register('customerName')} />
        <Input label={`${t('customerPhone')} (${t('optional')})`} {...register('customerPhone')} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Select label={t('paymentMethod')} options={paymentOptions} {...register('paymentMethod')} error={errors.paymentMethod?.message} />
        <Input type="date" label={t('date')} {...register('date')} error={errors.date?.message} />
      </div>

      <Input label={`${t('note')} (${t('optional')})`} {...register('notes')} />

      <div className="flex justify-end pt-4">
        <Button type="submit" loading={isSubmitting}>{t('add')}</Button>
      </div>
    </form>
  );
}
