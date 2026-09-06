import React, { useEffect, useState } from 'react';
import {
  IndianRupee,
  AlertTriangle,
  TrendingUp,
  Receipt,
  Clock,
  CheckCircle2,
  ArrowRight
} from 'lucide-react';
import { api } from '../../api/client';
import { FinanceOverview } from '../../types/crm';
import { NavigationTab } from '../../components/layout/Sidebar';

type FinancePageProps = {
  onNavigate?: (tab: NavigationTab, entityId?: string) => void;
};

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
      <div className="p-6 max-w-7xl mx-auto animate-pulse space-y-4">
        <div className="h-6 w-40 bg-slate-200 rounded" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 bg-slate-100 rounded-xl border border-slate-200" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs">
          {error || 'Unable to load finance data.'}
        </div>
      </div>
    );
  }

  const kpiCards = [
    {
      label: 'Revenue Generated',
      value: formatMoney(data.totalRevenue, 'USD'),
      sub: `${data.paidBillsCount} paid invoices`,
      icon: TrendingUp,
      accent: 'border-emerald-200 bg-emerald-50/40',
      iconWrap: 'bg-emerald-100 text-emerald-700'
    },
    {
      label: 'Due Payments',
      value: formatMoney(data.totalDue, 'USD'),
      sub: `${data.dueBillsCount} open bills`,
      icon: Clock,
      accent: 'border-amber-200 bg-amber-50/40',
      iconWrap: 'bg-amber-100 text-amber-700'
    },
    {
      label: 'Overdue Amount',
      value: formatMoney(data.overdueAmount, 'USD'),
      sub: `${data.overdueBillsCount} overdue`,
      icon: AlertTriangle,
      accent: 'border-rose-200 bg-rose-50/40',
      iconWrap: 'bg-rose-100 text-rose-700'
    },
    {
      label: 'Revenue This Month',
      value: formatMoney(data.revenueThisMonth, 'USD'),
      sub: `${data.totalBills} total bills`,
      icon: IndianRupee,
      accent: 'border-sky-200 bg-sky-50/40',
      iconWrap: 'bg-sky-100 text-sky-700'
    }
  ];

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-slate-800">Finance Overview</h3>
          <p className="text-xs text-slate-500">
            Revenue collected from delivered orders and outstanding receivables
          </p>
        </div>
        {onNavigate && (
          <button
            type="button"
            onClick={() => onNavigate('bills')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-700 hover:bg-slate-50"
          >
            <Receipt className="w-4 h-4" />
            View Bills
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
        {kpiCards.map(card => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className={`rounded-xl border p-4 ${card.accent}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                    {card.label}
                  </p>
                  <p className="mt-2 text-xl font-bold text-slate-900">{card.value}</p>
                  <p className="mt-1 text-[11px] text-slate-500">{card.sub}</p>
                </div>
                <div className={`p-2 rounded-lg ${card.iconWrap}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
            <h4 className="text-xs font-semibold text-slate-800">Due Payments</h4>
            <span className="text-[10px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-100">
              {data.recentDue.length} upcoming
            </span>
          </div>
          <div className="divide-y divide-slate-100">
            {data.recentDue.length === 0 ? (
              <p className="p-6 text-center text-xs text-slate-400">No outstanding dues.</p>
            ) : (
              data.recentDue.map(item => (
                <div key={item.id} className="px-4 py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-800 truncate">{item.company}</p>
                    <p className="text-[10px] text-slate-500 font-mono">
                      {item.billCode} · {item.orderCode}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      Due{' '}
                      {item.dueDate
                        ? new Date(item.dueDate).toLocaleDateString()
                        : '—'}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs font-bold text-amber-700">
                      {formatMoney(item.amountDue, item.currency)}
                    </p>
                    <p className="text-[10px] text-slate-400 capitalize">{item.status.replace('_', ' ')}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
            <h4 className="text-xs font-semibold text-slate-800">Recent Revenue</h4>
            <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
              Collected
            </span>
          </div>
          <div className="divide-y divide-slate-100">
            {data.recentPaid.length === 0 ? (
              <p className="p-6 text-center text-xs text-slate-400">No payments recorded yet.</p>
            ) : (
              data.recentPaid.map(item => (
                <div key={item.id} className="px-4 py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-800 truncate">{item.company}</p>
                    <p className="text-[10px] text-slate-500 font-mono">
                      {item.billCode} · {item.orderCode}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                      {new Date(item.paidAt).toLocaleDateString()}
                    </p>
                  </div>
                  <p className="text-xs font-bold text-emerald-700 shrink-0">
                    {formatMoney(item.amountPaid, item.currency)}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {(Object.keys(data.revenueByCurrency).length > 0 ||
        Object.keys(data.dueByCurrency).length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <h4 className="text-xs font-semibold text-slate-800 mb-3">Revenue by Currency</h4>
            <div className="space-y-2">
              {Object.entries(data.revenueByCurrency).map(([currency, amount]) => (
                <div key={currency} className="flex items-center justify-between text-xs">
                  <span className="text-slate-600">{currency}</span>
                  <span className="font-semibold text-emerald-700">
                    {formatMoney(Number(amount), currency)}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <h4 className="text-xs font-semibold text-slate-800 mb-3">Due by Currency</h4>
            <div className="space-y-2">
              {Object.entries(data.dueByCurrency).map(([currency, amount]) => (
                <div key={currency} className="flex items-center justify-between text-xs">
                  <span className="text-slate-600">{currency}</span>
                  <span className="font-semibold text-amber-700">
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
