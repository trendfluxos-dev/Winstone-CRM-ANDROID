import React from 'react';
import { LayoutDashboard, Users, CalendarClock, BarChart3, User } from 'lucide-react';
import { NavTab } from '../types';

interface BottomNavBarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  pendingFollowUpsCount: number;
  newLeadsCount: number;
}

export const BottomNavBar: React.FC<BottomNavBarProps> = ({
  currentTab,
  onSelectTab,
  pendingFollowUpsCount,
  newLeadsCount,
}) => {
  const navItems: { id: NavTab; label: string; icon: React.ComponentType<{ className?: string }>; badge?: number }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'leads', label: 'Leads', icon: Users, badge: newLeadsCount > 0 ? newLeadsCount : undefined },
    { id: 'followups', label: 'Follow-ups', icon: CalendarClock, badge: pendingFollowUpsCount > 0 ? pendingFollowUpsCount : undefined },
    { id: 'performance', label: 'Performance', icon: BarChart3 },
    { id: 'profile', label: 'Profile', icon: User },
  ];

  return (
    <nav
      id="winstone-bottom-nav"
      className="bg-white border-t border-neutral-200/90 shadow-[0_-2px_10px_rgba(0,0,0,0.03)] px-2 py-1.5 flex items-center justify-around z-30 select-none shrink-0"
    >
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = currentTab === item.id;
        return (
          <button
            key={item.id}
            id={`nav-item-${item.id}`}
            onClick={() => onSelectTab(item.id)}
            className="flex-1 flex flex-col items-center justify-center py-1 px-1 relative transition-colors group focus:outline-none"
          >
            <div
              className={`relative px-3 py-1 rounded-full transition-all duration-150 ${
                isActive
                  ? 'bg-[#0D6E44]/12 text-[#0D6E44] font-semibold'
                  : 'text-neutral-500 hover:text-neutral-800'
              }`}
            >
              <Icon className={`w-5 h-5 transition-transform ${isActive ? 'scale-105' : 'group-hover:scale-105'}`} />
              {item.badge !== undefined && item.badge > 0 && (
                <span className="absolute -top-1 -right-1.5 min-w-[17px] h-[17px] bg-[#0D6E44] text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 border-2 border-white">
                  {item.badge}
                </span>
              )}
            </div>
            <span
              className={`text-[11px] mt-0.5 tracking-tight whitespace-nowrap transition-colors ${
                isActive ? 'text-[#0D6E44] font-bold' : 'text-neutral-500 font-medium'
              }`}
            >
              {item.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
};
