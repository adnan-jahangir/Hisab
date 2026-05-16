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
  const [loading, setLoading] = React.useState(false);

  const stockSchema = z.object({
    productId: z.string().optional(),
    productName: z.string().optional(),
    category: z.string().optional(),
    quantity: z.number().min(1, t('quantityRequired') || 'Quantity required'),
    buyPrice: z.number().min(0, t('priceRequired') || 'Price required'),
    sellPrice: z.number().optional(),
    notes: z.string().optional(),
  }).refine((data) => isManual ? !!data.productName : !!data.productId, {
    message: t('productRequired') || 'Product required',
    path: [isManual ? 'productName' : 'productId'],
  });

  type StockFormValues = z.infer<typeof stockSchema>;

  const { register, handleSubmit, watch, formState: { errors } } = useForm<StockFormValues>({
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

  const onSubmit = async (data: StockFormValues) => {
    if (loading) return;
    setLoading(true);

    try {
      let finalProductId = data.productId;

      const timeoutPromise = new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Operation timed out. Please check your connection and try again.')), 10000)
      );

      if (isManual && data.productName) {
        const productPromise = addProduct({
          name: data.productName,
          sku: `SKU-${Date.now().toString().slice(-6)}`,
          category: data.category || 'General',
          buy_price: data.buyPrice,
          sell_price: data.sellPrice || data.buyPrice * 1.2,
          current_stock: 0,
          min_stock_level: 5,
        });

        const newProduct = await Promise.race([productPromise, timeoutPromise]);
        
        if (newProduct) {
          finalProductId = newProduct.id;
        }
      }

      if (finalProductId) {
        const stockPromise = addStock(finalProductId, data.quantity, data.buyPrice, data.notes || 'Quick Add Stock');
        await Promise.race([stockPromise, timeoutPromise]);
        
        if (!isManual && data.buyPrice) {
          const updatePromise = updateProduct(finalProductId, { buy_price: data.buyPrice });
          await Promise.race([updatePromise, timeoutPromise]);
        }

        recalculateKpis();
        addToast(t('stockAddedSuccess') || 'Stock added successfully', 'success');
        onSuccess();
      }
    } catch (error: any) {
      console.error('[AddStockForm] Failed to add stock/product:', error);
      addToast(error?.message || 'Failed to add stock. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const productOptions = products.map(p => ({
    label: `${p.name} (${t('quantity') || 'Qty'}: ${p.current_stock})`,
    value: p.id
  }));

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-4">
      <div className="flex items-center justify-between mb-2">
        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
          {isManual ? t('newProductDetails') || 'New Product Details' : t('selectProduct') || 'Select Product'}
        </label>
        <button
          type="button"
          onClick={() => setIsManual(!isManual)}
          className="text-xs text-indigo-600 hover:text-indigo-500 font-medium"
        >
          {isManual ? t('selectExisting') || 'Select Existing' : t('addNewManually') || 'Add New'}
        </button>
      </div>

      {isManual ? (
        <>
          <Input 
            label={t('productName') || 'Product Name'} 
            {...register('productName')} 
            error={errors.productName?.message} 
          />
          <Input 
            label={t('category') || 'Category'} 
            {...register('category')} 
            error={errors.category?.message} 
          />
        </>
      ) : (
        <Select 
          label={t('product') || 'Product'} 
          options={[{ label: t('choose') || 'Choose...', value: '' }, ...productOptions]} 
          {...register('productId')} 
          error={errors.productId?.message} 
        />
      )}
      
      <div className="grid grid-cols-2 gap-4">
        <Input 
          type="number" 
          label={t('quantity') || 'Quantity'} 
          {...register('quantity', { valueAsNumber: true })} 
          error={errors.quantity?.message} 
        />
        <Input 
          type="number" 
          label={t('buyPrice') || 'Buy Price'} 
          {...register('buyPrice', { valueAsNumber: true })} 
          error={errors.buyPrice?.message}
        />
      </div>

      {isManual && (
        <Input 
          type="number" 
          label={t('sellPrice') || 'Sell Price'} 
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
        label={`${t('note') || 'Note'} (${t('optional') || 'Optional'})`}
        {...register('notes')} 
      />

      <div className="flex justify-end pt-4">
        <Button type="submit" loading={loading}>{t('add') || 'Add'}</Button>
      </div>
    </form>
  );
}
