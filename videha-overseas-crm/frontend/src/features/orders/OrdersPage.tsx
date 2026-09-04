import React, { useState, useEffect } from 'react';
import {
  Package,
  Plus,
  Search,
  ExternalLink,
  Eye,
  Clock,
  CheckCircle2,
  Ship,
  Truck,
  Building2,
  Calendar,
  DollarSign,
  ArrowRight,
  Filter,
  LayoutGrid,
  List,
  MapPin,
  UserCheck
} from 'lucide-react';
import { api } from '../../api/client';
import { Order, OrderStatus, OrderStatusHistory, User as CrmUser } from '../../types/crm';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Modal } from '../../components/ui/Modal';
import { SearchableSelect } from '../../components/ui/SearchableSelect';
import { DateTimePicker } from '../../components/ui/DateTimePicker';
import { useAuth } from '../../context/AuthContext';
import { NavigationTab } from '../../components/layout/Sidebar';
import { CRM_COUNTRIES } from '../../constants/countries';

interface OrdersPageProps {
  onNavigate: (tab: NavigationTab, entityId?: string) => void;
  onOpenPublicTracking: (orderCode: string) => void;
  focusOrderId?: string | null;
  onFocusConsumed?: () => void;
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
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [countryFilter, setCountryFilter] = useState('all');

  // View Mode: Cards (default) or Table
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');

  const [teamMembers, setTeamMembers] = useState<CrmUser[]>([]);

