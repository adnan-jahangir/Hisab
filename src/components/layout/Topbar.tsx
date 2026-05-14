import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
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
  const navigate = useNavigate();
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
        <div className="flex items-center gap-1 sm:gap-3">
          {/* Search Button - Hidden on very small screens */}
          <div className="hidden xs:block">
            <Tooltip content="Search" position="bottom">
              <button 
                onClick={() => setIsSearchOpen(true)}
                className="p-2 rounded-full text-text-secondary hover:bg-bg-elevated hover:text-text-primary transition-colors"
              >
                <Search className="w-5 h-5" />
              </button>
            </Tooltip>
          </div>

          {/* Language Toggle - Simplified on mobile */}
          <button
            onClick={toggleLanguage}
            className="px-2 py-1 sm:px-2.5 sm:py-1 rounded-full border border-border bg-bg-elevated hover:bg-bg-base text-[10px] sm:text-xs font-bold text-text-secondary transition-colors whitespace-nowrap"
          >
            <span className="xs:hidden uppercase">{language}</span>
            <span className="hidden xs:inline">{language === 'bn' ? 'বাং | en' : 'bn | EN'}</span>
          </button>

          {/* Theme Toggle - Hidden on small screens */}
          <div className="hidden sm:block">
            <Tooltip content="Toggle Theme" position="bottom">
              <button 
                onClick={toggleTheme}
                className="p-2 rounded-full text-text-secondary hover:bg-bg-elevated hover:text-text-primary transition-colors"
              >
                {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
            </Tooltip>
          </div>

          {/* Notification */}
          <Tooltip content="Notifications" position="bottom">
            <button 
              onClick={() => navigate('/app/notifications')}
              className="relative p-2 rounded-full text-text-secondary hover:bg-bg-elevated hover:text-text-primary transition-colors"
            >
              <Bell className="w-5 h-5" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-danger rounded-full border-2 border-bg-surface animate-pulse" />
            </button>
          </Tooltip>

          <div className="w-px h-5 bg-border mx-0.5 sm:mx-1" />

          <div className="flex items-center gap-1 sm:gap-2">
            <Tooltip content="Profile" position="bottom">
              <button 
                onClick={() => navigate('/app/settings')}
                className="flex items-center justify-center w-9 h-9 rounded-full bg-bg-elevated border border-border hover:border-accent-primary transition-colors"
              >
                <User className="w-5 h-5 text-text-secondary" />
              </button>
            </Tooltip>

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