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
    tasks: {
      title: 'Task Management',
      subtitle: 'Monitor pending, in-progress, and overdue operational actions'
    },
    orders: {
      title: 'Order & Shipment Fulfillment',
      subtitle: 'Manage overseas purchase orders, logistics stages, and delivery tracking'
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
    'public-tracking': {
      title: 'Public Consignment Tracking',
      subtitle: 'Customer portal view for real-time shipment status verification'
    }
  };

  const currentInfo = tabTitles[currentTab] || { title: 'CRM Portal', subtitle: '' };

  return (
    <header className="min-h-16 py-3 bg-white/95 backdrop-blur-xs border-b border-slate-200/80 px-6 flex items-center justify-between sticky top-0 z-20 shrink-0">
      <div className="min-w-0 pr-4">
        <h2 className="text-sm font-semibold text-slate-900 tracking-tight leading-snug">
          {currentInfo.title}
        </h2>
        <p className="text-[11px] text-slate-500 font-normal mt-0.5 leading-snug">
          {currentInfo.subtitle}
        </p>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setShowNotifMenu(!showNotifMenu)}
            className="relative p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors focus:outline-none"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadNotifications.length > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-sky-500 ring-2 ring-white" />
            )}
          </button>

          {showNotifMenu && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
              <div className="px-4 py-2.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold text-slate-800">Notifications</span>
                  {unreadNotifications.length > 0 && (
                    <span className="text-[10px] bg-sky-100 text-sky-800 font-medium px-2 py-0.5 rounded-full border border-sky-200/60">
                      {unreadNotifications.length} new
                    </span>
                  )}
                </div>
                {unreadNotifications.length > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="text-[11px] text-slate-500 hover:text-slate-800 font-medium flex items-center gap-1"
                  >
                    <CheckCheck className="w-3 h-3 text-slate-400" /> Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                {notifications.length === 0 ? (
                  <div className="py-6 text-center text-xs text-slate-400">
                    No notifications right now
                  </div>
                ) : (
                  notifications.slice(0, 12).map(n => (
                    <div
                      key={n.id}
                      onClick={() => handleNotificationClick(n)}
                      className={`p-3 text-left hover:bg-slate-50 cursor-pointer transition-colors ${
                        !n.isRead ? 'bg-sky-50/50' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-xs font-medium text-slate-800">{n.title}</p>
                        {!n.isRead && (
                          <span className="w-1.5 h-1.5 rounded-full bg-sky-500 shrink-0 mt-1" />
                        )}
                      </div>
                      <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
                        {n.message}
                      </p>
                      <span className="text-[10px] text-slate-400 mt-1 block">
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

        <div className="relative" ref={userRef}>
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 pl-2 pr-2.5 py-1.5 rounded-lg border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all text-left shadow-2xs"
          >
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-sky-500 to-teal-600 text-white flex items-center justify-center text-[10px] font-semibold shrink-0">
              {user?.name ? user.name.slice(0, 2).toUpperCase() : 'VO'}
            </div>
            <span className="text-xs font-medium text-slate-800 max-w-[120px] truncate">
              {user?.name}
            </span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
              <div className="px-3.5 py-2.5 border-b border-slate-100 bg-slate-50/50">
                <p className="text-xs font-semibold text-slate-800">{user?.name}</p>
                <p className="text-[11px] text-slate-500 truncate">{user?.email}</p>
                <div className="mt-1.5 inline-flex items-center gap-1 text-[10px] font-medium bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200/60">
                  <Shield className="w-3 h-3 text-slate-500" />
                  {role?.displayName || user?.roleName}
                </div>
              </div>

              <div className="py-1">
                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    onOpenProfile();
                  }}
                  className="w-full px-3.5 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 text-left transition-colors"
                >
                  <UserIcon className="w-3.5 h-3.5 text-slate-400" />
                  <span>Profile & Security</span>
                </button>
              </div>

              <div className="border-t border-slate-100 pt-1">
                <button
                  onClick={logout}
                  className="w-full px-3.5 py-2 text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-2.5 text-left font-medium transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
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
