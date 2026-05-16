import React, { useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { BottomNav } from './BottomNav';
import { useSupabaseRealtime } from '../../hooks/useSupabaseRealtime';
import { useInventoryStore } from '../../store/useInventoryStore';
import { useSalesStore } from '../../store/useSalesStore';
import { useExpenseStore } from '../../store/useExpenseStore';
import { useSettingsStore } from '../../store/useSettingsStore';
import { useAuthStore } from '../../store/useAuthStore';

export function AppLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  const fetchProducts = useInventoryStore(state => state.fetchProducts);
  const fetchSales = useSalesStore(state => state.fetchSales);
  const fetchExpenses = useExpenseStore(state => state.fetchExpenses);
  const fetchBusinesses = useSettingsStore(state => state.fetchBusinesses);
  const fetchProfile = useSettingsStore(state => state.fetchProfile);

  // Initialize Realtime listeners
  useSupabaseRealtime();

  const role = useAuthStore(state => state.role);

  const activeBusiness = useSettingsStore(state => state.activeBusiness);
  const businesses = useSettingsStore(state => state.businesses);
  const navigate = useNavigate();

  // Initial Fetch: Profile and Businesses first
  React.useEffect(() => {
    if (role !== 'viewer' && role !== null) {
      fetchBusinesses().then(() => {
        // Only navigate to onboarding if we are CERTAIN there are no businesses
        const currentBusinesses = useSettingsStore.getState().businesses;
        if (currentBusinesses.length === 0 && location.pathname === '/app') {
          // Small delay to allow store state to settle
          setTimeout(() => {
            if (useSettingsStore.getState().businesses.length === 0) {
              navigate('/onboarding');
            }
          }, 1000);
        }
      });
      fetchProfile();
    }
  }, [fetchBusinesses, fetchProfile, role, navigate, location.pathname]);

  // Secondary Fetch: Data dependent on activeBusiness
  React.useEffect(() => {
    if (role !== 'viewer' && activeBusiness) {
      fetchProducts();
      fetchSales();
      fetchExpenses();
    }
  }, [activeBusiness, fetchProducts, fetchSales, fetchExpenses, role]);

  return (
    <div className="flex h-screen w-full bg-bg-base overflow-hidden text-text-primary selection:bg-accent-primary/30">
      {/* Sidebar (Left) */}
      <Sidebar 
        mobileOpen={mobileOpen} 
        onClose={() => setMobileOpen(false)} 
        collapsed={collapsed}
        setCollapsed={setCollapsed}
      />

      {/* Main Content Area (Right) */}
      <div className="flex flex-col flex-1 min-w-0 relative">
        <Topbar onMenuClick={() => setMobileOpen(true)} />
        
        {/* Scrollable Main body */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden relative bg-hero-glow">
          {/* Subdued radial gradient for background visual pop */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-accent-primary/10 blur-[100px] rounded-full pointer-events-none" />
          
          <div className="p-4 lg:p-8 max-w-7xl mx-auto min-h-full pb-20 md:pb-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
              >
                <Outlet />
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <BottomNav />
    </div>
  );
}