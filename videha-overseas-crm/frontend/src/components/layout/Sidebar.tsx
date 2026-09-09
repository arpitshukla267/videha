import React from 'react';
import {
  CalendarClock,
  FileText,
  FolderOpen,
  LayoutDashboard,
  Users,
  CheckSquare,
  Package,
  UserCheck,
  BarChart3,
  Settings,
  Compass,
  LogOut,
  IndianRupee,
  Receipt,
  Ship
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export type NavigationTab =
  | 'dashboard'
  | 'leads'
  | 'followups'
  | 'quotations'
  | 'documents'
  | 'tasks'
  | 'orders'
  | 'shipments'
  | 'finance'
  | 'bills'
  | 'team'
  | 'reports'
  | 'settings'
  | 'public-tracking';

interface SidebarProps {
  currentTab: NavigationTab;
  onSelectTab: (tab: NavigationTab) => void;
  unreadCount: number;
}

// Width of the collapsed rail. Reuse this value for the main content's
// left padding/margin in your layout shell so pages sit flush against it
// (e.g. <main className="ml-[72px]"> or style={{ marginLeft: COLLAPSED_WIDTH }}).
export const SIDEBAR_COLLAPSED_WIDTH = 72;

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
    { id: 'followups', label: 'Follow-ups', icon: CalendarClock, permission: 'followups.view' },
    { id: 'quotations', label: 'Quotations', icon: FileText, permission: 'quotations.view' },
    { id: 'documents', label: 'Documents', icon: FolderOpen, permission: 'documents.view' },
    { id: 'tasks', label: 'Tasks', icon: CheckSquare, permission: 'tasks.view' },
    { id: 'orders', label: 'Orders', icon: Package, permission: 'orders.view' },
    { id: 'shipments', label: 'Shipments', icon: Ship, permission: 'shipments.view' },
    { id: 'finance', label: 'Finance', icon: IndianRupee, permission: 'finance.view' },
    { id: 'bills', label: 'Bills', icon: Receipt, permission: 'bills.view' },
    { id: 'team', label: 'Team', icon: UserCheck, permission: 'users.view' },
    { id: 'reports', label: 'Reports', icon: BarChart3, permission: 'reports.view' },
    { id: 'settings', label: 'Settings', icon: Settings, permission: 'settings.manage' }
  ];

  const filteredNav = navItems.filter(item => {
    if (!item.permission) return true;
    return hasPermission(item.permission);
  });

  return (
    <aside
      className="group fixed inset-y-0 left-0 z-40 flex flex-col bg-white border-r border-slate-200
                 w-[72px] hover:w-60 transition-[width] duration-300 ease-out overflow-hidden select-none"
    >
      {/* Brand Header */}
      <div className="h-16 flex items-center border-b border-slate-200/80 shrink-0 overflow-hidden">
        {/* Collapsed mark: fixed square, always visible */}
        <div className="w-[72px] h-20 flex items-center justify-center shrink-0">
          <img src="/logo.png" alt="Videha Overseas" className="w-16 h-16 rounded-lg object-cover" />
        </div>
        {/* Wordmark: revealed on hover */}
        <span
          className="text-sm font-semibold text-slate-800 whitespace-nowrap opacity-0 -translate-x-2
                     group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200 delay-75"
        >
          Videha Overseas
        </span>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 py-4 space-y-1.5 overflow-y-auto overflow-x-hidden">
        {filteredNav.map(item => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              title={item.label}
              className="w-full flex items-center px-[22px] group-hover:px-3 py-2.5 transition-[padding] duration-200"
            >
              <div
                className={`flex items-center justify-center w-7 h-7 rounded-lg shrink-0 transition-colors ${
                  isActive ? 'bg-sky-600' : 'group-hover:hover:bg-slate-100'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-500'}`} />
              </div>
              <span
                className={`ml-3 text-xs whitespace-nowrap overflow-hidden max-w-0 opacity-0
                            group-hover:max-w-[160px] group-hover:opacity-100 transition-all duration-200
                            ${isActive ? 'font-semibold text-sky-800' : 'font-medium text-slate-600'}`}
              >
                {item.label}
              </span>
            </button>
          );
        })}

        {/* Public Portal Divider */}
        <div
          className="h-4 mt-4 mb-2 flex items-center overflow-hidden whitespace-nowrap
                     opacity-0 group-hover:opacity-100 transition-opacity duration-200 delay-100
                     px-3 text-[10px] font-semibold text-slate-400 uppercase tracking-wider"
        >
          External Services
        </div>
        <button
          onClick={() => onSelectTab('public-tracking')}
          title="Public Order Tracking"
          className="w-full flex items-center px-[22px] group-hover:px-3 py-2.5 transition-[padding] duration-200"
        >
          <div
            className={`flex items-center justify-center w-7 h-7 rounded-lg shrink-0 transition-colors ${
              currentTab === 'public-tracking' ? 'bg-teal-600' : 'group-hover:hover:bg-slate-100'
            }`}
          >
            <Compass className={`w-4 h-4 ${currentTab === 'public-tracking' ? 'text-white' : 'text-teal-600'}`} />
          </div>
          <span
            className={`ml-3 text-xs whitespace-nowrap overflow-hidden max-w-0 opacity-0
                        group-hover:max-w-[160px] group-hover:opacity-100 transition-all duration-200
                        ${currentTab === 'public-tracking' ? 'font-semibold text-teal-900' : 'font-medium text-slate-600'}`}
          >
            Public Order Tracking
          </span>
        </button>
      </nav>

      {/* User Footer */}
      <div className="border-t border-slate-200/80 bg-slate-50/50 shrink-0 py-3">
        <div className="flex items-center px-[22px] group-hover:px-3 transition-[padding] duration-200">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-sky-500 to-teal-600 text-white flex items-center justify-center text-xs font-semibold shrink-0">
            {user?.name ? user.name.slice(0, 2).toUpperCase() : 'VO'}
          </div>
          <div className="ml-2.5 min-w-0 flex-1 overflow-hidden max-w-0 opacity-0 group-hover:max-w-[130px] group-hover:opacity-100 transition-all duration-200 whitespace-nowrap">
            <p className="text-xs font-medium text-slate-800 truncate">{user?.name}</p>
            <p className="text-[10px] text-slate-500 truncate font-medium">
              {role?.displayName || user?.roleName}
            </p>
          </div>
          <button
            onClick={logout}
            title="Sign Out"
            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors
                       shrink-0 opacity-0 max-w-0 overflow-hidden group-hover:opacity-100 group-hover:max-w-[32px] transition-all duration-200"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};