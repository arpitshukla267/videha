import React, { useEffect, useMemo, useState } from 'react';
import { Plus, Search, Pencil, Trash2, FileText, Send, CheckCircle2, Package, MessageSquare, Download, Upload } from 'lucide-react';
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
import { CRM_COUNTRIES } from '../../constants/countries';
import { ImportWizard } from '../../components/import/ImportWizard';
import { ListStatePanel, ownScopeEmptyCopy } from '../../components/ui/ListStatePanel';

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
  companyLabel: string;
  customerLabel: string;
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
  companyLabel: '',
  customerLabel: '',
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
  const [loadError, setLoadError] = useState<string | null>(null);
  const [teamMembers, setTeamMembers] = useState<CrmUser[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editing, setEditing] = useState<Quotation | null>(null);
  const [form, setForm] = useState<QuotationForm>(emptyForm(user?.id));
  const [createRequestId, setCreateRequestId] = useState(generateClientRequestId);
  const [isSaving, setIsSaving] = useState(false);
  const [selected, setSelected] = useState<Quotation | null>(null);
  const [isLoadingView, setIsLoadingView] = useState(false);
  const [buildTarget, setBuildTarget] = useState<Quotation | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [buildForm, setBuildForm] = useState({
    customerName: '',
    company: '',
    phone: '',
    email: '',
    country: 'India',
    products: '',
    quantity: '',
    orderValue: 0,
    currency: 'USD',
    assignedMemberId: '',
    expectedDelivery: '',
    notes: '',
    destinationPort: '',
    shippingCarrier: '',
    trackingNumber: ''
  });
  const [buildRequestId, setBuildRequestId] = useState(generateClientRequestId);
  const [isBuildingOrder, setIsBuildingOrder] = useState(false);
  const [isLoadingBuildDraft, setIsLoadingBuildDraft] = useState(false);

  const totals = useMemo(() => calcTotals(form), [form]);

  const memberOptions = useMemo(
    () => teamMembers.map(m => ({ value: m.id, label: m.name })),
    [teamMembers]
  );
  const leadOptions = useMemo(
    () => leads.map(l => ({ value: l.id, label: `${l.leadCode} — ${l.company}` })),
    [leads]
  );
  const countryOptions = useMemo(
    () => CRM_COUNTRIES.map(c => ({ value: c, label: c })),
    []
  );

  const openView = async (q: Quotation) => {
    setSelected(q);
    setIsLoadingView(true);
    try {
      const res = await api.quotations.getQuotation(q.id);
      if (res.success) setSelected(res.data);
    } catch (err: unknown) {
      alertSaveError(err, 'Failed to load quotation details');
    } finally {
      setIsLoadingView(false);
    }
  };

  const openBuildOrder = async (q: Quotation) => {
    setBuildTarget(q);
    setIsLoadingBuildDraft(true);
    setBuildRequestId(generateClientRequestId());
    try {
      const res = await api.quotations.getOrderDraft(q.id);
      if (res.data.alreadyLinked && res.data.order) {
        alert(`Order ${res.data.order.orderCode} is already linked to this quotation.`);
        fetchQuotations(page);
        return;
      }
      const draft = res.data.draft;
      if (!draft) throw new Error('Order draft unavailable');
      setBuildForm({
        customerName: draft.customerName,
        company: draft.company,
        phone: draft.phone,
        email: draft.email,
        country: draft.country,
        products: draft.products,
        quantity: draft.quantity,
        orderValue: draft.orderValue,
        currency: draft.currency,
        assignedMemberId: draft.assignedMemberId || q.assignedToId || user?.id || '',
        expectedDelivery: draft.expectedDelivery.slice(0, 10),
        notes: draft.notes,
        destinationPort: draft.destinationPort,
        shippingCarrier: draft.shippingCarrier,
        trackingNumber: draft.trackingNumber
      });
    } catch (err: unknown) {
      setBuildTarget(null);
      alertSaveError(err, 'Failed to load order draft');
    } finally {
      setIsLoadingBuildDraft(false);
    }
  };

  const handleBuildOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!buildTarget) return;
    setIsBuildingOrder(true);
    try {
      const res = await api.quotations.createOrderFromQuotation(buildTarget.id, {
        ...buildForm,
        assignedMemberId: buildForm.assignedMemberId || user?.id,
        orderStatus: 'Order Confirmed',
        relatedLeadId: buildTarget.leadId,
        companyId: buildTarget.companyId,
        customerId: buildTarget.customerId,
        revision: buildTarget.revision,
        clientRequestId: buildRequestId
      });
      if (res.success) {
        const code = res.data.order.orderCode;
        if (res.data.alreadyExists) {
          alert(`Order ${code} is already linked to this quotation.`);
        } else {
          alert(`Order ${code} created from quotation.`);
        }
        setBuildTarget(null);
        fetchQuotations(page);
      }
    } catch (err: unknown) {
      await handleConflictWithReload(err, () => fetchQuotations(page), 'Failed to create order');
    } finally {
      setIsBuildingOrder(false);
    }
  };

  const applyLeadContext = async (leadId: string) => {
    if (!leadId) {
      setForm(prev => ({ ...prev, leadId: '', companyLabel: '', customerLabel: '' }));
      return;
    }
    try {
      const res = await api.leads.getLead(leadId);
      const lead = res.data.lead;
      setForm(prev => ({
        ...prev,
        leadId,
        companyLabel: lead.company || '',
        customerLabel: lead.name || ''
      }));
    } catch (err: unknown) {
      alertSaveError(err, 'Failed to load lead details');
    }
  };

  const fetchQuotations = async (pageNum = page) => {
    setIsLoading(true);
    setLoadError(null);
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
      const message = err instanceof Error ? err.message : 'Failed to load quotations';
      setLoadError(message);
      alertSaveError(err, 'Failed to load quotations');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchQuotations(1);
  }, [search, statusFilter]);

  useEffect(() => {
    api.users
      .getTeamDirectory()
      .then(res => {
        if (res.success) setTeamMembers(res.data as CrmUser[]);
      })
      .catch(() => {
        if (user) {
          setTeamMembers([
            {
              id: user.id,
              name: user.name,
              email: user.email,
              roleName: user.roleName,
              roleDisplayName: user.roleName
            } as CrmUser
          ]);
        }
      });
    api.leads.getLeads({ limit: 100 }).then(res => {
      if (res.success) setLeads(res.items);
    });
  }, [user]);

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
      companyLabel: q.companyName || '',
      customerLabel: q.customerName || '',
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
    if (!form.title.trim() || !form.leadId) return;
    setIsSaving(true);
    const payload = {
      title: form.title.trim(),
      currency: form.currency,
      leadId: form.leadId,
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

  const handleStatusChange = async (q: Quotation, status: QuotationStatus) => {
    try {
      const res = await api.quotations.updateStatus(q.id, status, {
        revision: q.revision
      });
      if (res.success) {
        fetchQuotations(page);
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

  const handleExportCsv = async () => {
    setIsExporting(true);
    try {
      await api.quotations.exportCsv({
        search: search.trim() || undefined,
        status: statusFilter
      });
    } catch (err: unknown) {
      alertSaveError(err, 'Failed to export quotations');
    } finally {
      setIsExporting(false);
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
        <div className="flex items-center gap-2">
          {hasPermission('quotations.create') && (
            <button
              type="button"
              onClick={() => setIsImportOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-sky-50 text-sky-800 hover:bg-sky-100 border border-sky-200/80 rounded-lg text-xs font-medium transition-colors"
            >
              <Upload className="w-3.5 h-3.5 text-sky-600" />
              Import CSV
            </button>
          )}
          {hasPermission('quotations.view') && (
            <button
              type="button"
              onClick={handleExportCsv}
              disabled={isExporting}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-teal-50 text-teal-800 hover:bg-teal-100 border border-teal-200/80 rounded-lg text-xs font-medium transition-colors disabled:opacity-60"
            >
              <Download className="w-3.5 h-3.5 text-teal-600" />
              {isExporting ? 'Exporting…' : 'Export CSV'}
            </button>
          )}
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
        ) : loadError ? (
          <div className="col-span-full">
            <ListStatePanel
              isLoading={false}
              error={loadError}
              isEmpty={false}
              emptyTitle=""
            />
          </div>
        ) : quotations.length === 0 ? (
          <div className="col-span-full">
            <ListStatePanel
              isLoading={false}
              isEmpty
              emptyTitle={
                user?.roleName === 'SALES_MEMBER' && statusFilter === 'all' && !search.trim()
                  ? ownScopeEmptyCopy('quotations').title
                  : 'No quotations found'
              }
              emptyDescription={
                user?.roleName === 'SALES_MEMBER' && statusFilter === 'all' && !search.trim()
                  ? ownScopeEmptyCopy('quotations').description
                  : undefined
              }
            />
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
                {q.companyName ? `${q.companyName}` : ''}
                {q.customerName ? ` · ${q.customerName}` : ''}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                {q.currency} {q.totalAmount.toLocaleString()}
              </p>
              <p className="text-[10px] text-slate-500 mt-1">
                {q.assignedToName || 'Unassigned'}
                {q.validityDate ? ` · Valid until ${new Date(q.validityDate).toLocaleDateString()}` : ''}
              </p>
              <div className="flex flex-wrap gap-1 mt-3 pt-3 border-t border-slate-100">
                <button
                  onClick={() => void openView(q)}
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
                {hasPermission('quotations.edit') && q.status === 'Sent' && (
                  <button
                    onClick={() => handleStatusChange(q, 'Negotiation')}
                    className="inline-flex items-center gap-1 px-2 py-1 text-[10px] text-amber-700 border border-amber-200 rounded-md hover:bg-amber-50"
                  >
                    <MessageSquare className="w-3 h-3" />
                    Negotiate
                  </button>
                )}
                {hasPermission('quotations.edit') && ['Sent', 'Negotiation'].includes(q.status) && (
                  <button
                    onClick={() => {
                      if (window.confirm('Accept this quotation?')) {
                        handleStatusChange(q, 'Accepted');
                      }
                    }}
                    className="inline-flex items-center gap-1 px-2 py-1 text-[10px] text-emerald-700 border border-emerald-200 rounded-md hover:bg-emerald-50"
                  >
                    <CheckCircle2 className="w-3 h-3" />
                    Accept
                  </button>
                )}
                {hasPermission('orders.create') &&
                  q.status === 'Accepted' &&
                  !q.orderId &&
                  hasPermission('quotations.edit') && (
                    <button
                      onClick={() => void openBuildOrder(q)}
                      className="inline-flex items-center gap-1 px-2 py-1 text-[10px] text-indigo-700 border border-indigo-200 rounded-md hover:bg-indigo-50"
                    >
                      <Package className="w-3 h-3" />
                      Build Order
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
        <form onSubmit={handleSave} className="flex flex-col ">
          {/* Scrollable fields — the ONLY scroll container in the modal */}
          <div className="flex-1 overflow-y-auto px-1 space-y-5">
            {/* Basic info */}
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Title 
                </label>
                <input
                  type="text"
                  value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. Q3 Enterprise Package"
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm placeholder:text-slate-400 focus:outline-none focus:ring-0 transition"
                  required
                />
              </div>
      
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Lead 
                  </label>
                  <SearchableSelect
                    options={[{ value: '', label: 'Select lead…' }, ...leadOptions]}
                    value={form.leadId}
                    onChange={v => {
                      void applyLeadContext(v);
                    }}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Currency</label>
                  <SearchableSelect
                    options={CURRENCY_OPTIONS}
                    value={form.currency}
                    onChange={v => setForm({ ...form, currency: v })}
                  />
                </div>
              </div>
            </div>
      
            {/* Company / customer context */}
            {(form.companyLabel || form.customerLabel) && (
              <div className="grid grid-cols-2 gap-3 bg-gradient-to-br from-slate-50 to-slate-100/60 border border-slate-200 rounded-xl p-3.5">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Company</p>
                  <p className="text-sm text-slate-800 mt-1 font-medium">{form.companyLabel || '—'}</p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Customer</p>
                  <p className="text-sm text-slate-800 mt-1 font-medium">{form.customerLabel || '—'}</p>
                </div>
              </div>
            )}
      
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Assigned To</label>
                <SearchableSelect
                  options={memberOptions}
                  value={form.assignedToId}
                  onChange={v => setForm({ ...form, assignedToId: v })}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Validity Date</label>
                <DateTimePicker
                  value={form.validityDate}
                  onChange={v => setForm({ ...form, validityDate: v })}
                />
              </div>
            </div>
      
            {/* Line items */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-semibold text-slate-700">Line Items</label>
                <span className="text-[10px] text-slate-400">{form.lineItems.length} item{form.lineItems.length !== 1 ? 's' : ''}</span>
              </div>
      
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <div className="grid grid-cols-12 gap-2 px-3 py-2 bg-slate-50 border-b border-slate-200 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                  <span className="col-span-4">Description</span>
                  <span className="col-span-2">Qty</span>
                  <span className="col-span-2">Price</span>
                  <span className="col-span-2">Disc %</span>
                  <span className="col-span-2 text-right">Action</span>
                </div>
      
                <div className="divide-y divide-slate-100">
                  {form.lineItems.map((item, idx) => (
                    <div key={idx} className="grid grid-cols-12 gap-2 items-center px-3 py-2 hover:bg-slate-50/60 transition">
                      <input
                        type="text"
                        placeholder="Description"
                        value={item.description}
                        onChange={e => updateLineItem(idx, { description: e.target.value })}
                        className="col-span-4 px-2 py-1.5 border border-slate-200 rounded-md text-xs focus:outline-none focus:border-sky-500 transition"
                      />
                      <input
                        type="text"
                        placeholder="Qty"
                        value={item.quantity}
                        onChange={e => updateLineItem(idx, { quantity: e.target.value })}
                        className="col-span-2 px-2 py-1.5 border border-slate-200 rounded-md text-xs focus:outline-none focus:border-sky-500 transition"
                      />
                      <input
                        type="number"
                        placeholder="Price"
                        value={item.unitPrice || ''}
                        onChange={e => updateLineItem(idx, { unitPrice: parseFloat(e.target.value) || 0 })}
                        className="col-span-2 px-2 py-1.5 border border-slate-200 rounded-md text-xs focus:outline-none focus:border-sky-500 transition"
                      />
                      <input
                        type="number"
                        placeholder="Disc %"
                        value={item.discountPercent || ''}
                        onChange={e =>
                          updateLineItem(idx, { discountPercent: parseFloat(e.target.value) || 0 })
                        }
                        className="col-span-2 px-2 py-1.5 border border-slate-200 rounded-md text-xs focus:outline-none focus:border-sky-500 transition"
                      />
                      <div className="col-span-2 flex justify-end">
                        <button
                          type="button"
                          onClick={() =>
                            setForm(prev => ({
                              ...prev,
                              lineItems: prev.lineItems.filter((_, i) => i !== idx)
                            }))
                          }
                          className="text-[10px] font-medium text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-2 py-1 rounded-md transition"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
      
                <button
                  type="button"
                  onClick={() => setForm(prev => ({ ...prev, lineItems: [...prev.lineItems, emptyLineItem()] }))}
                  className="w-full text-xs font-medium text-sky-600 hover:text-sky-700 hover:bg-sky-50 py-2.5 transition border-t border-slate-100"
                >
                  + Add line item
                </button>
              </div>
            </div>
      
            {/* Discount / tax */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Order Discount</label>
                <input
                  type="number"
                  value={form.discountAmount}
                  onChange={e => setForm({ ...form, discountAmount: e.target.value })}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-sky-500 transition"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Tax Rate %</label>
                <input
                  type="number"
                  value={form.taxRate}
                  onChange={e => setForm({ ...form, taxRate: e.target.value })}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-sky-500 transition"
                />
              </div>
            </div>
      
            {/* Totals summary */}
            <div className="rounded-xl border border-sky-100 bg-sky-50/60 p-4 space-y-1.5">
              <div className="flex justify-between text-xs text-slate-600">
                <span>Subtotal</span>
                <span>{form.currency} {totals.subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-xs text-slate-600">
                <span>Tax</span>
                <span>{form.currency} {totals.taxAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm font-semibold text-slate-900 pt-1.5 border-t border-sky-100">
                <span>Total</span>
                <span>{form.currency} {totals.totalAmount.toLocaleString()}</span>
              </div>
            </div>
      
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Payment Terms</label>
              <input
                type="text"
                value={form.paymentTerms}
                onChange={e => setForm({ ...form, paymentTerms: e.target.value })}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-sky-500 transition"
              />
            </div>
      
            <div className="pb-1">
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Notes</label>
              <textarea
                rows={3}
                value={form.notes}
                onChange={e => setForm({ ...form, notes: e.target.value })}
                placeholder="Any additional notes for this quotation…"
                className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm placeholder:text-slate-400 resize-none focus:outline-none focus:border-sky-500 transition"
              />
            </div>
          </div>
      
          {/* Fixed footer — never scrolls, always visible */}
          <div className="flex justify-end gap-2 pt-3 mt-3 border-t border-slate-100 shrink-0">
            <button
              type="button"
              onClick={() => setIsFormOpen(false)}
              className="px-4 py-2.5 text-xs font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving || !form.leadId}
              className="px-4 py-2.5 text-xs font-medium bg-sky-600 text-white rounded-lg hover:bg-sky-700 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-sm shadow-sky-600/20"
            >
              {isSaving ? 'Saving…' : editing ? 'Save' : 'Create Draft'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={!!selected} onClose={() => setSelected(null)} title={selected?.quotationCode || 'Quotation'}>
        {selected && (
          <div className="space-y-3 text-xs">
            {isLoadingView ? (
              <p className="text-slate-500">Loading quotation details…</p>
            ) : (
              <>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-semibold text-slate-800">{selected.title}</h3>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      {selected.assignedToName || 'Unassigned'}
                      {selected.validityDate
                        ? ` · Valid until ${new Date(selected.validityDate).toLocaleDateString()}`
                        : ''}
                    </p>
                  </div>
                  <StatusBadge status={selected.status} />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 border border-slate-200 rounded-lg p-3">
                  <div>
                    <p className="text-[10px] uppercase tracking-wide text-slate-500">Lead</p>
                    <p className="text-xs text-slate-800 mt-0.5">
                      {selected.leadCode ? `${selected.leadCode} — ${selected.leadName || selected.customerName || '—'}` : '—'}
                    </p>
                    {(selected.leadCountry || selected.leadEmail || selected.leadPhone) && (
                      <p className="text-[10px] text-slate-500 mt-1">
                        {[selected.leadCountry, selected.leadEmail, selected.leadPhone].filter(Boolean).join(' · ')}
                      </p>
                    )}
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wide text-slate-500">Company</p>
                    <p className="text-xs text-slate-800 mt-0.5">
                      {selected.companyName || '—'}
                      {selected.companyCode ? ` (${selected.companyCode})` : ''}
                    </p>
                    {selected.companyCountry && (
                      <p className="text-[10px] text-slate-500 mt-1">{selected.companyCountry}</p>
                    )}
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wide text-slate-500">Customer</p>
                    <p className="text-xs text-slate-800 mt-0.5">
                      {selected.customerName || '—'}
                      {selected.customerCode ? ` (${selected.customerCode})` : ''}
                    </p>
                    {(selected.customerEmail || selected.customerPhone) && (
                      <p className="text-[10px] text-slate-500 mt-1">
                        {[selected.customerEmail, selected.customerPhone].filter(Boolean).join(' · ')}
                      </p>
                    )}
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wide text-slate-500">Commercial</p>
                    <p className="text-xs text-slate-800 mt-0.5">
                      {selected.currency} {selected.totalAmount.toLocaleString()}
                    </p>
                    {selected.paymentTerms && (
                      <p className="text-[10px] text-slate-500 mt-1">Terms: {selected.paymentTerms}</p>
                    )}
                  </div>
                </div>

                {selected.notes && (
                  <div className="bg-white border border-slate-200 rounded-lg p-3">
                    <p className="text-[10px] uppercase tracking-wide text-slate-500">Notes</p>
                    <p className="text-xs text-slate-700 mt-1 whitespace-pre-wrap">{selected.notes}</p>
                  </div>
                )}

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
                <div className="text-xs text-slate-600">
                  Subtotal: {selected.currency} {selected.subtotal.toLocaleString()} · Tax:{' '}
                  {selected.taxAmount.toLocaleString()} · Discount: {selected.discountAmount.toLocaleString()}
                </div>
                <p className="font-semibold text-slate-800">
                  Total: {selected.currency} {selected.totalAmount.toLocaleString()}
                </p>
                {selected.orderCode && (
                  <p className="text-emerald-700">Linked order: {selected.orderCode}</p>
                )}
              </>
            )}
          </div>
        )}
      </Modal>

      <Modal
        isOpen={!!buildTarget && !isLoadingBuildDraft}
  onClose={() => setBuildTarget(null)}
        title={buildTarget ? `Build Order — ${buildTarget.quotationCode}` : 'Build Order'}
      >
  {buildTarget && (
    <form onSubmit={handleBuildOrder} className="flex flex-col ">
      {/* Scrollable fields — the ONLY scroll container in the modal */}
      <div className="flex-1 overflow-y-auto px-1 space-y-5">
        <p className="text-[11px] text-slate-500 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
          Review and edit order details prefilled from quotation. The quotation record will not be modified.
        </p>

        {/* Contact info */}
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Customer
              </label>
              <input
                type="text"
                value={buildForm.customerName}
                onChange={e => setBuildForm({ ...buildForm, customerName: e.target.value })}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none transition"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Company 
              </label>
              <input
                type="text"
                value={buildForm.company}
                onChange={e => setBuildForm({ ...buildForm, company: e.target.value })}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none transition"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Email</label>
              <input
                type="email"
                value={buildForm.email}
                onChange={e => setBuildForm({ ...buildForm, email: e.target.value })}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none transition"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Phone</label>
              <input
                type="text"
                value={buildForm.phone}
                onChange={e => setBuildForm({ ...buildForm, phone: e.target.value })}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none transition"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Country</label>
              <SearchableSelect
                options={countryOptions}
                value={buildForm.country}
                onChange={v => setBuildForm({ ...buildForm, country: v })}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Assigned To</label>
              <SearchableSelect
                options={memberOptions}
                value={buildForm.assignedMemberId}
                onChange={v => setBuildForm({ ...buildForm, assignedMemberId: v })}
              />
            </div>
          </div>
        </div>

        {/* Order details */}
        <div className="space-y-3 pt-1 border-t border-slate-100">
          <div className="pt-3">
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Products <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={2}
              value={buildForm.products}
              onChange={e => setBuildForm({ ...buildForm, products: e.target.value })}
              className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm resize-none focus:outline-none transition"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Quantity</label>
              <input
                type="text"
                value={buildForm.quantity}
                onChange={e => setBuildForm({ ...buildForm, quantity: e.target.value })}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none transition"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Expected Delivery <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                value={buildForm.expectedDelivery}
                onChange={e => setBuildForm({ ...buildForm, expectedDelivery: e.target.value })}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none transition"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Order Value</label>
              <input
                type="number"
                value={buildForm.orderValue}
                onChange={e => setBuildForm({ ...buildForm, orderValue: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none transition"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Currency</label>
              <SearchableSelect
                options={CURRENCY_OPTIONS}
                value={buildForm.currency}
                onChange={v => setBuildForm({ ...buildForm, currency: v })}
              />
            </div>
          </div>
        </div>

        <div className="pb-1">
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">Notes</label>
          <textarea
            rows={3}
            value={buildForm.notes}
            onChange={e => setBuildForm({ ...buildForm, notes: e.target.value })}
            className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm resize-none focus:outline-none transition"
          />
        </div>
      </div>

      {/* Fixed footer — never scrolls, always visible */}
      <div className="flex justify-end gap-2 pt-3 mt-3 border-t border-slate-100 shrink-0">
        <button
          type="button"
          onClick={() => setBuildTarget(null)}
          className="px-4 py-2.5 text-xs font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isBuildingOrder}
          className="px-4 py-2.5 text-xs font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-sm shadow-indigo-600/20"
        >
          {isBuildingOrder ? 'Creating…' : 'Create Order'}
        </button>
      </div>
    </form>
  )}
</Modal>

      <ImportWizard
        entity="quotations"
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        onComplete={() => fetchQuotations(page)}
      />
    </div>
  );
};
