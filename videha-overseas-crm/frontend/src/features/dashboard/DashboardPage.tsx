import React, { useEffect, useMemo, useState } from 'react';
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
  Check,
  Radio
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis
} from 'recharts';
import { api } from '../../api/client';
import { DueBadge } from '../../components/ui/OverdueBadge';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { PriorityBadge } from '../../components/ui/PriorityBadge';
import { NavigationTab } from '../../components/layout/Sidebar';

interface DashboardProps {
  onNavigate: (tab: NavigationTab, entityId?: string) => void;
}

// Ordered pipeline stages read left-to-right as a lead matures. Colors move
// stone -> teal -> amber along that progression, with fixed endpoints for
// won/lost so the outcome colors never depend on where a status happens to
// fall in the object.
const STAGE_COLOR_SEQUENCE = [
  '#78716C', '#57534E', '#0F766E', '#0D9488', '#14B8A6', '#2DD4BF',
  '#D97706', '#F59E0B', '#EA580C'
];
const FIXED_STATUS_COLOR: Record<string, string> = {
  Converted: '#15803D',
  Interested: '#0D9488',
  'Follow-up': '#D97706',
  'Not Interested': '#B45309',
  Lost: '#B91C1C'
};

const TASK_COLORS: Record<string, string> = {
  Pending: '#78716C',
  'In Progress': '#0284C7',
  Completed: '#15803D',
  Overdue: '#B91C1C'
};

function getStatusColor(status: string, idx: number): string {
  return FIXED_STATUS_COLOR[status] || STAGE_COLOR_SEQUENCE[idx % STAGE_COLOR_SEQUENCE.length];
}

function ChartTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const p = payload[0];
  return (
    <div className="bg-stone-900 text-stone-50 text-[11px] px-2.5 py-1.5 rounded-md shadow-lg">
      <span className="font-medium">{p.name}</span>
      <span className="text-stone-300"> — {p.value}</span>
    </div>
  );
}

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

  // Kept above the early returns below so hook order never changes between
  // the loading/error/loaded states.
  const taskChartData = useMemo(() => {
    const t = data?.taskOverview || {};
    return [
      { name: 'Pending', value: t.pending || 0 },
      { name: 'In Progress', value: t.inProgress || 0 },
      { name: 'Completed', value: t.completed || 0 },
      { name: 'Overdue', value: t.overdue || 0 }
    ];
  }, [data?.taskOverview]);

  if (isLoading) {
    return (
      <div className="p-6 space-y-6 animate-pulse max-w-7xl mx-auto">
        <div className="h-6 w-48 bg-stone-200 rounded" />
        <div className="h-20 bg-stone-100 rounded-xl border border-stone-200" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-56 bg-stone-100 rounded-xl border border-stone-200" />
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

  const { kpi, attention, leadDistribution, pipelineDistribution, memberPerformance, recentActivities } = data;

  const kpiItems = [
    { label: 'Total leads', value: kpi.totalLeads, icon: Users, tab: 'leads' as NavigationTab },
    { label: 'New inquiries', value: kpi.newLeads, icon: UserPlus, tab: 'leads' as NavigationTab },
    { label: 'Interested', value: kpi.interestedLeads, icon: HeartHandshake, tab: 'leads' as NavigationTab },
    { label: 'Follow-ups due', value: kpi.followUpsDueCount, icon: Calendar, tab: 'followups' as NavigationTab },
    {
      label: 'Overdue follow-ups',
      value: kpi.followUpsOverdue ?? 0,
      icon: AlertTriangle,
      tab: 'followups' as NavigationTab,
      danger: (kpi.followUpsOverdue ?? 0) > 0
    },
    { label: 'Converted', value: kpi.wonLeads ?? 0, icon: CheckCircle2, tab: 'leads' as NavigationTab },
    {
      label: 'Open quotations',
      value: (kpi.quotationsDraft ?? 0) + (kpi.quotationsSent ?? 0),
      icon: HeartHandshake,
      tab: 'quotations' as NavigationTab
    },
    { label: 'Active tasks', value: kpi.activeTasksCount, icon: CheckSquare, tab: 'tasks' as NavigationTab },
    {
      label: 'Overdue tasks',
      value: kpi.overdueTasksCount,
      icon: AlertTriangle,
      tab: 'tasks' as NavigationTab,
      danger: kpi.overdueTasksCount > 0
    },
    { label: 'Active orders', value: kpi.activeOrdersCount, icon: Package, tab: 'orders' as NavigationTab },
    { label: 'Completed orders', value: kpi.completedOrdersCount, icon: CheckCircle2, tab: 'orders' as NavigationTab }
  ];

  const leadDistEntries = Object.entries(leadDistribution || {}) as [string, number][];
  const leadDistTotal = leadDistEntries.reduce((s, [, v]) => s + v, 0) || 1;
  const leadDistChartData = leadDistEntries.map(([status, count], idx) => ({
    name: status,
    value: count,
    color: getStatusColor(status, idx)
  }));

  const pipelineEntries = Object.entries(pipelineDistribution || {}) as [string, number][];
  const pipelineChartData = pipelineEntries
    .map(([status, count]) => ({ name: status, value: count }))
    .sort((a, b) => b.value - a.value);

  const taskTotal = taskChartData.reduce((s, d) => s + d.value, 0);

  const hasPipeline = pipelineEntries.length > 0;
  const hasMembers = memberPerformance?.length > 0;

  return (
    <div className="p-6 space-y-6 ">
      <header className="flex items-end justify-between">
        <div>
          <h2 className="text-lg font-semibold text-stone-900">Sales operations</h2>
          <p className="text-xs text-stone-500 mt-0.5">Pipeline, tasks and fulfillment at a glance</p>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-stone-500">
          <Radio className="w-3 h-3 text-emerald-600 animate-pulse" />
          Live
        </div>
      </header>

      {/* KPI ticker */}
      <section className="bg-white border border-stone-200 rounded-xl overflow-hidden shadow-sm">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 divide-x divide-y divide-stone-100">
          {kpiItems.map((item, idx) => {
            const Icon = item.icon;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => onNavigate(item.tab)}
                className="text-left p-3.5 hover:bg-stone-50 transition-colors group"
              >
                <div className="flex items-center gap-1.5 text-stone-400 group-hover:text-stone-600">
                  <Icon className="w-3 h-3" />
                  <span className="text-[10.5px] font-medium text-stone-500 group-hover:text-stone-700 truncate">
                    {item.label}
                  </span>
                </div>
                <div className="mt-1.5 flex items-baseline gap-1.5">
                  <span
                    className={` text-xl font-semibold tracking-tight ${
                      item.danger ? 'text-rose-700' : 'text-stone-900'
                    }`}
                  >
                    {item.value}
                  </span>
                  <ArrowUpRight className="w-3 h-3 text-stone-300 group-hover:text-stone-500 mb-0.5" />
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Pipeline + task composition */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-white border border-stone-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-stone-900">Lead status distribution</h3>
            <span className="text-[11px] text-stone-400">{leadDistTotal} total</span>
          </div>
          {leadDistChartData.length === 0 ? (
            <p className="text-xs text-stone-400 py-10 text-center">No lead data yet</p>
          ) : (
            <div className="flex items-center gap-5">
              <div className="w-36 h-36 shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={leadDistChartData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={42}
                      outerRadius={64}
                      paddingAngle={2}
                      stroke="none"
                    >
                      {leadDistChartData.map((entry, idx) => (
                        <Cell key={idx} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<ChartTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex-1 space-y-1.5 max-h-40 overflow-y-auto pr-1">
                {leadDistChartData.map((d, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1.5 text-stone-700 min-w-0">
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
                      <span className="truncate">{d.name}</span>
                    </span>
                    <span className=" text-stone-900 font-medium shrink-0 ml-2">
                      {d.value}
                      <span className="text-stone-400 font-normal">
                        {' '}
                        · {Math.round((d.value / leadDistTotal) * 100)}%
                      </span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="bg-white border border-stone-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-stone-900">Task fulfillment</h3>
            <span className="text-[11px] text-stone-400">{taskTotal} logged</span>
          </div>
          {taskTotal === 0 ? (
            <p className="text-xs text-stone-400 py-10 text-center">No tasks logged yet</p>
          ) : (
            <div className="flex items-center gap-5">
              <div className="w-36 h-36 shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={taskChartData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={42}
                      outerRadius={64}
                      paddingAngle={2}
                      stroke="none"
                    >
                      {taskChartData.map((entry, idx) => (
                        <Cell key={idx} fill={TASK_COLORS[entry.name]} />
                      ))}
                    </Pie>
                    <Tooltip content={<ChartTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex-1 space-y-1.5">
                {taskChartData.map((d, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1.5 text-stone-700">
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: TASK_COLORS[d.name] }} />
                      {d.name}
                    </span>
                    <span className=" text-stone-900 font-medium">{d.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Pipeline funnel + member leaderboard */}
      {(hasPipeline || hasMembers) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {hasPipeline && (
            <div className="bg-white border border-stone-200 rounded-xl p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-stone-900 mb-4">Active pipeline by stage</h3>
              <div style={{ width: '100%', height: Math.max(pipelineChartData.length * 32, 120) }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={pipelineChartData} layout="vertical" margin={{ left: 8, right: 16 }}>
                    <XAxis type="number" hide />
                    <YAxis
                      type="category"
                      dataKey="name"
                      width={110}
                      tick={{ fontSize: 11, fill: '#57534E' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip content={<ChartTooltip />} cursor={{ fill: '#F5F5F4' }} />
                    <Bar dataKey="value" fill="#0F766E" radius={[0, 4, 4, 0]} barSize={14} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {hasMembers && (
            <div className="bg-white border border-stone-200 rounded-xl p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-stone-900 mb-4">Member performance</h3>
              <div className="space-y-3">
                {memberPerformance.map((m: any) => {
                  const wins = Number(m.wins) || 0;
                  const losses = Number(m.losses) || 0;
                  const decided = wins + losses;
                  const winPct = decided > 0 ? Math.round((wins / decided) * 100) : 0;
                  return (
                    <div key={m.memberId}>
                      <div className="flex items-baseline justify-between text-xs mb-1">
                        <span className="font-medium text-stone-800">{m.memberName}</span>
                        <span className="text-stone-500 text-[11px]">
                          {m.leadsAssigned} leads · {wins}W / {losses}L
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-stone-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-600 rounded-full"
                          style={{ width: `${decided > 0 ? winPct : 4}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Attention required */}
      <section className="bg-white border border-stone-200 rounded-xl shadow-sm overflow-hidden">
        

        <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-stone-100">
          <div className="p-4">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-sm font-medium text-stone-700 flex items-center gap-1.5">
                Overdue tasks - {attention.overdueTasks?.length || 0}
              </span>
              <button
                onClick={() => onNavigate('tasks')}
                className="text-[11px] font-medium text-stone-500 hover:text-stone-900 flex items-center gap-0.5"
              >
                All tasks <ArrowRight className="w-3 h-3" />
              </button>
            </div>
            {attention.overdueTasks?.length === 0 ? (
              <p className="text-xs text-stone-400 py-3 text-center">No overdue tasks</p>
            ) : (
              <div className="space-y-1.5">
                {attention.overdueTasks.map((t: any) => (
                  <div
                    key={t.id}
                    onClick={() => onNavigate('tasks')}
                    className="p-2.5 rounded-md border border-stone-150 border-stone-100 hover:border-rose-200 hover:bg-rose-50/40 transition-colors cursor-pointer"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-md font-medium text-stone-900 line-clamp-1">{t.taskTitle}</p>
                      <DueBadge
                        dueDate={t.dueDate}
                        status={t.status}
                        isOverdue={t.isOverdue ?? true}
                        overdueDays={t.overdueDays || 1}
                      />
                    </div>
                    <div className="flex items-center gap-3 text-xs text-stone-500 mt-1">
                      <span>
                        Assignee: <strong className="text-stone-700">{t.assignedToName || 'Unassigned'}</strong>
                      </span>
                      <span>·</span>
                      <span>Due {new Date(t.dueDate).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="p-4">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-sm font-medium text-stone-700 flex items-center gap-1.5">
                Follow-ups scheduled - {attention.followUpsDueToday?.length || 0}
              </span>
              <button
                onClick={() => onNavigate('followups')}
                className="text-[11px] font-medium text-stone-500 hover:text-stone-900 flex items-center gap-0.5"
              >
                All follow-ups <ArrowRight className="w-3 h-3" />
              </button>
            </div>
            {attention.followUpsDueToday?.length === 0 ? (
              <p className="text-xs text-stone-400 py-3 text-center">No follow-ups due today</p>
            ) : (
              <div className="space-y-1.5">
                {attention.followUpsDueToday.map((f: any) => (
                  <div
                    key={f.id}
                    onClick={() => onNavigate('followups')}
                    className="p-2.5 rounded-md border border-stone-100 hover:border-violet-200 hover:bg-violet-50/40 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-stone-900">{f.leadCompany || f.company}</p>
                      <StatusBadge status={f.type || f.status} />
                    </div>
                    <div className="flex items-center gap-3 text-[11px] text-stone-500 mt-1">
                      <span>{f.leadCode}</span>
                      <span>·</span>
                      <span className="text-violet-700 font-medium">
                        Due {new Date(f.dueAt || f.nextFollowUp).toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="p-4">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-sm font-medium text-stone-700 flex items-center gap-1.5">
                Unassigned inquiries - {attention.unassignedLeads?.length || 0}
              </span>
              <button
                onClick={() => onNavigate('leads')}
                className="text-[11px] font-medium text-stone-500 hover:text-stone-900 flex items-center gap-0.5"
              >
                Assign now <ArrowRight className="w-3 h-3" />
              </button>
            </div>
            {attention.unassignedLeads?.length === 0 ? (
              <p className="text-xs text-stone-400 py-3 text-center">All leads currently assigned</p>
            ) : (
              <div className="space-y-1.5">
                {attention.unassignedLeads.map((l: any) => (
                  <div
                    key={l.id}
                    onClick={() => onNavigate('leads')}
                    className="p-2.5 rounded-md border border-stone-100 hover:border-teal-200 hover:bg-teal-50/40 transition-colors cursor-pointer flex items-center justify-between"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-stone-900 truncate">{l.company}</p>
                      <p className="text-[11px] text-stone-500 truncate">{l.productInterest}</p>
                    </div>
                    <PriorityBadge priority={l.priority} />
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="p-4">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-sm font-medium text-stone-700 flex items-center gap-1.5">
                Orders in processing - {attention.ordersNeedingAttention?.length || 0}
              </span>
              <button
                onClick={() => onNavigate('orders')}
                className="text-[11px] font-medium text-stone-500 hover:text-stone-900 flex items-center gap-0.5"
              >
                All orders <ArrowRight className="w-3 h-3" />
              </button>
            </div>
            {attention.ordersNeedingAttention?.length === 0 ? (
              <p className="text-xs text-stone-400 py-3 text-center">No orders awaiting dispatch</p>
            ) : (
              <div className="space-y-1.5">
                {attention.ordersNeedingAttention.map((o: any) => (
                  <div
                    key={o.id}
                    onClick={() => onNavigate('orders')}
                    className="p-2.5 rounded-md border border-stone-100 hover:border-indigo-200 hover:bg-indigo-50/40 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-stone-900">{o.orderCode}</span>
                      <StatusBadge status={o.orderStatus} />
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-stone-500 mt-1">
                      <span>
                        {o.company} ({o.country})
                      </span>
                      <span className="font-semibold text-stone-900">
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

      {/* Recent activity */}
      <section className="bg-white border border-stone-200 rounded-xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-md font-medium text-stone-900">Recent activity</h3>
          <Clock className="w-3.5 h-3.5 text-stone-400" />
        </div>
        <div className="space-y-0 divide-y divide-stone-100">
          {recentActivities?.slice(0, 10).map((act: any) => {
            const isLeadDone =
              act.action === 'Lead Completed' ||
              (act.entity === 'Lead' && /converted/i.test(`${act.action} ${act.details || ''}`));
            const isTaskDone =
              act.action === 'Task Completed' ||
              (act.entity === 'Task' && /completed/i.test(`${act.action} ${act.details || ''}`));
            const isSuccess = isLeadDone || isTaskDone;
            const title = isLeadDone ? 'Lead completed' : isTaskDone ? 'Task completed' : act.action;

            return (
              <div key={act.id} className="flex items-start gap-3 py-2.5 first:pt-5 last:pb-0">
                {/* <span
                  className={`mt-0.5 w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${
                    isSuccess ? 'bg-emerald-600 text-white' : 'bg-stone-100 text-stone-400'
                  }`}
                >
                  {isSuccess ? <Check className="w-2.5 h-2.5" strokeWidth={3} /> : (
                    <span className="w-1.5 h-1.5 rounded-full bg-stone-400" />
                  )}
                </span> */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className={`text-sm font-medium ${isSuccess ? 'text-emerald-700' : 'text-stone-800'}`}>
                      {title}
                    </p>
                    <span className="text-[10px] text-stone-400 shrink-0">
                      {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-[11px] text-stone-600 mt-0.5 leading-relaxed line-clamp-2">{act.details}</p>
                  <div className="flex items-center gap-1.5 text-[10px] text-stone-400 mt-1">
                    <span>By {act.userName}</span>
                    <span>·</span>
                    <span>{act.entity}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};