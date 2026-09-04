import React, { useEffect, useState } from 'react';
import {
  Users,
  UserPlus,
  HeartHandshake,
  Calendar,
  CheckSquare,
  AlertTriangle,
  Package,
  CheckCircle2,
  Clock,
  ArrowRight,
  UserCheck,
  ShieldAlert,
  ArrowUpRight,
  Check
} from 'lucide-react';
import { api } from '../../api/client';
import { DueBadge } from '../../components/ui/OverdueBadge';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { PriorityBadge } from '../../components/ui/PriorityBadge';
import { NavigationTab } from '../../components/layout/Sidebar';

interface DashboardProps {
  onNavigate: (tab: NavigationTab, entityId?: string) => void;
}

const LEAD_STATUS_BAR: Record<string, string> = {
  New: 'bg-blue-500',
  Contacted: 'bg-indigo-500',
  Interested: 'bg-teal-500',
  'Follow-up': 'bg-sky-500',
  Converted: 'bg-emerald-500',
  'Not Interested': 'bg-rose-400',
  Lost: 'bg-rose-500'
};

export const DashboardPage: React.FC<DashboardProps> = ({ onNavigate }) => {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = async () => {
    setIsLoading(true);
    try {
      const res = await api.dashboard.getOverview();
      if (res.success) {
        setData(res.data);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  if (isLoading) {
    return (
      <div className="p-6 space-y-6 animate-pulse max-w-7xl mx-auto">
        <div className="h-6 w-48 bg-slate-200 rounded" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-24 bg-slate-100 rounded-xl border border-slate-200" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs">
          {error || 'Unable to display dashboard.'}
        </div>
      </div>
    );
  }

  const { kpi, attention, leadDistribution, taskOverview, recentActivities } = data;

  const kpiItems = [
    {
      label: 'Total Leads',
      value: kpi.totalLeads,
      icon: Users,
      accent: 'border-slate-200',
      iconWrap: 'bg-slate-100 text-slate-600',
      tab: 'leads' as NavigationTab
    },
    {
      label: 'New Inquiries',
      value: kpi.newLeads,
      icon: UserPlus,
      accent: 'border-blue-200',
      iconWrap: 'bg-blue-50 text-blue-600',
      tab: 'leads' as NavigationTab
    },
    {
      label: 'Interested Leads',
      value: kpi.interestedLeads,
      icon: HeartHandshake,
      accent: 'border-teal-200',
      iconWrap: 'bg-teal-50 text-teal-600',
      tab: 'leads' as NavigationTab
    },
    {
      label: 'Follow-ups Due',
      value: kpi.followUpsDueCount,
      icon: Calendar,
      accent: kpi.followUpsDueCount > 0 ? 'border-violet-300' : 'border-violet-200',
      iconWrap: 'bg-violet-50 text-violet-600',
      tab: 'leads' as NavigationTab
    },
    {
      label: 'Active Tasks',
      value: kpi.activeTasksCount,
      icon: CheckSquare,
      accent: 'border-sky-200',
      iconWrap: 'bg-sky-50 text-sky-600',
      tab: 'tasks' as NavigationTab
    },
    {
      label: 'Overdue Tasks',
      value: kpi.overdueTasksCount,
      icon: AlertTriangle,
      accent: kpi.overdueTasksCount > 0 ? 'border-rose-300 bg-rose-50/40' : 'border-rose-200',
      iconWrap: 'bg-rose-50 text-rose-600',
      tab: 'tasks' as NavigationTab,
      highlight: kpi.overdueTasksCount > 0
    },
    {
      label: 'Active Orders',
      value: kpi.activeOrdersCount,
      icon: Package,
      accent: 'border-indigo-200',
      iconWrap: 'bg-indigo-50 text-indigo-600',
      tab: 'orders' as NavigationTab
    },
    {
      label: 'Completed Orders',
      value: kpi.completedOrdersCount,
      icon: CheckCircle2,
      accent: 'border-emerald-200',
      iconWrap: 'bg-emerald-50 text-emerald-600',
      tab: 'orders' as NavigationTab
    }
  ];

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <section>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Operational Metrics
          </h3>
          <span className="text-[11px] text-slate-400">Live system status</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
          {kpiItems.map((item, idx) => {
            const Icon = item.icon;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => onNavigate(item.tab)}
                className={`text-left p-4 rounded-xl border bg-white shadow-xs transition-all hover:shadow-sm hover:-translate-y-0.5 ${item.accent}`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-medium text-slate-500">{item.label}</span>
                  <span
                    className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${item.iconWrap}`}
                  >
                    <Icon className="w-4 h-4" />
                  </span>
                </div>
                <div className="mt-2.5 flex items-baseline justify-between">
                  <span className="text-2xl font-semibold tracking-tight text-slate-900">
                    {item.value}
                  </span>
                  <span className="text-[10px] text-slate-400 flex items-center">
                    View <ArrowUpRight className="w-3 h-3 ml-0.5" />
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      <section className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
        <div className="flex items-center gap-2 mb-4 border-b border-slate-100 pb-3">
          <ShieldAlert className="w-4 h-4 text-amber-600" />
          <h3 className="text-sm font-semibold text-slate-900">Action Required & Attention Items</h3>
          <span className="text-[11px] bg-amber-50 text-amber-800 font-medium px-2 py-0.5 rounded-full ml-auto border border-amber-200/70">
            Requires Manager & Team Action
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="border border-rose-100 rounded-lg p-3.5 bg-rose-50/30">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-rose-700 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5" />
                Overdue Tasks ({attention.overdueTasks?.length || 0})
              </span>
              <button
                onClick={() => onNavigate('tasks')}
                className="text-[11px] font-medium text-slate-600 hover:text-slate-900 flex items-center gap-0.5"
              >
                All tasks <ArrowRight className="w-3 h-3" />
              </button>
            </div>
            {attention.overdueTasks?.length === 0 ? (
              <p className="text-xs text-slate-400 py-3 text-center">No overdue tasks</p>
            ) : (
              <div className="space-y-2">
                {attention.overdueTasks.map((t: any) => (
                  <div
                    key={t.id}
                    onClick={() => onNavigate('tasks')}
                    className="p-2.5 rounded-md bg-white border border-rose-100 hover:border-rose-300 transition-colors cursor-pointer"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-xs font-medium text-slate-900 line-clamp-1">{t.taskTitle}</p>
                      <DueBadge
                        dueDate={t.dueDate}
                        status={t.status}
                        isOverdue={t.isOverdue ?? true}
                        overdueDays={t.overdueDays || 1}
                      />
                    </div>
                    <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-1">
                      <span>
                        Assignee:{' '}
                        <strong className="text-slate-700">{t.assignedToName || 'Unassigned'}</strong>
                      </span>
                      <span>•</span>
                      <span>Due: {new Date(t.dueDate).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="border border-violet-100 rounded-lg p-3.5 bg-violet-50/30">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-violet-800 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                Follow-ups Scheduled ({attention.followUpsDueToday?.length || 0})
              </span>
              <button
                onClick={() => onNavigate('leads')}
                className="text-[11px] font-medium text-slate-600 hover:text-slate-900 flex items-center gap-0.5"
              >
                All leads <ArrowRight className="w-3 h-3" />
              </button>
            </div>
            {attention.followUpsDueToday?.length === 0 ? (
              <p className="text-xs text-slate-400 py-3 text-center">No follow-ups due today</p>
            ) : (
              <div className="space-y-2">
                {attention.followUpsDueToday.map((l: any) => (
                  <div
                    key={l.id}
                    onClick={() => onNavigate('leads')}
                    className="p-2.5 rounded-md bg-white border border-violet-100 hover:border-violet-300 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-medium text-slate-900">{l.company}</p>
                      <StatusBadge status={l.leadStatus} />
                    </div>
                    <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-1">
                      <span>Contact: {l.name}</span>
                      <span>•</span>
                      <span>{l.country}</span>
                      <span>•</span>
                      <span className="text-violet-700 font-medium">
                        Due {l.nextFollowUp ? new Date(l.nextFollowUp).toLocaleDateString() : 'Today'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="border border-teal-100 rounded-lg p-3.5 bg-teal-50/30">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-teal-800 flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5" />
                Unassigned Inquiries ({attention.unassignedLeads?.length || 0})
              </span>
              <button
                onClick={() => onNavigate('leads')}
                className="text-[11px] font-medium text-slate-600 hover:text-slate-900 flex items-center gap-0.5"
              >
                Assign now <ArrowRight className="w-3 h-3" />
              </button>
            </div>
            {attention.unassignedLeads?.length === 0 ? (
              <p className="text-xs text-slate-400 py-3 text-center">All leads currently assigned</p>
            ) : (
              <div className="space-y-2">
                {attention.unassignedLeads.map((l: any) => (
                  <div
                    key={l.id}
                    onClick={() => onNavigate('leads')}
                    className="p-2.5 rounded-md bg-white border border-teal-100 hover:border-teal-300 transition-colors cursor-pointer flex items-center justify-between"
                  >
                    <div>
                      <p className="text-xs font-medium text-slate-900">{l.company}</p>
                      <p className="text-[11px] text-slate-500">{l.productInterest}</p>
                    </div>
                    <PriorityBadge priority={l.priority} />
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="border border-indigo-100 rounded-lg p-3.5 bg-indigo-50/30">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-indigo-800 flex items-center gap-1.5">
                <Package className="w-3.5 h-3.5" />
                Orders in Processing ({attention.ordersNeedingAttention?.length || 0})
              </span>
              <button
                onClick={() => onNavigate('orders')}
                className="text-[11px] font-medium text-slate-600 hover:text-slate-900 flex items-center gap-0.5"
              >
                All orders <ArrowRight className="w-3 h-3" />
              </button>
            </div>
            {attention.ordersNeedingAttention?.length === 0 ? (
              <p className="text-xs text-slate-400 py-3 text-center">No orders awaiting dispatch</p>
            ) : (
              <div className="space-y-2">
                {attention.ordersNeedingAttention.map((o: any) => (
                  <div
                    key={o.id}
                    onClick={() => onNavigate('orders')}
                    className="p-2.5 rounded-md bg-white border border-indigo-100 hover:border-indigo-300 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-slate-900 font-mono">
                        {o.orderCode}
                      </span>
                      <StatusBadge status={o.orderStatus} />
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1">
                      <span>
                        {o.company} ({o.country})
                      </span>
                      <span className="font-semibold text-slate-900">
                        ${Number(o.orderValue).toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">
            Lead Distribution by Status
          </h4>
          <div className="space-y-3">
            {Object.entries(leadDistribution || {}).map(([status, count]) => {
              const total = kpi.totalLeads || 1;
              const pct = Math.round(((count as number) / total) * 100);
              return (
                <div key={status}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-medium text-slate-700">{status}</span>
                    <span className="text-slate-900 font-semibold">
                      {count as number}{' '}
                      <span className="text-slate-400 font-normal">({pct}%)</span>
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${LEAD_STATUS_BAR[status] || 'bg-slate-500'}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">
            Task Fulfillment Overview
          </h4>
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-lg border border-slate-200 bg-slate-50 text-center">
              <span className="text-[11px] font-medium text-slate-600 block">Pending</span>
              <span className="text-xl font-semibold text-slate-900 mt-1 block">
                {taskOverview?.pending || 0}
              </span>
            </div>
            <div className="p-3 rounded-lg border border-sky-200 bg-sky-50 text-center">
              <span className="text-[11px] font-medium text-sky-700 block">In Progress</span>
              <span className="text-xl font-semibold text-slate-900 mt-1 block">
                {taskOverview?.inProgress || 0}
              </span>
            </div>
            <div className="p-3 rounded-lg border border-emerald-200 bg-emerald-50 text-center">
              <span className="text-[11px] font-medium text-emerald-700 block">Completed</span>
              <span className="text-xl font-semibold text-slate-900 mt-1 block">
                {taskOverview?.completed || 0}
              </span>
            </div>
            <div className="p-3 rounded-lg border border-rose-200 bg-rose-50 text-center">
              <span className="text-[11px] font-medium text-rose-700 block">Overdue</span>
              <span className="text-xl font-semibold text-slate-900 mt-1 block">
                {taskOverview?.overdue || 0}
              </span>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Total Tasks Logged:</span>
            <span className="font-semibold text-slate-900">
              {(taskOverview?.pending || 0) +
                (taskOverview?.inProgress || 0) +
                (taskOverview?.completed || 0)}
            </span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Recent CRM Activity
            </h4>
            <Clock className="w-3.5 h-3.5 text-slate-400" />
          </div>
          <div className="space-y-3 max-h-64 overflow-y-auto pr-1 divide-y divide-slate-100">
            {recentActivities?.slice(0, 6).map((act: any) => {
              const isLeadDone =
                act.action === 'Lead Completed' ||
                (act.entity === 'Lead' && /converted/i.test(`${act.action} ${act.details || ''}`));
              const isTaskDone =
                act.action === 'Task Completed' ||
                (act.entity === 'Task' && /completed/i.test(`${act.action} ${act.details || ''}`));
              const isSuccess = isLeadDone || isTaskDone;
              const title = isLeadDone
                ? 'Lead Completed'
                : isTaskDone
                  ? 'Task Completed'
                  : act.action;

              return (
                <div key={act.id} className="pt-2 first:pt-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2 min-w-0">
                      {isSuccess ? (
                        <span className="mt-0.5 w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0">
                          <Check className="w-2.5 h-2.5" strokeWidth={3} />
                        </span>
                      ) : null}
                      <div className="min-w-0">
                        <p
                          className={`text-xs font-semibold ${
                            isSuccess ? 'text-emerald-700' : 'text-slate-800'
                          }`}
                        >
                          {title}
                        </p>
                        <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed line-clamp-2">
                          {act.details}
                        </p>
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mt-1">
                          <span>By {act.userName}</span>
                          <span>•</span>
                          <span>{act.entity}</span>
                        </div>
                      </div>
                    </div>
                    <span className="text-[10px] text-slate-400 shrink-0">
                      {new Date(act.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
