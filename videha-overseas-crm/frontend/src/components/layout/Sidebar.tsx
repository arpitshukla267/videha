import React from 'react';
import {
  LayoutDashboard,
  Users,
  CheckSquare,
  Package,
  UserCheck,
  BarChart3,
  Settings,
  Compass,
  LogOut,
  Building2,
  ExternalLink
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export type NavigationTab =
  | 'dashboard'
  | 'leads'
  | 'tasks'
  | 'orders'
  | 'team'
  | 'reports'
  | 'settings'
  | 'public-tracking';

interface SidebarProps {
  currentTab: NavigationTab;
  onSelectTab: (tab: NavigationTab) => void;
  unreadCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, onSelectTab, unreadCount }) => {
  const { user, role, logout, hasPermission } = useAuth();

  const navItems: Array<{
    id: NavigationTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    permission?: string;
  }> = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, permission: 'dashboard.view' },
    { id: 'leads', label: 'Leads', icon: Users, permission: 'leads.view' },
    { id: 'tasks', label: 'Tasks', icon: CheckSquare, permission: 'tasks.view' },
    { id: 'orders', label: 'Orders', icon: Package, permission: 'orders.view' },
    { id: 'team', label: 'Team', icon: UserCheck, permission: 'users.view' },
    { id: 'reports', label: 'Reports', icon: BarChart3, permission: 'reports.view' },
    { id: 'settings', label: 'Settings', icon: Settings, permission: 'settings.manage' }
  ];

  const filteredNav = navItems.filter(item => {
    if (!item.permission) return true;
    return hasPermission(item.permission);
  });

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col shrink-0 h-screen sticky top-0 z-30 select-none">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-200/80 flex items-center gap-3 bg-white">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-600 to-teal-600 text-white flex items-center justify-center font-bold text-base shadow-xs shrink-0">
          VO
        </div>
        <div className="min-w-0">
          <h1 className="text-xs font-bold text-slate-800 tracking-wider leading-none uppercase">
            VIDEHA OVERSEAS
          </h1>
          <p className="text-[10px] text-slate-500 font-medium tracking-tight mt-1 truncate">
            Export CRM & Operations Portal
          </p>
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
        <div className="px-3 pb-2 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
          Main Navigation
        </div>
        {filteredNav.map(item => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                isActive
                  ? 'bg-sky-50 text-sky-800 font-semibold border-l-3 border-sky-600 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-800 hover:bg-slate-100/70'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={`w-4 h-4 ${
                    isActive ? 'text-sky-600' : 'text-slate-400'
                  }`}
                />
                <span>{item.label}</span>
              </div>
            </button>
          );
        })}

        {/* Public Portal Divider */}
        <div className="pt-5 pb-2 px-3 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
          External Services
        </div>
        <button
          onClick={() => onSelectTab('public-tracking')}
          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
            currentTab === 'public-tracking'
              ? 'bg-teal-50 text-teal-900 border border-teal-200 font-semibold shadow-2xs'
              : 'text-slate-600 hover:text-slate-800 hover:bg-slate-100/70'
          }`}
        >
          <div className="flex items-center gap-3">
            <Compass className="w-4 h-4 text-teal-600" />
            <span>Public Order Tracking</span>
          </div>
          <span className="text-[10px] bg-teal-100 text-teal-800 font-medium px-2 py-0.5 rounded border border-teal-200/60">
            Public
          </span>
        </button>
      </nav>

      {/* User Footer */}
      <div className="p-3 border-t border-slate-200/80 bg-slate-50/50">
        <div className="flex items-center justify-between p-2.5 rounded-lg bg-white border border-slate-200 shadow-2xs">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-sky-500 to-teal-600 text-white flex items-center justify-center text-xs font-semibold shrink-0">
              {user?.name ? user.name.slice(0, 2).toUpperCase() : 'VO'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-slate-800 truncate">{user?.name}</p>
              <p className="text-[10px] text-slate-500 truncate font-medium">
                {role?.displayName || user?.roleName}
              </p>
            </div>
          </div>
          <button
            onClick={logout}
            title="Sign Out"
            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
