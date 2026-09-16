import React from 'react';
import { LayoutDashboard, Users, Clock, BarChart2, UserCheck } from 'lucide-react';
import { NavigationTab } from '../types';

interface BottomNavBarProps {
  currentTab: NavigationTab;
  onSelectTab: (tab: NavigationTab) => void;
  unreadCount?: number;
  dueFollowUpsCount?: number;
}

export const BottomNavBar: React.FC<BottomNavBarProps> = ({
  currentTab,
  onSelectTab,
  unreadCount = 0,
  dueFollowUpsCount = 0,
}) => {
  const navItems = [
    {
      id: 'dashboard' as NavigationTab,
      label: 'Dashboard',
      icon: LayoutDashboard,
      badge: unreadCount > 0 ? unreadCount : undefined,
    },
    {
      id: 'leads' as NavigationTab,
      label: 'Leads',
      icon: Users,
    },
    {
      id: 'followups' as NavigationTab,
      label: 'Follow-ups',
      icon: Clock,
      badge: dueFollowUpsCount > 0 ? dueFollowUpsCount : undefined,
    },
    {
      id: 'performance' as NavigationTab,
      label: 'Performance',
      icon: BarChart2,
    },
    {
      id: 'profile' as NavigationTab,
      label: 'Profile',
      icon: UserCheck,
    },
  ];

  return (
    <nav
      id="winstone-bottom-nav"
      className="bg-white border-t border-[#E5E7EB] px-2 py-1.5 flex items-center justify-around z-20 shrink-0 sticky bottom-0 shadow-[0_-2px_10px_rgba(0,0,0,0.03)]"
    >
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = currentTab === item.id;

        return (
          <button
            key={item.id}
            id={`bottom-nav-${item.id}`}
            onClick={() => onSelectTab(item.id)}
            className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all relative cursor-pointer min-w-[58px] ${
              isActive
                ? 'text-[#8C6B24] font-bold bg-[#FAF6EE]'
                : 'text-[#64748B] hover:text-[#1E293B] hover:bg-[#F8F9FA]'
            }`}
          >
            <div className="relative">
              <Icon
                className={`w-5 h-5 transition-transform ${
                  isActive ? 'scale-110 text-[#B8934A]' : 'text-[#64748B]'
                }`}
              />
              {item.badge !== undefined && item.badge > 0 && (
                <span className="absolute -top-1 -right-2 bg-[#B8934A] text-white text-[9px] font-extrabold w-4 h-4 rounded-full flex items-center justify-center shadow-xs">
                  {item.badge > 99 ? '99+' : item.badge}
                </span>
              )}
            </div>
            <span className="text-[10px] tracking-tight mt-1 truncate">
              {item.label}
            </span>
            {isActive && (
              <span className="w-1 h-1 rounded-full bg-[#B8934A] mt-0.5" />
            )}
          </button>
        );
      })}
    </nav>
  );
};
