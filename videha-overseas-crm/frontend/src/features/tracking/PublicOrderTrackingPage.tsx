import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  CheckCircle2,
  Clock,
  Package,
  Calendar,
  AlertCircle,
  Lock,
  MapPin,
  Ship,
  Truck,
  Factory,
  Box,
  ListOrdered,
  ArrowRight
} from 'lucide-react';
import { api } from '../../api/client';
import { PublicOrderTrackingInfo, OrderStatus, Order } from '../../types/crm';
import { StatusBadge } from '../../components/ui/StatusBadge';
import {
  DEMO_ORDER_LIST,
  getDemoTracking,
  type TrackableOrderSummary
} from './demoOrders';

interface PublicOrderTrackingPageProps {
  initialOrderCode?: string;
  onBackToCrm?: () => void;
  isLoggedIn?: boolean;
  embedded?: boolean;
}

const milestoneSteps: OrderStatus[] = [
  'Order Confirmed',
  'Processing',
  'Production',
  'Packed',
  'Shipped',
  'In Transit',
  'Delivered'
];

const stepIcon = (status: OrderStatus) => {
  switch (status) {
    case 'Order Confirmed':
      return Package;
    case 'Processing':
      return Clock;
    case 'Production':
      return Factory;
    case 'Packed':
      return Box;
    case 'Shipped':
      return Ship;
    case 'In Transit':
      return Truck;
    case 'Delivered':
      return CheckCircle2;
    default:
      return Package;
  }
};

function orderToSummary(o: Order): TrackableOrderSummary {
  return {
    orderCode: o.orderCode,
    company: o.company,
    country: o.country,
    products: o.products,
    orderStatus: o.orderStatus,
    expectedDelivery: o.expectedDelivery,
    destinationPort: o.destinationPort
  };
}

