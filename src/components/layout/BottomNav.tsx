import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, ShoppingCart, Receipt, Package, BarChart3 
} from 'lucide-react';
import { cn } from '../../utils/cn';

const bottomNavItems = [
  { name: 'Dashboard', path: '/app', icon: LayoutDashboard },
  { name: 'Sales', path: '/app/sales', icon: ShoppingCart },
  { name: 'Expenses', path: '/app/expenses', icon: Receipt },
  { name: 'Inventory', path: '/app/inventory', icon: Package },
  { name: 'Analytics', path: '/app/analytics', icon: BarChart3 },
];

export function BottomNav() {
  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-bg-surface/90 backdrop-blur-md border-t border-border z-40 px-2 pb-safe flex items-center justify-around">
      {bottomNavItems.map((item) => (
        <NavLink
          key={item.path}
          to={item.path}
          end={item.path === '/app'}
          className={({ isActive }) =>
            cn(
              'flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors',
              isActive
                ? 'text-accent-primary'
                : 'text-text-muted hover:text-text-primary hover:bg-bg-elevated rounded-lg'
            )
          }
        >
          {({ isActive }) => (
            <>
              <item.icon
                className={cn('w-5 h-5 transition-transform duration-200', isActive && 'scale-110')}
              />
              <span className="text-[10px] font-medium">{item.name}</span>
            </>
          )}
        </NavLink>
      ))}
    </div>
  );
}