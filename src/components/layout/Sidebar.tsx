import React from 'react';
import { NavLink } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, ShoppingCart, Receipt, Package, BarChart3, 
  Target, Bell, Settings, ChevronsUpDown, ChevronLeft, ChevronRight, X, LogOut
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { Tooltip } from '../ui';
import { useLanguageStore } from '../../store/useLanguageStore';
import { useTranslation } from '../../hooks/useTranslation';
import { useAuthStore } from '../../store/useAuthStore';
import { useSettingsStore } from '../../store/useSettingsStore';

interface SidebarProps {
  mobileOpen: boolean;
  onClose: () => void;
  collapsed: boolean;
  setCollapsed: (v: boolean) => void;
}

const mainNavItems = [
  { nameKey: 'dashboard', path: '/app', icon: LayoutDashboard },
  { nameKey: 'sales', path: '/app/sales', icon: ShoppingCart },
  { nameKey: 'expenses', path: '/app/expenses', icon: Receipt },
  { nameKey: 'inventory', path: '/app/inventory', icon: Package },
  { nameKey: 'analytics', path: '/app/analytics', icon: BarChart3 },
  { nameKey: 'budget', path: '/app/budget', icon: Target },
];

const secondaryNavItems = [
  { nameKey: 'notifications', path: '/app/notifications', icon: Bell, badge: 3 },
  { nameKey: 'settings', path: '/app/settings', icon: Settings },
  { nameKey: 'logout', path: '/logout', icon: LogOut, action: 'logout' },
];

export function Sidebar({ mobileOpen, onClose, collapsed, setCollapsed }: SidebarProps) {
  const sidebarWidth = collapsed ? 56 : 240;
  const { t } = useTranslation();
  const { language } = useLanguageStore();
  const role = useAuthStore((state) => state.role);
  const ownerAccount = useAuthStore((state) => state.ownerAccount);
  const user = useSettingsStore((state) => state.user);

  const logout = useAuthStore(state => state.logout);

  const NavLinkList = ({ items }: { items: typeof mainNavItems }) => (
    <ul className="space-y-1 mt-4">
      {items.map((item) => {
        const itemName = t(item.nameKey as any);
        const isLogout = (item as any).action === 'logout';
        
        const linkContent = isLogout ? (
          <button
            onClick={() => logout()}
            className={cn(
              'group flex items-center relative py-2.5 transition-all text-sm font-medium w-full',
              'text-danger border-l-2 border-transparent hover:bg-danger/10',
              collapsed ? 'px-0 justify-center' : 'px-4'
            )}
          >
            <item.icon className={cn('w-5 h-5 min-w-[20px]', !collapsed && 'mr-3')} />
            {!collapsed && <span className="truncate">{itemName}</span>}
          </button>
        ) : (
          <NavLink
            to={item.path}
            end={item.path === '/app'}
            onClick={() => mobileOpen && onClose()}
            className={({ isActive }) => cn(
              'group flex items-center relative py-2.5 transition-all text-sm font-medium',
              isActive
                ? 'bg-accent-primary/15 border-l-2 border-accent-primary text-accent-light'
                : 'text-text-secondary border-l-2 border-transparent hover:bg-bg-elevated hover:text-text-primary',
              collapsed ? 'px-0 justify-center' : 'px-4'
            )}
          >
            {({ isActive }) => (
              <>
                <item.icon className={cn('w-5 h-5 min-w-[20px]', !collapsed && 'mr-3')} />
                {!collapsed && <span className="truncate">{itemName}</span>}
                
                {/* Badge Support */}
                {(item as any).badge && !collapsed && (
                  <span className="ml-auto bg-danger text-white text-[10px] px-2 py-0.5 rounded-full font-bold">
                    {(item as any).badge}
                  </span>
                )}
                {/* Collapsed Badge Dot */}
                {(item as any).badge && collapsed && (
                   <span className="absolute top-2 right-2 w-2 h-2 bg-danger rounded-full" />
                )}
              </>
            )}
          </NavLink>
        );

        return (
          <li key={item.path}>
            {collapsed ? (
              <Tooltip content={itemName} position="right">
                {linkContent}
              </Tooltip>
            ) : (
              linkContent
            )}
          </li>
        );
      })}
    </ul>
  );

  return (
    <>
      {/* Mobile Overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="md:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          />
        )}
      </AnimatePresence>

      {/* Sidebar Container */}
      <motion.aside
        initial={false}
        animate={{ 
          width: sidebarWidth,
          x: mobileOpen ? 0 : (window.innerWidth < 768 ? -240 : 0)
        }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className={cn(
          'fixed md:relative flex flex-col h-full bg-bg-surface border-r border-border z-50 overflow-hidden',
          mobileOpen ? 'w-[240px]' : (collapsed ? 'w-[56px]' : 'w-[240px]')
        )}
      >
        {/* Header / Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-border shrink-0">
          {(!collapsed || mobileOpen) && (
            <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-accent-primary to-accent-light tracking-tight font-sans">
              হিসাব
            </span>
          )}
          {collapsed && !mobileOpen && (
             <span className="mx-auto text-xl font-bold text-accent-primary">হ</span>
          )}
          
          {/* Mobile Close Button */}
          {mobileOpen && (
            <button onClick={onClose} className="md:hidden p-1 text-text-muted hover:text-text-primary">
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Desktop Collapse Toggle */}
        <div className="hidden md:flex justify-end p-2 pb-0">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1.5 rounded-lg text-text-muted hover:bg-bg-elevated hover:text-text-primary transition-colors"
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Navigation Lists */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden no-scrollbar py-2">
          <NavLinkList items={mainNavItems} />
          
          <div className="mt-8 mb-4 px-4">
            {!collapsed && <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">System</h4>}
            {collapsed && <div className="border-t border-border mx-2 mt-4" />}
          </div>
          
          <NavLinkList items={secondaryNavItems} />
        </div>

        {/* Bottom Profile Area */}
        <div className={cn(
          "border-t border-border p-4 flex items-center hover:bg-bg-elevated transition-colors cursor-pointer shrink-0",
          collapsed ? "justify-center" : "justify-between"
        )}>
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-accent-primary to-accent-light flex items-center justify-center text-white shrink-0">
              <span className="text-sm font-semibold">{(user.name || ownerAccount?.fullName || 'U').slice(0, 1).toUpperCase()}</span>
            </div>
            {!collapsed && (
              <div className="flex flex-col truncate">
                <span className="text-sm font-medium text-text-primary truncate">{user.businessName || ownerAccount?.businessName || 'Hisab Demo'}</span>
                <span className="text-xs text-text-muted truncate">{user.email || ownerAccount?.email || 'viewer@demo.local'}</span>
                <span className="text-[10px] uppercase tracking-wider text-text-muted">{role || 'guest'}</span>
              </div>
            )}
          </div>
          {!collapsed && <ChevronsUpDown className="w-4 h-4 text-text-muted shrink-0" />}
        </div>
      </motion.aside>
    </>
  );
}