export const PublicOrderTrackingPage: React.FC<PublicOrderTrackingPageProps> = ({
  initialOrderCode = '',
  onBackToCrm,
  isLoggedIn = false,
  embedded = false
}) => {
  const [trackingData, setTrackingData] = useState<PublicOrderTrackingInfo | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [usingDemo, setUsingDemo] = useState(false);
  const [orderList, setOrderList] = useState<TrackableOrderSummary[]>(DEMO_ORDER_LIST);
  const [listFilter, setListFilter] = useState('');

  const performTracking = async (codeToSearch: string) => {
    const trimmed = codeToSearch.trim();
    if (!trimmed) {
      setErrorMsg('Please enter a valid Order ID (e.g., VO-2026-0182).');
      return;
    }

    setErrorMsg(null);

    try {
      const res = await api.public.trackOrder(trimmed);
      if (res.success) {
        setTrackingData(res.data);
        setUsingDemo(false);
        return;
      }
    } catch {
      // fall through to demo catalog
    }

    const demo = getDemoTracking(trimmed);
    if (demo) {
      setTrackingData(demo);
      setUsingDemo(true);
      setErrorMsg(null);
    } else {
      setTrackingData(null);
      setUsingDemo(false);
      setErrorMsg(`No shipment found for "${trimmed}". Try a sample order from the list.`);
    }
  };

  useEffect(() => {
    const code = initialOrderCode || 'VO-2026-0182';
    performTracking(code);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialOrderCode]);

  useEffect(() => {
    if (!isLoggedIn && !embedded) {
      setOrderList(DEMO_ORDER_LIST);
      return;
    }

    api.orders
      .getOrders({})
      .then(res => {
        if (!res.success || !res.data.length) {
          setOrderList(DEMO_ORDER_LIST);
          return;
        }
        const live = res.data.map(orderToSummary);
        const liveCodes = new Set(live.map(o => o.orderCode.toUpperCase()));
        const demosMissing = DEMO_ORDER_LIST.filter(
          d => !liveCodes.has(d.orderCode.toUpperCase())
        );
        setOrderList([...live, ...demosMissing]);
      })
      .catch(() => setOrderList(DEMO_ORDER_LIST));
  }, [isLoggedIn, embedded]);

  const filteredList = useMemo(() => {
    const q = listFilter.trim().toLowerCase();
    if (!q) return orderList;
    return orderList.filter(
      o =>
        o.orderCode.toLowerCase().includes(q) ||
        o.company.toLowerCase().includes(q) ||
        o.country.toLowerCase().includes(q) ||
        o.products.toLowerCase().includes(q)
    );
  }, [orderList, listFilter]);

  const getStepIndex = (status: OrderStatus): number => {
    const idx = milestoneSteps.indexOf(status);
    return idx === -1 ? 0 : idx;
  };

  const currentStepIdx = trackingData ? getStepIndex(trackingData.orderStatus) : -1;
  const historyByStatus = new Map<OrderStatus, { timestamp: string; notes?: string }>(
    (trackingData?.statusHistory || []).map(h => [
      h.status,
      { timestamp: h.timestamp, notes: h.notes }
    ])
  );

  const content = (
    <div className={`space-y-5 ${embedded ? 'p-6 max-w-7xl mx-auto' : 'max-w-6xl w-full mx-auto px-4 py-8'}`}>
      {!embedded && (
        <div>
          <h2 className="text-base font-semibold text-slate-900">Public Order Tracking</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Select a consignment or enter an order ID to follow shipment milestones.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
        {/* Existing orders list */}
        <aside className="xl:col-span-4 space-y-3">
          <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/80 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ListOrdered className="w-3.5 h-3.5 text-slate-500" />
                <h3 className="text-xs font-semibold text-slate-800">Existing Orders</h3>
              </div>
              <span className="text-[10px] font-semibold text-slate-500 bg-white border border-slate-200 px-2 py-0.5 rounded-full">
                {filteredList.length}
              </span>
            </div>

            <div className="p-3 border-b border-slate-100">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                <input
                  type="text"
                  value={listFilter}
                  onChange={e => setListFilter(e.target.value)}
                  placeholder="Filter orders…"
                  className="w-full pl-8 pr-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-sky-600"
                />
              </div>
            </div>

            <div className="max-h-[28rem] overflow-y-auto divide-y divide-slate-100">
              {filteredList.length === 0 ? (
                <p className="p-4 text-center text-xs text-slate-400">No orders match.</p>
              ) : (
                filteredList.map(order => {
                  const active =
                    trackingData?.orderCode?.toUpperCase() === order.orderCode.toUpperCase();
                  return (
                    <button
                      key={order.orderCode}
                      type="button"
                      onClick={() => performTracking(order.orderCode)}
                      className={`w-full text-left px-4 py-3 transition-colors ${
                        active
                          ? 'bg-sky-50 border-l-2 border-l-sky-600'
                          : 'hover:bg-slate-50 border-l-2 border-l-transparent'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-mono text-[11px] font-semibold text-slate-900">
                          {order.orderCode}
                        </span>
                        <StatusBadge status={order.orderStatus} className="scale-90 origin-right" />
                      </div>
                      <p className="text-xs font-medium text-slate-800 mt-1 truncate">
                        {order.company}
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                        {order.country} · {order.products}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-1.5 inline-flex items-center gap-1">
                        ETA{' '}
                        {order.expectedDelivery
                          ? new Date(order.expectedDelivery).toLocaleDateString([], {
                              month: 'short',
                              day: 'numeric'
                            })
                          : '—'}
                        <ArrowRight className="w-3 h-3" />
                      </p>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          <div className="p-3 bg-amber-50 border border-amber-200/80 rounded-xl text-[11px] text-amber-900">
            Demo consignments <span className="font-semibold">VO-2026-0180 → 0184</span> are
            available even without live API data so you can preview the timeline.
          </div>
        </aside>

        {/* Tracking panel */}
        <section className="xl:col-span-8 space-y-4">
          {errorMsg && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {trackingData && (
            <div className="space-y-4 animate-in fade-in duration-150">
              {usingDemo && (
                <div className="px-3 py-2 rounded-lg bg-sky-50 border border-sky-100 text-[11px] text-sky-800 font-medium">
                  Showing demo tracking preview for {trackingData.orderCode}
                </div>
              )}

              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-4 border-b border-slate-100">
                  <div>
                    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                      Consignment
                    </p>
                    <h3 className="text-lg font-semibold font-mono text-slate-900 mt-0.5">
                      {trackingData.orderCode}
                    </h3>
                    <p className="text-xs text-slate-600 mt-1">
                      {trackingData.customerCompany} · {trackingData.country}
                    </p>
                  </div>
                  <StatusBadge status={trackingData.orderStatus} />
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-4 text-xs">
                  <div className="rounded-lg border border-slate-100 bg-gradient-to-br from-slate-50 to-white p-3">
                    <p className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">
                      Expected Delivery
                    </p>
                    <p className="mt-1 font-semibold text-slate-900 inline-flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-sky-600" />
                      {trackingData.expectedDelivery
                        ? new Date(trackingData.expectedDelivery).toLocaleDateString([], {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })
                        : '—'}
                    </p>
                  </div>
                  <div className="rounded-lg border border-slate-100 bg-gradient-to-br from-teal-50/50 to-white p-3">
                    <p className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">
                      Port
                    </p>
                    <p className="mt-1 font-semibold text-slate-900 inline-flex items-center gap-1.5 truncate">
                      <MapPin className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                      <span className="truncate">{trackingData.destinationPort || '—'}</span>
                    </p>
                  </div>
                  <div className="rounded-lg border border-slate-100 bg-gradient-to-br from-indigo-50/50 to-white p-3">
                    <p className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">
                      Carrier
                    </p>
                    <p className="mt-1 font-semibold text-slate-900 truncate">
                      {trackingData.shippingCarrier || '—'}
                    </p>
                  </div>
                  <div className="rounded-lg border border-slate-100 bg-gradient-to-br from-amber-50/40 to-white p-3">
                    <p className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">
                      BL / AWB
                    </p>
                    <p className="mt-1 font-mono font-semibold text-slate-900 truncate">
                      {trackingData.trackingNumber || 'Pending'}
                    </p>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 text-xs">
                  <p className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">
                    Goods
                  </p>
                  <p className="mt-1 font-medium text-slate-800">
                    {trackingData.products}
                    <span className="text-slate-500 font-normal"> · {trackingData.quantity}</span>
                  </p>
                </div>
              </div>

              {/* Timeline */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
                <div className="flex items-center justify-between mb-5">
                  <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Shipment Timeline
                  </h4>
                  <span className="text-[11px] font-semibold text-slate-600 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-full">
                    Step {Math.max(currentStepIdx + 1, 0)} / {milestoneSteps.length}
                  </span>
                </div>

                <ol className="relative">
                  {milestoneSteps.map((step, idx) => {
                    const Icon = stepIcon(step);
                    const isDone = idx < currentStepIdx;
                    const isCurrent = idx === currentStepIdx;
                    const isUpcoming = idx > currentStepIdx;
                    const entry = historyByStatus.get(step);
                    const isLast = idx === milestoneSteps.length - 1;

                    return (
                      <li key={step} className="relative flex gap-4 pb-6 last:pb-0">
                        {!isLast && (
                          <span
                            className={`absolute left-[15px] top-8 w-0.5 h-[calc(100%-1.25rem)] ${
                              isDone || isCurrent ? 'bg-sky-400' : 'bg-slate-200'
                            }`}
                            aria-hidden
                          />
                        )}

                        <div
                          className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center shrink-0 border-2 ${
                            isCurrent
                              ? 'bg-sky-600 border-sky-600 text-white shadow-sm ring-4 ring-sky-100'
                              : isDone
                                ? 'bg-emerald-500 border-emerald-500 text-white'
                                : 'bg-white border-slate-200 text-slate-400'
                          }`}
                        >
                          {isDone ? (
                            <CheckCircle2 className="w-4 h-4" />
                          ) : (
                            <Icon className="w-3.5 h-3.5" />
                          )}
                        </div>

                        <div
                          className={`flex-1 min-w-0 rounded-xl border px-3.5 py-3 ${
                            isCurrent
                              ? 'border-sky-200 bg-sky-50/70 shadow-xs'
                              : isDone
                                ? 'border-emerald-100 bg-emerald-50/40'
                                : 'border-slate-100 bg-slate-50/50'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p
                                className={`text-xs font-semibold ${
                                  isUpcoming ? 'text-slate-400' : 'text-slate-900'
                                }`}
                              >
                                {step}
                              </p>
                              <p className="text-[11px] text-slate-500 mt-0.5">
                                {entry?.notes
                                  ? entry.notes
                                  : isCurrent
                                    ? 'In progress now'
                                    : isDone
                                      ? 'Milestone completed'
                                      : 'Upcoming stage'}
                              </p>
                            </div>
                            <div className="text-right shrink-0">
                              {isCurrent && (
                                <span className="inline-flex text-[10px] font-semibold bg-sky-100 text-sky-800 px-2 py-0.5 rounded-full border border-sky-200/70">
                                  Current
                                </span>
                              )}
                              {entry?.timestamp && (
                                <p className="text-[10px] text-slate-400 mt-1">
                                  {new Date(entry.timestamp).toLocaleString([], {
                                    month: 'short',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ol>
              </div>

              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-start gap-2.5 text-[11px] text-slate-500">
                <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                <span>
                  Public tracking shows shipment progress only. Pricing, internal notes, and CRM
                  communications stay private.
                </span>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );

  if (embedded) return content;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-white border-b border-slate-200 px-6 py-4 shrink-0">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-sky-600 to-teal-600 text-white flex items-center justify-center font-bold text-base shadow-xs">
              VO
            </div>
            <div>
              <h1 className="text-sm font-semibold text-slate-800 tracking-tight leading-none">
                VIDEHA OVERSEAS
              </h1>
              <p className="text-[11px] text-slate-500 font-medium mt-1">
                Public Consignment Tracking
              </p>
            </div>
          </div>
          {isLoggedIn && onBackToCrm && (
            <button
              onClick={onBackToCrm}
              className="text-xs font-medium text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg transition-colors"
            >
              Return to CRM
            </button>
          )}
        </div>
      </header>
      <main className="flex-1">{content}</main>
      <footer className="border-t border-slate-200 bg-white py-5 px-6 text-center text-xs text-slate-400 shrink-0">
        <p>© 2026 Videha Overseas. Global Export Operations & Trade Logistics.</p>
      </footer>
    </div>
  );
};
