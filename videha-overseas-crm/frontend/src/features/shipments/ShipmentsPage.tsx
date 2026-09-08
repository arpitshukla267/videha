import React, { useEffect, useState } from 'react';
import { Plus, Search, Ship, Pencil } from 'lucide-react';
import { api } from '../../api/client';
import { Shipment, ShipmentStatus, Order, User as CrmUser } from '../../types/crm';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Modal } from '../../components/ui/Modal';
import { SearchableSelect } from '../../components/ui/SearchableSelect';
import { DateTimePicker } from '../../components/ui/DateTimePicker';
import { PaginationBar } from '../../components/ui/PaginationBar';
import { useAuth } from '../../context/AuthContext';
import { alertSaveError, handleConflictWithReload } from '../../lib/apiErrors';

const STATUS_OPTIONS: { value: ShipmentStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All Statuses' },
  { value: 'Planned', label: 'Planned' },
  { value: 'Booked', label: 'Booked' },
  { value: 'In Transit', label: 'In Transit' },
  { value: 'Arrived', label: 'Arrived' },
  { value: 'Delivered', label: 'Delivered' },
  { value: 'Cancelled', label: 'Cancelled' }
];

const emptyForm = () => ({
  shipmentReference: '',
  containerReference: '',
  orderId: '',
  product: '',
  quantity: '',
  originPort: '',
  destinationPort: '',
  etd: '',
  eta: '',
  carrier: '',
  shippingLine: '',
  trackingNumber: '',
  status: 'Planned' as ShipmentStatus,
  notes: '',
  assignedToId: ''
});

