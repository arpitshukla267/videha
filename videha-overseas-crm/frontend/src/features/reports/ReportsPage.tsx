import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  Globe,
  Users,
  CheckSquare,
  Package,
  IndianRupee
} from 'lucide-react';
import { api } from '../../api/client';

export const ReportsPage: React.FC = () => {
  const [reports, setReports] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    api.reports
      .getReports()
      .then(res => {
        if (res.success) setReports(res.data);
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading || !reports) {
    return (
      <div className="p-8 space-y-6 animate-pulse max-w-7xl mx-auto">
        <div className="h-6 w-48 bg-slate-200 rounded" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-44 bg-slate-100 rounded-xl border border-slate-200" />
          ))}
        </div>
      </div>
    );
  }

  const { leads, tasks, orders } = reports;
  const pipelineValue = orders.totalValueINR ?? orders.totalValueUSD ?? 0;
  const taskCompletionPct =
    tasks.total > 0 ? Math.round((tasks.completed / tasks.total) * 100) : 0;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div>
        <h3 className="text-base font-semibold text-slate-900">Operational CRM Reports</h3>
        <p className="text-xs text-slate-500">
          Export performance, lead conversion rates, and task fulfillment statistics
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Lead Conversion Rate
            </span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-semibold text-slate-900">{leads.conversionRate}</span>
            <span className="text-xs text-slate-500 font-medium">
              (<span className="font-semibold text-slate-800">{leads.converted}</span> of{' '}
              <span className="font-semibold text-slate-800">{leads.total}</span> leads
            </span>
          </div>
          <div className="mt-3 w-full bg-slate-100 h-2 rounded-full overflow-hidden">
            <div
              className="bg-emerald-600 h-full rounded-full transition-all"
              style={{ width: leads.conversionRate }}
            />
          </div>
        </div>

        <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Task Completion Rate
            </span>
            <CheckSquare className="w-4 h-4 text-sky-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-semibold text-slate-900">{taskCompletionPct}%</span>
            <span className="text-xs text-slate-500 font-medium">
              <span className="font-semibold text-slate-800">{tasks.completed}</span> of{' '}
              <span className="font-semibold text-slate-800">{tasks.total}</span> done
            </span>
          </div>
          <div className="mt-3 w-full bg-slate-100 h-2 rounded-full overflow-hidden">
            <div
              className="bg-sky-600 h-full rounded-full transition-all"
              style={{ width: `${taskCompletionPct}%` }}
            />
          </div>
        </div>

        <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Consignment Pipeline
            </span>
            <IndianRupee className="w-4 h-4 text-teal-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-semibold text-slate-900">
              ₹{Number(pipelineValue).toLocaleString('en-IN')}
            </span>
            <span className="text-xs text-slate-500 font-medium">
              INR across <span className="font-semibold text-slate-800">{orders.total}</span> orders
            </span>
          </div>
          <div className="mt-3 text-[11px] text-slate-500 font-medium">
            Active shipments moving through international ports
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-xs">
          <h4 className="text-xs font-semibold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
            <Globe className="w-3.5 h-3.5 text-slate-400" />
            Leads by Destination Country
          </h4>
          <div className="space-y-3">
            {Object.entries(leads.byCountry || {}).map(([country, count]) => {
              const pct = Math.round(((count as number) / (leads.total || 1)) * 100);
              return (
                <div key={country}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-medium text-slate-700">{country}</span>
                    <span className="font-semibold text-slate-900">
                      {count as number}{' '}
                      <span className="text-slate-400 font-normal">({pct}%)</span>
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-slate-800 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-xs">
          <h4 className="text-xs font-semibold text-slate-900 uppercase tracking-wider mb-4">
            Leads by Acquisition Channel
          </h4>
          <div className="space-y-3">
            {Object.entries(leads.bySource || {}).map(([source, count]) => {
              const pct = Math.round(((count as number) / (leads.total || 1)) * 100);
              return (
                <div key={source}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-medium text-slate-700">{source}</span>
                    <span className="font-semibold text-slate-900">
                      {count as number}{' '}
                      <span className="text-slate-400 font-normal">({pct}%)</span>
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-teal-600 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-xs">
          <h4 className="text-xs font-semibold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
            <Package className="w-3.5 h-3.5 text-slate-400" />
            Consignment Status Distribution
          </h4>
          <div className="space-y-3">
            {Object.entries(orders.byStatus || {}).map(([status, count]) => {
              const pct = Math.round(((count as number) / (orders.total || 1)) * 100);
              return (
                <div key={status}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-medium text-slate-700">{status}</span>
                    <span className="font-semibold text-slate-900">
                      {count as number}{' '}
                      <span className="text-slate-400 font-normal">({pct}%)</span>
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-600 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-xs col-span-1 md:col-span-2 lg:col-span-3">
          <h4 className="text-xs font-semibold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
            <Users className="w-3.5 h-3.5 text-slate-400" />
            Team Member Task Fulfillment & Overdue Tracking
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {Object.entries(tasks.byMember || {}).map(([memberName, stats]: any) => (
              <div key={memberName} className="p-3 border border-slate-200 rounded-lg bg-slate-50">
                <p className="font-semibold text-xs text-slate-900">{memberName}</p>
                <div className="mt-2 space-y-1 text-[11px] text-slate-600">
                  <div className="flex justify-between">
                    <span>Total Tasks:</span>
                    <span className="font-semibold text-slate-900">{stats.total}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Completed:</span>
                    <span className="font-semibold text-emerald-700">{stats.completed}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Overdue:</span>
                    <span
                      className={`font-semibold ${
                        stats.overdue > 0 ? 'text-rose-700' : 'text-slate-500'
                      }`}
                    >
                      {stats.overdue}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
