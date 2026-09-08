import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  Globe,
  Users,
  CheckSquare,
  Package,
  IndianRupee,
  Download,
  Building2,
  Upload,
  BarChart3
} from 'lucide-react';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { alertSaveError } from '../../lib/apiErrors';
import { ImportEntityType } from '../../types/crm';
import { ImportWizard } from '../../components/import/ImportWizard';
import { SearchableSelect } from '../../components/ui/SearchableSelect';

const IMPORT_ENTITIES: Array<{ entity: ImportEntityType; label: string; permission: string }> = [
  { entity: 'leads', label: 'Leads', permission: 'leads.create' },
  { entity: 'companies', label: 'Companies', permission: 'companies.create' },
  { entity: 'customers', label: 'Customers', permission: 'customers.create' },
  { entity: 'follow-ups', label: 'Follow-ups', permission: 'followups.create' },
  { entity: 'quotations', label: 'Quotations', permission: 'quotations.create' },
  { entity: 'orders', label: 'Orders', permission: 'orders.create' }
];

export const ReportsPage: React.FC = () => {
  const { hasPermission } = useAuth();
  const [reports, setReports] = useState<any>(null);
  const [advanced, setAdvanced] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdvancedLoading, setIsAdvancedLoading] = useState(false);
  const [exporting, setExporting] = useState<'companies' | 'customers' | null>(null);
  const [importEntity, setImportEntity] = useState<ImportEntityType | null>(null);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [teamMembers, setTeamMembers] = useState<Array<{ value: string; label: string }>>([]);
  const [departments, setDepartments] = useState<Array<{ value: string; label: string }>>([]);
  const [memberFilter, setMemberFilter] = useState('all');
  const [departmentFilter, setDepartmentFilter] = useState('all');

  useEffect(() => {
    api.reports
      .getReports()
      .then(res => {
        if (res.success) setReports(res.data);
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));

    api.users.getUsers({ status: 'active', limit: 100 }).then(res => {
      if (res.success) {
        setTeamMembers([
          { value: 'all', label: 'All Members' },
          ...res.data.map(user => ({ value: user.id, label: user.name }))
        ]);
      }
    });
    api.departments.getDepartments().then(res => {
      if (res.success) {
        setDepartments([
          { value: 'all', label: 'All Departments' },
          ...res.data.map(dept => ({ value: dept.id, label: dept.name }))
        ]);
      }
    }).catch(() => {});
  }, []);

  const loadAdvanced = async () => {
    setIsAdvancedLoading(true);
    try {
      const res = await api.reports.getAdvancedReports({
        from: fromDate || undefined,
        to: toDate || undefined,
        memberId: memberFilter,
        departmentId: departmentFilter
      });
      if (res.success) setAdvanced(res.data);
    } catch (err: unknown) {
      alertSaveError(err, 'Failed to load advanced reports');
    } finally {
      setIsAdvancedLoading(false);
    }
  };

  useEffect(() => {
    if (!isLoading) loadAdvanced();
  }, [isLoading, fromDate, toDate, memberFilter, departmentFilter]);

  const handleExport = async (type: 'companies' | 'customers') => {
    setExporting(type);
    try {
      if (type === 'companies') {
        await api.companies.exportCsv();
      } else {
        await api.customers.exportCsv();
      }
    } catch (err: unknown) {
      alertSaveError(err, `Failed to export ${type}`);
    } finally {
      setExporting(null);
    }
  };

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

      {(hasPermission('companies.view') || hasPermission('customers.view')) && (
        <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-xs">
          <h4 className="text-xs font-semibold text-slate-800 uppercase tracking-wider mb-1">
            Data Exports
          </h4>
          <p className="text-xs text-slate-500 mb-4">
            Download CSV snapshots of master data visible to your account (server-side, RBAC-filtered).
          </p>
          <div className="flex flex-wrap gap-3">
            {hasPermission('companies.view') && (
              <button
                type="button"
                onClick={() => handleExport('companies')}
                disabled={exporting !== null}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-teal-50 text-teal-800 hover:bg-teal-100 border border-teal-200/80 rounded-lg text-xs font-medium transition-colors disabled:opacity-60"
              >
                <Building2 className="w-3.5 h-3.5 text-teal-600" />
                <Download className="w-3.5 h-3.5 text-teal-600" />
                {exporting === 'companies' ? 'Exporting…' : 'Export Companies CSV'}
              </button>
            )}
            {hasPermission('customers.view') && (
              <button
                type="button"
                onClick={() => handleExport('customers')}
                disabled={exporting !== null}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-teal-50 text-teal-800 hover:bg-teal-100 border border-teal-200/80 rounded-lg text-xs font-medium transition-colors disabled:opacity-60"
              >
                <Users className="w-3.5 h-3.5 text-teal-600" />
                <Download className="w-3.5 h-3.5 text-teal-600" />
                {exporting === 'customers' ? 'Exporting…' : 'Export Customers CSV'}
              </button>
            )}
          </div>
        </div>
      )}

      {IMPORT_ENTITIES.some(item => hasPermission(item.permission)) && (
        <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-xs">
          <h4 className="text-xs font-semibold text-slate-800 uppercase tracking-wider mb-1">
            CSV Import
          </h4>
          <p className="text-xs text-slate-500 mb-4">
            Upload CSV files with column mapping, validation preview, and row-level error reporting.
          </p>
          <div className="flex flex-wrap gap-3">
            {IMPORT_ENTITIES.filter(item => hasPermission(item.permission)).map(item => (
              <button
                key={item.entity}
                type="button"
                onClick={() => setImportEntity(item.entity)}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-sky-50 text-sky-800 hover:bg-sky-100 border border-sky-200/80 rounded-lg text-xs font-medium"
              >
                <Upload className="w-3.5 h-3.5" />
                Import {item.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h4 className="text-xs font-semibold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <BarChart3 className="w-3.5 h-3.5" />
              Advanced Performance Reports
            </h4>
            <p className="text-xs text-slate-500 mt-1">
              Pipeline, conversion, follow-ups, quotations, orders, and team performance with RBAC scoping.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          <input
            type="date"
            value={fromDate}
            onChange={e => setFromDate(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-lg text-xs"
          />
          <input
            type="date"
            value={toDate}
            onChange={e => setToDate(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-lg text-xs"
          />
          <SearchableSelect options={teamMembers} value={memberFilter} onChange={setMemberFilter} className="w-44" />
          <SearchableSelect options={departments} value={departmentFilter} onChange={setDepartmentFilter} className="w-44" />
        </div>
        {isAdvancedLoading || !advanced ? (
          <div className="h-24 animate-pulse bg-slate-100 rounded-lg" />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
              <div className="text-[10px] uppercase text-slate-500">Lead Conversion</div>
              <div className="text-xl font-semibold text-slate-900">{advanced.leads?.conversionRate}</div>
              <div className="text-[11px] text-slate-500">{advanced.leads?.won} won / {advanced.leads?.lost} lost</div>
            </div>
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
              <div className="text-[10px] uppercase text-slate-500">Follow-up Completion</div>
              <div className="text-xl font-semibold text-slate-900">{advanced.followUps?.completionRate}</div>
              <div className="text-[11px] text-slate-500">{advanced.followUps?.overdue} overdue</div>
            </div>
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
              <div className="text-[10px] uppercase text-slate-500">Quotation Accept Rate</div>
              <div className="text-xl font-semibold text-slate-900">{advanced.quotations?.acceptRate}</div>
              <div className="text-[11px] text-slate-500">{advanced.quotations?.accepted} accepted</div>
            </div>
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
              <div className="text-[10px] uppercase text-slate-500">Order Fulfillment</div>
              <div className="text-xl font-semibold text-slate-900">{advanced.orders?.fulfillmentRate}</div>
              <div className="text-[11px] text-slate-500">{advanced.orders?.delivered} delivered</div>
            </div>
          </div>
        )}
        {advanced?.pipeline?.openByStage && (
          <div>
            <h5 className="text-xs font-semibold text-slate-700 mb-2">Open Pipeline by Stage</h5>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {Object.entries(advanced.pipeline.openByStage).map(([stage, count]) => (
                <div key={stage} className="flex justify-between text-xs px-3 py-2 bg-slate-50 rounded-lg border border-slate-200">
                  <span>{stage}</span>
                  <span className="font-semibold">{count as number}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        {advanced?.team?.byMember?.length > 0 && (
          <div>
            <h5 className="text-xs font-semibold text-slate-700 mb-2">Member Performance</h5>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
              {advanced.team.byMember.slice(0, 8).map((member: any) => (
                <div key={member.memberId || member.memberName} className="p-3 rounded-lg border border-slate-200 bg-white text-xs">
                  <div className="font-semibold text-slate-800">{member.memberName}</div>
                  <div className="mt-1 text-slate-500">{member.leads} leads · {member.winRate} win rate</div>
                </div>
              ))}
            </div>
          </div>
        )}
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

      {importEntity && (
        <ImportWizard
          entity={importEntity}
          isOpen={!!importEntity}
          onClose={() => setImportEntity(null)}
        />
      )}
    </div>
  );
};
