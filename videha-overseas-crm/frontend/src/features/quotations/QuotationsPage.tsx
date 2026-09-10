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
    <div className="p-6 space-y-6">
      {/* Page header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Quotations</h2>
          <p className="text-sm text-slate-500 mt-1">Sales quotes linked to leads, customers, and orders</p>
        </div>
        <div className="flex items-center gap-2">
          {hasPermission('quotations.create') && (
            <button
              type="button"
              onClick={() => setIsImportOpen(true)}
              className="inline-flex items-center gap-2 px-3.5 py-2.5 bg-white text-emerald-700 hover:bg-emerald-50 border border-emerald-200 rounded-lg text-sm font-medium transition-colors shadow-sm"
            >
              <Upload className="w-4 h-4 text-emerald-600" />
              Import CSV
            </button>
          )}
          {hasPermission('quotations.view') && (
            <button
              type="button"
              onClick={handleExportCsv}
              disabled={isExporting}
              className="inline-flex items-center gap-2 px-3.5 py-2.5 bg-white text-teal-700 hover:bg-teal-50 border border-teal-200 rounded-lg text-sm font-medium transition-colors disabled:opacity-60 shadow-sm"
            >
              <Download className="w-4 h-4 text-teal-600" />
              {isExporting ? 'Exporting…' : 'Export CSV'}
            </button>
          )}
          {hasPermission('quotations.create') && (
            <button
              onClick={openCreate}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white text-sm font-semibold rounded-lg hover:bg-emerald-700 shadow-sm shadow-emerald-600/20 transition-colors"
            >
              <Plus className="w-4 h-4" />
              New Quotation
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 bg-white border border-slate-200 rounded-xl p-3 shadow-sm">
        <div className="relative flex-1 min-w-[220px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search quotations…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 transition"
          />
        </div>
        <SearchableSelect
          options={STATUS_OPTIONS}
          value={statusFilter}
          onChange={setStatusFilter}
          placeholder="Status"
        />
      </div>

      {/* Quotation cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {isLoading ? (
          [...Array(6)].map((_, i) => (
            <div key={i} className="h-40 bg-slate-100 rounded-xl animate-pulse" />
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
              className="bg-white border border-slate-200 rounded-xl p-5 hover:border-emerald-300 hover:shadow-md shadow-sm transition-all"
            >
              <div className="flex items-start justify-between gap-2 mb-2.5">
                <div>
                  <p className="text-xs font-mono text-slate-400 tracking-wide">{q.quotationCode}</p>
                  <h3 className="text-sm font-semibold text-slate-800 mt-1">{q.title}</h3>
                </div>
                <StatusBadge status={q.status} />
              </div>
              <p className="text-sm text-slate-600">
                {q.leadCode ? `${q.leadCode} · ` : ''}
                {q.companyName ? `${q.companyName}` : ''}
                {q.customerName ? ` · ${q.customerName}` : ''}
              </p>
              <p className="text-sm font-semibold text-emerald-700 mt-1">
                {q.currency} {q.totalAmount.toLocaleString()}
              </p>
              <p className="text-xs text-slate-500 mt-1.5">
                {q.assignedToName || 'Unassigned'}
                {q.validityDate ? ` · Valid until ${new Date(q.validityDate).toLocaleDateString()}` : ''}
              </p>
              <div className="flex flex-wrap gap-1.5 mt-4 pt-4 border-t border-slate-100">
                <button
                  onClick={() => void openView(q)}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium border border-slate-200 rounded-md hover:bg-slate-50 transition-colors"
                >
                  <FileText className="w-3.5 h-3.5" />
                  View
                </button>
                {hasPermission('quotations.edit') && q.status === 'Draft' && (
                  <button
                    onClick={() => openEdit(q)}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium border border-slate-200 rounded-md hover:bg-slate-50 transition-colors"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    Edit
                  </button>
                )}
                {hasPermission('quotations.edit') && q.status === 'Draft' && (
                  <button
                    onClick={() => handleStatusChange(q, 'Sent')}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-emerald-700 border border-emerald-200 rounded-md hover:bg-emerald-50 transition-colors"
                  >
                    <Send className="w-3.5 h-3.5" />
                    Send
                  </button>
                )}
                {hasPermission('quotations.edit') && q.status === 'Sent' && (
                  <button
                    onClick={() => handleStatusChange(q, 'Negotiation')}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-amber-700 border border-amber-200 rounded-md hover:bg-amber-50 transition-colors"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
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
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-teal-700 border border-teal-200 rounded-md hover:bg-teal-50 transition-colors"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Accept
                  </button>
                )}
                {hasPermission('orders.create') &&
                  q.status === 'Accepted' &&
                  !q.orderId &&
                  hasPermission('quotations.edit') && (
                    <button
                      onClick={() => void openBuildOrder(q)}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-md hover:bg-emerald-100 transition-colors"
                    >
                      <Package className="w-3.5 h-3.5" />
                      Build Order
                    </button>
                  )}
                {hasPermission('quotations.delete') && q.status === 'Draft' && (
                  <button
                    onClick={() => handleDelete(q)}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-rose-600 border border-rose-200 rounded-md hover:bg-rose-50 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
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
          <div className="flex-1 overflow-y-auto px-1 space-y-6">
            {/* Basic info */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Title
                </label>
                <input
                  type="text"
                  value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. Q3 Enterprise Package"
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 transition"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">
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
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Currency</label>
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
              <div className="grid grid-cols-2 gap-3.5 bg-gradient-to-br from-emerald-50 to-teal-50/60 border border-emerald-100 rounded-xl p-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600/70">Company</p>
                  <p className="text-sm text-slate-800 mt-1 font-medium">{form.companyLabel || '—'}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600/70">Customer</p>
                  <p className="text-sm text-slate-800 mt-1 font-medium">{form.customerLabel || '—'}</p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3.5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Assigned To</label>
                <SearchableSelect
                  options={memberOptions}
                  value={form.assignedToId}
                  onChange={v => setForm({ ...form, assignedToId: v })}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Validity Date</label>
                <DateTimePicker
                  value={form.validityDate}
                  onChange={v => setForm({ ...form, validityDate: v })}
                />
              </div>
            </div>

            {/* Line items */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-semibold text-slate-700">Line Items</label>
                <span className="text-xs text-slate-500">{form.lineItems.length} item{form.lineItems.length !== 1 ? 's' : ''}</span>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <div className="grid grid-cols-12 gap-2 px-3.5 py-2.5 bg-emerald-50/70 border-b border-slate-200 text-xs font-semibold uppercase tracking-wide text-emerald-700/80">
                  <span className="col-span-4">Description</span>
                  <span className="col-span-2">Qty</span>
                  <span className="col-span-2">Price</span>
                  <span className="col-span-2">Disc %</span>
                  <span className="col-span-2 text-right">Action</span>
                </div>

                <div className="divide-y divide-slate-100">
                  {form.lineItems.map((item, idx) => (
                    <div key={idx} className="grid grid-cols-12 gap-2 items-center px-3.5 py-2.5 hover:bg-emerald-50/30 transition">
                      <input
                        type="text"
                        placeholder="Description"
                        value={item.description}
                        onChange={e => updateLineItem(idx, { description: e.target.value })}
                        className="col-span-4 px-2.5 py-2 border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 transition"
                      />
                      <input
                        type="text"
                        placeholder="Qty"
                        value={item.quantity}
                        onChange={e => updateLineItem(idx, { quantity: e.target.value })}
                        className="col-span-2 px-2.5 py-2 border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 transition"
                      />
                      <input
                        type="number"
                        placeholder="Price"
                        value={item.unitPrice || ''}
                        onChange={e => updateLineItem(idx, { unitPrice: parseFloat(e.target.value) || 0 })}
                        className="col-span-2 px-2.5 py-2 border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 transition"
                      />
                      <input
                        type="number"
                        placeholder="Disc %"
                        value={item.discountPercent || ''}
                        onChange={e =>
                          updateLineItem(idx, { discountPercent: parseFloat(e.target.value) || 0 })
                        }
                        className="col-span-2 px-2.5 py-2 border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 transition"
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
                          className="text-xs font-medium text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-2.5 py-1.5 rounded-md transition"
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
                  className="w-full text-sm font-semibold text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 py-3 transition border-t border-slate-100"
                >
                  + Add line item
                </button>
              </div>
            </div>

            {/* Discount / tax */}
            <div className="grid grid-cols-2 gap-3.5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Order Discount</label>
                <input
                  type="number"
                  value={form.discountAmount}
                  onChange={e => setForm({ ...form, discountAmount: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 transition"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Tax Rate %</label>
                <input
                  type="number"
                  value={form.taxRate}
                  onChange={e => setForm({ ...form, taxRate: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 transition"
                />
              </div>
            </div>

            {/* Totals summary */}
            <div className="rounded-xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50/50 p-4.5 space-y-2">
              <div className="flex justify-between text-sm text-slate-600">
                <span>Subtotal</span>
                <span>{form.currency} {totals.subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm text-slate-600">
                <span>Tax</span>
                <span>{form.currency} {totals.taxAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-base font-bold text-emerald-800 pt-2 border-t border-emerald-200">
                <span>Total</span>
                <span>{form.currency} {totals.totalAmount.toLocaleString()}</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Payment Terms</label>
              <input
                type="text"
                value={form.paymentTerms}
                onChange={e => setForm({ ...form, paymentTerms: e.target.value })}
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 transition"
              />
            </div>

            <div className="pb-1">
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Notes</label>
              <textarea
                rows={3}
                value={form.notes}
                onChange={e => setForm({ ...form, notes: e.target.value })}
                placeholder="Any additional notes for this quotation…"
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg text-sm placeholder:text-slate-400 resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 transition"
              />
            </div>
          </div>

          {/* Fixed footer — never scrolls, always visible */}
          <div className="flex justify-end gap-2.5 pt-4 mt-4 border-t border-slate-100 shrink-0">
            <button
              type="button"
              onClick={() => setIsFormOpen(false)}
              className="px-4 py-2.5 text-sm font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving || !form.leadId}
              className="px-4 py-2.5 text-sm font-semibold bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-sm shadow-emerald-600/20"
            >
              {isSaving ? 'Saving…' : editing ? 'Save' : 'Create Draft'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={!!selected} onClose={() => setSelected(null)} title={selected?.quotationCode || 'Quotation'}>
        {selected && (
          <div className="space-y-4 text-sm">
            {isLoadingView ? (
              <p className="text-slate-500">Loading quotation details…</p>
            ) : (
              <>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-base font-semibold text-slate-800">{selected.title}</h3>
                    <p className="text-xs text-slate-500 mt-1">
                      {selected.assignedToName || 'Unassigned'}
                      {selected.validityDate
                        ? ` · Valid until ${new Date(selected.validityDate).toLocaleDateString()}`
                        : ''}
                    </p>
                  </div>
                  <StatusBadge status={selected.status} />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-emerald-50/60 border border-emerald-100 rounded-lg p-4">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-emerald-700/70 font-semibold">Lead</p>
                    <p className="text-sm text-slate-800 mt-1">
                      {selected.leadCode ? `${selected.leadCode} — ${selected.leadName || selected.customerName || '—'}` : '—'}
                    </p>
                    {(selected.leadCountry || selected.leadEmail || selected.leadPhone) && (
                      <p className="text-xs text-slate-500 mt-1">
                        {[selected.leadCountry, selected.leadEmail, selected.leadPhone].filter(Boolean).join(' · ')}
                      </p>
                    )}
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-emerald-700/70 font-semibold">Company</p>
                    <p className="text-sm text-slate-800 mt-1">
                      {selected.companyName || '—'}
                      {selected.companyCode ? ` (${selected.companyCode})` : ''}
                    </p>
                    {selected.companyCountry && (
                      <p className="text-xs text-slate-500 mt-1">{selected.companyCountry}</p>
                    )}
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-emerald-700/70 font-semibold">Customer</p>
                    <p className="text-sm text-slate-800 mt-1">
                      {selected.customerName || '—'}
                      {selected.customerCode ? ` (${selected.customerCode})` : ''}
                    </p>
                    {(selected.customerEmail || selected.customerPhone) && (
                      <p className="text-xs text-slate-500 mt-1">
                        {[selected.customerEmail, selected.customerPhone].filter(Boolean).join(' · ')}
                      </p>
                    )}
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-emerald-700/70 font-semibold">Commercial</p>
                    <p className="text-sm text-slate-800 mt-1">
                      {selected.currency} {selected.totalAmount.toLocaleString()}
                    </p>
                    {selected.paymentTerms && (
                      <p className="text-xs text-slate-500 mt-1">Terms: {selected.paymentTerms}</p>
                    )}
                  </div>
                </div>

                {selected.notes && (
                  <div className="bg-white border border-slate-200 rounded-lg p-4">
                    <p className="text-xs uppercase tracking-wide text-slate-500 font-semibold">Notes</p>
                    <p className="text-sm text-slate-700 mt-1.5 whitespace-pre-wrap">{selected.notes}</p>
                  </div>
                )}

                <table className="w-full border border-slate-200 rounded-lg overflow-hidden text-sm">
                  <thead className="bg-emerald-50/70">
                    <tr>
                      <th className="text-left px-3 py-2 text-xs font-semibold uppercase tracking-wide text-emerald-700/80">Item</th>
                      <th className="text-right px-3 py-2 text-xs font-semibold uppercase tracking-wide text-emerald-700/80">Qty</th>
                      <th className="text-right px-3 py-2 text-xs font-semibold uppercase tracking-wide text-emerald-700/80">Price</th>
                      <th className="text-right px-3 py-2 text-xs font-semibold uppercase tracking-wide text-emerald-700/80">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selected.lineItems.map((item, i) => (
                      <tr key={i} className="border-t border-slate-100">
                        <td className="px-3 py-2">{item.description}</td>
                        <td className="px-3 py-2 text-right">{item.quantity}</td>
                        <td className="px-3 py-2 text-right">{item.unitPrice}</td>
                        <td className="px-3 py-2 text-right">{item.amount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="text-sm text-slate-600">
                  Subtotal: {selected.currency} {selected.subtotal.toLocaleString()} · Tax:{' '}
                  {selected.taxAmount.toLocaleString()} · Discount: {selected.discountAmount.toLocaleString()}
                </div>
                <p className="text-base font-bold text-emerald-800">
                  Total: {selected.currency} {selected.totalAmount.toLocaleString()}
                </p>
                {selected.orderCode && (
                  <p className="text-sm font-medium text-emerald-700">Linked order: {selected.orderCode}</p>
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
            <div className="flex-1 overflow-y-auto px-1 space-y-6">
              <p className="text-sm text-emerald-800 bg-emerald-50 border border-emerald-100 rounded-lg px-3.5 py-2.5">
                Review and edit order details prefilled from quotation. The quotation record will not be modified.
              </p>

              {/* Contact info */}
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                      Customer
                    </label>
                    <input
                      type="text"
                      value={buildForm.customerName}
                      onChange={e => setBuildForm({ ...buildForm, customerName: e.target.value })}
                      className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 transition"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                      Company
                    </label>
                    <input
                      type="text"
                      value={buildForm.company}
                      onChange={e => setBuildForm({ ...buildForm, company: e.target.value })}
                      className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 transition"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Email</label>
                    <input
                      type="email"
                      value={buildForm.email}
                      onChange={e => setBuildForm({ ...buildForm, email: e.target.value })}
                      className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 transition"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Phone</label>
                    <input
                      type="text"
                      value={buildForm.phone}
                      onChange={e => setBuildForm({ ...buildForm, phone: e.target.value })}
                      className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 transition"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Country</label>
                    <SearchableSelect
                      options={countryOptions}
                      value={buildForm.country}
                      onChange={v => setBuildForm({ ...buildForm, country: v })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Assigned To</label>
                    <SearchableSelect
                      options={memberOptions}
                      value={buildForm.assignedMemberId}
                      onChange={v => setBuildForm({ ...buildForm, assignedMemberId: v })}
                    />
                  </div>
                </div>
              </div>

              {/* Order details */}
              <div className="space-y-4 pt-1 border-t border-slate-100">
                <div className="pt-4">
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                    Products <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    rows={2}
                    value={buildForm.products}
                    onChange={e => setBuildForm({ ...buildForm, products: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 transition"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Quantity</label>
                    <input
                      type="text"
                      value={buildForm.quantity}
                      onChange={e => setBuildForm({ ...buildForm, quantity: e.target.value })}
                      className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 transition"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                      Expected Delivery <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={buildForm.expectedDelivery}
                      onChange={e => setBuildForm({ ...buildForm, expectedDelivery: e.target.value })}
                      className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 transition"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Order Value</label>
                    <input
                      type="number"
                      value={buildForm.orderValue}
                      onChange={e => setBuildForm({ ...buildForm, orderValue: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 transition"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Currency</label>
                    <SearchableSelect
                      options={CURRENCY_OPTIONS}
                      value={buildForm.currency}
                      onChange={v => setBuildForm({ ...buildForm, currency: v })}
                    />
                  </div>
                </div>
              </div>

              <div className="pb-1">
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Notes</label>
                <textarea
                  rows={3}
                  value={buildForm.notes}
                  onChange={e => setBuildForm({ ...buildForm, notes: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 transition"
                />
              </div>
            </div>

            {/* Fixed footer — never scrolls, always visible */}
            <div className="flex justify-end gap-2.5 pt-4 mt-4 border-t border-slate-100 shrink-0">
              <button
                type="button"
                onClick={() => setBuildTarget(null)}
                className="px-4 py-2.5 text-sm font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isBuildingOrder}
                className="px-4 py-2.5 text-sm font-semibold bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-sm shadow-teal-600/20"
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