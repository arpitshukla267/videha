import React from 'react';
import {
  CalendarClock,
  Contact,
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
  Ship,
  Truck
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export type NavigationTab =
  | 'dashboard'
  | 'leads'
  | 'customers'
  | 'followups'
  | 'quotations'
  | 'documents'
  | 'tasks'
  | 'orders'
  | 'shipments'
  | 'suppliers'
  | 'finance'
  | 'bills'
  | 'team'
  | 'reports'
  | 'settings'
  | 'quotation-builder'
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

// Same manifest/ledger palette used across Topbar, Orders & Finance.
const INK = '#182430';
const INK_SOFT = '#4B5563';
const INK_FAINT = '#8B8D85';
const LINE = '#E2DED2';
const PAPER = '#F6F4EE';
const MARINE = '#155A52';
const MARINE_TINT = '#EEF4F2';
const TEAL = '#1F7A6C'; // slightly lighter marine, reserved for the external/public portal item
const RUST = '#A6402F';
const RUST_TINT = '#F7ECE9';

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
    { id: 'customers', label: 'Customers', icon: Contact, permission: 'customers.view' },
    { id: 'followups', label: 'Follow-ups', icon: CalendarClock, permission: 'followups.view' },
    { id: 'quotations', label: 'Quotations', icon: FileText, permission: 'quotations.view' },
    { id: 'documents', label: 'Documents', icon: FolderOpen, permission: 'documents.view' },
    { id: 'tasks', label: 'Tasks', icon: CheckSquare, permission: 'tasks.view' },
    { id: 'orders', label: 'Orders', icon: Package, permission: 'orders.view' },
    { id: 'shipments', label: 'Shipments', icon: Ship, permission: 'shipments.view' },
    { id: 'suppliers', label: 'Suppliers', icon: Truck, permission: 'suppliers.view' },
    { id: 'finance', label: 'Finance', icon: IndianRupee, permission: 'finance.view' },
    { id: 'bills', label: 'Bills', icon: Receipt, permission: 'bills.view' },
    { id: 'team', label: 'Team', icon: UserCheck, permission: 'users.view' },
    { id: 'reports', label: 'Reports', icon: BarChart3, permission: 'reports.view' },
    { id: 'settings', label: 'Settings', icon: Settings, permission: 'settings.manage' }
  ];

  const filteredNav = navItems.filter(item => {
    if (item.id === 'customers') {
      return hasPermission('customers.view') || hasPermission('leads.view');
    }
    if (!item.permission) return true;
    return hasPermission(item.permission);
  });

  return (
    <aside
      className="vo-sidebar group fixed inset-y-0 left-0 z-40 flex flex-col bg-white border-r
        w-[72px] hover:w-60 transition-[width] duration-300 ease-out overflow-hidden select-none"
      style={{ borderColor: LINE }}
    >
      {/* Scoped scrollbar: thin + faint while the rail is collapsed, fills in on hover-expand */}
      <style>{`
        .vo-sidebar-nav { scrollbar-width: thin; scrollbar-color: rgba(21,90,82,0.16) transparent; }
        .vo-sidebar-nav::-webkit-scrollbar { width: 3px; }
        .vo-sidebar-nav::-webkit-scrollbar-track { background: transparent; }
        .vo-sidebar-nav::-webkit-scrollbar-thumb { background-color: rgba(21,90,82,0.16); border-radius: 9999px; }
        .vo-sidebar:hover .vo-sidebar-nav { scrollbar-color: rgba(21,90,82,0.38) transparent; }
        .vo-sidebar:hover .vo-sidebar-nav::-webkit-scrollbar { width: 5px; }
        .vo-sidebar:hover .vo-sidebar-nav::-webkit-scrollbar-thumb { background-color: rgba(21,90,82,0.38); }
      `}</style>

      {/* Brand Header */}
      <div className="min-h-16 flex items-center border-b shrink-0 overflow-hidden" style={{ borderColor: LINE }}>
        {/* Collapsed mark: fixed square, always visible */}
        <div className="w-[72px] h-[71px] flex items-center justify-center shrink-0">
          <img src="/logo.png" alt="Videha Overseas" className="w-16 h-16 rounded-lg object-cover" />
        </div>
        {/* Wordmark: revealed on hover */}
        <span
          className="text-sm font-semibold whitespace-nowrap opacity-0 -translate-x-2
            group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200 delay-75"
          style={{ color: INK }}
        >
          Videha Overseas
        </span>
      </div>

      {/* Main Navigation */}
      <nav className="vo-sidebar-nav flex-1 py-4 space-y-1.5 overflow-y-auto overflow-x-hidden">
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
                className="flex items-center justify-center w-7 h-7 rounded-md shrink-0 transition-colors"
                style={isActive ? { backgroundColor: MARINE } : undefined}
                onMouseEnter={e => {
                  if (!isActive) e.currentTarget.style.backgroundColor = MARINE_TINT;
                }}
                onMouseLeave={e => {
                  if (!isActive) e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <Icon className="w-4 h-4" style={{ color: isActive ? '#fff' : INK_SOFT }} />
              </div>
              <span
                className="ml-3 text-xs whitespace-nowrap overflow-hidden max-w-0 opacity-0
                            group-hover:max-w-[160px] group-hover:opacity-100 transition-all duration-200"
                style={{ color: isActive ? MARINE : INK_SOFT, fontWeight: isActive ? 600 : 500 }}
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
                     px-3 text-xs font-medium"
          style={{ color: INK_FAINT }}
        >
          External services
        </div>
        <button
          onClick={() => onSelectTab('public-tracking')}
          title="Public Order Tracking"
          className="w-full flex items-center px-[22px] group-hover:px-3 py-2.5 transition-[padding] duration-200"
        >
          <div
            className="flex items-center justify-center w-7 h-7 rounded-md shrink-0 transition-colors"
            style={currentTab === 'public-tracking' ? { backgroundColor: TEAL } : undefined}
            onMouseEnter={e => {
              if (currentTab !== 'public-tracking') e.currentTarget.style.backgroundColor = MARINE_TINT;
            }}
            onMouseLeave={e => {
              if (currentTab !== 'public-tracking') e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <Compass className="w-4 h-4" style={{ color: currentTab === 'public-tracking' ? '#fff' : TEAL }} />
          </div>
          <span
            className="ml-3 text-xs whitespace-nowrap overflow-hidden max-w-0 opacity-0
                        group-hover:max-w-[160px] group-hover:opacity-100 transition-all duration-200"
            style={{ color: currentTab === 'public-tracking' ? TEAL : INK_SOFT, fontWeight: currentTab === 'public-tracking' ? 600 : 500 }}
          >
            Public Order Tracking
          </span>
        </button>
      </nav>

      {/* User Footer */}
      <div className="border-t shrink-0 py-3" style={{ borderColor: LINE, backgroundColor: PAPER }}>
        <div className="flex items-center px-[22px] group-hover:px-3 transition-[padding] duration-200">
          <div
            className="w-8 h-8 rounded-full text-white flex items-center justify-center text-xs font-semibold shrink-0"
            style={{ backgroundColor: MARINE }}
          >
            {user?.name ? user.name.slice(0, 2).toUpperCase() : 'VO'}
          </div>
          <div className="ml-2.5 min-w-0 flex-1 overflow-hidden max-w-0 opacity-0 group-hover:max-w-[130px] group-hover:opacity-100 transition-all duration-200 whitespace-nowrap">
            <p className="text-xs font-medium truncate" style={{ color: INK }}>{user?.name}</p>
            <p className="text-xs truncate font-medium" style={{ color: INK_FAINT }}>
              {role?.displayName || user?.roleName}
            </p>
          </div>
          <button
            onClick={logout}
            title="Sign Out"
            className="p-1.5 rounded-md transition-colors shrink-0 opacity-0 max-w-0 overflow-hidden
                       group-hover:opacity-100 group-hover:max-w-[32px]"
            style={{ color: INK_FAINT }}
            onMouseEnter={e => {
              e.currentTarget.style.color = RUST;
              e.currentTarget.style.backgroundColor = RUST_TINT;
            }}
            onMouseLeave={e => {
              e.currentTarget.style.color = INK_FAINT;
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};