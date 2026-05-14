import React from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input, Select, Button } from '../ui';
import { useInventoryStore } from '../../store/useInventoryStore';
import { useDashboardStore } from '../../store/useDashboardStore';
import { useToastStore } from '../../store/useToastStore';
import { useTranslation } from '../../hooks/useTranslation';

export function AddStockForm({ onSuccess }: { onSuccess: () => void }) {
  const { t } = useTranslation();
  const { products, addStock, updateProduct, addProduct } = useInventoryStore();
  const recalculateKpis = useDashboardStore(state => state.recalculate);
  const addToast = useToastStore(state => state.addToast);
  const [isManual, setIsManual] = React.useState(false);

  const stockSchema = z.object({
    productId: z.string().optional(),
    productName: z.string().optional(),
    category: z.string().optional(),
    quantity: z.number().min(1, t('quantityRequired')),
    buyPrice: z.number().min(0, t('priceRequired')),
    sellPrice: z.number().optional(),
    notes: z.string().optional(),
  }).refine((data) => isManual ? !!data.productName : !!data.productId, {
    message: t('productRequired'),
    path: [isManual ? 'productName' : 'productId'],
  });

  type StockFormValues = z.infer<typeof stockSchema>;

  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<StockFormValues>({
    resolver: zodResolver(stockSchema),
    defaultValues: {
      productId: '',
      productName: '',
      category: '',
      quantity: 1,
      buyPrice: 0,
      sellPrice: 0,
    }
  });

  const watchQty = watch('quantity');
  const watchBuyPrice = watch('buyPrice');
  const watchSellPrice = watch('sellPrice');
  const watchProductName = watch('productName');

  const onSubmit = async (data: StockFormValues) => {
    let finalProductId = data.productId;

    if (isManual && data.productName) {
      const newProduct = await addProduct({
        name: data.productName,
        sku: `SKU-${Date.now().toString().slice(-6)}`,
        category: data.category || 'General',
        buy_price: data.buyPrice,
        sell_price: data.sellPrice || data.buyPrice * 1.2,
        current_stock: 0,
        min_stock_level: 5,
      });
      if (newProduct) {
        finalProductId = newProduct.id;
      }
    }

    if (finalProductId) {
      await addStock(finalProductId, data.quantity, data.buyPrice, data.notes || 'Quick Add Stock');
      
      if (!isManual && data.buyPrice) {
        await updateProduct(finalProductId, { buy_price: data.buyPrice });
      }

      recalculateKpis();
      addToast(t('stockAddedSuccess'), 'success');
      onSuccess();
    }
  };

  const productOptions = products.map(p => ({
    label: `${p.name} (${t('quantity')}: ${p.current_stock})`,
    value: p.id
  }));

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-4">
      <div className="flex items-center justify-between mb-2">
        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
          {isManual ? t('newProductDetails') : t('selectProduct')}
        </label>
        <button
          type="button"
          onClick={() => setIsManual(!isManual)}
          className="text-xs text-indigo-600 hover:text-indigo-500 font-medium"
        >
          {isManual ? t('selectExisting') : t('addNewManually')}
        </button>
      </div>

      {isManual ? (
        <>
          <Input 
            label={t('productName')} 
            {...register('productName')} 
            error={errors.productName?.message} 
          />
          <Input 
            label={t('category')} 
            {...register('category')} 
            error={errors.category?.message} 
          />
        </>
      ) : (
        <Select 
          label={t('product')} 
          options={[{ label: t('choose'), value: '' }, ...productOptions]} 
          {...register('productId')} 
          error={errors.productId?.message} 
        />
      )}
      
      <div className="grid grid-cols-2 gap-4">
        <Input 
          type="number" 
          label={t('quantity')} 
          {...register('quantity', { valueAsNumber: true })} 
          error={errors.quantity?.message} 
        />
        <Input 
          type="number" 
          label={t('buyPrice')} 
          {...register('buyPrice', { valueAsNumber: true })} 
          error={errors.buyPrice?.message}
        />
      </div>

      {isManual && (
        <Input 
          type="number" 
          label={t('sellPrice')} 
          {...register('sellPrice', { valueAsNumber: true })} 
        />
      )}

      {watchQty > 0 && watchBuyPrice > 0 && (
        <div className="grid grid-cols-2 gap-4 p-3 bg-bg-elevated/50 rounded-xl border border-border/50 mt-4">
          <div className="space-y-1">
            <p className="text-[10px] uppercase tracking-wider font-bold text-text-muted">Total Cost</p>
            <p className="text-xl font-black text-accent-primary">৳{(watchQty * watchBuyPrice).toLocaleString()}</p>
          </div>
          {isManual && watchSellPrice > 0 && (
            <div className="space-y-1 text-right border-l border-border/30 pl-4">
              <p className="text-[10px] uppercase tracking-wider font-bold text-text-muted">Est. Profit/Unit</p>
              <p className="text-xl font-black text-success">৳{(watchSellPrice - watchBuyPrice).toLocaleString()}</p>
            </div>
          )}
        </div>
      )}

      <Input 
        label={`${t('note')} (${t('optional')})`}
        {...register('notes')} 
      />

      <div className="flex justify-end pt-4">
        <Button type="submit" loading={isSubmitting}>{t('add')}</Button>
      </div>
    </form>
  );
}
