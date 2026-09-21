import React, { useState, useEffect, useRef } from 'react';
import {
  Bell,
  CheckCheck,
  User as UserIcon,
  Shield,
  LogOut,
  ChevronDown
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Notification } from '../../types/crm';
import { api } from '../../api/client';
import { NavigationTab } from './Sidebar';
import { parseNotificationLink } from '../../lib/notifications';

interface TopbarProps {
  currentTab: NavigationTab;
  onNavigate: (tab: NavigationTab, entityId?: string) => void;
  onOpenProfile: () => void;
}

// Keep this equal to the sidebar header's rendered height so the two
// chrome pieces line up pixel-for-pixel. If the sidebar's logo box
// (currently `h-18`) ever changes, update this value too.
export const TOPBAR_HEIGHT = 72;

// Same manifest/ledger palette used across Orders & Finance — marine, not
// blue, is the one accent color this CRM uses.
const INK = '#182430';
const INK_SOFT = '#4B5563';
const INK_FAINT = '#8B8D85';
const LINE = '#E2DED2';
const MARINE = '#155A52';
const MARINE_TINT = '#EEF4F2';
const RUST = '#A6402F';

// Short reference code shown next to the page heading — read like a form
// or manifest section code rather than a decorative color bar.
const tabCodes: Record<NavigationTab, string> = {
  dashboard: 'OPS',
  leads: 'LDS',
  customers: 'CUS',
  followups: 'F/U',
  quotations: 'QUO',
  documents: 'DOC',
  tasks: 'TSK',
  orders: 'ORD',
  shipments: 'SHP',
  suppliers: 'SUP',
  finance: 'FIN',
  bills: 'BIL',
  team: 'TM',
  reports: 'RPT',
  settings: 'SET',
  'quotation-builder': 'Q/P',
  'public-tracking': 'PUB'
};

