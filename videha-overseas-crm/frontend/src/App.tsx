import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Sidebar, NavigationTab } from './components/layout/Sidebar';
import { Topbar } from './components/layout/Topbar';
import { DashboardPage } from './features/dashboard/DashboardPage';
import { LeadsPage } from './features/leads/LeadsPage';
import { TasksPage } from './features/tasks/TasksPage';
import { OrdersPage } from './features/orders/OrdersPage';
import { TeamPage } from './features/team/TeamPage';
import { ReportsPage } from './features/reports/ReportsPage';
import { SettingsPage } from './features/settings/SettingsPage';
import { PublicOrderTrackingPage } from './features/tracking/PublicOrderTrackingPage';
import { LoginPage } from './features/auth/LoginPage';
import { ProfileModal } from './components/ui/ProfileModal';

const CrmApp: React.FC = () => {
  const { user, isLoading, hasPermission, permissions } = useAuth();
  const [currentTab, setCurrentTab] = useState<NavigationTab>('dashboard');
  const [publicOrderCode, setPublicOrderCode] = useState('');
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [focusEntityId, setFocusEntityId] = useState<string | null>(null);

  // Check URL pathname or query for /order-tracking
  useEffect(() => {
    const path = window.location.pathname;
    const urlParams = new URLSearchParams(window.location.search);
    const orderParam = urlParams.get('order');

    if (path === '/order-tracking' || urlParams.get('page') === 'order-tracking') {
      setCurrentTab('public-tracking');
      if (orderParam) {
        setPublicOrderCode(orderParam);
      }
    }
  }, []);

  // Land users without dashboard access on their first available module
  useEffect(() => {
    if (!user || isLoading) return;
    if (currentTab !== 'dashboard') return;
    if (hasPermission('dashboard.view')) return;

    const fallbacks: Array<{ tab: NavigationTab; perm: string }> = [
      { tab: 'leads', perm: 'leads.view' },
      { tab: 'tasks', perm: 'tasks.view' },
      { tab: 'orders', perm: 'orders.view' },
      { tab: 'team', perm: 'users.view' },
      { tab: 'reports', perm: 'reports.view' },
      { tab: 'settings', perm: 'settings.manage' }
    ];
    const next = fallbacks.find(f => hasPermission(f.perm));
    if (next) setCurrentTab(next.tab);
  }, [user, isLoading, permissions, currentTab, hasPermission]);

  const handleNavigate = (tab: NavigationTab, entityId?: string) => {
    setFocusEntityId(entityId || null);
    setCurrentTab(tab);
  };

  const clearFocusEntity = () => setFocusEntityId(null);

  const handleOpenPublicTracking = (orderCode?: string) => {
    if (orderCode) {
      setPublicOrderCode(orderCode);
    }
    setCurrentTab('public-tracking');
  };

  // If loading session
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-600 to-teal-600 text-white flex items-center justify-center font-bold text-lg mx-auto animate-pulse shadow-md">
            VO
          </div>
          <p className="text-xs font-medium text-slate-500">Initializing Videha CRM...</p>
        </div>
      </div>
    );
  }

  // Public URL (logged out): full standalone portal
  if (currentTab === 'public-tracking' && !user) {
    return (
      <PublicOrderTrackingPage
        initialOrderCode={publicOrderCode}
        isLoggedIn={false}
      />
    );
  }

  // If not logged in, render LoginPage
  if (!user) {
    return <LoginPage onOpenPublicTracking={() => setCurrentTab('public-tracking')} />;
  }

  // Safe fallback if user has no permission for current tab
  const renderTabContent = () => {
    switch (currentTab) {
      case 'dashboard':
        if (!hasPermission('dashboard.view')) {
          return (
            <div className="p-8 text-center text-xs text-slate-500">
              You do not have permission to view the Dashboard.
            </div>
          );
        }
        return <DashboardPage onNavigate={handleNavigate} />;
      case 'leads':
        if (!hasPermission('leads.view')) {
          return (
            <div className="p-8 text-center text-xs text-slate-500">
              You do not have permission to view Leads.
            </div>
          );
        }
        return (
          <LeadsPage focusLeadId={focusEntityId} onFocusConsumed={clearFocusEntity} />
        );
      case 'tasks':
        if (!hasPermission('tasks.view')) {
          return (
            <div className="p-8 text-center text-xs text-slate-500">
              You do not have permission to view Tasks.
            </div>
          );
        }
        return (
          <TasksPage focusTaskId={focusEntityId} onFocusConsumed={clearFocusEntity} />
        );
      case 'orders':
        if (!hasPermission('orders.view')) {
          return (
            <div className="p-8 text-center text-xs text-slate-500">
              You do not have permission to view Orders.
            </div>
          );
        }
        return (
          <OrdersPage
            onNavigate={handleNavigate}
            onOpenPublicTracking={handleOpenPublicTracking}
            focusOrderId={focusEntityId}
            onFocusConsumed={clearFocusEntity}
          />
        );
      case 'team':
        if (!hasPermission('users.view')) {
          return (
            <div className="p-8 text-center text-xs text-slate-500">
              You do not have permission to view Team Directory.
            </div>
          );
        }
        return <TeamPage />;
      case 'reports':
        if (!hasPermission('reports.view')) {
          return (
            <div className="p-8 text-center text-xs text-slate-500">
              You do not have permission to view Reports.
            </div>
          );
        }
        return <ReportsPage />;
      case 'settings':
        if (!hasPermission('settings.manage')) {
          return (
            <div className="p-8 text-center text-xs text-slate-500">
              You do not have permission to manage Settings.
            </div>
          );
        }
        return <SettingsPage />;
      case 'public-tracking':
        return (
          <PublicOrderTrackingPage
            initialOrderCode={publicOrderCode}
            isLoggedIn
            embedded
          />
        );
      default:
        return hasPermission('dashboard.view') ? (
          <DashboardPage onNavigate={handleNavigate} />
        ) : (
          <div className="p-8 text-center text-xs text-slate-500">No modules available.</div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={tab => {
          clearFocusEntity();
          if (tab === 'public-tracking') {
            setPublicOrderCode('VO-2026-0182');
          }
          setCurrentTab(tab);
        }}
        unreadCount={0}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto">
        <Topbar
          currentTab={currentTab}
          onNavigate={handleNavigate}
          onOpenProfile={() => setIsProfileOpen(true)}
        />

        <main className="flex-1 pb-12">{renderTabContent()}</main>
      </div>

      {/* User Profile / Password Modal */}
      <ProfileModal isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <CrmApp />
    </AuthProvider>
  );
}
