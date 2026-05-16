import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { User, Bell, Shield, Camera, AlertTriangle } from 'lucide-react';

import { GlassCard } from '../components/ui/GlassCard';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Modal } from '../components/ui/Modal';
import { Toast } from '../components/ui/Toast';
import { useLanguageStore } from '../store/useLanguageStore';
import { useTranslation } from '../hooks/useTranslation';
import { useSettingsStore } from '../store/useSettingsStore';
import { useAuthStore } from '../store/useAuthStore';
import { useSalesStore } from '../store/useSalesStore';
import { useExpenseStore } from '../store/useExpenseStore';
import { useInventoryStore } from '../store/useInventoryStore';

// Helper functions to create schemas with translations
function getProfileSchema(t: (key: string) => string) {
  return z.object({
    fullName: z.string().min(2, t('fullName')),
    phone: z.string().min(11, t('phoneNumber')),
    location: z.string().min(3, t('address')),
  });
}

function getBusinessSchema(t: (key: string) => string) {
  return z.object({
    businessName: z.string().min(2, t('businessName')),
    businessType: z.string().min(1, t('businessType')),
    address: z.string().min(3, t('detailedAddress')),
    contactEmail: z.string().email(t('email')),
    contactPhone: z.string().min(11, t('phoneNumber')),
    currency: z.string().min(1, t('currency')),
  });
}

type ProfileForm = z.infer<ReturnType<typeof getProfileSchema>>;
type BusinessForm = z.infer<ReturnType<typeof getBusinessSchema>>;

// --- Mocks ---
const mockBusinessList = [
  { id: '1', name: 'Alim Store', type: 'retail', active: true, createdAt: '2023-01-10' },
  { id: '2', name: 'Alim Electronics', type: 'electronics', active: false, createdAt: '2023-06-15' },
];