export const Topbar: React.FC<TopbarProps> = ({ currentTab, onNavigate, onOpenProfile }) => {
  const { user, role, logout } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);

  const fetchNotifs = async () => {
    try {
      const res = await api.notifications.getNotifications();
      if (res.success) {
        setNotifications(res.data);
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetchNotifs();
    const interval = setInterval(fetchNotifs, 15000);
    const onRefresh = () => fetchNotifs();
    window.addEventListener('crm:notifications-refresh', onRefresh);
    return () => {
      clearInterval(interval);
      window.removeEventListener('crm:notifications-refresh', onRefresh);
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifMenu(false);
      }
      if (userRef.current && !userRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadNotifications = notifications.filter(n => !n.isRead);

  const handleMarkAllRead = async () => {
    try {
      await api.notifications.markAllRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch {
      // ignore
    }
  };

  const handleNotificationClick = async (notif: Notification) => {
    if (!notif.isRead) {
      try {
        await api.notifications.markRead(notif.id);
        setNotifications(prev =>
          prev.map(n => (n.id === notif.id ? { ...n, isRead: true } : n))
        );
      } catch {
        // ignore
      }
    }
    setShowNotifMenu(false);

    const target = parseNotificationLink(notif.linkUrl);
    if (!target) return;
    onNavigate(target.tab, target.entityId || undefined);
  };

  const tabTitles: Record<NavigationTab, { title: string; subtitle: string }> = {
    dashboard: {
      title: 'Operations Dashboard',
      subtitle: 'Overview of leads, task fulfillment, and international shipments'
    },
    leads: {
      title: 'Lead Management',
      subtitle: 'Track global inquiries, trade buyers, and follow-up schedules'
    },
    customers: {
      title: 'Customer Directory',
      subtitle: 'Manage verified business accounts, primary buyer contacts, and converted clients'
    },
    followups: {
      title: 'Follow-ups',
      subtitle: 'Today, upcoming, and overdue scheduled lead touchpoints'
    },
    quotations: {
      title: 'Quotations',
      subtitle: 'Draft, send, and track sales quotes through to orders'
    },
    documents: {
      title: 'Documents',
      subtitle: 'Upload and manage CRM files linked to leads, orders, and accounts'
    },
    tasks: {
      title: 'Task Management',
      subtitle: 'Monitor pending, in-progress, and overdue operational actions'
    },
    orders: {
      title: 'Order & Shipment Fulfillment',
      subtitle: 'Manage overseas purchase orders, logistics stages, and delivery tracking'
    },
    shipments: {
      title: 'Export Shipments',
      subtitle: 'Operational shipment records linked to orders, ports, and carriers'
    },
    suppliers: {
      title: 'Supplier Management',
      subtitle: 'Internal supplier directory with contacts, payment terms, and currencies'
    },
    finance: {
      title: 'Finance Overview',
      subtitle: 'Revenue collected, due payments, and receivables from delivered orders'
    },
    bills: {
      title: 'Bills & Invoices',
      subtitle: 'Edit commercial invoices and download PDF documents for delivered orders'
    },
    team: {
      title: 'Team & Member Directory',
      subtitle: 'Workload distribution, member roles, and departmental permissions'
    },
    reports: {
      title: 'Operational Reports',
      subtitle: 'Conversion statistics, regional order metrics, and member performance'
    },
    settings: {
      title: 'CRM Settings & Access Control',
      subtitle: 'Manage system roles, permission policies, and security audit logs'
    },
    'quotation-builder': {
      title: 'Quotation Builder',
      subtitle: 'Design the export quotation document and download a print-ready PDF'
    },
    'public-tracking': {
      title: 'Public Consignment Tracking',
      subtitle: 'Customer portal view for real-time shipment status verification'
    }
  };

  const currentInfo = tabTitles[currentTab] || { title: 'CRM Portal', subtitle: '' };
  const currentCode = tabCodes[currentTab] || '—';
  const initials = user?.name ? user.name.slice(0, 2).toUpperCase() : 'VO';

  return (
    <header
      style={{ height: TOPBAR_HEIGHT, borderColor: LINE }}
      className="flex items-center justify-between gap-4 px-6 bg-white/95 backdrop-blur-xs
        border-b sticky top-0 z-20 shrink-0"
    >
      {/* Page title, presented as a manifest reference code + heading */}
      <div className="min-w-0 flex items-center gap-3">
        {/* <div
          className="hidden sm:flex flex-col items-center justify-center w-10 h-10 rounded-md border shrink-0"
          style={{ borderColor: LINE }}
        >
          <span className="font-mono text-[10px] font-semibold" style={{ color: MARINE }}>
            {currentCode}
          </span>
        </div> */}
        <div className="min-w-0">
          <h2 className="text-base font-semibold tracking-tight leading-snug truncate" style={{ color: INK }}>
            {currentInfo.title}
          </h2>
          <p className="text-xs mt-0.5 leading-snug truncate" style={{ color: INK_SOFT }}>
            {currentInfo.subtitle}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setShowNotifMenu(!showNotifMenu)}
            className="relative p-2.5 rounded-md transition-colors focus:outline-none"
            style={{ color: INK_SOFT }}
            onMouseEnter={e => {
              e.currentTarget.style.color = MARINE;
              e.currentTarget.style.backgroundColor = MARINE_TINT;
            }}
            onMouseLeave={e => {
              e.currentTarget.style.color = INK_SOFT;
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
            title="Notifications"
          >
            <Bell className="w-[18px] h-[18px]" />
            {unreadNotifications.length > 0 && (
              <span
                className="absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full ring-2 ring-white"
                style={{ backgroundColor: MARINE }}
              />
            )}
          </button>

          {showNotifMenu && (
            <div
              className="absolute right-0 mt-2 w-[22rem] bg-white rounded-lg shadow-lg border py-2 z-50 animate-in fade-in zoom-in-95 duration-100"
              style={{ borderColor: LINE }}
            >
              <div
                className="px-4 py-3 border-b flex items-center justify-between rounded-t-lg"
                style={{ borderColor: LINE, backgroundColor: MARINE_TINT }}
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold" style={{ color: INK }}>Notifications</span>
                  {unreadNotifications.length > 0 && (
                    <span
                      className="text-xs font-semibold px-2 py-0.5 rounded-full border bg-white"
                      style={{ color: MARINE, borderColor: LINE }}
                    >
                      {unreadNotifications.length} new
                    </span>
                  )}
                </div>
                {unreadNotifications.length > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="text-xs font-medium flex items-center gap-1 transition-colors"
                    style={{ color: INK_SOFT }}
                  >
                    <CheckCheck className="w-3.5 h-3.5" /> Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-96 overflow-y-auto divide-y" style={{ borderColor: LINE }}>
                {notifications.length === 0 ? (
                  <div className="py-10 text-center">
                    <Bell className="w-6 h-6 mx-auto mb-2" style={{ color: LINE }} />
                    <p className="text-sm" style={{ color: INK_FAINT }}>No notifications right now</p>
                  </div>
                ) : (
                  notifications.slice(0, 12).map(n => (
                    <div
                      key={n.id}
                      onClick={() => handleNotificationClick(n)}
                      className="p-3.5 text-left cursor-pointer transition-colors hover:bg-[#F6F4EE]"
                      style={!n.isRead ? { backgroundColor: MARINE_TINT } : undefined}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-semibold leading-snug" style={{ color: INK }}>{n.title}</p>
                        {!n.isRead && (
                          <span className="w-2 h-2 rounded-full shrink-0 mt-1.5" style={{ backgroundColor: MARINE }} />
                        )}
                      </div>
                      <p className="text-xs mt-1 leading-relaxed" style={{ color: INK_SOFT }}>
                        {n.message}
                      </p>
                      <span className="text-xs mt-1.5 block" style={{ color: INK_FAINT }}>
                        {new Date(n.createdAt).toLocaleString([], {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="w-px h-8" style={{ backgroundColor: LINE }} />

        {/* User menu */}
        <div className="relative" ref={userRef}>
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2.5 pl-2 pr-3 py-1.5 rounded-md border transition-colors text-left focus:outline-none"
            style={{ borderColor: LINE }}
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = MARINE_TINT)}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
          >
            <div
              className="w-8 h-8 rounded-full text-white flex items-center justify-center text-xs font-semibold shrink-0"
              style={{ backgroundColor: MARINE }}
            >
              {initials}
            </div>
            <div className="hidden sm:block min-w-0">
              <p className="text-sm font-semibold max-w-[130px] truncate leading-tight" style={{ color: INK }}>
                {user?.name}
              </p>
              <p className="text-xs truncate leading-tight" style={{ color: INK_FAINT }}>
                {role?.displayName || user?.roleName}
              </p>
            </div>
            <ChevronDown className="w-3.5 h-3.5 shrink-0" style={{ color: INK_FAINT }} />
          </button>

          {showUserMenu && (
            <div
              className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100"
              style={{ borderColor: LINE }}
            >
              <div className="px-4 py-3 border-b rounded-t-lg" style={{ borderColor: LINE, backgroundColor: MARINE_TINT }}>
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-9 h-9 rounded-full text-white flex items-center justify-center text-xs font-semibold shrink-0"
                    style={{ backgroundColor: MARINE }}
                  >
                    {initials}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate" style={{ color: INK }}>{user?.name}</p>
                    <p className="text-xs truncate" style={{ color: INK_FAINT }}>{user?.email}</p>
                  </div>
                </div>
                <div
                  className="mt-2.5 inline-flex items-center gap-1.5 text-xs font-semibold bg-white px-2.5 py-1 rounded-md border"
                  style={{ borderColor: LINE, color: INK }}
                >
                  <Shield className="w-3.5 h-3.5" style={{ color: MARINE }} />
                  {role?.displayName || user?.roleName}
                </div>
              </div>

              <div className="py-1.5">
                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    onOpenProfile();
                  }}
                  className="w-full px-4 py-2.5 text-sm flex items-center gap-2.5 text-left transition-colors hover:bg-[#F6F4EE]"
                  style={{ color: INK }}
                >
                  <UserIcon className="w-4 h-4" style={{ color: INK_FAINT }} />
                  <span>Profile & Security</span>
                </button>
              </div>

              <div className="border-t pt-1.5" style={{ borderColor: LINE }}>
                <button
                  onClick={logout}
                  className="w-full px-4 py-2.5 text-sm flex items-center gap-2.5 text-left font-semibold transition-colors hover:bg-[#F7ECE9]"
                  style={{ color: RUST }}
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};