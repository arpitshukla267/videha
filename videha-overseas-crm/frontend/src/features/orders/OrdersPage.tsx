import React, { useState, useEffect } from 'react';
import {
  Package,
  Plus,
  Search,
  ExternalLink,
  Eye,
  Clock,
  Ship,
  Truck,
  Calendar,
  DollarSign,
  ArrowRight,
  LayoutGrid,
  List,
  UserCheck,
  Download,
  Upload
} from 'lucide-react';
import { api } from '../../api/client';
import { Order, OrderStatus, OrderStatusHistory, User as CrmUser, Shipment, BillStatus } from '../../types/crm';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Modal } from '../../components/ui/Modal';
import { SearchableSelect } from '../../components/ui/SearchableSelect';
import { DateTimePicker } from '../../components/ui/DateTimePicker';
import { useAuth } from '../../context/AuthContext';
import { NavigationTab } from '../../components/layout/Sidebar';
import { CRM_COUNTRIES } from '../../constants/countries';
import { handleConflictWithReload, alertSaveError } from '../../lib/apiErrors';
import { PaginationBar } from '../../components/ui/PaginationBar';
import { createClientRequestId as generateClientRequestId } from '../../lib/clientRequestId';
import { ImportWizard } from '../../components/import/ImportWizard';
import { LIST_PAGE_SIZE } from '../../lib/pagination';

interface OrdersPageProps {
  onNavigate: (tab: NavigationTab, entityId?: string) => void;
  onOpenPublicTracking: (orderCode: string) => void;
  focusOrderId?: string | null;
  onFocusConsumed?: () => void;
}

// Manifest palette — an ink/marine/brass system tied to freight paperwork,
// deliberately not the generic emerald-SaaS or terracotta-AI defaults.
const INK = '#182430';
const INK_SOFT = '#4B5563';
const INK_FAINT = '#8B8D85';
const LINE = '#E2DED2';
const PAPER = '#F6F4EE';
const MARINE = '#155A52';
const MARINE_DARK = '#0F4640';
const RUST = '#A6402F';

// Left-edge accent per order status, doubling as the milestone-history rail color.
function orderStatusAccent(status: OrderStatus): string {
  switch (status) {
    case 'Delivered':
      return 'bg-[#155A52]';
    case 'Cancelled':
      return 'bg-[#A6402F]';
    case 'In Transit':
    case 'Shipped':
      return 'bg-[#2B6C8C]';
    case 'Processing':
    case 'Production':
    case 'Packed':
      return 'bg-[#9C6B25]';
    case 'Order Confirmed':
      return 'bg-[#3D7F76]';
    default:
      return 'bg-[#C9C2B2]';
  }
}