export const ShipmentsPage: React.FC = () => {
  const { hasPermission } = useAuth();
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit] = useState(15);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [teamMembers, setTeamMembers] = useState<CrmUser[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editing, setEditing] = useState<Shipment | null>(null);
  const [form, setForm] = useState(emptyForm());
  const [isSaving, setIsSaving] = useState(false);
  const [selected, setSelected] = useState<Shipment | null>(null);

  const fetchShipments = async (pageNum = page) => {
    setIsLoading(true);
    try {
      const res = await api.shipments.getShipments({
        search: search.trim() || undefined,
        status: statusFilter,
        page: pageNum,
        limit
      });
      if (res.success) {
        setShipments(res.data);
        setTotal(res.total);
        setPage(res.page);
        setTotalPages(res.totalPages);
      }
    } catch (err: unknown) {
      alertSaveError(err, 'Failed to load shipments');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchShipments(1);
  }, [search, statusFilter]);

  useEffect(() => {
    api.orders.getOrders({ limit: 100 }).then(res => {
      if (res.success) setOrders(res.data);
    });
    api.users.getUsers({ status: 'active', limit: 100 }).then(res => {
      if (res.success) setTeamMembers(res.data);
    });
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm());
    setIsFormOpen(true);
  };

  const openEdit = (shipment: Shipment) => {
    setEditing(shipment);
    setForm({
      shipmentReference: shipment.shipmentReference,
      containerReference: shipment.containerReference,
      orderId: shipment.orderId || '',
      product: shipment.product,
      quantity: shipment.quantity,
      originPort: shipment.originPort,
      destinationPort: shipment.destinationPort,
      etd: shipment.etd || '',
      eta: shipment.eta || '',
      carrier: shipment.carrier,
      shippingLine: shipment.shippingLine,
      trackingNumber: shipment.trackingNumber,
      status: shipment.status,
      notes: shipment.notes,
      assignedToId: shipment.assignedToId || ''
    });
    setIsFormOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const payload = {
        ...form,
        orderId: form.orderId || null,
        assignedToId: form.assignedToId || null,
        etd: form.etd || null,
        eta: form.eta || null,
        ...(editing ? { revision: editing.revision } : {})
      };
      if (editing) {
        await api.shipments.updateShipment(editing.id, payload);
      } else {
        await api.shipments.createShipment(payload);
      }
      setIsFormOpen(false);
      fetchShipments(page);
    } catch (err: unknown) {
      if (editing && (await handleConflictWithReload(err, () => fetchShipments(page), 'Failed to save shipment'))) return;
      alertSaveError(err, 'Failed to save shipment');
    } finally {
      setIsSaving(false);
    }
  };

  const orderOptions = orders.map(order => ({
    value: order.id,
    label: `${order.orderCode} — ${order.company}`
  }));
  const memberOptions = teamMembers.map(member => ({ value: member.id, label: member.name }));

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-slate-800">Export Shipments</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Operational shipment records linked to orders, containers, ports, and carriers
          </p>
        </div>
        {hasPermission('shipments.create') && (
          <button
            onClick={openCreate}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-sky-600 text-white text-xs font-medium rounded-lg hover:bg-sky-700"
          >
            <Plus className="w-3.5 h-3.5" />
            New Shipment
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search shipments…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-xs"
          />
        </div>
        <SearchableSelect
          options={STATUS_OPTIONS}
          value={statusFilter}
          onChange={setStatusFilter}
          className="w-44"
        />
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <table className="min-w-full text-xs">
          <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider">
            <tr>
              <th className="px-3 py-2 text-left">Code</th>
              <th className="px-3 py-2 text-left">Reference</th>
              <th className="px-3 py-2 text-left">Order</th>
              <th className="px-3 py-2 text-left">Route</th>
              <th className="px-3 py-2 text-left">ETA</th>
              <th className="px-3 py-2 text-left">Status</th>
              <th className="px-3 py-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={7} className="px-3 py-8 text-center text-slate-500">
                  Loading shipments…
                </td>
              </tr>
            ) : shipments.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-3 py-8 text-center text-slate-500">
                  No shipment records found.
                </td>
              </tr>
            ) : (
              shipments.map(shipment => (
                <tr key={shipment.id} className="border-t border-slate-100 hover:bg-slate-50/60">
                  <td className="px-3 py-2.5 font-medium text-slate-800">{shipment.shipmentCode}</td>
                  <td className="px-3 py-2.5">
                    <div>{shipment.shipmentReference || shipment.containerReference || '—'}</div>
                    <div className="text-[10px] text-slate-500">{shipment.trackingNumber}</div>
                  </td>
                  <td className="px-3 py-2.5">{shipment.orderCode || '—'}</td>
                  <td className="px-3 py-2.5">
                    <div>{shipment.originPort || '—'} → {shipment.destinationPort || '—'}</div>
                    <div className="text-[10px] text-slate-500">{shipment.carrier}</div>
                  </td>
                  <td className="px-3 py-2.5">
                    {shipment.eta ? new Date(shipment.eta).toLocaleDateString() : '—'}
                  </td>
                  <td className="px-3 py-2.5">
                    <StatusBadge status={shipment.status} />
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => setSelected(shipment)}
                        className="p-1.5 rounded-md border border-slate-200 hover:bg-slate-50"
                        title="View details"
                      >
                        <Ship className="w-3.5 h-3.5 text-slate-600" />
                      </button>
                      {hasPermission('shipments.edit') && (
                        <button
                          type="button"
                          onClick={() => openEdit(shipment)}
                          className="p-1.5 rounded-md border border-slate-200 hover:bg-slate-50"
                          title="Edit"
                        >
                          <Pencil className="w-3.5 h-3.5 text-slate-600" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <PaginationBar page={page} totalPages={totalPages} onPageChange={p => fetchShipments(p)} />

      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={editing ? `Edit ${editing.shipmentCode}` : 'Create Shipment'}
        maxWidth="2xl"
      >
        <form onSubmit={handleSave} className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              placeholder="Shipment reference"
              value={form.shipmentReference}
              onChange={e => setForm(prev => ({ ...prev, shipmentReference: e.target.value }))}
              className="px-3 py-2 border border-slate-200 rounded-lg text-xs"
            />
            <input
              placeholder="Container reference"
              value={form.containerReference}
              onChange={e => setForm(prev => ({ ...prev, containerReference: e.target.value }))}
              className="px-3 py-2 border border-slate-200 rounded-lg text-xs"
            />
            <SearchableSelect
              options={[{ value: '', label: 'No linked order' }, ...orderOptions]}
              value={form.orderId}
              onChange={value => setForm(prev => ({ ...prev, orderId: value }))}
              placeholder="Linked order"
            />
            <SearchableSelect
              options={STATUS_OPTIONS.filter(option => option.value !== 'all')}
              value={form.status}
              onChange={value => setForm(prev => ({ ...prev, status: value as ShipmentStatus }))}
              placeholder="Status"
            />
            <input
              placeholder="Product"
              value={form.product}
              onChange={e => setForm(prev => ({ ...prev, product: e.target.value }))}
              className="px-3 py-2 border border-slate-200 rounded-lg text-xs"
            />
            <input
              placeholder="Quantity"
              value={form.quantity}
              onChange={e => setForm(prev => ({ ...prev, quantity: e.target.value }))}
              className="px-3 py-2 border border-slate-200 rounded-lg text-xs"
            />
            <input
              placeholder="Origin port"
              value={form.originPort}
              onChange={e => setForm(prev => ({ ...prev, originPort: e.target.value }))}
              className="px-3 py-2 border border-slate-200 rounded-lg text-xs"
            />
            <input
              placeholder="Destination port"
              value={form.destinationPort}
              onChange={e => setForm(prev => ({ ...prev, destinationPort: e.target.value }))}
              className="px-3 py-2 border border-slate-200 rounded-lg text-xs"
            />
            <DateTimePicker
              placeholder="ETD"
              value={form.etd}
              onChange={value => setForm(prev => ({ ...prev, etd: value }))}
            />
            <DateTimePicker
              placeholder="ETA"
              value={form.eta}
              onChange={value => setForm(prev => ({ ...prev, eta: value }))}
            />
            <input
              placeholder="Carrier"
              value={form.carrier}
              onChange={e => setForm(prev => ({ ...prev, carrier: e.target.value }))}
              className="px-3 py-2 border border-slate-200 rounded-lg text-xs"
            />
            <input
              placeholder="Shipping line"
              value={form.shippingLine}
              onChange={e => setForm(prev => ({ ...prev, shippingLine: e.target.value }))}
              className="px-3 py-2 border border-slate-200 rounded-lg text-xs"
            />
            <input
              placeholder="Tracking number"
              value={form.trackingNumber}
              onChange={e => setForm(prev => ({ ...prev, trackingNumber: e.target.value }))}
              className="px-3 py-2 border border-slate-200 rounded-lg text-xs sm:col-span-2"
            />
            <SearchableSelect
              options={[{ value: '', label: 'Unassigned' }, ...memberOptions]}
              value={form.assignedToId}
              onChange={value => setForm(prev => ({ ...prev, assignedToId: value }))}
              placeholder="Assigned to"
              className="sm:col-span-2"
            />
          </div>
          <textarea
            placeholder="Notes"
            value={form.notes}
            onChange={e => setForm(prev => ({ ...prev, notes: e.target.value }))}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs min-h-[80px]"
          />
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setIsFormOpen(false)} className="px-3 py-2 text-xs border border-slate-200 rounded-lg">
              Cancel
            </button>
            <button type="submit" disabled={isSaving} className="px-3 py-2 text-xs bg-sky-600 text-white rounded-lg disabled:opacity-50">
              {isSaving ? 'Saving…' : editing ? 'Update Shipment' : 'Create Shipment'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={!!selected}
        onClose={() => setSelected(null)}
        title={selected ? selected.shipmentCode : 'Shipment Details'}
        maxWidth="lg"
      >
        {selected && (
          <div className="space-y-3 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div><span className="text-slate-500">Reference</span><p className="font-medium">{selected.shipmentReference || '—'}</p></div>
              <div><span className="text-slate-500">Container</span><p className="font-medium">{selected.containerReference || '—'}</p></div>
              <div><span className="text-slate-500">Order</span><p className="font-medium">{selected.orderCode || '—'}</p></div>
              <div><span className="text-slate-500">Status</span><p><StatusBadge status={selected.status} /></p></div>
              <div><span className="text-slate-500">Product</span><p className="font-medium">{selected.product || '—'}</p></div>
              <div><span className="text-slate-500">Quantity</span><p className="font-medium">{selected.quantity || '—'}</p></div>
              <div><span className="text-slate-500">Route</span><p className="font-medium">{selected.originPort || '—'} → {selected.destinationPort || '—'}</p></div>
              <div><span className="text-slate-500">Carrier</span><p className="font-medium">{selected.carrier || selected.shippingLine || '—'}</p></div>
              <div><span className="text-slate-500">ETD</span><p className="font-medium">{selected.etd ? new Date(selected.etd).toLocaleString() : '—'}</p></div>
              <div><span className="text-slate-500">ETA</span><p className="font-medium">{selected.eta ? new Date(selected.eta).toLocaleString() : '—'}</p></div>
              <div className="col-span-2"><span className="text-slate-500">Tracking</span><p className="font-medium">{selected.trackingNumber || '—'}</p></div>
              {selected.notes && (
                <div className="col-span-2"><span className="text-slate-500">Notes</span><p className="font-medium whitespace-pre-wrap">{selected.notes}</p></div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
