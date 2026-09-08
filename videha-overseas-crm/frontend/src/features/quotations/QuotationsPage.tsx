import React, { useEffect, useMemo, useState } from 'react';
import { Plus, Search, Pencil, Trash2, FileText, Send, CheckCircle2 } from 'lucide-react';
import { api } from '../../api/client';
import {
  Quotation,
  QuotationLineItem,
  QuotationStatus,
  Lead,
  User as CrmUser
} from '../../types/crm';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Modal } from '../../components/ui/Modal';
import { SearchableSelect } from '../../components/ui/SearchableSelect';
import { DateTimePicker } from '../../components/ui/DateTimePicker';
import { PaginationBar } from '../../components/ui/PaginationBar';
import { useAuth } from '../../context/AuthContext';
import { handleConflictWithReload, alertSaveError } from '../../lib/apiErrors';
import { createClientRequestId as generateClientRequestId } from '../../lib/clientRequestId';

const STATUS_OPTIONS: { value: QuotationStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All Statuses' },
  { value: 'Draft', label: 'Draft' },
  { value: 'Sent', label: 'Sent' },
  { value: 'Negotiation', label: 'Negotiation' },
  { value: 'Accepted', label: 'Accepted' },
  { value: 'Rejected', label: 'Rejected' },
  { value: 'Expired', label: 'Expired' },
  { value: 'Cancelled', label: 'Cancelled' }
];

const CURRENCY_OPTIONS = [
  { value: 'USD', label: 'USD' },
  { value: 'EUR', label: 'EUR' },
  { value: 'GBP', label: 'GBP' },
  { value: 'INR', label: 'INR' },
  { value: 'AED', label: 'AED' }
];

const emptyLineItem = (): QuotationLineItem => ({
  description: '',
  quantity: '1',
  unitPrice: 0,
  discountPercent: 0,
  amount: 0
});

type QuotationForm = {
  title: string;
  currency: string;
  leadId: string;
  assignedToId: string;
  validityDate: string;
  paymentTerms: string;
  notes: string;
  discountAmount: string;
  taxRate: string;
  lineItems: QuotationLineItem[];
};

const emptyForm = (assigneeId = ''): QuotationForm => ({
  title: '',
  currency: 'USD',
  leadId: '',
  assignedToId: assigneeId,
  validityDate: '',
  paymentTerms: 'Net 30',
  notes: '',
  discountAmount: '0',
  taxRate: '0',
  lineItems: [emptyLineItem()]
});

function calcLineAmount(item: QuotationLineItem): number {
  const qty = parseFloat(item.quantity) || 1;
  const gross = qty * (item.unitPrice || 0);
  return Math.round(gross * (1 - (item.discountPercent || 0) / 100) * 100) / 100;
}

function calcTotals(form: QuotationForm) {
  const lineItems = form.lineItems.map(item => ({
    ...item,
    amount: calcLineAmount(item)
  }));
  const subtotal = lineItems.reduce((s, i) => s + i.amount, 0);
  const discountAmount = parseFloat(form.discountAmount) || 0;
  const afterDiscount = Math.max(0, subtotal - discountAmount);
  const taxRate = parseFloat(form.taxRate) || 0;
  const taxAmount = Math.round(afterDiscount * (taxRate / 100) * 100) / 100;
  const totalAmount = Math.round((afterDiscount + taxAmount) * 100) / 100;
  return { lineItems, subtotal, taxAmount, totalAmount };
}

