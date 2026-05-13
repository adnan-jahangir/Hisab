import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Menu, Search, Sun, Moon, Bell, User, LogOut } from 'lucide-react';
import { Tooltip, Modal, Input } from '../ui';
import { useThemeStore } from '../../store/useThemeStore';
import { useLanguageStore } from '../../store/useLanguageStore';
import { useTranslation } from '../../hooks/useTranslation';
import { useAuthStore } from '../../store/useAuthStore';
import { useSettingsStore } from '../../store/useSettingsStore';

interface TopbarProps {
  onMenuClick: () => void;
}

export function Topbar({ onMenuClick }: TopbarProps) {
  const location = useLocation();
  const { isDark, toggleTheme } = useThemeStore();
  const { language, toggleLanguage } = useLanguageStore();
  const { t } = useTranslation();
  const role = useAuthStore((state) => state.role);
  const logout = useAuthStore((state) => state.logout);
  const user = useSettingsStore((state) => state.user);

  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const getPageTitle = (pathname: string): string => {
    const defaultTitle = t('overview');
    const paths: Record<string, string> = {
      '/app': t('dashboard'),
      '/app/sales': t('sales'),
      '/app/expenses': t('expenses'),
      '/app/inventory': t('inventory'),
      '/app/analytics': t('analytics'),
      '/app/budget': t('budget'),
      '/app/settings': t('settings'),
      '/app/notifications': t('notifications'),
    };
    return paths[pathname] || defaultTitle;
  };

  const title = getPageTitle(location.pathname);

  return (
    <>
      <header className="h-16 shrink-0 bg-bg-surface/80 backdrop-blur border-b border-border flex items-center justify-between px-4 lg:px-8 z-30 sticky top-0 w-full transition-colors duration-200">
        
        {/* Left Side: Hamburger & Title */}
        <div className="flex items-center gap-4">
          <button 
            onClick={onMenuClick}
            className="md:hidden p-2 -ml-2 rounded-lg text-text-secondary hover:bg-bg-elevated hover:text-text-primary focus:outline-none"
          >
            <Menu className="w-5 h-5" />
          </button>
          
          <div className="flex flex-col">
            <h1 className="text-lg font-semibold text-text-primary leading-tight">{title}</h1>
            <nav className="hidden sm:flex text-xs text-text-muted">
              <span>Home</span>
              <span className="mx-1">/</span>
              <span className="text-text-secondary">{title}</span>
            </nav>
          </div>
        </div>

        {/* Right Side: Actions */}
        <div className="flex items-center gap-1.5 sm:gap-3">
          {/* Search Button */}
          <Tooltip content="Command Palette" position="bottom">
            <button 
              onClick={() => setIsSearchOpen(true)}
              className="p-2 rounded-full text-text-secondary hover:bg-bg-elevated hover:text-text-primary transition-colors"
            >
              <Search className="w-5 h-5" />
            </button>
          </Tooltip>

          <div className="w-px h-5 bg-border mx-1 hidden sm:block" />

          {/* Language Toggle */}
          <button
            onClick={toggleLanguage}
            className="px-2.5 py-1 rounded-full border border-border bg-bg-elevated hover:bg-bg-base text-xs font-semibold text-text-secondary transition-colors"
          >
            {language === 'bn' ? 'বাং | en' : 'bn | EN'}
          </button>

          {/* Theme Toggle */}
          <Tooltip content="Toggle Theme" position="bottom">
            <button 
              onClick={toggleTheme}
              className="p-2 rounded-full text-text-secondary hover:bg-bg-elevated hover:text-text-primary transition-colors"
            >
              {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
          </Tooltip>

          {/* Notification */}
          <Tooltip content="Notifications" position="bottom">
            <button className="relative p-2 rounded-full text-text-secondary hover:bg-bg-elevated hover:text-text-primary transition-colors">
              <Bell className="w-5 h-5" />
              {/* Animated Red Dot */}
              <span className="absolute top-2 right-2 w-2 h-2 bg-danger rounded-full border-2 border-bg-surface animate-pulse" />
            </button>
          </Tooltip>

          <div className="w-px h-5 bg-border mx-1 hidden sm:block" />

          <div className="flex items-center gap-2">
            <button className="flex items-center gap-2 px-3 h-8 rounded-full bg-bg-elevated border border-border hover:border-text-muted transition-colors">
              <User className="w-4 h-4 text-text-secondary" />
              <span className="hidden md:inline text-xs font-medium text-text-secondary">{user.businessName}</span>
              <span className="hidden lg:inline text-[10px] uppercase tracking-wider text-text-muted">{role || 'guest'}</span>
            </button>

            <Tooltip content={t('logout')} position="bottom">
              <button 
                onClick={() => logout()}
                className="p-2 rounded-full text-danger hover:bg-danger/10 transition-colors"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </Tooltip>
          </div>
        </div>
      </header>

      {/* Dummy Command Palette Modal */}
      <Modal 
        open={isSearchOpen} 
        onClose={() => setIsSearchOpen(false)} 
        title="Search / Command Palette"
      >
        <Input 
          autoFocus 
          prefix={<Search />} 
          placeholder="Search for transactions, expenses, pages..." 
        />
        <div className="mt-4 text-sm text-text-muted flex justify-center py-8">
          Start typing to see results...
        </div>
      </Modal>
    </>
  );
}