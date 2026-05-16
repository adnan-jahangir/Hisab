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

  const { sales } = useSalesStore();
  const { expenses } = useExpenseStore();
  const { products } = useInventoryStore();

  const handleExportData = () => {
    showToast(t('dataDownloadStarted') || 'Data download started...');
    const dataToExport = {
      sales,
      expenses,
      products
    };
    const dataStr = JSON.stringify(dataToExport, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `hisab_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
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
            <Button variant="secondary" disabled>{t('uploadFile')}</Button>
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
