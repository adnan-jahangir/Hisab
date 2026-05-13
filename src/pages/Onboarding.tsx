import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, ChevronRight, Store, Settings as Service, Factory, Coffee, CheckSquare } from 'lucide-react';
import { Button } from '../components/ui/Button';

const steps = [
  { id: 1, title: 'ব্যবসার ধরন' },
  { id: 2, title: 'আনুমানিক আয়' },
  { id: 3, title: 'প্রয়োজনীয় ফিচার' },
];

import { useSettingsStore } from '../store/useSettingsStore';

export default function Onboarding() {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const addBusiness = useSettingsStore(state => state.addBusiness);

  // State
  const [bizType, setBizType] = useState('');
  const [revenue, setRevenue] = useState('');
  const [features, setFeatures] = useState<string[]>([]);
  const [done, setDone] = useState(false);

  const handleNext = async () => {
    if (currentStep < 3) setCurrentStep(s => s + 1);
    else {
      setLoading(true);
      
      // Create actual business in Supabase
      try {
        await addBusiness({
          name: 'My Store', // You can add an input for this later
          type: bizType,
          currency: 'BDT',
          address: 'Default Address'
        });
        
        setLoading(false);
        setDone(true);
        setTimeout(() => navigate('/app'), 2500);
      } catch (error) {
        console.error('Error creating business:', error);
        setLoading(false);
      }
    }
  };

  const handleSkip = () => {
    handleNext();
  };

  if (done) {
    return (
      <div className="min-h-screen bg-bg-base flex items-center justify-center p-6">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center space-y-6"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', delay: 0.2 }}
            className="w-24 h-24 bg-success/20 text-success rounded-full flex items-center justify-center mx-auto mb-6"
          >
            <CheckCircle2 className="w-12 h-12" />
          </motion.div>
          <h1 className="text-4xl font-bold text-white">হিসাবে আপনাকে স্বাগতম! 🎉</h1>
          <p className="text-text-muted text-lg">আপনার ড্যাশবোর্ড প্রস্তুত করা হচ্ছে...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-base flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        
        {/* Progress Bar */}
        <div className="mb-12">
          <div className="flex justify-between mb-4">
            {steps.map(s => (
              <div key={s.id} className={`text-sm font-medium ${currentStep >= s.id ? 'text-accent-primary' : 'text-text-muted'}`}>
                {s.title}
              </div>
            ))}
          </div>
          <div className="h-2 bg-bg-elevated rounded-full overflow-hidden flex">
             <motion.div 
               className="h-full bg-accent-primary" 
               initial={{ width: 0 }}
               animate={{ width: `${(currentStep / 3) * 100}%` }}
               transition={{ duration: 0.3 }}
             />
          </div>
        </div>

        {/* Content */}
        <div className="bg-bg-elevated border border-border p-8 md:p-12 rounded-2xl shadow-2xl relative overflow-hidden min-h-[400px]">
          <AnimatePresence mode="wait">
            
            {/* Step 1 */}
            {currentStep === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                className="space-y-6"
              >
                <h2 className="text-3xl font-bold text-white text-center mb-8">আপনার ব্যবসার ধরন কি?</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { id: 'retail', icon: Store, label: 'Retail' },
                    { id: 'service', icon: Service, label: 'Service' },
                    { id: 'manufacturing', icon: Factory, label: 'Manufacturing' },
                    { id: 'food', icon: Coffee, label: 'Food & Beverage' },
                  ].map(b => (
                    <motion.div
                      key={b.id}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setBizType(b.id)}
                      className={`p-6 rounded-xl border-2 flex flex-col items-center gap-3 cursor-pointer transition-colors ${bizType === b.id ? 'border-accent-primary bg-accent-primary/10' : 'border-border bg-bg-base hover:border-text-muted'}`}
                    >
                      <b.icon className={`w-8 h-8 ${bizType === b.id ? 'text-accent-primary' : 'text-text-muted'}`} />
                      <span className="font-semibold text-white">{b.label}</span>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Step 2 */}
            {currentStep === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                className="space-y-6"
              >
                <h2 className="text-3xl font-bold text-white text-center mb-8">প্রতি মাসে আনুমানিক আয় কত?</h2>
                <div className="flex flex-col gap-4 max-w-md mx-auto">
                  {['< ১০ হাজার', '১০–৫০ হাজার', '৫০ হাজার–১ লাখ', '১ লাখ+'].map(r => (
                    <motion.div
                      key={r}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setRevenue(r)}
                      className={`p-4 rounded-xl border-2 cursor-pointer text-center text-lg font-semibold transition-colors ${revenue === r ? 'border-accent-primary bg-accent-primary/10 text-accent-light' : 'border-border bg-bg-base text-white hover:border-text-muted'}`}
                    >
                      {r}
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Step 3 */}
            {currentStep === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                className="space-y-6"
              >
                <h2 className="text-3xl font-bold text-white text-center mb-8">কোন ফিচারগুলো বেশি দরকার?</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg mx-auto">
                  {['Sales', 'Expenses', 'Inventory', 'Analytics', 'Budget Planning'].map(f => {
                    const isSelected = features.includes(f);
                    return (
                      <motion.div
                        key={f}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                          setFeatures(prev => isSelected ? prev.filter(x => x !== f) : [...prev, f]);
                        }}
                        className={`p-4 rounded-xl border-2 cursor-pointer flex items-center justify-between transition-colors ${isSelected ? 'border-accent-primary bg-accent-primary/10 text-white' : 'border-border bg-bg-base text-text-muted hover:border-text-muted'}`}
                      >
                        <span className="font-semibold">{f}</span>
                        {isSelected && <CheckSquare className="w-5 h-5 text-accent-primary" />}
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-between mt-8 max-w-2xl px-2">
          <Button variant="ghost" onClick={handleSkip} className="text-text-muted hover:text-white">এড়িয়ে যান</Button>
          <Button onClick={handleNext} disabled={currentStep === 1 && !bizType || currentStep === 2 && !revenue || currentStep === 3 && features.length === 0} loading={loading} icon={<ChevronRight className="w-4 h-4"/>} iconPosition="right">
            {currentStep === 3 ? 'সম্পন্ন করুন' : 'পরবর্তী ধাপ'}
          </Button>
        </div>

      </div>
    </div>
  );
}