export const QuotationsPage: React.FC = () => {
  const { user, hasPermission } = useAuth();
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit] = useState(12);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [teamMembers, setTeamMembers] = useState<CrmUser[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editing, setEditing] = useState<Quotation | null>(null);
  const [form, setForm] = useState<QuotationForm>(emptyForm(user?.id));
  const [createRequestId, setCreateRequestId] = useState(generateClientRequestId);
  const [isSaving, setIsSaving] = useState(false);
  const [selected, setSelected] = useState<Quotation | null>(null);

  const totals = useMemo(() => calcTotals(form), [form]);

  const memberOptions = useMemo(
    () => teamMembers.map(m => ({ value: m.id, label: m.name })),
    [teamMembers]
  );
  const leadOptions = useMemo(
    () => [{ value: '', label: 'None' }, ...leads.map(l => ({ value: l.id, label: `${l.leadCode} — ${l.company}` }))],
    [leads]
  );

  const fetchQuotations = async (pageNum = page) => {
    setIsLoading(true);
    try {
      const res = await api.quotations.getQuotations({
        search: search.trim() || undefined,
        status: statusFilter,
        page: pageNum,
        limit
      });
      if (res.success) {
        setQuotations(res.data);
        setTotal(res.total);
        setPage(res.page);
        setTotalPages(res.totalPages);
      }
    } catch (err: unknown) {
      alertSaveError(err, 'Failed to load quotations');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchQuotations(1);
  }, [search, statusFilter]);

  useEffect(() => {
    api.users.getUsers({ status: 'active', limit: 100 }).then(res => {
      if (res.success) setTeamMembers(res.data);
    });
    api.leads.getLeads({ limit: 100 }).then(res => {
      if (res.success) setLeads(res.items);
    });
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm(user?.id));
    setCreateRequestId(generateClientRequestId());
    setIsFormOpen(true);
  };

  const openEdit = (q: Quotation) => {
    setEditing(q);
    setForm({
      title: q.title,
      currency: q.currency,
      leadId: q.leadId || '',
      assignedToId: q.assignedToId || user?.id || '',
      validityDate: q.validityDate ? q.validityDate.slice(0, 16) : '',
      paymentTerms: q.paymentTerms || '',
      notes: q.notes || '',
      discountAmount: String(q.discountAmount ?? 0),
      taxRate: String(q.taxRate ?? 0),
      lineItems: q.lineItems?.length ? q.lineItems : [emptyLineItem()]
    });
    setIsFormOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    setIsSaving(true);
    const payload = {
      title: form.title.trim(),
      currency: form.currency,
      leadId: form.leadId || null,
      assignedToId: form.assignedToId,
      validityDate: form.validityDate ? new Date(form.validityDate).toISOString() : null,
      paymentTerms: form.paymentTerms,
      notes: form.notes,
      discountAmount: parseFloat(form.discountAmount) || 0,
      taxRate: parseFloat(form.taxRate) || 0,
      lineItems: totals.lineItems
    };
    try {
      if (editing) {
        await api.quotations.updateQuotation(editing.id, {
          ...payload,
          revision: editing.revision
        });
      } else {
        await api.quotations.createQuotation({
          ...payload,
          clientRequestId: createRequestId
        } as Partial<Quotation> & { clientRequestId: string });
      }
      setIsFormOpen(false);
      fetchQuotations(page);
    } catch (err: unknown) {
      if (editing) {
        await handleConflictWithReload(err, () => fetchQuotations(page), 'Failed to save quotation');
      } else {
        alertSaveError(err, 'Failed to create quotation');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleStatusChange = async (q: Quotation, status: QuotationStatus, createOrder = false) => {
    try {
      const res = await api.quotations.updateStatus(q.id, status, {
        revision: q.revision,
        createOrder
      });
      if (res.success) {
        fetchQuotations(page);
        if (res.data.order) {
          alert(`Order ${res.data.order.orderCode} created from quotation.`);
        }
      }
    } catch (err: unknown) {
      await handleConflictWithReload(err, () => fetchQuotations(page), 'Failed to update status');
    }
  };

  const handleDelete = async (q: Quotation) => {
    if (!window.confirm(`Delete quotation ${q.quotationCode}?`)) return;
    try {
      await api.quotations.deleteQuotation(q.id);
      fetchQuotations(page);
    } catch (err: unknown) {
      alertSaveError(err, 'Failed to delete quotation');
    }
  };

  const updateLineItem = (index: number, patch: Partial<QuotationLineItem>) => {
    setForm(prev => {
      const lineItems = [...prev.lineItems];
      lineItems[index] = { ...lineItems[index], ...patch };
      return { ...prev, lineItems };
    });
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-slate-800">Quotations</h2>
          <p className="text-xs text-slate-500 mt-0.5">Sales quotes linked to leads, customers, and orders</p>
        </div>
        {hasPermission('quotations.create') && (
          <button
            onClick={openCreate}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-sky-600 text-white text-xs font-medium rounded-lg hover:bg-sky-700"
          >
            <Plus className="w-3.5 h-3.5" />
            New Quotation
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search quotations…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-xs"
          />
        </div>
        <SearchableSelect
          options={STATUS_OPTIONS}
          value={statusFilter}
          onChange={setStatusFilter}
          placeholder="Status"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {isLoading ? (
          [...Array(6)].map((_, i) => (
            <div key={i} className="h-36 bg-slate-100 rounded-xl animate-pulse" />
          ))
        ) : quotations.length === 0 ? (
          <div className="col-span-full p-8 text-center text-xs text-slate-500 bg-white border border-slate-200 rounded-xl">
            No quotations found.
          </div>
        ) : (
          quotations.map(q => (
            <div
              key={q.id}
              className="bg-white border border-slate-200 rounded-xl p-4 hover:border-sky-200 transition-colors"
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <p className="text-[10px] font-mono text-slate-500">{q.quotationCode}</p>
                  <h3 className="text-xs font-semibold text-slate-800 mt-0.5">{q.title}</h3>
                </div>
                <StatusBadge status={q.status} />
              </div>
              <p className="text-xs text-slate-600">
                {q.leadCode ? `${q.leadCode} · ` : ''}
                {q.currency} {q.totalAmount.toLocaleString()}
              </p>
              <p className="text-[10px] text-slate-500 mt-1">
                {q.assignedToName || 'Unassigned'}
                {q.validityDate ? ` · Valid until ${new Date(q.validityDate).toLocaleDateString()}` : ''}
              </p>
              <div className="flex flex-wrap gap-1 mt-3 pt-3 border-t border-slate-100">
                <button
                  onClick={() => setSelected(q)}
                  className="inline-flex items-center gap-1 px-2 py-1 text-[10px] border border-slate-200 rounded-md hover:bg-slate-50"
                >
                  <FileText className="w-3 h-3" />
                  View
                </button>
                {hasPermission('quotations.edit') && q.status === 'Draft' && (
                  <button
                    onClick={() => openEdit(q)}
                    className="inline-flex items-center gap-1 px-2 py-1 text-[10px] border border-slate-200 rounded-md hover:bg-slate-50"
                  >
                    <Pencil className="w-3 h-3" />
                    Edit
                  </button>
                )}
                {hasPermission('quotations.edit') && q.status === 'Draft' && (
                  <button
                    onClick={() => handleStatusChange(q, 'Sent')}
                    className="inline-flex items-center gap-1 px-2 py-1 text-[10px] text-sky-700 border border-sky-200 rounded-md hover:bg-sky-50"
                  >
                    <Send className="w-3 h-3" />
                    Send
                  </button>
                )}
                {hasPermission('quotations.edit') && ['Sent', 'Negotiation'].includes(q.status) && (
                  <button
                    onClick={() => {
                      if (window.confirm('Accept quotation and create order?')) {
                        handleStatusChange(q, 'Accepted', true);
                      }
                    }}
                    className="inline-flex items-center gap-1 px-2 py-1 text-[10px] text-emerald-700 border border-emerald-200 rounded-md hover:bg-emerald-50"
                  >
                    <CheckCircle2 className="w-3 h-3" />
                    Accept
                  </button>
                )}
                {hasPermission('quotations.delete') && q.status === 'Draft' && (
                  <button
                    onClick={() => handleDelete(q)}
                    className="inline-flex items-center gap-1 px-2 py-1 text-[10px] text-rose-600 border border-rose-200 rounded-md hover:bg-rose-50"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      <PaginationBar page={page} totalPages={totalPages} total={total} onPageChange={p => fetchQuotations(p)} />

      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={editing ? `Edit ${editing.quotationCode}` : 'New Quotation'}
      >
        <form onSubmit={handleSave} className="space-y-3 max-h-[70vh] overflow-y-auto pr-1">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Title *</label>
            <input
              type="text"
              value={form.title}
              onChange={e => setForm({ ...form, title: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Lead</label>
              <SearchableSelect
                options={leadOptions}
                value={form.leadId}
                onChange={v => setForm({ ...form, leadId: v })}
                allowClear
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Currency</label>
              <SearchableSelect
                options={CURRENCY_OPTIONS}
                value={form.currency}
                onChange={v => setForm({ ...form, currency: v })}
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Assigned To</label>
            <SearchableSelect
              options={memberOptions}
              value={form.assignedToId}
              onChange={v => setForm({ ...form, assignedToId: v })}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Validity Date</label>
            <DateTimePicker
              value={form.validityDate}
              onChange={v => setForm({ ...form, validityDate: v })}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Line Items</label>
            <div className="space-y-2">
              {form.lineItems.map((item, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-1 items-end">
                  <input
                    type="text"
                    placeholder="Description"
                    value={item.description}
                    onChange={e => updateLineItem(idx, { description: e.target.value })}
                    className="col-span-4 px-2 py-1.5 border border-slate-200 rounded text-xs"
                  />
                  <input
                    type="text"
                    placeholder="Qty"
                    value={item.quantity}
                    onChange={e => updateLineItem(idx, { quantity: e.target.value })}
                    className="col-span-2 px-2 py-1.5 border border-slate-200 rounded text-xs"
                  />
                  <input
                    type="number"
                    placeholder="Price"
                    value={item.unitPrice || ''}
                    onChange={e => updateLineItem(idx, { unitPrice: parseFloat(e.target.value) || 0 })}
                    className="col-span-2 px-2 py-1.5 border border-slate-200 rounded text-xs"
                  />
                  <input
                    type="number"
                    placeholder="Disc %"
                    value={item.discountPercent || ''}
                    onChange={e =>
                      updateLineItem(idx, { discountPercent: parseFloat(e.target.value) || 0 })
                    }
                    className="col-span-2 px-2 py-1.5 border border-slate-200 rounded text-xs"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setForm(prev => ({
                        ...prev,
                        lineItems: prev.lineItems.filter((_, i) => i !== idx)
                      }))
                    }
                    className="col-span-2 text-[10px] text-rose-600 py-1.5"
                  >
                    Remove
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => setForm(prev => ({ ...prev, lineItems: [...prev.lineItems, emptyLineItem()] }))}
                className="text-xs text-sky-600"
              >
                + Add line item
              </button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Order Discount</label>
              <input
                type="number"
                value={form.discountAmount}
                onChange={e => setForm({ ...form, discountAmount: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Tax Rate %</label>
              <input
                type="number"
                value={form.taxRate}
                onChange={e => setForm({ ...form, taxRate: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
              />
            </div>
          </div>
          <div className="text-xs text-slate-600 bg-slate-50 rounded-lg p-3 border border-slate-200">
            Subtotal: {form.currency} {totals.subtotal.toLocaleString()} · Tax: {totals.taxAmount.toLocaleString()} ·{' '}
            <span className="font-semibold text-slate-800">Total: {totals.totalAmount.toLocaleString()}</span>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Payment Terms</label>
            <input
              type="text"
              value={form.paymentTerms}
              onChange={e => setForm({ ...form, paymentTerms: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Notes</label>
            <textarea
              rows={2}
              value={form.notes}
              onChange={e => setForm({ ...form, notes: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setIsFormOpen(false)} className="px-3 py-2 text-xs border rounded-lg">
              Cancel
            </button>
            <button type="submit" disabled={isSaving} className="px-3 py-2 text-xs bg-sky-600 text-white rounded-lg">
              {isSaving ? 'Saving…' : editing ? 'Save' : 'Create Draft'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={!!selected} onClose={() => setSelected(null)} title={selected?.quotationCode || 'Quotation'}>
        {selected && (
          <div className="space-y-3 text-xs">
            <div>
              <h3 className="font-semibold text-slate-800">{selected.title}</h3>
              <StatusBadge status={selected.status} />
            </div>
            <table className="w-full border border-slate-200 rounded-lg overflow-hidden">
              <thead className="bg-slate-50">
                <tr>
                  <th className="text-left px-2 py-1.5">Item</th>
                  <th className="text-right px-2 py-1.5">Qty</th>
                  <th className="text-right px-2 py-1.5">Price</th>
                  <th className="text-right px-2 py-1.5">Amount</th>
                </tr>
              </thead>
              <tbody>
                {selected.lineItems.map((item, i) => (
                  <tr key={i} className="border-t border-slate-100">
                    <td className="px-2 py-1.5">{item.description}</td>
                    <td className="px-2 py-1.5 text-right">{item.quantity}</td>
                    <td className="px-2 py-1.5 text-right">{item.unitPrice}</td>
                    <td className="px-2 py-1.5 text-right">{item.amount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="font-semibold text-slate-800">
              Total: {selected.currency} {selected.totalAmount.toLocaleString()}
            </p>
            {selected.orderCode && (
              <p className="text-emerald-700">Linked order: {selected.orderCode}</p>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};