  // Create Order Modal
  const [isCreateOpen, setIsCreateOpen] = useState(false);
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
  } | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);

  // Status transition form inside modal
  const [nextStatus, setNextStatus] = useState<OrderStatus>('Processing');
  const [statusNotes, setStatusNotes] = useState('');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  useEffect(() => {
    api.users
      .getUsers()
      .then(res => {
        if (res.success) setTeamMembers(res.data);
      })
      .catch(() => {});
  }, []);

  const fetchOrders = async () => {
    setIsLoading(true);
    try {
      const res = await api.orders.getOrders({
        search,
        status: statusFilter,
        country: countryFilter
      });
      if (res.success) {
        setOrders(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch orders:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [search, statusFilter, countryFilter]);

  const handleOpenDetail = async (id: string) => {
    setSelectedOrderId(id);
    setIsLoadingDetail(true);
    try {
      const res = await api.orders.getOrder(id);
      if (res.success) {
        setOrderDetail(res.data);
        setNextStatus(res.data.order.orderStatus);
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
        assignedMemberId: newOrderForm.assignedMemberId || user?.id
      });
      if (res.success) {
        setIsCreateOpen(false);
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
        fetchOrders();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to create order');
    } finally {
      setIsSubmittingCreate(false);
    }
  };

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderDetail) return;
    setIsUpdatingStatus(true);
    try {
      const res = await api.orders.updateStatus(orderDetail.order.id, nextStatus, statusNotes);
      if (res.success) {
        setOrderDetail(res.data);
        setStatusNotes('');
        fetchOrders();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to update order status');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const orderStatuses: OrderStatus[] = [
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

  return (
    <div className="p-6 space-y-5 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-slate-800">Overseas Order Fulfillment</h3>
          <p className="text-xs text-slate-500">
            Export consignments, bills of lading, and international delivery status tracking
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* View Mode Toggle */}
          <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200">
            <button
              onClick={() => setViewMode('cards')}
              className={`p-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 transition-all ${
                viewMode === 'cards'
                  ? 'bg-white text-sky-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-800'
              }`}
              title="Card Form View"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Cards</span>
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 transition-all ${
                viewMode === 'table'
                  ? 'bg-white text-sky-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-800'
              }`}
              title="Table View"
            >
              <List className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Table</span>
            </button>
          </div>

          {hasPermission('orders.create') && (
            <button
              onClick={() => setIsCreateOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-medium transition-colors shadow-2xs"
            >
              <Plus className="w-4 h-4" />
              <span>Create New Order</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter Row */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search order code, company, products..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-sky-600 text-slate-800"
            />
          </div>

          <SearchableSelect
            options={[{ value: 'all', label: 'All Order Statuses' }, ...statusOptions]}
            value={statusFilter}
            onChange={setStatusFilter}
            placeholder="Status"
            searchPlaceholder="Search status…"
          />

          <SearchableSelect
            options={[{ value: 'all', label: 'All Countries' }, ...countryOptions]}
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
            <div className="py-16 text-center text-slate-400 bg-white border border-slate-200 rounded-xl">
              Loading orders in card view...
            </div>
          ) : orders.length === 0 ? (
            <div className="py-16 text-center text-slate-400 bg-white border border-slate-200 rounded-xl">
              No orders found matching the filter criteria.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4.5">
              {orders.map(order => (
                <div
                  key={order.id}
                  onClick={() => handleOpenDetail(order.id)}
                  className="bg-white border border-slate-200 hover:border-sky-300 rounded-xl p-4 shadow-2xs hover:shadow-xs transition-all cursor-pointer flex flex-col justify-between group"
                >
                  <div>
                    {/* Top Bar */}
                    <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-slate-100">
                      <span className="font-mono text-xs font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">
                        {order.orderCode}
                      </span>
                      <StatusBadge status={order.orderStatus} />
                    </div>

                    {/* Buyer & Company */}
                    <div className="mt-3">
                      <h4 className="text-sm font-semibold text-slate-800 group-hover:text-sky-700 transition-colors leading-snug">
                        {order.company}
                      </h4>
                      <p className="text-xs text-slate-600 mt-0.5 font-medium">
                        {order.customerName}
                      </p>
                      <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-1">
                        <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="truncate">
                          {order.country}
                          {order.destinationPort ? ` · ${order.destinationPort}` : ''}
                        </span>
                      </p>
                    </div>

                    {/* Products Consignment Pill */}
                    <div className="mt-3 bg-sky-50/70 border border-sky-100 rounded-lg p-2.5 text-xs">
                      <div className="flex items-center justify-between text-[10px] text-sky-800 font-semibold mb-0.5 uppercase tracking-wider">
                        <span>Consignment</span>
                        <span className="bg-sky-100 text-sky-800 px-1.5 py-0.2 rounded font-normal">
                          {order.quantity}
                        </span>
                      </div>
                      <p className="text-slate-800 font-medium truncate" title={order.products}>
                        {order.products}
                      </p>
                    </div>

                    {/* Order Metrics Grid */}
                    <div className="grid grid-cols-2 gap-2 mt-2.5 text-[11px]">
                      <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                        <span className="text-[10px] text-slate-400 block font-medium">Order Value</span>
                        <span className="font-semibold text-emerald-700 text-xs">
                          ${Number(order.orderValue).toLocaleString()} {order.currency}
                        </span>
                      </div>
                      <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                        <span className="text-[10px] text-slate-400 block font-medium">Expected Delivery</span>
                        <span className="font-medium text-slate-700 flex items-center gap-1 mt-0.5">
                          <Calendar className="w-3 h-3 text-slate-400 shrink-0" />
                          {new Date(order.expectedDelivery).toLocaleDateString([], {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </span>
                      </div>
                    </div>

                    {/* Carrier & Tracking */}
                    {order.trackingNumber && (
                      <div className="mt-2.5 text-[11px] flex items-center justify-between bg-teal-50/60 border border-teal-100/80 px-2.5 py-1.5 rounded-lg text-teal-900">
                        <div className="flex items-center gap-1.5 truncate">
                          <Ship className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                          <span className="font-medium">{order.shippingCarrier || 'Carrier'}:</span>
                          <span className="font-mono text-[10px] truncate">{order.trackingNumber}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Card Footer */}
                  <div className="mt-4 pt-2.5 border-t border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <div className="w-5 h-5 rounded-full bg-gradient-to-br from-sky-500 to-teal-600 text-white flex items-center justify-center text-[9px] font-bold shrink-0">
                        {(order.assignedMemberName || 'VO').slice(0, 1).toUpperCase()}
                      </div>
                      <span className="text-[11px] text-slate-600 truncate max-w-[110px]" title={order.assignedMemberName}>
                        {order.assignedMemberName || 'Unassigned'}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
                      <button
                        onClick={() => handleOpenDetail(order.id)}
                        className="px-2.5 py-1 bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200/80 rounded-lg text-[11px] font-medium transition-colors"
                      >
                        Manage Status
                      </button>
                      <button
                        onClick={() => onOpenPublicTracking(order.orderCode)}
                        className="p-1.5 text-teal-700 hover:text-teal-900 hover:bg-teal-50 rounded-lg border border-teal-200/70"
                        title="Open Public Tracking Portal"
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
        <div className="bg-white border border-slate-200 rounded-xl shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-600 font-semibold">
                  <th className="py-3 px-4">Order Code</th>
                  <th className="py-3 px-4">Buyer & Company</th>
                  <th className="py-3 px-4">Consignment Products</th>
                  <th className="py-3 px-4">Destination</th>
                  <th className="py-3 px-4">Order Value</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Expected Delivery</th>
                  <th className="py-3 px-4">Assigned Member</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-slate-400">
                      Loading export orders...
                    </td>
                  </tr>
                ) : orders.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-slate-400">
                      No orders found matching the filter criteria.
                    </td>
                  </tr>
                ) : (
                  orders.map(order => (
                    <tr
                      key={order.id}
                      className="hover:bg-slate-50/70 transition-colors cursor-pointer group"
                      onClick={() => handleOpenDetail(order.id)}
                    >
                      <td className="py-3 px-4 font-mono font-semibold text-slate-800 whitespace-nowrap">
                        {order.orderCode}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <p className="font-medium text-slate-800">{order.company}</p>
                        <p className="text-[11px] text-slate-500">{order.customerName}</p>
                      </td>
                      <td className="py-3 px-4 max-w-xs truncate" title={order.products}>
                        <span className="font-medium text-slate-700">{order.products}</span>
                        <span className="text-[11px] text-slate-400 block">{order.quantity}</span>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap text-slate-700">
                        <span>{order.country}</span>
                        {order.destinationPort && (
                          <span className="text-[10px] text-slate-400 block truncate max-w-[130px]">
                            {order.destinationPort}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap font-semibold text-slate-800">
                        ${Number(order.orderValue).toLocaleString()} {order.currency}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <StatusBadge status={order.orderStatus} />
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap text-slate-700">
                        <span className="inline-flex items-center gap-1 font-medium">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          {new Date(order.expectedDelivery).toLocaleDateString([], {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </span>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap text-slate-600">
                        {order.assignedMemberName || 'Unassigned'}
                      </td>
                      <td
                        className="py-3 px-4 text-right whitespace-nowrap"
                        onClick={e => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenDetail(order.id)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-sky-700 hover:bg-sky-50"
                            title="Manage Order Status & Timeline"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onOpenPublicTracking(order.orderCode)}
                            className="p-1.5 rounded-lg text-teal-700 hover:text-teal-900 hover:bg-teal-50"
                            title="Test Public Order Tracker"
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

      {/* CREATE ORDER MODAL */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Create New Consignment Order"
        subtitle="Record buyer purchase order, delivery timeline, and shipping port"
        maxWidth="3xl"
      >
        <form onSubmit={handleCreateOrder} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Company / Buyer *</label>
              <input
                type="text"
                required
                value={newOrderForm.company}
                onChange={e => setNewOrderForm({ ...newOrderForm, company: e.target.value })}
                placeholder="e.g. Al-Madina Hospitality Group"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-sky-600 text-slate-800"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1">Customer Name *</label>
              <input
                type="text"
                required
                value={newOrderForm.customerName}
                onChange={e => setNewOrderForm({ ...newOrderForm, customerName: e.target.value })}
                placeholder="e.g. Sheikh Abdullah"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-sky-600 text-slate-800"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Phone</label>
              <input
                type="text"
                value={newOrderForm.phone}
                onChange={e => setNewOrderForm({ ...newOrderForm, phone: e.target.value })}
                placeholder="+971 4 332 9900"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-sky-600 text-slate-800"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1">Email</label>
              <input
                type="email"
                value={newOrderForm.email}
                onChange={e => setNewOrderForm({ ...newOrderForm, email: e.target.value })}
                placeholder="orders@company.com"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-sky-600 text-slate-800"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1">Destination Country</label>
              <SearchableSelect
                options={countryOptions}
                value={newOrderForm.country}
                onChange={country => setNewOrderForm({ ...newOrderForm, country })}
                placeholder="Select country"
                searchPlaceholder="Search countries…"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Products Ordered *</label>
              <input
                type="text"
                required
                value={newOrderForm.products}
                onChange={e => setNewOrderForm({ ...newOrderForm, products: e.target.value })}
                placeholder="e.g. Handmade Antique Brass Tableware, Chafing Dishes"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-sky-600 text-slate-800"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1">Quantity / Volume</label>
              <input
                type="text"
                value={newOrderForm.quantity}
                onChange={e => setNewOrderForm({ ...newOrderForm, quantity: e.target.value })}
                placeholder="e.g. 1,200 Sets or 2x 40ft Containers"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-sky-600 text-slate-800"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Order Value ($ USD)</label>
              <input
                type="number"
                value={newOrderForm.orderValue}
                onChange={e => setNewOrderForm({ ...newOrderForm, orderValue: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-sky-600 text-slate-800"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1">Expected Delivery Date *</label>
              <DateTimePicker
                value={newOrderForm.expectedDelivery}
                onChange={expectedDelivery => setNewOrderForm({ ...newOrderForm, expectedDelivery })}
                placeholder="Pick delivery date"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1">Assigned Member</label>
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

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Destination Port</label>
              <input
                type="text"
                value={newOrderForm.destinationPort}
                onChange={e => setNewOrderForm({ ...newOrderForm, destinationPort: e.target.value })}
                placeholder="e.g. Jebel Ali Port, Dubai"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-sky-600 text-slate-800"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1">Shipping Carrier</label>
              <input
                type="text"
                value={newOrderForm.shippingCarrier}
                onChange={e => setNewOrderForm({ ...newOrderForm, shippingCarrier: e.target.value })}
                placeholder="e.g. Maersk / MSC / DHL Global"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-sky-600 text-slate-800"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1">Bill of Lading / Tracking #</label>
              <input
                type="text"
                value={newOrderForm.trackingNumber}
                onChange={e => setNewOrderForm({ ...newOrderForm, trackingNumber: e.target.value })}
                placeholder="e.g. MAEU7612093"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-sky-600 text-slate-800"
              />
            </div>
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">Internal Order Notes</label>
            <textarea
              rows={2}
              value={newOrderForm.notes}
              onChange={e => setNewOrderForm({ ...newOrderForm, notes: e.target.value })}
              placeholder="Fumigation certifications, palletization instructions, etc."
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-sky-600 text-slate-800"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsCreateOpen(false)}
              className="px-4 py-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmittingCreate}
              className="px-5 py-2 rounded-lg bg-sky-600 hover:bg-sky-700 text-white font-medium disabled:opacity-50 transition-colors shadow-2xs"
            >
              {isSubmittingCreate ? 'Saving Order...' : 'Create Consignment Order'}
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
        title={orderDetail ? `${orderDetail.order.orderCode} · ${orderDetail.order.company}` : 'Order Details'}
        subtitle={orderDetail ? `Destination: ${orderDetail.order.country} · Expected Delivery: ${new Date(orderDetail.order.expectedDelivery).toLocaleDateString()}` : ''}
        maxWidth="3xl"
      >
        {isLoadingDetail || !orderDetail ? (
          <div className="py-12 text-center text-xs text-slate-400">Loading order timeline...</div>
        ) : (
          <div className="space-y-6 text-xs">
            {/* Top Quick Actions Bar */}
            <div className="flex flex-wrap items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl gap-2">
              <div className="flex items-center gap-2">
                <span className="text-slate-500 font-medium">Current Status:</span>
                <StatusBadge status={orderDetail.order.orderStatus} />
              </div>
              <button
                onClick={() => onOpenPublicTracking(orderDetail.order.orderCode)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-teal-50 text-teal-900 hover:bg-teal-100 border border-teal-200 rounded-lg font-medium transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5 text-teal-600" />
                <span>Open in Public Order Tracker</span>
              </button>
            </div>

            {/* Consignment Profile */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-white border border-slate-200 rounded-xl">
              <div>
                <span className="text-[10px] uppercase tracking-wider text-slate-400 block">Customer</span>
                <span className="font-medium text-slate-800 block mt-0.5">{orderDetail.order.customerName}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase tracking-wider text-slate-400 block">Phone</span>
                <span className="font-medium text-slate-800 block mt-0.5">{orderDetail.order.phone || '—'}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase tracking-wider text-slate-400 block">Order Value</span>
                <span className="font-semibold text-emerald-700 block mt-0.5">
                  ${Number(orderDetail.order.orderValue).toLocaleString()} {orderDetail.order.currency}
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase tracking-wider text-slate-400 block">Assigned Member</span>
                <span className="font-medium text-slate-800 block mt-0.5">{orderDetail.order.assignedMemberName}</span>
              </div>
              <div className="col-span-2">
                <span className="text-[10px] uppercase tracking-wider text-slate-400 block">Products</span>
                <span className="font-medium text-slate-800 block mt-0.5">{orderDetail.order.products}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase tracking-wider text-slate-400 block">Carrier</span>
                <span className="font-medium text-slate-800 block mt-0.5">{orderDetail.order.shippingCarrier || '—'}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase tracking-wider text-slate-400 block">Port / BL #</span>
                <span className="font-medium text-slate-800 block mt-0.5 truncate">
                  {orderDetail.order.trackingNumber || orderDetail.order.destinationPort || '—'}
                </span>
              </div>
            </div>

            {/* Status Transition Control */}
            {hasPermission('orders.update_status') && (
              <form onSubmit={handleUpdateStatus} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <h4 className="text-xs font-semibold text-slate-800 uppercase tracking-wider">
                  Update Consignment Status
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">
                      Target Milestone
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
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">
                      Status Change Remarks / Milestone Notes
                    </label>
                    <input
                      type="text"
                      value={statusNotes}
                      onChange={e => setStatusNotes(e.target.value)}
                      placeholder="e.g. Vessel departed Nhava Sheva port on schedule"
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white focus:outline-none focus:ring-1 focus:ring-sky-600 text-slate-800"
                    />
                  </div>
                </div>
                <div className="flex justify-end pt-1">
                  <button
                    type="submit"
                    disabled={isUpdatingStatus || nextStatus === orderDetail.order.orderStatus}
                    className="px-4 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-medium disabled:opacity-40 transition-colors shadow-2xs"
                  >
                    {isUpdatingStatus ? 'Transitioning...' : 'Transition Status'}
                  </button>
                </div>
              </form>
            )}

            {/* Order Status History Audit Trail */}
            <div className="border border-slate-200 rounded-xl p-4 bg-white">
              <h4 className="text-xs font-semibold text-slate-800 uppercase tracking-wider mb-4 flex items-center justify-between">
                <span>Milestone History & Audit Trail</span>
                <Clock className="w-3.5 h-3.5 text-slate-400" />
              </h4>

              <div className="space-y-3">
                {orderDetail.history.map((h, i) => (
                  <div key={h.id} className="relative pl-5 border-l-2 border-slate-200">
                    <div className="absolute -left-[5px] top-1 w-2 h-2 rounded-full bg-sky-600" />
                    <div className="flex items-center gap-2">
                      <StatusBadge status={h.newStatus} />
                      {h.previousStatus && (
                        <span className="text-[11px] text-slate-400">
                          (previously {h.previousStatus})
                        </span>
                      )}
                    </div>
                    {h.notes && (
                      <p className="text-[11px] text-slate-700 mt-1 italic">"{h.notes}"</p>
                    )}
                    <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-1">
                      <span>Changed by {h.changedByName}</span>
                      <span>•</span>
                      <span>{new Date(h.timestamp).toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setSelectedOrderId(null);
                  setOrderDetail(null);
                }}
                className="px-4 py-2 rounded-lg bg-slate-800 text-white font-medium hover:bg-slate-700"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
