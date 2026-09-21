import React, { useEffect, useState } from 'react';
import {
  AlertTriangle,
  TrendingUp,
  Receipt,
  Clock,
  CheckCircle2,
  ArrowRight,
  Wallet
} from 'lucide-react';
import { api } from '../../api/client';
import { FinanceOverview } from '../../types/crm';
import { NavigationTab } from '../../components/layout/Sidebar';

type FinancePageProps = {
  onNavigate?: (tab: NavigationTab, entityId?: string) => void;
};

// Same manifest/ledger palette used across the CRM (see Orders page) —
// kept here rather than four different pastel accent colors per card.
const INK = '#182430';
const INK_SOFT = '#4B5563';
const INK_FAINT = '#8B8D85';
const LINE = '#E2DED2';
const PAPER = '#F6F4EE';
const MARINE = '#155A52';
const BRASS = '#9C6B25';
const RUST = '#A6402F';

function formatMoney(amount: number, currency = 'USD') {
  const prefix = currency === 'INR' ? '₹' : currency === 'USD' ? '$' : `${currency} `;
  return `${prefix}${amount.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
}

export const FinancePage: React.FC<FinancePageProps> = ({ onNavigate }) => {
  const [data, setData] = useState<FinanceOverview | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setIsLoading(true);
      try {
        const res = await api.finance.getOverview();
        if (res.success) setData(res.data);
      } catch (err: any) {
        setError(err.message || 'Failed to load finance overview.');
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  if (isLoading) {
    return (
      <div className="p-6 sm:p-8 max-w-7xl mx-auto animate-pulse space-y-6" style={{ backgroundColor: PAPER }}>
        <div className="h-6 w-40 rounded" style={{ backgroundColor: LINE }} />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 bg-white rounded-lg border" style={{ borderColor: LINE }} />
          ))}
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6 sm:p-8 max-w-7xl mx-auto" style={{ backgroundColor: PAPER }}>
        <div className="p-4 bg-white border rounded-lg text-sm flex items-start gap-2.5" style={{ borderColor: LINE, color: INK }}>
          <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" style={{ color: RUST }} />
          <span>{error || 'Unable to load finance data.'}</span>
        </div>
      </div>
    );
  }

  const kpiCards = [
    {
      label: 'Revenue generated',
      value: formatMoney(data.totalRevenue, 'INR'),
      sub: `${data.paidBillsCount} paid invoices · reported in INR`,
      icon: TrendingUp,
      color: MARINE
    },
    {
      label: 'Due payments',
      value: formatMoney(data.totalDue, 'INR'),
      sub: `${data.dueBillsCount} open bills · INR equivalent`,
      icon: Clock,
      color: BRASS
    },
    {
      label: 'Overdue amount',
      value: formatMoney(data.overdueAmount, 'INR'),
      sub: `${data.overdueBillsCount} overdue · INR equivalent`,
      icon: AlertTriangle,
      color: RUST
    },
    {
      label: 'Revenue this month',
      value: formatMoney(data.revenueThisMonth, 'INR'),
      sub: `${data.totalBills} total bills · all currencies converted`,
      icon: Wallet,
      color: INK
    }
  ];

  return (
    <div className="p-6 sm:p-8 space-y-6" style={{ backgroundColor: PAPER }}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b" style={{ borderColor: LINE }}>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight" style={{ color: INK }}>Finance overview</h1>
          <p className="text-sm mt-1.5 max-w-md" style={{ color: INK_SOFT }}>
            Revenue collected from delivered orders and what's still outstanding. KPI totals are normalized to INR; line items keep original invoice currency.
          </p>
        </div>
        {onNavigate && (
          <button
            type="button"
            onClick={() => onNavigate('bills')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-white border rounded-md text-sm font-medium transition-colors hover:bg-[#F6F4EE] shrink-0"
            style={{ borderColor: LINE, color: INK }}
          >
            <Receipt className="w-4 h-4" style={{ color: INK_SOFT }} />
            View bills
            <ArrowRight className="w-3.5 h-3.5" style={{ color: INK_SOFT }} />
          </button>
        )}
      </div>

      {/* KPI ledger row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
        {kpiCards.map(card => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="bg-white rounded-lg border p-4" style={{ borderColor: LINE }}>
              <div className="flex items-start justify-between gap-3">
                <p className="text-xs" style={{ color: INK_SOFT }}>{card.label}</p>
                <div className="w-7 h-7 rounded-md border flex items-center justify-center shrink-0" style={{ borderColor: LINE }}>
                  <Icon className="w-3.5 h-3.5" style={{ color: card.color }} />
                </div>
              </div>
              <p className="mt-2.5 text-xl font-medium" style={{ color: card.color }}>{card.value}</p>
              <p className="mt-1 text-xs" style={{ color: INK_FAINT }}>{card.sub}</p>
            </div>
          );
        })}
      </div>

      {/* Due / recent revenue */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-lg border overflow-hidden" style={{ borderColor: LINE }}>
          <div className="px-4 py-3 border-b flex items-center justify-between" style={{ borderColor: LINE }}>
            <h4 className="text-sm font-semibold" style={{ color: INK }}>Due payments</h4>
            <span className="text-xs" style={{ color: INK_FAINT }}>{data.recentDue.length} upcoming</span>
          </div>
          <div className="divide-y" style={{ borderColor: LINE }}>
            {data.recentDue.length === 0 ? (
              <p className="p-6 text-center text-sm" style={{ color: INK_FAINT }}>No outstanding dues.</p>
            ) : (
              data.recentDue.map(item => (
                <div key={item.id} className="px-4 py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: INK }}>{item.company}</p>
                    <p className="text-xs mt-0.5" style={{ color: INK_FAINT }}>
                      {item.billCode} · {item.orderCode}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: INK_FAINT }}>
                      Due {item.dueDate ? new Date(item.dueDate).toLocaleDateString() : '—'}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-medium" style={{ color: BRASS }}>
                      {formatMoney(item.amountDue, item.currency)}
                    </p>
                    <p className="text-xs mt-0.5 capitalize" style={{ color: INK_FAINT }}>{item.status.replace('_', ' ')}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg border overflow-hidden" style={{ borderColor: LINE }}>
          <div className="px-4 py-3 border-b flex items-center justify-between" style={{ borderColor: LINE }}>
            <h4 className="text-sm font-semibold" style={{ color: INK }}>Recent revenue</h4>
            <span className="text-xs" style={{ color: INK_FAINT }}>Collected</span>
          </div>
          <div className="divide-y" style={{ borderColor: LINE }}>
            {data.recentPaid.length === 0 ? (
              <p className="p-6 text-center text-sm" style={{ color: INK_FAINT }}>No payments recorded yet.</p>
            ) : (
              data.recentPaid.map(item => (
                <div key={item.id} className="px-4 py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: INK }}>{item.company}</p>
                    <p className="text-xs mt-0.5" style={{ color: INK_FAINT }}>
                      {item.billCode} · {item.orderCode}
                    </p>
                    <p className="text-xs mt-0.5 flex items-center gap-1" style={{ color: INK_FAINT }}>
                      <CheckCircle2 className="w-3 h-3" style={{ color: MARINE }} />
                      {new Date(item.paidAt).toLocaleDateString()}
                    </p>
                  </div>
                  <p className="text-sm font-medium shrink-0" style={{ color: MARINE }}>
                    {formatMoney(item.amountPaid, item.currency)}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Currency breakdown */}
      {(Object.keys(data.revenueByCurrency).length > 0 ||
        Object.keys(data.dueByCurrency).length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-lg border p-4" style={{ borderColor: LINE }}>
            <h4 className="text-sm font-semibold mb-3" style={{ color: INK }}>Revenue by currency</h4>
            <div className="space-y-2">
              {Object.entries(data.revenueByCurrency).map(([currency, amount]) => (
                <div key={currency} className="flex items-center justify-between text-sm">
                  <span style={{ color: INK_SOFT }}>{currency}</span>
                  <span className="font-medium" style={{ color: MARINE }}>
                    {formatMoney(Number(amount), currency)}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-white rounded-lg border p-4" style={{ borderColor: LINE }}>
            <h4 className="text-sm font-semibold mb-3" style={{ color: INK }}>Due by currency</h4>
            <div className="space-y-2">
              {Object.entries(data.dueByCurrency).map(([currency, amount]) => (
                <div key={currency} className="flex items-center justify-between text-sm">
                  <span style={{ color: INK_SOFT }}>{currency}</span>
                  <span className="font-medium" style={{ color: BRASS }}>
                    {formatMoney(Number(amount), currency)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};