export const OrdersPage: React.FC<OrdersPageProps> = ({
  onNavigate,
  onOpenPublicTracking,
  focusOrderId,
  onFocusConsumed
}) => {
  const { user, hasPermission } = useAuth();

  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalOrders, setTotalOrders] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [pageLimit] = useState(LIST_PAGE_SIZE);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [countryFilter, setCountryFilter] = useState('all');

  // View Mode: Cards (default) or Table
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');

  const [teamMembers, setTeamMembers] = useState<CrmUser[]>([]);

  // Create Order Modal
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createRequestId, setCreateRequestId] = useState(generateClientRequestId);
  const [newOrderForm, setNewOrderForm] = useState({
    customerName: '',
    company: '',
    phone: '',
    email: '',
    country: 'United Arab Emirates',
    products: '',
    quantity: '1x 40ft High Cube Container',
    orderValue: 45000,
    currency: 'USD',
    assignedMemberId: '',
    orderStatus: 'Order Confirmed' as OrderStatus,
    expectedDelivery: new Date(Date.now() + 86400000 * 20).toISOString().slice(0, 10),
    destinationPort: 'Jebel Ali Port, Dubai',
    shippingCarrier: 'Maersk Line',
    trackingNumber: '',
    notes: ''
  });
  const [isSubmittingCreate, setIsSubmittingCreate] = useState(false);

  // Order Details / Status Update Modal
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [orderDetail, setOrderDetail] = useState<{
    order: Order;
    history: OrderStatusHistory[];
    shipments?: Shipment[];
  } | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);

  // Status transition form inside modal
  const [nextStatus, setNextStatus] = useState<OrderStatus>('Processing');
  const [statusNotes, setStatusNotes] = useState('');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [billingStatus, setBillingStatus] = useState<BillStatus>('pending');
  const [amountPaid, setAmountPaid] = useState('0');
  const [isUpdatingPayment, setIsUpdatingPayment] = useState(false);

  const billingStatusOptions = [
    { value: 'draft', label: 'Draft' },
    { value: 'pending', label: 'Pending' },
    { value: 'partially_paid', label: 'Partially Paid' },
    { value: 'paid', label: 'Paid' },
    { value: 'overdue', label: 'Overdue' },
    { value: 'void', label: 'Void' }
  ];
  const [isExporting, setIsExporting] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);

  useEffect(() => {
    api.users
      .getUsers({ limit: 100, page: 1 })
      .then(res => {
        if (res.success) setTeamMembers(res.data);
      })
      .catch(() => {});
  }, []);

  const fetchOrders = async (page = currentPage) => {
    setIsLoading(true);
    try {
      const res = await api.orders.getOrders({
        search,
        status: statusFilter,
        country: countryFilter,
        page,
        limit: pageLimit
      });
      if (res.success) {
        setOrders(res.data);
        setTotalOrders(res.total);
        setCurrentPage(res.page);
        setTotalPages(res.totalPages);
      }
    } catch (err) {
      console.error('Failed to fetch orders:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter, countryFilter]);

  useEffect(() => {
    fetchOrders(currentPage);
  }, [search, statusFilter, countryFilter, currentPage]);

  const handleExportCsv = async () => {
    setIsExporting(true);
    try {
      await api.orders.exportCsv({
        search: search.trim() || undefined,
        status: statusFilter,
        country: countryFilter
      });
    } catch (err: unknown) {
      alertSaveError(err, 'Failed to export orders');
    } finally {
      setIsExporting(false);
    }
  };

  const handleOpenDetail = async (id: string) => {
    setSelectedOrderId(id);
    setIsLoadingDetail(true);
    try {
      const res = await api.orders.getOrder(id);
      if (res.success) {
        setOrderDetail(res.data);
        setNextStatus(res.data.order.orderStatus);
        setBillingStatus(res.data.order.billingStatus || 'pending');
        setAmountPaid(String(res.data.order.amountPaid || 0));
      }
    } catch (err) {
      console.error('Failed to load order details:', err);
    } finally {
      setIsLoadingDetail(false);
    }
  };

  useEffect(() => {
    if (!focusOrderId) return;
    handleOpenDetail(focusOrderId).finally(() => onFocusConsumed?.());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusOrderId]);

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingCreate(true);
    try {
      const res = await api.orders.createOrder({
        ...newOrderForm,
        assignedMemberId: newOrderForm.assignedMemberId || user?.id,
        clientRequestId: createRequestId
      });
      if (res.success) {
        setIsCreateOpen(false);
        setCreateRequestId(generateClientRequestId());
        setNewOrderForm({
          customerName: '',
          company: '',
          phone: '',
          email: '',
          country: 'United Arab Emirates',
          products: '',
          quantity: '1x 40ft High Cube Container',
          orderValue: 45000,
          currency: 'USD',
          assignedMemberId: '',
          orderStatus: 'Order Confirmed',
          expectedDelivery: new Date(Date.now() + 86400000 * 20).toISOString().slice(0, 10),
          destinationPort: 'Jebel Ali Port, Dubai',
          shippingCarrier: 'Maersk Line',
          trackingNumber: '',
          notes: ''
        });
        fetchOrders(1);
      }
    } catch (err: unknown) {
      alertSaveError(err, 'Failed to create order');
    } finally {
      setIsSubmittingCreate(false);
    }
  };

  const handleUpdatePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderDetail) return;
    const paid = Number(amountPaid) || 0;
    const orderTotal = Number(orderDetail.order.totalAmount || orderDetail.order.orderValue) || 0;
    if (paid > orderTotal) {
      alert('Amount paid cannot exceed the order total.');
      return;
    }
    setIsUpdatingPayment(true);
    try {
      const res = await api.orders.updateOrder(orderDetail.order.id, {
        billingStatus,
        amountPaid: paid,
        revision: orderDetail.order.revision
      });
      if (res.success) {
        await handleOpenDetail(orderDetail.order.id);
        fetchOrders(currentPage);
      }
    } catch (err: unknown) {
      await handleConflictWithReload(
        err,
        () => handleOpenDetail(orderDetail.order.id),
        'Failed to update payment status'
      );
    } finally {
      setIsUpdatingPayment(false);
    }
  };

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderDetail) return;
    setIsUpdatingStatus(true);
    try {
      const res = await api.orders.updateStatus(
        orderDetail.order.id,
        nextStatus,
        statusNotes,
        orderDetail.order.revision
      );
      if (res.success) {
        setOrderDetail(res.data);
        setStatusNotes('');
        fetchOrders(currentPage);
      }
    } catch (err: unknown) {
      await handleConflictWithReload(
        err,
        () => handleOpenDetail(orderDetail.order.id),
        'Failed to update order status'
      );
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const orderStatuses: OrderStatus[] = [
    'Draft',
    'Order Confirmed',
    'Processing',
    'Production',
    'Packed',
    'Shipped',
    'In Transit',
    'Delivered',
    'Cancelled'
  ];

  const statusOptions = orderStatuses.map(s => ({ value: s, label: s }));
  const countryOptions = CRM_COUNTRIES.map(c => ({ value: c, label: c }));
  const memberOptions = teamMembers.map(m => ({
    value: m.id,
    label: m.name,
    description: m.roleDisplayName || m.roleName
  }));

  // Shared field styling for the create-order form — a plain underline
  // rather than a boxed input, closer to filling out a shipping manifest.
  const fieldClass =
    'w-full px-0 py-2 bg-transparent border-0 border-b border-[#E2DED2] rounded-none text-sm text-[#182430] focus:outline-none focus:border-[#155A52] transition-colors placeholder:text-[#8B8D85]';
  const labelClass = 'block text-xs text-[#4B5563] mb-1.5';

  return (
    <div className="p-6 sm:p-8 space-y-6" style={{ backgroundColor: PAPER }}>
      {/* Header */}
      <div className="flex flex-col gap-5 pb-6 border-b" style={{ borderColor: LINE }}>
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight" style={{ color: INK }}>
              Consignments
            </h1>
            <p className="text-sm mt-1.5 max-w-md" style={{ color: INK_SOFT }}>
              Every overseas order, its shipping documents, and delivery milestones in one place.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* View Mode Toggle */}
            <div className="flex items-center gap-0.5 bg-white border rounded-md p-0.5" style={{ borderColor: LINE }}>
              <button
                onClick={() => setViewMode('cards')}
                className="px-2.5 py-1.5 rounded text-sm font-medium flex items-center gap-1.5 transition-colors"
                style={
                  viewMode === 'cards'
                    ? { backgroundColor: INK, color: '#fff' }
                    : { color: INK_SOFT }
                }
                title="Card view"
              >
                <LayoutGrid className="w-4 h-4" />
                <span className="hidden md:inline">Cards</span>
              </button>
              <button
                onClick={() => setViewMode('table')}
                className="px-2.5 py-1.5 rounded text-sm font-medium flex items-center gap-1.5 transition-colors"
                style={
                  viewMode === 'table'
                    ? { backgroundColor: INK, color: '#fff' }
                    : { color: INK_SOFT }
                }
                title="Table view"
              >
                <List className="w-4 h-4" />
                <span className="hidden md:inline">Table</span>
              </button>
            </div>

            {hasPermission('orders.create') && (
              <button
                type="button"
                onClick={() => setIsImportOpen(true)}
                className=" inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-white hover:bg-[#F6F4EE] border rounded-md text-sm font-medium transition-colors"
                style={{ borderColor: LINE, color: INK }}
              >
                <Upload className="w-4 h-4" style={{ color: INK_SOFT }} />
                Import
              </button>
            )}

            {hasPermission('orders.view') && (
              <button
                type="button"
                onClick={handleExportCsv}
                disabled={isExporting}
                className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-white hover:bg-[#F6F4EE] border rounded-md text-sm font-medium transition-colors disabled:opacity-60"
                style={{ borderColor: LINE, color: INK }}
              >
                <Download className="w-4 h-4" style={{ color: INK_SOFT }} />
                {isExporting ? 'Exporting…' : 'Export'}
              </button>
            )}

            {hasPermission('orders.create') && (
              <button
                onClick={() => {
                  setCreateRequestId(generateClientRequestId());
                  setIsCreateOpen(true);
                }}
                className="inline-flex items-center gap-2 px-4 py-2.5 text-white rounded-md text-sm font-medium transition-colors"
                style={{ backgroundColor: MARINE }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = MARINE_DARK)}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = MARINE)}
              >
                <Plus className="w-4 h-4" />
                <span>New order</span>
              </button>
            )}
          </div>
        </div>

        {/* Filter Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: INK_FAINT }} />
            <input
              type="text"
              placeholder="Search order code, company, products…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 bg-white border rounded-md text-sm focus:outline-none transition-shadow"
              style={{ borderColor: LINE, color: INK }}
            />
          </div>

          <SearchableSelect
            options={[{ value: 'all', label: 'All order statuses' }, ...statusOptions]}
            value={statusFilter}
            onChange={setStatusFilter}
            placeholder="Status"
            searchPlaceholder="Search status…"
          />

          <SearchableSelect
            options={[{ value: 'all', label: 'All countries' }, ...countryOptions]}
            value={countryFilter}
            onChange={setCountryFilter}
            placeholder="Country"
            searchPlaceholder="Search countries…"
          />
        </div>
      </div>

      {/* Content: Cards View (Default) or Table View */}
      {viewMode === 'cards' ? (
        <div>
          {isLoading ? (
            <div className="py-16 text-center text-sm bg-white border rounded-lg" style={{ borderColor: LINE, color: INK_FAINT }}>
              Loading consignments…
            </div>
          ) : orders.length === 0 ? (
            <div className="py-16 text-center bg-white border rounded-lg" style={{ borderColor: LINE }}>
              <Package className="w-8 h-8 mx-auto mb-3" style={{ color: INK_FAINT }} />
              <p className="text-sm font-medium" style={{ color: INK }}>No orders match these filters</p>
              <p className="text-xs mt-1" style={{ color: INK_FAINT }}>Try widening the search or clearing a filter.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {orders.map(order => (
                <div
                  key={order.id}
                  onClick={() => handleOpenDetail(order.id)}
                  className="group relative bg-white border rounded-lg cursor-pointer flex flex-col overflow-hidden transition-colors hover:border-[#182430]/30"
                  style={{ borderColor: LINE }}
                >
                  {/* Milestone rail + tag punch-hole */}
                  <div className={`h-[3px] w-full ${orderStatusAccent(order.orderStatus)}`} />
                  {/* <span
                    className="absolute left-4 top-0 -translate-y-1/2 w-2.5 h-2.5 rounded-full border"
                    style={{ backgroundColor: PAPER, borderColor: LINE }}
                  /> */}

                  <div className="px-4 pt-4 pb-3.5 flex-1 flex flex-col gap-3">
                    {/* Order code + status */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-[15px] font-medium tracking-tight" style={{ color: INK }}>
                          {order.orderCode}
                        </p>
                        <p className="text-xs mt-0.5 truncate" style={{ color: INK_FAINT }}>
                          {order.company}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <StatusBadge status={order.orderStatus} />
                        {order.billingStatus && <StatusBadge status={order.billingStatus} />}
                      </div>
                    </div>

                    {/* Buyer */}
                    <p className="text-[15px] font-semibold leading-snug truncate" style={{ color: INK }}>
                      {order.customerName}
                    </p>

                    {/* Route */}
                    <div className="flex items-center gap-1.5 text-sm min-w-0" style={{ color: INK_SOFT }}>
                      <Truck className="w-3.5 h-3.5 shrink-0" style={{ color: INK_FAINT }} />
                      <span className="truncate">{order.country}</span>
                      {order.destinationPort && (
                        <>
                          <ArrowRight className="w-3 h-3 shrink-0" style={{ color: INK_FAINT }} />
                          <span className="truncate">{order.destinationPort}</span>
                        </>
                      )}
                    </div>

                    {/* Consignment line */}
                    <div className="border-t border-dashed pt-3" style={{ borderColor: LINE }}>
                      <div className="flex items-baseline justify-between gap-2">
                        <p className="text-sm font-medium truncate" style={{ color: INK }} title={order.products}>
                          {order.products}
                        </p>
                        <span className="text-xs shrink-0" style={{ color: INK_SOFT }}>
                          {order.quantity}
                        </span>
                      </div>
                    </div>

                    {/* Ledger: total / paid / due */}
                    <div className="grid grid-cols-3 border-t pt-3 text-sm" style={{ borderColor: LINE }}>
                      <div>
                        <p className="text-xs" style={{ color: INK_FAINT }}>Total</p>
                        <p className="font-medium" style={{ color: INK }}>
                          ${Number(order.totalAmount || order.orderValue).toLocaleString()}
                        </p>
                      </div>
                      <div className="border-l pl-3" style={{ borderColor: LINE }}>
                        <p className="text-xs" style={{ color: INK_FAINT }}>Paid</p>
                        <p className="font-medium" style={{ color: MARINE }}>
                          ${Number(order.amountPaid || 0).toLocaleString()}
                        </p>
                      </div>
                      <div className="border-l pl-3" style={{ borderColor: LINE }}>
                        <p className="text-xs" style={{ color: INK_FAINT }}>Due</p>
                        <p className="font-medium" style={{ color: RUST }}>
                          ${Number(order.amountDue ?? order.orderValue).toLocaleString()}
                        </p>
                      </div>
                    </div>

                    {/* Delivery + carrier */}
                    <div className="flex items-center justify-between gap-2 text-xs border-t pt-3" style={{ borderColor: LINE, color: INK_SOFT }}>
                      <span className="flex items-center gap-1.5 shrink-0">
                        <Calendar className="w-3.5 h-3.5" style={{ color: INK_FAINT }} />
                        {new Date(order.expectedDelivery).toLocaleDateString([], {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </span>
                      {order.trackingNumber && (
                        <span className="flex items-center gap-1.5 truncate">
                          <Ship className="w-3.5 h-3.5 shrink-0" style={{ color: INK_FAINT }} />
                          {order.trackingNumber}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Card Footer */}
                  <div className="flex items-center justify-between gap-2 px-4 py-3 border-t" style={{ borderColor: LINE }}>
                    <span className="flex items-center gap-1.5 text-xs truncate min-w-0" style={{ color: INK_SOFT }}>
                      <UserCheck className="w-3.5 h-3.5 shrink-0" style={{ color: INK_FAINT }} />
                      <span className="truncate">{order.assignedMemberName || 'Unassigned'}</span>
                    </span>

                    <div className="flex items-center gap-2 shrink-0" onClick={e => e.stopPropagation()}>
                      <button
                        onClick={() => handleOpenDetail(order.id)}
                        className="text-xs font-medium transition-colors hover:underline"
                        style={{ color: MARINE }}
                      >
                        Manage
                      </button>
                      <span style={{ color: LINE }}>|</span>
                      <button
                        onClick={() => onOpenPublicTracking(order.orderCode)}
                        className="p-1 transition-colors hover:text-[#182430]"
                        style={{ color: INK_SOFT }}
                        title="Open public tracking portal"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* Orders Table */
        <div className="bg-white border rounded-lg overflow-hidden" style={{ borderColor: LINE }}>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b" style={{ borderColor: LINE, color: INK_FAINT }}>
                  <th className="py-3 px-4 font-medium text-xs">Order</th>
                  <th className="py-3 px-4 font-medium text-xs">Buyer</th>
                  <th className="py-3 px-4 font-medium text-xs">Consignment</th>
                  <th className="py-3 px-4 font-medium text-xs">Destination</th>
                  <th className="py-3 px-4 font-medium text-xs">Total</th>
                  <th className="py-3 px-4 font-medium text-xs">Paid / due</th>
                  <th className="py-3 px-4 font-medium text-xs">Status</th>
                  <th className="py-3 px-4 font-medium text-xs">Billing</th>
                  <th className="py-3 px-4 font-medium text-xs">Delivery</th>
                  <th className="py-3 px-4 font-medium text-xs">Owner</th>
                  <th className="py-3 px-4 font-medium text-xs text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: LINE }}>
                {isLoading ? (
                  <tr>
                    <td colSpan={11} className="py-14 text-center text-sm" style={{ color: INK_FAINT }}>
                      Loading consignments…
                    </td>
                  </tr>
                ) : orders.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="py-14 text-center text-sm" style={{ color: INK_FAINT }}>
                      No orders match these filters.
                    </td>
                  </tr>
                ) : (
                  orders.map(order => (
                    <tr
                      key={order.id}
                      className="cursor-pointer transition-colors hover:bg-[#F6F4EE]"
                      onClick={() => handleOpenDetail(order.id)}
                    >
                      <td className="py-4 px-4 font-medium whitespace-nowrap text-sm" style={{ color: INK }}>
                        {order.orderCode}
                      </td>
                      <td className="py-4 px-4 whitespace-nowrap">
                        <p className="font-medium text-sm" style={{ color: INK }}>{order.company}</p>
                        <p className="text-xs mt-0.5" style={{ color: INK_FAINT }}>{order.customerName}</p>
                      </td>
                      <td className="py-4 px-4 max-w-xs truncate" title={order.products}>
                        <span className="font-medium text-sm" style={{ color: INK }}>{order.products}</span>
                        <span className="text-xs block mt-0.5" style={{ color: INK_FAINT }}>{order.quantity}</span>
                      </td>
                      <td className="py-4 px-4 whitespace-nowrap text-sm" style={{ color: INK_SOFT }}>
                        <span>{order.country}</span>
                        {order.destinationPort && (
                          <span className="text-xs block truncate max-w-[130px] mt-0.5" style={{ color: INK_FAINT }}>
                            {order.destinationPort}
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-4 whitespace-nowrap font-medium text-sm" style={{ color: INK }}>
                        ${Number(order.totalAmount || order.orderValue).toLocaleString()}
                      </td>
                      <td className="py-4 px-4 whitespace-nowrap text-sm">
                        <span style={{ color: MARINE }}>${Number(order.amountPaid || 0).toLocaleString()}</span>
                        <span style={{ color: LINE }}> / </span>
                        <span style={{ color: RUST }}>${Number(order.amountDue ?? order.orderValue).toLocaleString()}</span>
                      </td>
                      <td className="py-4 px-4 whitespace-nowrap">
                        <StatusBadge status={order.orderStatus} />
                      </td>
                      <td className="py-4 px-4 whitespace-nowrap">
                        {order.billingStatus ? <StatusBadge status={order.billingStatus} /> : <span className="text-sm" style={{ color: INK_FAINT }}>—</span>}
                      </td>
                      <td className="py-4 px-4 whitespace-nowrap text-sm" style={{ color: INK_SOFT }}>
                        {new Date(order.expectedDelivery).toLocaleDateString([], {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </td>
                      <td className="py-4 px-4 whitespace-nowrap text-sm" style={{ color: INK_SOFT }}>
                        {order.assignedMemberName || 'Unassigned'}
                      </td>
                      <td className="py-4 px-4 text-right whitespace-nowrap" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleOpenDetail(order.id)}
                            className="p-2 rounded-md transition-colors hover:bg-[#F6F4EE]"
                            style={{ color: INK_SOFT }}
                            title="Manage order status and timeline"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onOpenPublicTracking(order.orderCode)}
                            className="p-2 rounded-md transition-colors hover:bg-[#F6F4EE]"
                            style={{ color: INK_SOFT }}
                            title="Open public tracking portal"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <PaginationBar
        page={currentPage}
        totalPages={totalPages}
        total={totalOrders}
        isLoading={isLoading}
        onPageChange={page => setCurrentPage(page)}
        label="orders"
      />

      {/* CREATE ORDER MODAL */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Create new consignment order"
        subtitle="Record the buyer's purchase order, delivery timeline, and shipping port"
        maxWidth="3xl"
      >
        <form onSubmit={handleCreateOrder} className="space-y-6 text-sm">
          {/* Section: buyer */}
          <div className="space-y-4">
            <p className="text-sm font-semibold pb-2 border-b" style={{ color: INK, borderColor: LINE }}>Buyer details</p>
            <div className="grid grid-cols-2 gap-x-6 gap-y-4">
              <div>
                <label className={labelClass}>Company / buyer</label>
                <input
                  type="text"
                  required
                  value={newOrderForm.company}
                  onChange={e => setNewOrderForm({ ...newOrderForm, company: e.target.value })}
                  placeholder="Al-Madina Hospitality Group"
                  className={fieldClass}
                />
              </div>
              <div>
                <label className={labelClass}>Customer name</label>
                <input
                  type="text"
                  required
                  value={newOrderForm.customerName}
                  onChange={e => setNewOrderForm({ ...newOrderForm, customerName: e.target.value })}
                  placeholder="Sheikh Abdullah"
                  className={fieldClass}
                />
              </div>
              <div>
                <label className={labelClass}>Phone</label>
                <input
                  type="text"
                  value={newOrderForm.phone}
                  onChange={e => setNewOrderForm({ ...newOrderForm, phone: e.target.value })}
                  placeholder="+971 4 332 9900"
                  className={fieldClass}
                />
              </div>
              <div>
                <label className={labelClass}>Email</label>
                <input
                  type="email"
                  value={newOrderForm.email}
                  onChange={e => setNewOrderForm({ ...newOrderForm, email: e.target.value })}
                  placeholder="orders@company.com"
                  className={fieldClass}
                />
              </div>
              <div>
                <label className={labelClass}>Destination country</label>
                <SearchableSelect
                  options={countryOptions}
                  value={newOrderForm.country}
                  onChange={country => setNewOrderForm({ ...newOrderForm, country })}
                  placeholder="Select country"
                  searchPlaceholder="Search countries…"
                />
              </div>
            </div>
          </div>

          {/* Section: consignment */}
          <div className="space-y-4">
            <p className="text-sm font-semibold pb-2 border-b" style={{ color: INK, borderColor: LINE }}>Consignment</p>
            <div className="grid grid-cols-2 gap-x-6 gap-y-4">
              <div>
                <label className={labelClass}>Products ordered</label>
                <input
                  type="text"
                  required
                  value={newOrderForm.products}
                  onChange={e => setNewOrderForm({ ...newOrderForm, products: e.target.value })}
                  placeholder="Handmade antique brass tableware, chafing dishes"
                  className={fieldClass}
                />
              </div>
              <div>
                <label className={labelClass}>Quantity / volume</label>
                <input
                  type="text"
                  value={newOrderForm.quantity}
                  onChange={e => setNewOrderForm({ ...newOrderForm, quantity: e.target.value })}
                  placeholder="1,200 sets or 2x 40ft containers"
                  className={fieldClass}
                />
              </div>
              <div>
                <label className={labelClass}>Order value (USD)</label>
                <input
                  type="number"
                  value={newOrderForm.orderValue}
                  onChange={e => setNewOrderForm({ ...newOrderForm, orderValue: Number(e.target.value) })}
                  className={`${fieldClass} font-mono`}
                />
              </div>
              <div>
                <label className={labelClass}>Expected delivery date</label>
                <DateTimePicker
                  value={newOrderForm.expectedDelivery}
                  onChange={expectedDelivery => setNewOrderForm({ ...newOrderForm, expectedDelivery })}
                  placeholder="Pick delivery date"
                />
              </div>
              <div>
                <label className={labelClass}>Assigned member</label>
                <SearchableSelect
                  options={memberOptions}
                  value={newOrderForm.assignedMemberId}
                  onChange={assignedMemberId => setNewOrderForm({ ...newOrderForm, assignedMemberId })}
                  placeholder="Select assignee"
                  searchPlaceholder="Search members…"
                  allowClear
                />
              </div>
            </div>
          </div>

          {/* Section: shipping */}
          <div className="space-y-4">
            <p className="text-sm font-semibold pb-2 border-b" style={{ color: INK, borderColor: LINE }}>Shipping and logistics</p>
            <div className="grid grid-cols-3 gap-x-6 gap-y-4">
              <div>
                <label className={labelClass}>Destination port</label>
                <input
                  type="text"
                  value={newOrderForm.destinationPort}
                  onChange={e => setNewOrderForm({ ...newOrderForm, destinationPort: e.target.value })}
                  placeholder="Jebel Ali Port, Dubai"
                  className={fieldClass}
                />
              </div>
              <div>
                <label className={labelClass}>Shipping carrier</label>
                <input
                  type="text"
                  value={newOrderForm.shippingCarrier}
                  onChange={e => setNewOrderForm({ ...newOrderForm, shippingCarrier: e.target.value })}
                  placeholder="Maersk / MSC / DHL Global"
                  className={fieldClass}
                />
              </div>
              <div>
                <label className={labelClass}>Bill of lading / tracking #</label>
                <input
                  type="text"
                  value={newOrderForm.trackingNumber}
                  onChange={e => setNewOrderForm({ ...newOrderForm, trackingNumber: e.target.value })}
                  placeholder="MAEU7612093"
                  className={`${fieldClass} font-mono`}
                />
              </div>
            </div>
            <div>
              <label className={labelClass}>Internal order notes</label>
              <textarea
                rows={2}
                value={newOrderForm.notes}
                onChange={e => setNewOrderForm({ ...newOrderForm, notes: e.target.value })}
                placeholder="Fumigation certifications, palletization instructions, etc."
                className={`${fieldClass} resize-none`}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t" style={{ borderColor: LINE }}>
            <button
              type="button"
              onClick={() => setIsCreateOpen(false)}
              className="px-4 py-2.5 rounded-md border font-medium text-sm transition-colors hover:bg-[#F6F4EE]"
              style={{ borderColor: LINE, color: INK }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmittingCreate}
              className="px-5 py-2.5 rounded-md text-white font-medium text-sm disabled:opacity-50 transition-colors"
              style={{ backgroundColor: MARINE }}
            >
              {isSubmittingCreate ? 'Saving order…' : 'Create consignment order'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ORDER DETAILS & STATUS WORKFLOW MODAL */}
      <Modal
        isOpen={!!selectedOrderId}
        onClose={() => {
          setSelectedOrderId(null);
          setOrderDetail(null);
        }}
        title={orderDetail ? `${orderDetail.order.orderCode} · ${orderDetail.order.company}` : 'Order details'}
        subtitle={orderDetail ? `Destination: ${orderDetail.order.country} · Expected delivery: ${new Date(orderDetail.order.expectedDelivery).toLocaleDateString()}` : ''}
        maxWidth="3xl"
      >
        {isLoadingDetail || !orderDetail ? (
          <div className="py-12 text-center text-sm" style={{ color: INK_FAINT }}>Loading order timeline…</div>
        ) : (
          <div className="space-y-5 text-sm">
            {/* Top Quick Actions Bar */}
            <div className="relative overflow-hidden flex flex-wrap items-center justify-between p-4 border rounded-lg gap-2" style={{ borderColor: LINE, backgroundColor: PAPER }}>
              <span className={`absolute inset-y-0 left-0 w-1 ${orderStatusAccent(orderDetail.order.orderStatus)}`} />
              <div className="flex items-center gap-2 flex-wrap pl-2">
                <span className="font-medium text-sm" style={{ color: INK_SOFT }}>Order status:</span>
                <StatusBadge status={orderDetail.order.orderStatus} />
                <span className="font-medium ml-2 text-sm" style={{ color: INK_SOFT }}>Billing:</span>
                {orderDetail.order.billingStatus ? (
                  <StatusBadge status={orderDetail.order.billingStatus} />
                ) : (
                  <span className="text-sm" style={{ color: INK_FAINT }}>Pending</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {orderDetail.order.billId && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedOrderId(null);
                      onNavigate('bills');
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border rounded-md font-medium text-sm transition-colors hover:bg-[#F6F4EE]"
                    style={{ borderColor: LINE, color: INK }}
                  >
                    <DollarSign className="w-4 h-4" style={{ color: INK_SOFT }} />
                    <span>View bill / invoice</span>
                  </button>
                )}
                <button
                  onClick={() => onOpenPublicTracking(orderDetail.order.orderCode)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border rounded-md font-medium text-sm transition-colors hover:bg-[#F6F4EE]"
                  style={{ borderColor: LINE, color: INK }}
                >
                  <ExternalLink className="w-4 h-4" style={{ color: INK_SOFT }} />
                  <span>Public tracker</span>
                </button>
              </div>
            </div>

            {/* Financial Overview */}
            <div className="grid grid-cols-3 p-4 border rounded-lg text-sm" style={{ borderColor: LINE }}>
              <div>
                <span className="text-xs block" style={{ color: INK_FAINT }}>Total order value</span>
                <span className="text-base font-medium block mt-1" style={{ color: INK }}>
                  ${Number(orderDetail.order.totalAmount || orderDetail.order.orderValue).toLocaleString()} {orderDetail.order.currency}
                </span>
              </div>
              <div className="border-l pl-4" style={{ borderColor: LINE }}>
                <span className="text-xs block" style={{ color: INK_FAINT }}>Amount paid</span>
                <span className="text-base font-medium block mt-1" style={{ color: MARINE }}>
                  ${Number(orderDetail.order.amountPaid || 0).toLocaleString()} {orderDetail.order.currency}
                </span>
              </div>
              <div className="border-l pl-4" style={{ borderColor: LINE }}>
                <span className="text-xs block" style={{ color: INK_FAINT }}>Amount due</span>
                <span className="text-base font-medium block mt-1" style={{ color: RUST }}>
                  ${Number(orderDetail.order.amountDue ?? orderDetail.order.orderValue).toLocaleString()} {orderDetail.order.currency}
                </span>
              </div>
            </div>

            {/* Consignment Profile */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 border rounded-lg" style={{ borderColor: LINE }}>
              <div>
                <span className="text-xs block" style={{ color: INK_FAINT }}>Customer</span>
                <span className="font-medium block mt-1 text-sm" style={{ color: INK }}>{orderDetail.order.customerName}</span>
              </div>
              <div>
                <span className="text-xs block" style={{ color: INK_FAINT }}>Phone</span>
                <span className="font-medium block mt-1 text-sm" style={{ color: INK }}>{orderDetail.order.phone || '—'}</span>
              </div>
              <div>
                <span className="text-xs block" style={{ color: INK_FAINT }}>Company</span>
                <span className="font-semibold block mt-1 text-sm" style={{ color: INK }}>{orderDetail.order.company}</span>
              </div>
              <div>
                <span className="text-xs block" style={{ color: INK_FAINT }}>Assigned member</span>
                <span className="font-medium block mt-1 text-sm" style={{ color: INK }}>{orderDetail.order.assignedMemberName}</span>
              </div>
              <div className="col-span-2">
                <span className="text-xs block" style={{ color: INK_FAINT }}>Products</span>
                <span className="font-medium block mt-1 text-sm" style={{ color: INK }}>{orderDetail.order.products}</span>
              </div>
              <div>
                <span className="text-xs block" style={{ color: INK_FAINT }}>Carrier</span>
                <span className="font-medium block mt-1 text-sm" style={{ color: INK }}>{orderDetail.order.shippingCarrier || '—'}</span>
              </div>
              <div>
                <span className="text-xs block" style={{ color: INK_FAINT }}>Port / BL #</span>
                <span className="block mt-1 text-sm truncate" style={{ color: INK }}>
                  {orderDetail.order.trackingNumber || orderDetail.order.destinationPort || '—'}
                </span>
              </div>
            </div>

            {/* Payment / Billing Update */}
            {hasPermission('orders.edit') && (
              <form onSubmit={handleUpdatePayment} className="p-4 border rounded-lg space-y-3" style={{ borderColor: LINE, backgroundColor: PAPER }}>
                <h4 className="text-sm font-semibold" style={{ color: INK }}>
                  Update payment status
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs mb-1.5" style={{ color: INK_SOFT }}>
                      Billing status
                    </label>
                    <SearchableSelect
                      options={billingStatusOptions}
                      value={billingStatus}
                      onChange={v => setBillingStatus(v as BillStatus)}
                      placeholder="Select billing status"
                    />
                  </div>
                  <div>
                    <label className="block text-xs mb-1.5" style={{ color: INK_SOFT }}>
                      Amount paid ({orderDetail.order.currency})
                    </label>
                    <input
                      type="number"
                      min={0}
                      step={0.01}
                      value={amountPaid}
                      onChange={e => setAmountPaid(e.target.value)}
                      className="w-full px-3.5 py-2.5 border rounded-md text-sm bg-white focus:outline-none focus:border-[#155A52] transition-colors"
                      style={{ borderColor: LINE, color: INK }}
                    />
                  </div>
                </div>
                <p className="text-xs" style={{ color: INK_FAINT }}>
                  Amount due will be recalculated automatically from the order total minus amount paid.
                </p>
                <div className="flex justify-end pt-1">
                  <button
                    type="submit"
                    disabled={isUpdatingPayment}
                    className="px-4 py-2 text-white rounded-md text-sm font-medium disabled:opacity-40 transition-colors"
                    style={{ backgroundColor: MARINE }}
                  >
                    {isUpdatingPayment ? 'Saving…' : 'Update payment'}
                  </button>
                </div>
              </form>
            )}

            {/* Status Transition Control */}
            {hasPermission('orders.update_status') && (
              <form onSubmit={handleUpdateStatus} className="p-4 border rounded-lg space-y-3" style={{ borderColor: LINE, backgroundColor: PAPER }}>
                <h4 className="text-sm font-semibold" style={{ color: INK }}>
                  Update consignment status
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs mb-1.5" style={{ color: INK_SOFT }}>
                      Target milestone
                    </label>
                    <SearchableSelect
                      options={statusOptions}
                      value={nextStatus}
                      onChange={v => setNextStatus(v as OrderStatus)}
                      placeholder="Select status"
                      searchPlaceholder="Search status…"
                    />
                  </div>
                  <div>
                    <label className="block text-xs mb-1.5" style={{ color: INK_SOFT }}>
                      Status change remarks
                    </label>
                    <input
                      type="text"
                      value={statusNotes}
                      onChange={e => setStatusNotes(e.target.value)}
                      placeholder="Vessel departed Nhava Sheva port on schedule"
                      className="w-full px-3.5 py-2.5 border rounded-md text-sm bg-white focus:outline-none focus:border-[#155A52] transition-colors"
                      style={{ borderColor: LINE, color: INK }}
                    />
                  </div>
                </div>
                <div className="flex justify-end pt-1">
                  <button
                    type="submit"
                    disabled={isUpdatingStatus || nextStatus === orderDetail.order.orderStatus}
                    className="px-4 py-2 text-white rounded-md text-sm font-medium disabled:opacity-40 transition-colors"
                    style={{ backgroundColor: MARINE }}
                  >
                    {isUpdatingStatus ? 'Transitioning…' : 'Transition status'}
                  </button>
                </div>
              </form>
            )}

            {orderDetail.shipments && orderDetail.shipments.length > 0 && (
              <div className="border rounded-lg p-4" style={{ borderColor: LINE }}>
                <h4 className="text-sm font-semibold mb-3" style={{ color: INK }}>
                  Linked shipments
                </h4>
                <div className="space-y-2">
                  {orderDetail.shipments.map(shipment => (
                    <div key={shipment.id} className="flex items-center justify-between text-sm p-3 rounded-md border" style={{ borderColor: LINE }}>
                      <div>
                        <div className=" font-medium" style={{ color: INK }}>{shipment.shipmentCode}</div>
                        <div className="text-xs mt-0.5" style={{ color: INK_FAINT }}>
                          {shipment.shipmentReference || shipment.containerReference || shipment.trackingNumber || 'No reference'}
                        </div>
                      </div>
                      <StatusBadge status={shipment.status} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Order Status History Audit Trail */}
            <div className="border rounded-lg p-4" style={{ borderColor: LINE }}>
              <h4 className="text-sm font-semibold mb-4 flex items-center justify-between" style={{ color: INK }}>
                <span>Milestone history</span>
                <Clock className="w-4 h-4" style={{ color: INK_FAINT }} />
              </h4>

              <div className="space-y-3.5">
                {orderDetail.history.map(h => (
                  <div key={h.id} className="relative pl-5 border-l-2" style={{ borderColor: LINE }}>
                    <div className="absolute -left-[5px] top-1 w-2.5 h-2.5 rounded-full" style={{ backgroundColor: MARINE }} />
                    <div className="flex items-center gap-2">
                      <StatusBadge status={h.newStatus} />
                      {h.previousStatus && (
                        <span className="text-xs" style={{ color: INK_FAINT }}>
                          (previously {h.previousStatus})
                        </span>
                      )}
                    </div>
                    {h.notes && (
                      <p className="text-sm mt-1.5 italic" style={{ color: INK_SOFT }}>"{h.notes}"</p>
                    )}
                    <div className="flex items-center gap-2 text-xs mt-1.5" style={{ color: INK_FAINT }}>
                      <span>Changed by {h.changedByName}</span>
                      <span>•</span>
                      <span>{new Date(h.timestamp).toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t" style={{ borderColor: LINE }}>
              <button
                type="button"
                onClick={() => {
                  setSelectedOrderId(null);
                  setOrderDetail(null);
                }}
                className="px-4 py-2.5 rounded-md text-white font-medium text-sm transition-colors"
                style={{ backgroundColor: INK }}
              >
                Done
              </button>
            </div>
          </div>
        )}
      </Modal>

      <ImportWizard
        entity="orders"
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        onComplete={() => fetchOrders(currentPage)}
      />
    </div>
  );
};