export default function Settings() {
  const [activeTab, setActiveTab] = useState('profile');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const { t } = useTranslation();

  const tabs = [
    { id: 'profile', label: t('profile'), icon: User },
    { id: 'notifications', label: t('notifications'), icon: Bell },
    { id: 'privacy', label: t('privacy'), icon: Shield },
  ];

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
  };

  return (
    <div className="flex flex-col md:flex-row gap-6 p-4 md:p-8 max-w-7xl mx-auto min-h-[calc(100vh-80px)]">
      
      {/* Left Sidebar Nav */}
      <GlassCard className="md:w-72 flex-shrink-0 p-4 space-y-2 h-fit">
        <h2 className="text-xl font-bold text-text-primary mb-6 px-2">{t('settings')}</h2>
        
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 text-sm font-medium
                ${isActive 
                  ? 'bg-accent-primary/10 text-accent-primary border border-accent-primary/20' 
                  : 'text-text-muted hover:bg-bg-elevated hover:text-text-primary border border-transparent'
                }`}
            >
              <tab.icon className={`w-5 h-5 ${isActive ? 'text-accent-primary' : 'text-text-muted'}`} />
              {tab.label}
            </button>
          );
        })}
      </GlassCard>

      {/* Right Content Area */}
      <div className="flex-1 min-w-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.2 }}
            className="h-full"
          >
            {activeTab === 'profile' && <ProfileTab showToast={showToast} />}
            {activeTab === 'notifications' && <NotificationsTab showToast={showToast} />}
            {activeTab === 'privacy' && <PrivacyTab showToast={showToast} />}
          </motion.div>
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      </AnimatePresence>
    </div>
  );
}

// ==========================================
// 1. Profile Tab
// ==========================================
function ProfileTab({ showToast }: { showToast: (msg: string, type?: 'success' | 'error') => void }) {
  const { language, setLanguage } = useLanguageStore();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const user = useSettingsStore(state => state.user);
  const updateUser = useSettingsStore(state => state.updateUser);
  const ownerAccount = useAuthStore(state => state.ownerAccount);

  const profileSchema = getProfileSchema(t);
  const { register, handleSubmit, formState: { errors } } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    values: { 
      fullName: user.name || '', 
      phone: user.phone || '', 
      location: user.location || '' 
    }
  });

  const onSubmit = async (data: ProfileForm) => {
    setLoading(true);
    try {
      await updateUser({
        name: data.fullName,
        phone: data.phone,
        location: data.location
      });
      showToast(t('profileUpdated'), 'success');
    } catch (error) {
      showToast('Failed to update profile', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <GlassCard className="p-6">
      <h3 className="text-xl font-semibold mb-6 pb-4 border-b border-border/50">{t('yourProfile')}</h3>
      


      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input label={t('fullName')} {...register('fullName')} error={errors.fullName?.message} />
          <Input label={t('email')} value={user.email || ownerAccount?.email || ''} disabled hint={t('emailCannotChange')} />
          <Input label={t('phoneNumber')} {...register('phone')} error={errors.phone?.message} />
          <Input label={t('address')} {...register('location')} error={errors.location?.message} />
        </div>

        <div className="pt-4">
          <label className="block text-sm font-medium text-text-primary mb-3">{t('language')}</label>
          <div className="flex bg-bg-elevated p-1 rounded-lg w-fit border border-border">
            <button
              type="button"
              onClick={() => setLanguage('bn')}
              className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${language === 'bn' ? 'bg-accent-primary text-white shadow-md' : 'text-text-muted hover:text-text-primary'}`}
            >
              {t('bangla')}
            </button>
            <button
              type="button"
              onClick={() => setLanguage('en')}
              className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${language === 'en' ? 'bg-accent-primary text-white shadow-md' : 'text-text-muted hover:text-text-primary'}`}
            >
              {t('english')}
            </button>
          </div>
        </div>

        <div className="flex justify-end pt-6 border-t border-border/50">
          <Button type="submit" loading={loading}>{t('saveChanges')}</Button>
        </div>
      </form>
    </GlassCard>
  );
}

// ==========================================
// 2. Notifications Tab
// ==========================================
function NotificationsTab({ showToast }: { showToast: (msg: string) => void }) {
  const { t } = useTranslation();
  const notifs = [
    { id: 'master', titleKey: 'emailNotifications', descKey: 'getEmailsForImportantAlerts', active: true },
    { id: 'stock_low', titleKey: 'lowStockAlert', descKey: 'alertWhenProductStockIsLow', active: true },
    { id: 'stock_out', titleKey: 'outOfStockAlert', descKey: 'quickAlertWhenProductIsOut', active: true },
    { id: 'expense_warning', titleKey: 'budgetAlert', descKey: 'warnWhenBudgetExceeds', active: false },
    { id: 'payment_due', titleKey: 'paymentDue', descKey: 'notificationsForUpcomingPayments', active: true },
  ];

  return (
    <GlassCard className="p-6 space-y-6">
      <div className="pb-4 border-b border-border/50">
        <h3 className="text-xl font-semibold text-text-primary">{t('notificationSettings')}</h3>
        <p className="text-sm text-text-muted mt-2">{t('notificationSettingsSaved')}</p>
      </div>

      <div className="space-y-3">
        {notifs.map((n) => (
          <div key={n.id} className="flex items-center justify-between gap-4 rounded-xl border border-border/60 bg-bg-elevated/70 p-4">
            <div className="min-w-0">
              <p className="font-semibold text-text-primary">{t(n.titleKey as any)}</p>
              <p className="text-sm text-text-muted mt-1">{t(n.descKey as any)}</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input type="checkbox" defaultChecked={n.active} className="sr-only peer" />
              <div className="w-11 h-6 bg-bg-card border border-border peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent-primary"></div>
            </label>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
        <Input label={t('globalLowStockThreshold')} type="number" defaultValue={5} />
      </div>

      <div className="pt-2 flex justify-end">
        <Button onClick={() => showToast(t('notificationSettingsSaved'))}>{t('save')}</Button>
      </div>
    </GlassCard>
  );
}

// ==========================================
// 5. Data & Privacy Tab
// ==========================================
function PrivacyTab({ showToast }: { showToast: (msg: string) => void }) {
  const { t } = useTranslation();
  const [showClearModal, setShowClearModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [confirmText, setConfirmText] = useState('');

  const { sales, fetchSales } = useSalesStore();
  const { expenses, fetchExpenses } = useExpenseStore();
  const { products, fetchProducts } = useInventoryStore();
  const activeBusiness = useSettingsStore(state => state.activeBusiness);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleExportData = () => {
    showToast(t('dataDownloadStarted') || 'Data download started...');
    
    import('xlsx').then((XLSX) => {
      const wb = XLSX.utils.book_new();

      const formatDt = (d?: string) => {
        if (!d) return 'N/A';
        try { return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) } catch { return d }
      };

      // Sales Sheet
      const salesData = sales.map(s => ({
        ID: s.id,
        Date: formatDt(s.date || s.created_at),
        Customer: s.customer_name || 'N/A',
        Phone: s.customer_phone || 'N/A',
        Product: s.product_name,
        Quantity: s.quantity,
        'Unit Price': s.sell_price,
        'Total Amount': s.total_amount,
        Profit: s.profit,
        Status: s.status,
        'Payment Method': s.payment_method
      }));
      const wsSales = XLSX.utils.json_to_sheet(salesData);
      wsSales['!cols'] = [{wch: 36}, {wch: 15}, {wch: 20}, {wch: 15}, {wch: 25}, {wch: 10}, {wch: 12}, {wch: 15}, {wch: 12}, {wch: 12}, {wch: 15}];
      XLSX.utils.book_append_sheet(wb, wsSales, "Sales");

      // Expenses Sheet
      const expData = expenses.map(e => ({
        ID: e.id,
        Date: formatDt(e.date || e.created_at),
        Category: e.category,
        Amount: e.amount,
        Description: e.description || 'N/A',
        Type: e.type || 'one_time'
      }));
      const wsExp = XLSX.utils.json_to_sheet(expData);
      wsExp['!cols'] = [{wch: 36}, {wch: 15}, {wch: 20}, {wch: 15}, {wch: 30}, {wch: 15}];
      XLSX.utils.book_append_sheet(wb, wsExp, "Expenses");

      // Inventory Sheet
      const invData = products.map(p => ({
        ID: p.id,
        Name: p.name,
        SKU: p.sku || 'N/A',
        Category: p.category,
        'Current Stock': p.current_stock,
        'Min Stock': p.min_stock_level,
        'Buy Price': p.buy_price,
        'Sell Price': p.sell_price,
        Supplier: p.supplier_name || 'N/A'
      }));
      const wsInv = XLSX.utils.json_to_sheet(invData);
      wsInv['!cols'] = [{wch: 36}, {wch: 25}, {wch: 15}, {wch: 20}, {wch: 15}, {wch: 12}, {wch: 12}, {wch: 12}, {wch: 20}];
      XLSX.utils.book_append_sheet(wb, wsInv, "Inventory");

      // Write and download
      XLSX.writeFile(wb, `amr_hisab_backup_${new Date().toISOString().split('T')[0]}.xlsx`);
    }).catch(err => {
      console.error(err);
      showToast('Error exporting to Excel', 'error');
    });
  };

  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!activeBusiness) {
      showToast('No active business selected.', 'error');
      return;
    }

    import('xlsx').then(async (XLSX) => {
      const reader = new FileReader();
      reader.onload = async (evt) => {
        try {
          showToast('Import started. Please wait...', 'success');
          const bstr = evt.target?.result;
          const wb = XLSX.read(bstr, { type: 'binary' });

          const { supabase } = await import('../lib/supabase');

          let importedCount = 0;

          // 1. Import Inventory
          if (wb.SheetNames.includes('Inventory')) {
            const ws = wb.Sheets['Inventory'];
            const data: any[] = XLSX.utils.sheet_to_json(ws);
            if (data.length > 0) {
              const payloads = data.map(p => ({
                business_id: activeBusiness,
                name: p['Name'] || 'Imported Product',
                sku: p['SKU'] !== 'N/A' ? p['SKU'] : `SKU-${Date.now()}-${Math.floor(Math.random()*100)}`,
                category: p['Category'] || 'General',
                buy_price: parseFloat(p['Buy Price']) || 0,
                sell_price: parseFloat(p['Sell Price']) || 0,
                current_stock: parseInt(p['Current Stock']) || 0,
                min_stock_level: parseInt(p['Min Stock']) || 5,
                supplier_name: p['Supplier'] !== 'N/A' ? p['Supplier'] : null
              }));
              await supabase.from('products').insert(payloads);
              importedCount += data.length;
            }
          }

          // Fetch products again so we can match IDs for Sales
          await fetchProducts();
          const latestProducts = useInventoryStore.getState().products;

          // 2. Import Sales
          if (wb.SheetNames.includes('Sales')) {
            const ws = wb.Sheets['Sales'];
            const data: any[] = XLSX.utils.sheet_to_json(ws);
            if (data.length > 0) {
              const payloads = data.map(s => {
                const prodName = s['Product'] || 'Unknown';
                const foundProd = latestProducts.find(p => p.name === prodName);
                // Fallback UUID if product not found, this avoids FK errors if the column allows null or if we just want to bypass. 
                // Wait, if it requires a real ID, we must create it. We already imported products above, so hopefully it matches.
                return {
                  business_id: activeBusiness,
                  product_id: foundProd?.id || latestProducts[0]?.id || null, // At least give one valid product ID if possible
                  quantity: parseInt(s['Quantity']) || 1,
                  sell_price: parseFloat(s['Unit Price']) || 0,
                  total_amount: parseFloat(s['Total Amount']) || 0,
                  profit: parseFloat(s['Profit']) || 0,
                  customer_name: s['Customer'] !== 'N/A' ? s['Customer'] : null,
                  payment_method: (s['Payment Method'] || 'cash').toLowerCase(),
                  status: s['Status'] || 'Completed',
                  created_at: s['Date'] !== 'N/A' && s['Date'] ? new Date(s['Date']).toISOString() : new Date().toISOString()
                };
              });
              // Filter out null product_id to avoid FK constraint errors if it is strictly enforced
              const validPayloads = payloads.filter(p => p.product_id !== null);
              if (validPayloads.length > 0) {
                await supabase.from('sales').insert(validPayloads);
                importedCount += validPayloads.length;
              }
            }
          }

          // 3. Import Expenses
          if (wb.SheetNames.includes('Expenses')) {
            const ws = wb.Sheets['Expenses'];
            const data: any[] = XLSX.utils.sheet_to_json(ws);
            if (data.length > 0) {
              const payloads = data.map(e => ({
                business_id: activeBusiness,
                category: e['Category'] || 'Other',
                amount: parseFloat(e['Amount']) || 0,
                description: e['Description'] !== 'N/A' ? e['Description'] : null,
                type: e['Type'] || 'one_time',
                created_at: e['Date'] !== 'N/A' && e['Date'] ? new Date(e['Date']).toISOString() : new Date().toISOString()
              }));
              await supabase.from('expenses').insert(payloads);
              importedCount += data.length;
            }
          }

          if (importedCount > 0) {
            await Promise.all([fetchSales(), fetchExpenses()]);
            showToast(`Successfully imported ${importedCount} records!`, 'success');
          } else {
            showToast('No recognizable data found in the Excel file.', 'error');
          }

        } catch (err) {
          console.error(err);
          showToast('Failed to parse and import data.', 'error');
        } finally {
          if (fileInputRef.current) fileInputRef.current.value = '';
        }
      };
      reader.readAsBinaryString(file);
    }).catch(err => {
      console.error('xlsx load error', err);
      showToast('Error loading Excel parser', 'error');
    });
  };

  return (
    <div className="space-y-6">
      <input type="file" accept=".xlsx, .xls" className="hidden" ref={fileInputRef} onChange={handleImportData} />
      
      <GlassCard className="p-6">
        <h3 className="text-xl font-semibold mb-6 pb-4 border-b border-border/50">{t('dataManagement')}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-5 border border-border rounded-xl bg-bg-elevated space-y-3">
            <h4 className="font-semibold">{t('exportData')}</h4>
            <p className="text-sm text-text-muted">{t('downloadAllYourData')}</p>
            <Button variant="secondary" onClick={handleExportData}>{t('downloadBackup')}</Button>
          </div>
          <div className="p-5 border border-border rounded-xl bg-bg-elevated space-y-3">
            <h4 className="font-semibold">{t('importData')}</h4>
            <p className="text-sm text-text-muted">{t('uploadPreviousBackup')}</p>
            <Button variant="secondary" onClick={() => fileInputRef.current?.click()}>{t('uploadFile')}</Button>
          </div>
        </div>
      </GlassCard>

      <GlassCard className="p-6 border-danger/30 bg-danger/5">
        <h3 className="text-xl font-semibold text-danger mb-4 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5"/> {t('dangerZone')}
        </h3>
        <p className="text-sm text-text-muted mb-6">{t('actionsInThisSectionCannotBeUndone')}</p>
        
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 py-4 border-t border-danger/20">
            <div>
               <h4 className="font-semibold text-text-primary">{t('clearAllTransactions')}</h4>
               <p className="text-sm text-text-muted mt-1">{t('deleteAllYourSalesExpensesRecords')}</p>
            </div>
            <Button variant="danger" onClick={() => setShowClearModal(true)}>{t('clearTransactions')}</Button>
          </div>

          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 py-4 border-t border-danger/20">
            <div>
               <h4 className="font-semibold text-text-primary">{t('deleteAccount')}</h4>
               <p className="text-sm text-text-muted mt-1">{t('permanentlyDeleteYourProfileAndData')}</p>
            </div>
            <Button variant="danger" onClick={() => setShowDeleteModal(true)}>{t('deleteAccount')}</Button>
          </div>
        </div>
      </GlassCard>

      {/* Confirmation Modals */}
      <Modal open={showClearModal} onClose={() => setShowClearModal(false)} title={t('areYouSure')}>
        <div className="p-4 space-y-4">
          <p className="text-text-muted">{t('thisWillDeleteAllTransactionHistory')}</p>
          <div className="flex gap-4 justify-end mt-6">
            <Button variant="ghost" onClick={() => setShowClearModal(false)}>{t('cancel')}</Button>
            <Button variant="danger" onClick={() => { setShowClearModal(false); showToast(t('allTransactionsCleared'), 'error'); }}>{t('yesDelete')}</Button>
          </div>
        </div>
      </Modal>

      <Modal open={showDeleteModal} onClose={() => setShowDeleteModal(false)} title={t('deleteAccount')}>
        <div className="p-4 space-y-4">
          <div className="bg-danger/10 border border-danger/20 text-danger p-3 rounded-lg text-sm mb-4 flex gap-3">
             <AlertTriangle className="w-5 h-5 shrink-0" />
             <p>{t('deletingYourAccountWillPermanentlyLoseAllData')}</p>
          </div>
          <Input 
            label={t('typeToConfirm')} 
            value={confirmText} 
            onChange={(e) => setConfirmText(e.target.value)} 
          />
          <div className="flex gap-4 justify-end mt-6">
            <Button variant="ghost" onClick={() => setShowDeleteModal(false)}>{t('cancel')}</Button>
            <Button variant="danger" disabled={confirmText !== 'Alim Store'} onClick={() => { setShowDeleteModal(false); showToast(t('accountDeletionInProgress'), 'error'); }}>{t('deleteAccount')}</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
