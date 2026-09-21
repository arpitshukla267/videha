import React, { useState, useEffect } from 'react';
import {
  Globe,
  Users,
  Package,
  Download,
  Building2,
  Upload,
  BarChart3,
  FileDown
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip
} from 'recharts';
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

// Same manifest/ledger palette used across the rest of the CRM.
const INK = '#182430';
const INK_SOFT = '#4B5563';
const INK_FAINT = '#8B8D85';
const LINE = '#E2DED2';
const PAPER = '#F6F4EE';
const MARINE = '#155A52';
const MARINE_TINT = '#EEF4F2';
const BRASS = '#9C6B25';
const RUST = '#A6402F';
const VOYAGE = '#2B6C8C';

// Cycled across chart slices so no two adjacent categories share a color.
const CHART_COLORS = [MARINE, BRASS, RUST, VOYAGE, '#6B5B95', INK_FAINT];

// Shared size for every pie chart on this page so the donut + legend blocks
// line up consistently across the "Leads by..." and "Consignment status"
// sections, instead of the previous mismatched 128 / 144 sizing.
const PIE_SIZE = 140;

function toCsvValue(v: unknown): string {
  const s = String(v ?? '');
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function downloadCsv(filename: string, rows: (string | number)[][]) {
  const csv = rows.map(r => r.map(toCsvValue).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Tooltip matching the ledger palette used everywhere else on this page.
function ChartTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const p = payload[0];
  return (
    <div
      className="text-[11px] px-2.5 py-1.5 rounded-md shadow-lg"
      style={{ backgroundColor: INK, color: '#F6F4EE' }}
    >
      <span className="font-medium">{p.name}</span>
      <span style={{ color: '#C9CDD3' }}> — {p.value}</span>
    </div>
  );
}

// Recharts-backed pie chart (ported from the Dashboard page) so slices get
// the same animated entry — they sweep in from 0deg on mount/update instead
// of appearing instantly like the old CSS conic-gradient donut. The total
// sits centered over the chart and a legend with counts/percentages runs
// alongside it.
//
// `wide` switches the legend from a single column (for the two half-width
// cards) to a multi-column grid (for the full-width consignment card), so a
// short list doesn't leave a large empty gap next to the donut.
function ReportPieChart({
  data,
  size = PIE_SIZE,
  wide = false
}: {
  data: Array<{ label: string; value: number }>;
  size?: number;
  wide?: boolean;
}) {
  const total = data.reduce((s, d) => s + d.value, 0);
  const chartData = data.map((d, i) => ({
    name: d.label,
    value: d.value,
    color: CHART_COLORS[i % CHART_COLORS.length]
  }));

  const legendRow = (d: { name: string; value: number; color: string }) => {
    const pct = total ? Math.round((d.value / total) * 100) : 0;
    return (
      <div key={d.name} className="flex items-center justify-between text-sm gap-3">
        <span className="flex items-center gap-2 min-w-0" style={{ color: INK_SOFT }}>
          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
          <span className="truncate">{d.name}</span>
        </span>
        <span className="font-medium shrink-0" style={{ color: INK }}>
          {d.value} <span style={{ color: INK_FAINT }}>({pct}%)</span>
        </span>
      </div>
    );
  };

  return (
    <div className="flex items-center gap-5">
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="name"
              innerRadius={size * 0.33}
              outerRadius={size * 0.5}
              paddingAngle={2}
              stroke="none"
              isAnimationActive
              animationBegin={0}
              animationDuration={800}
              animationEasing="ease-out"
            >
              {chartData.map((entry, idx) => (
                <Cell key={idx} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<ChartTooltip />} />
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <span className="text-base font-semibold" style={{ color: INK }}>
            {total}
          </span>
        </div>
      </div>

      {wide ? (
        // Full-width card: spread the legend across columns so it fills the
        // available width instead of hugging the donut with empty space
        // trailing off to the right.
        <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 gap-x-8 gap-y-1.5 min-w-0">
          {chartData.map(legendRow)}
        </div>
      ) : (
        // Half-width cards: single column, capped to the donut's own height
        // and scrollable past that — so a longer legend (more categories
        // than the country chart, say) never grows taller than the chart
        // and pushes the two out of vertical alignment.
        <div
          className="flex-1 space-y-1.5 min-w-0 overflow-y-auto pr-1"
          style={{ maxHeight: size }}
        >
          {chartData.map(legendRow)}
        </div>
      )}
    </div>
  );
}

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
          { value: 'all', label: 'All members' },
          ...res.data.map(user => ({ value: user.id, label: user.name }))
        ]);
      }
    });
    api.departments.getDepartments().then(res => {
      if (res.success) {
        setDepartments([
          { value: 'all', label: 'All departments' },
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

  const handleDownloadReport = () => {
    if (!advanced) return;

    const memberLabel = teamMembers.find(m => m.value === memberFilter)?.label || memberFilter;
    const departmentLabel = departments.find(d => d.value === departmentFilter)?.label || departmentFilter;

    const rows: (string | number)[][] = [
      ['Filtered performance report'],
      // Filter metadata as a proper header row + one data row underneath,
      // instead of the previous label/value pairs stacked one per row.
      ['From', 'To', 'Member', 'Department'],
      [fromDate || 'all time', toDate || 'all time', memberLabel, departmentLabel],
      [],
      ['Metric', 'Value'],
      ['Lead conversion rate', advanced.leads?.conversionRate ?? ''],
      ['Leads won', advanced.leads?.won ?? ''],
      ['Leads lost', advanced.leads?.lost ?? ''],
      ['Follow-up completion rate', advanced.followUps?.completionRate ?? ''],
      ['Follow-ups overdue', advanced.followUps?.overdue ?? ''],
      ['Quotation accept rate', advanced.quotations?.acceptRate ?? ''],
      ['Quotations accepted', advanced.quotations?.accepted ?? ''],
      ['Order fulfillment rate', advanced.orders?.fulfillmentRate ?? ''],
      ['Orders delivered', advanced.orders?.delivered ?? ''],
      [],
      ['Open pipeline by stage'],
      ['Stage', 'Count'],
      ...Object.entries(advanced.pipeline?.openByStage || {}).map(([stage, count]) => [stage, count as number]),
      [],
      ['Member performance'],
      ['Member', 'Leads', 'Win rate'],
      ...(advanced.team?.byMember || []).map((m: any) => [m.memberName, m.leads, m.winRate])
    ];
    downloadCsv(`performance-report-${fromDate || 'all'}-to-${toDate || 'all'}.csv`, rows);
  };

  if (isLoading || !reports) {
    return (
      <div className="p-6 sm:p-8 space-y-6 animate-pulse" style={{ backgroundColor: PAPER }}>
        <div className="h-6 w-48 rounded" style={{ backgroundColor: LINE }} />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-44 bg-white rounded-lg border" style={{ borderColor: LINE }} />
          ))}
        </div>
      </div>
    );
  }

  const { leads, orders } = reports;

  const inputClass = 'px-3.5 py-2.5 bg-white border rounded-md text-sm focus:outline-none transition-colors';

  return (
    <div className="p-6 sm:p-8 space-y-6" style={{ backgroundColor: PAPER }}>
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight" style={{ color: INK }}>Reports</h1>
        <p className="text-sm mt-1.5 max-w-2xl" style={{ color: INK_SOFT }}>
          Filtered analytics, breakdowns, and exports. For live counts and today's activity, see the Dashboard.
        </p>
      </div>

      {/* Data Exports */}
      {(hasPermission('companies.view') || hasPermission('customers.view')) && (
        <div className="bg-white border rounded-lg p-5" style={{ borderColor: LINE }}>
          <h4 className="text-sm font-semibold mb-1" style={{ color: INK }}>Data exports</h4>
          <p className="text-sm mb-4" style={{ color: INK_SOFT }}>
            Download CSV snapshots of master data visible to your account (server-side, permission-filtered).
          </p>
          <div className="flex flex-wrap gap-3">
            {hasPermission('companies.view') && (
              <button
                type="button"
                onClick={() => handleExport('companies')}
                disabled={exporting !== null}
                className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-white hover:bg-[#F6F4EE] border rounded-md text-sm font-medium transition-colors disabled:opacity-60"
                style={{ borderColor: LINE, color: INK }}
              >
                <Building2 className="w-4 h-4" style={{ color: INK_SOFT }} />
                <Download className="w-4 h-4" style={{ color: INK_SOFT }} />
                {exporting === 'companies' ? 'Exporting…' : 'Export companies CSV'}
              </button>
            )}
            {hasPermission('customers.view') && (
              <button
                type="button"
                onClick={() => handleExport('customers')}
                disabled={exporting !== null}
                className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-white hover:bg-[#F6F4EE] border rounded-md text-sm font-medium transition-colors disabled:opacity-60"
                style={{ borderColor: LINE, color: INK }}
              >
                <Users className="w-4 h-4" style={{ color: INK_SOFT }} />
                <Download className="w-4 h-4" style={{ color: INK_SOFT }} />
                {exporting === 'customers' ? 'Exporting…' : 'Export customers CSV'}
              </button>
            )}
          </div>
        </div>
      )}

      {/* CSV Import */}
      {IMPORT_ENTITIES.some(item => hasPermission(item.permission)) && (
        <div className="bg-white border rounded-lg p-5" style={{ borderColor: LINE }}>
          <h4 className="text-sm font-semibold mb-1" style={{ color: INK }}>CSV import</h4>
          <p className="text-sm mb-4" style={{ color: INK_SOFT }}>
            Upload CSV files with column mapping, validation preview, and row-level error reporting.
          </p>
          <div className="flex flex-wrap gap-3">
            {IMPORT_ENTITIES.filter(item => hasPermission(item.permission)).map(item => (
              <button
                key={item.entity}
                type="button"
                onClick={() => setImportEntity(item.entity)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-white hover:bg-[#F6F4EE] border rounded-md text-sm font-medium transition-colors"
                style={{ borderColor: LINE, color: INK }}
              >
                <Upload className="w-4 h-4" style={{ color: INK_SOFT }} />
                Import {item.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Filtered performance report */}
      <div className="bg-white border rounded-lg p-5 space-y-5" style={{ borderColor: LINE }}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h4 className="text-sm font-semibold flex items-center gap-2" style={{ color: INK }}>
              <BarChart3 className="w-4 h-4" style={{ color: INK_SOFT }} />
              Filtered performance report
            </h4>
            <p className="text-sm mt-1" style={{ color: INK_SOFT }}>
              Pipeline, conversion, and team performance scoped to a date range, member, or department.
            </p>
          </div>
          <button
            type="button"
            onClick={handleDownloadReport}
            disabled={!advanced}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 text-white rounded-md text-sm font-medium transition-colors disabled:opacity-50 shrink-0"
            style={{ backgroundColor: MARINE }}
          >
            <FileDown className="w-4 h-4" />
            Download report
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <input
            type="date"
            value={fromDate}
            onChange={e => setFromDate(e.target.value)}
            className={inputClass}
            style={{ borderColor: LINE, color: INK }}
          />
          <input
            type="date"
            value={toDate}
            onChange={e => setToDate(e.target.value)}
            className={inputClass}
            style={{ borderColor: LINE, color: INK }}
          />
          <SearchableSelect options={teamMembers} value={memberFilter} onChange={setMemberFilter} className="w-48" />
          <SearchableSelect options={departments} value={departmentFilter} onChange={setDepartmentFilter} className="w-48" />
        </div>

        {isAdvancedLoading || !advanced ? (
          <div className="h-24 animate-pulse rounded-lg" style={{ backgroundColor: PAPER }} />
        ) : (
          <>
            {/* Rate ledger */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                { label: 'Lead conversion', value: advanced.leads?.conversionRate, sub: `${advanced.leads?.won} won / ${advanced.leads?.lost} lost`, color: MARINE },
                { label: 'Follow-up completion', value: advanced.followUps?.completionRate, sub: `${advanced.followUps?.overdue} overdue`, color: BRASS },
                { label: 'Quotation accept rate', value: advanced.quotations?.acceptRate, sub: `${advanced.quotations?.accepted} accepted`, color: VOYAGE },
                { label: 'Order fulfillment', value: advanced.orders?.fulfillmentRate, sub: `${advanced.orders?.delivered} delivered`, color: MARINE }
              ].map(stat => (
                <div key={stat.label} className="p-3.5 rounded-md border" style={{ borderColor: LINE }}>
                  <p className="text-xs" style={{ color: INK_FAINT }}>{stat.label}</p>
                  <p className="text-xl font-semibold mt-1" style={{ color: stat.color }}>{stat.value}</p>
                  <p className="text-xs mt-0.5" style={{ color: INK_SOFT }}>{stat.sub}</p>
                </div>
              ))}
            </div>

            {/* Pipeline by stage */}
            {advanced?.pipeline?.openByStage && Object.keys(advanced.pipeline.openByStage).length > 0 && (
              <div className="pt-2">
                <h5 className="text-sm font-semibold mb-4" style={{ color: INK }}>Open pipeline by stage</h5>
                <ReportPieChart
                  data={Object.entries(advanced.pipeline.openByStage).map(([label, value]) => ({
                    label,
                    value: value as number
                  }))}
                />
              </div>
            )}

            {/* Member performance */}
            {advanced?.team?.byMember?.length > 0 && (
              <div className="pt-2">
                <h5 className="text-sm font-semibold mb-4" style={{ color: INK }}>Member performance</h5>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                  {advanced.team.byMember.slice(0, 8).map((member: any) => (
                    <div key={member.memberId || member.memberName} className="p-3 rounded-md border" style={{ borderColor: LINE }}>
                      <div className="text-sm font-semibold" style={{ color: INK }}>{member.memberName}</div>
                      <div className="mt-1 text-xs" style={{ color: INK_SOFT }}>{member.leads} leads · {member.winRate} win rate</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Distribution charts — dimensions the live Dashboard doesn't show */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-white border rounded-lg p-5" style={{ borderColor: LINE }}>
          <h4 className="text-sm font-semibold mb-4 flex items-center gap-2" style={{ color: INK }}>
            <Globe className="w-4 h-4" style={{ color: INK_SOFT }} />
            Leads by destination country
          </h4>
          {Object.keys(leads.byCountry || {}).length === 0 ? (
            <p className="text-sm" style={{ color: INK_FAINT }}>No leads recorded yet.</p>
          ) : (
            <ReportPieChart data={Object.entries(leads.byCountry).map(([label, value]) => ({ label, value: value as number }))} />
          )}
        </div>

        <div className="bg-white border rounded-lg p-5" style={{ borderColor: LINE }}>
          <h4 className="text-sm font-semibold mb-4 flex items-center gap-2" style={{ color: INK }}>
            <Users className="w-4 h-4" style={{ color: INK_SOFT }} />
            Leads by acquisition channel
          </h4>
          {Object.keys(leads.bySource || {}).length === 0 ? (
            <p className="text-sm" style={{ color: INK_FAINT }}>No leads recorded yet.</p>
          ) : (
            <ReportPieChart data={Object.entries(leads.bySource).map(([label, value]) => ({ label, value: value as number }))} />
          )}
        </div>

        <div className="bg-white border rounded-lg p-5 lg:col-span-2" style={{ borderColor: LINE }}>
          <h4 className="text-sm font-semibold mb-4 flex items-center gap-2" style={{ color: INK }}>
            <Package className="w-4 h-4" style={{ color: INK_SOFT }} />
            Consignment status distribution
          </h4>
          {Object.keys(orders.byStatus || {}).length === 0 ? (
            <p className="text-sm" style={{ color: INK_FAINT }}>No orders recorded yet.</p>
          ) : (
            <ReportPieChart
              wide
              data={Object.entries(orders.byStatus).map(([label, value]) => ({ label, value: value as number }))}
            />
          )}
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