import React, { useEffect, useMemo, useState } from 'react';
import {
  Search,
  Pencil,
  Download,
  RefreshCw,
  FileText,
  Plus,
  Trash2,
  CreditCard,
  Receipt,
  Building2,
  Landmark,
  StickyNote
} from 'lucide-react';
import { api } from '../../api/client';
import { Bill, BillLineItem, BillStatus } from '../../types/crm';
import { Modal } from '../../components/ui/Modal';
import { SearchableSelect } from '../../components/ui/SearchableSelect';
import { DateTimePicker } from '../../components/ui/DateTimePicker';
import { useAuth } from '../../context/AuthContext';
import { PaginationBar } from '../../components/ui/PaginationBar';
import { LIST_PAGE_SIZE } from '../../lib/pagination';

const STATUS_OPTIONS: { value: BillStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All Statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'issued', label: 'Issued' },
  { value: 'partially_paid', label: 'Partially Paid' },
  { value: 'paid', label: 'Paid' },
  { value: 'overdue', label: 'Overdue' },
  { value: 'draft', label: 'Draft' },
  { value: 'void', label: 'Void' }
];

const STATUS_STYLES: Record<BillStatus, string> = {
  draft: 'bg-slate-100 text-slate-700 border-slate-200',
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  issued: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  partially_paid: 'bg-orange-50 text-orange-700 border-orange-100',
  paid: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  overdue: 'bg-rose-50 text-rose-700 border-rose-100',
  void: 'bg-slate-50 text-slate-500 border-slate-200'
};

function billStatusStyle(status?: string) {
  if (status && status in STATUS_STYLES) {
    return STATUS_STYLES[status as BillStatus];
  }
  return 'bg-slate-100 text-slate-600 border-slate-200';
}

function billStatusLabel(status?: string) {
  return (status || 'pending').replace(/_/g, ' ');
}

function formatMoney(amount: number, currency = 'USD') {
  const prefix = currency === 'INR' ? '₹' : currency === 'USD' ? '$' : `${currency} `;
  return `${prefix}${amount.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
}

function billToForm(bill: Bill) {
  return {
    customerName: bill.customerName,
    company: bill.company,
    phone: bill.phone,
    email: bill.email,
    country: bill.country,
    products: bill.products,
    quantity: bill.quantity,
    lineItems: bill.lineItems?.length
      ? bill.lineItems
      : [{ description: bill.products, quantity: bill.quantity || '1', unitPrice: bill.subtotal, amount: bill.subtotal }],
    taxRate: bill.taxRate,
    amountPaid: bill.amountPaid,
    currency: bill.currency,
    paymentTerms: bill.paymentTerms,
    status: bill.status,
    dueDate: bill.dueDate ? bill.dueDate.slice(0, 16) : '',
    issuedAt: bill.issuedAt ? bill.issuedAt.slice(0, 16) : '',
    invoiceNotes: bill.invoiceNotes,
    billingAddress: bill.billingAddress,
    gstNumber: bill.gstNumber,
    bankDetails: bill.bankDetails
  };
}

type BillForm = ReturnType<typeof billToForm>;

function recalcPreview(form: BillForm) {
  const subtotal = form.lineItems.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  const taxAmount = Math.round(subtotal * (form.taxRate / 100) * 100) / 100;
  const totalAmount = Math.round((subtotal + taxAmount) * 100) / 100;
  const amountDue = Math.max(0, Math.round((totalAmount - form.amountPaid) * 100) / 100);
  return { subtotal, taxAmount, totalAmount, amountDue };
}

export const BillsPage: React.FC = () => {
  const { hasPermission } = useAuth();
  const [bills, setBills] = useState<Bill[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [pageLimit] = useState(LIST_PAGE_SIZE);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [editBill, setEditBill] = useState<Bill | null>(null);
  const [editForm, setEditForm] = useState<BillForm | null>(null);
  const [isLoadingEdit, setIsLoadingEdit] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [paymentBill, setPaymentBill] = useState<Bill | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [isRecordingPayment, setIsRecordingPayment] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const fetchBills = async (pageNum = page) => {
    setIsLoading(true);
    try {
      const res = await api.bills.getBills({
        search: search.trim() || undefined,
        status: statusFilter,
        page: pageNum,
        limit: pageLimit
      });
      if (res.success) {
        setBills(res.data);
        setTotal(res.total);
        setPage(res.page);
        setTotalPages(res.totalPages);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter]);

  useEffect(() => {
    fetchBills(page);
  }, [search, statusFilter, page]);

  const preview = useMemo(
    () => (editForm ? recalcPreview(editForm) : null),
    [editForm]
  );

  const openEdit = async (bill: Bill) => {
    setEditBill(bill);
    setIsLoadingEdit(true);
    setEditForm(null);
    try {
      const res = await api.bills.getBill(bill.id);
      if (res.success) {
        setEditBill(res.data);
        setEditForm(billToForm(res.data));
      }
    } catch (err) {
      console.error(err);
      setEditBill(null);
    } finally {
      setIsLoadingEdit(false);
    }
  };

  const updateLineItem = (index: number, patch: Partial<BillLineItem>) => {
    setEditForm(prev => {
      if (!prev) return prev;
      const lineItems = prev.lineItems.map((item, i) => {
        if (i !== index) return item;
        const next = { ...item, ...patch };
        if (patch.unitPrice !== undefined || patch.quantity !== undefined) {
          const qty = parseFloat(String(next.quantity)) || 1;
          const unitPrice = Number(next.unitPrice) || 0;
          next.amount = Math.round(unitPrice * qty * 100) / 100;
        }
        return next;
      });
      return { ...prev, lineItems };
    });
  };

  const addLineItem = () => {
    setEditForm(prev =>
      prev
        ? {
            ...prev,
            lineItems: [
              ...prev.lineItems,
              { description: '', quantity: '1', unitPrice: 0, amount: 0 }
            ]
          }
        : prev
    );
  };

  const removeLineItem = (index: number) => {
    setEditForm(prev =>
      prev && prev.lineItems.length > 1
        ? { ...prev, lineItems: prev.lineItems.filter((_, i) => i !== index) }
        : prev
    );
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editBill || !editForm) return;
    setIsSaving(true);
    try {
      const res = await api.bills.updateBill(editBill.id, editForm);
      if (res.success) {
        setEditBill(null);
        setEditForm(null);
        fetchBills();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to save invoice');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDownload = async (bill: Bill) => {
    setDownloadingId(bill.id);
    try {
      await api.bills.downloadPdf(bill.id, bill.billCode);
    } catch (err: any) {
      alert(err.message || 'Failed to download PDF');
    } finally {
      setDownloadingId(null);
    }
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentBill) return;
    const amount = Number(paymentAmount);
    if (!amount || amount <= 0) {
      alert('Enter a valid payment amount');
      return;
    }
    if (amount > paymentBill.amountDue) {
      alert(`Payment amount cannot exceed amount due (${formatMoney(paymentBill.amountDue, paymentBill.currency)})`);
      return;
    }
    setIsRecordingPayment(true);
    try {
      await api.bills.recordPayment(paymentBill.id, amount, paymentNotes);
      setPaymentBill(null);
      setPaymentAmount('');
      setPaymentNotes('');
      fetchBills();
    } catch (err: any) {
      alert(err.message || 'Failed to record payment');
    } finally {
      setIsRecordingPayment(false);
    }
  };

  const handleSync = async () => {
    try {
      const res = await api.bills.syncFromOrders();
      if (res.success) {
        fetchBills();
        if (res.data.created > 0) {
          alert(`Created ${res.data.created} bill(s) from delivered orders.`);
        }
      }
    } catch (err: any) {
      alert(err.message || 'Sync failed');
    }
  };

  const inputClass =
    'w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-emerald-500 transition bg-white';

  // Labeled section wrapper — breaks the invoice form into readable groups.
  const FormSection: React.FC<{ icon: React.ReactNode; title: string; children: React.ReactNode }> = ({
    icon,
    title,
    children
  }) => (
    <div className="rounded-xl border border-slate-200 p-3.5">
      <div className="flex items-center gap-1.5 mb-3 text-slate-500">
        {icon}
        <p className="text-[11px] font-bold uppercase tracking-wider">{title}</p>
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  );

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center">
              <Receipt className="w-4 h-4" />
            </span>
            Bills & Invoices
          </h3>
          <p className="text-sm text-slate-500 mt-1 ml-10">
            Delivered orders appear here automatically — edit invoice details and download PDF
          </p>
        </div>
        {hasPermission('bills.edit') && (
          <button
            type="button"
            onClick={handleSync}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
          >
            <RefreshCw className="w-4 h-4" />
            Sync Delivered Orders
          </button>
        )}
      </div>

      {/* Toolbar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-3 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search bills, orders, companies…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:outline-none focus:border-emerald-500 transition"
            />
          </div>
          <SearchableSelect
            options={STATUS_OPTIONS}
            value={statusFilter}
            onChange={setStatusFilter}
            placeholder="Status"
          />
        </div>
      </div>

      {/* Bill cards */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="py-16 text-center text-slate-400 bg-white border border-slate-200 rounded-2xl">
            Loading bills…
          </div>
        ) : bills.length === 0 ? (
          <div className="py-16 text-center text-slate-400 bg-white border border-slate-200 rounded-2xl">
            No bills yet. Delivered orders will appear here automatically.
          </div>
        ) : (
          bills.map(bill => (
            <div
              key={bill.id}
              className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm hover:border-emerald-200 transition"
            >
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-bold text-slate-900">{bill.billCode}</span>
                    <span
                      className={`inline-flex text-[11px] font-semibold px-2 py-0.5 rounded-full border capitalize ${billStatusStyle(
                        bill.status
                      )}`}
                    >
                      {billStatusLabel(bill.status)}
                    </span>
                    <span className="text-xs text-slate-400">
                      {bill.issuedAt ? new Date(bill.issuedAt).toLocaleDateString() : 'No issue date'}
                    </span>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800 truncate">{bill.company || '—'}</p>
                    <p className="text-xs text-slate-500 truncate">
                      {bill.customerName || '—'} · Order {bill.orderCode || '—'}
                    </p>
                  </div>
                  <div className="grid grid-cols-3 gap-3 max-w-md text-xs">
                    <div>
                      <p className="text-slate-400 uppercase tracking-wide text-[10px]">Total</p>
                      <p className="font-semibold text-slate-800 mt-0.5">
                        {formatMoney(bill.totalAmount ?? 0, bill.currency)}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-400 uppercase tracking-wide text-[10px]">Paid</p>
                      <p className="font-semibold text-emerald-700 mt-0.5">
                        {formatMoney(bill.amountPaid ?? 0, bill.currency)}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-400 uppercase tracking-wide text-[10px]">Due</p>
                      <p className="font-semibold text-amber-700 mt-0.5">
                        {formatMoney(bill.amountDue ?? 0, bill.currency)}
                      </p>
                    </div>
                  </div>
                  {bill.dueDate && (
                    <p className="text-[11px] text-slate-500">
                      Due {new Date(bill.dueDate).toLocaleDateString()}
                    </p>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleDownload(bill)}
                    disabled={downloadingId === bill.id}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 transition disabled:opacity-60"
                  >
                    <Download className="w-3.5 h-3.5" />
                    {downloadingId === bill.id ? 'Downloading…' : 'Download PDF'}
                  </button>
                  {hasPermission('bills.edit') && (
                    <>
                      <button
                        type="button"
                        onClick={() => openEdit(bill)}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 text-slate-700 text-xs font-medium hover:bg-slate-50 transition"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setPaymentBill(bill);
                          setPaymentAmount(String(bill.amountDue ?? 0));
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 text-slate-700 text-xs font-medium hover:bg-slate-50 transition"
                      >
                        <CreditCard className="w-3.5 h-3.5" />
                        Payment
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <PaginationBar
        page={page}
        totalPages={totalPages}
        total={total}
        isLoading={isLoading}
        onPageChange={nextPage => setPage(nextPage)}
        label="bills"
      />

      {/* Edit Invoice modal */}
      <Modal
        isOpen={!!editBill}
        onClose={() => {
          setEditBill(null);
          setEditForm(null);
        }}
        title="Edit Invoice"
        subtitle={editBill ? `${editBill.billCode} · ${editBill.orderCode}` : ''}
        maxWidth="xl"
      >
        {isLoadingEdit ? (
          <div className="py-12 text-center text-slate-400 text-sm">Loading invoice details…</div>
        ) : editForm && editBill ? (
          <form onSubmit={handleSave} className="flex flex-col max-h-[75vh] text-sm">
            <div className="flex-1 overflow-y-auto px-1 space-y-3">
              <div className="rounded-xl border border-emerald-100 bg-emerald-50/40 p-3.5 flex items-start gap-2.5">
                <FileText className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <p className="text-slate-600 leading-relaxed text-xs">
                  Update invoice fields below, then save and download the PDF. Changes apply to the
                  generated invoice document.
                </p>
              </div>

              <FormSection icon={<Building2 className="w-3.5 h-3.5" />} title="Bill To">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1.5">Company</label>
                    <input
                      value={editForm.company}
                      onChange={e => setEditForm({ ...editForm, company: e.target.value })}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1.5">Contact Name</label>
                    <input
                      value={editForm.customerName}
                      onChange={e => setEditForm({ ...editForm, customerName: e.target.value })}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1.5">Email</label>
                    <input
                      value={editForm.email}
                      onChange={e => setEditForm({ ...editForm, email: e.target.value })}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1.5">Phone</label>
                    <input
                      value={editForm.phone}
                      onChange={e => setEditForm({ ...editForm, phone: e.target.value })}
                      className={inputClass}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block font-semibold text-slate-700 mb-1.5">Billing Address</label>
                    <textarea
                      rows={2}
                      value={editForm.billingAddress}
                      onChange={e => setEditForm({ ...editForm, billingAddress: e.target.value })}
                      className={`${inputClass} resize-none`}
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1.5">GST / Tax ID</label>
                    <input
                      value={editForm.gstNumber}
                      onChange={e => setEditForm({ ...editForm, gstNumber: e.target.value })}
                      className={inputClass}
                    />
                  </div>
                </div>
              </FormSection>

              <FormSection icon={<Receipt className="w-3.5 h-3.5" />} title="Invoice Terms">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1.5">Currency</label>
                    <SearchableSelect
                      options={[
                        { value: 'USD', label: 'USD' },
                        { value: 'INR', label: 'INR' },
                        { value: 'EUR', label: 'EUR' },
                        { value: 'AED', label: 'AED' }
                      ]}
                      value={editForm.currency}
                      onChange={v => setEditForm({ ...editForm, currency: v })}
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1.5">Tax Rate (%)</label>
                    <input
                      type="number"
                      min={0}
                      step={0.1}
                      value={editForm.taxRate}
                      onChange={e =>
                        setEditForm({ ...editForm, taxRate: Number(e.target.value) || 0 })
                      }
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1.5">Issue Date</label>
                    <DateTimePicker
                      includeTime
                      value={editForm.issuedAt}
                      onChange={v => setEditForm({ ...editForm, issuedAt: v })}
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1.5">Due Date</label>
                    <DateTimePicker
                      includeTime
                      value={editForm.dueDate}
                      onChange={v => setEditForm({ ...editForm, dueDate: v })}
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1.5">Amount Paid</label>
                    <input
                      type="number"
                      min={0}
                      step={0.01}
                      value={editForm.amountPaid}
                      onChange={e =>
                        setEditForm({ ...editForm, amountPaid: Number(e.target.value) || 0 })
                      }
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1.5">Payment Terms</label>
                    <input
                      value={editForm.paymentTerms}
                      onChange={e => setEditForm({ ...editForm, paymentTerms: e.target.value })}
                      className={inputClass}
                    />
                  </div>
                </div>
              </FormSection>

              <div className="rounded-xl border border-slate-200 p-3.5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-1.5 text-slate-500">
                    <Receipt className="w-3.5 h-3.5" />
                    <p className="text-[11px] font-bold uppercase tracking-wider">Line Items</p>
                  </div>
                  <button
                    type="button"
                    onClick={addLineItem}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:text-emerald-800 transition"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add line
                  </button>
                </div>
                <div className="space-y-3">
                  {editForm.lineItems.map((item, index) => (
                    <div
                      key={index}
                      className="rounded-lg border border-slate-200 p-3 space-y-2 bg-slate-50/40"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <label className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                          Line {index + 1}
                        </label>
                        <button
                          type="button"
                          onClick={() => removeLineItem(index)}
                          className="p-1 text-slate-400 hover:text-rose-600 transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <input
                        value={item.description}
                        onChange={e => updateLineItem(index, { description: e.target.value })}
                        placeholder="Description"
                        className="w-full px-2 py-1.5 border border-slate-200 rounded-md text-xs focus:outline-none focus:border-emerald-500 transition bg-white"
                      />
                      <div className="grid grid-cols-3 gap-2">
                        <input
                          value={item.quantity}
                          onChange={e => updateLineItem(index, { quantity: e.target.value })}
                          placeholder="Qty"
                          className="px-2 py-1.5 border border-slate-200 rounded-md text-xs focus:outline-none focus:border-emerald-500 transition bg-white"
                        />
                        <input
                          type="number"
                          value={item.unitPrice}
                          onChange={e =>
                            updateLineItem(index, { unitPrice: Number(e.target.value) || 0 })
                          }
                          placeholder="Unit price"
                          className="px-2 py-1.5 border border-slate-200 rounded-md text-xs focus:outline-none focus:border-emerald-500 transition bg-white"
                        />
                        <input
                          type="number"
                          value={item.amount}
                          onChange={e =>
                            updateLineItem(index, { amount: Number(e.target.value) || 0 })
                          }
                          placeholder="Amount"
                          className="px-2 py-1.5 border border-slate-200 rounded-md text-xs focus:outline-none focus:border-emerald-500 transition bg-white"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <FormSection icon={<StickyNote className="w-3.5 h-3.5" />} title="Notes & Bank Details">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1.5">Invoice Notes</label>
                  <textarea
                    rows={2}
                    value={editForm.invoiceNotes}
                    onChange={e => setEditForm({ ...editForm, invoiceNotes: e.target.value })}
                    className={`${inputClass} resize-none`}
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1.5 flex items-center gap-1">
                    <Landmark className="w-3.5 h-3.5" /> Bank Details (on PDF)
                  </label>
                  <textarea
                    rows={3}
                    value={editForm.bankDetails}
                    onChange={e => setEditForm({ ...editForm, bankDetails: e.target.value })}
                    className={`${inputClass} resize-none`}
                  />
                </div>
              </FormSection>

              {preview && (
                <div className="rounded-xl border border-emerald-100 bg-emerald-50/40 p-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <p className="text-[10px] text-slate-500 uppercase font-semibold tracking-wide">Subtotal</p>
                    <p className="font-semibold text-slate-800 mt-0.5">{formatMoney(preview.subtotal, editForm.currency)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500 uppercase font-semibold tracking-wide">Tax</p>
                    <p className="font-semibold text-slate-800 mt-0.5">{formatMoney(preview.taxAmount, editForm.currency)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500 uppercase font-semibold tracking-wide">Total</p>
                    <p className="font-semibold text-slate-800 mt-0.5">{formatMoney(preview.totalAmount, editForm.currency)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500 uppercase font-semibold tracking-wide">Due</p>
                    <p className="font-semibold text-amber-700 mt-0.5">
                      {formatMoney(preview.amountDue, editForm.currency)}
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-3 mt-3 border-t border-slate-100 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setEditBill(null);
                  setEditForm(null);
                }}
                className="px-4 py-2.5 rounded-lg border border-slate-200 text-slate-600 font-medium hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDownload(editBill)}
                disabled={downloadingId === editBill.id}
                className="px-4 py-2.5 rounded-lg border border-emerald-200 text-emerald-700 font-semibold hover:bg-emerald-50 transition disabled:opacity-60"
              >
                {downloadingId === editBill.id ? 'Downloading…' : 'Download PDF'}
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="px-4 py-2.5 rounded-lg bg-emerald-600 text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-emerald-700 transition shadow-sm"
              >
                {isSaving ? 'Saving…' : 'Save Invoice'}
              </button>
            </div>
          </form>
        ) : null}
      </Modal>

      {/* Record Payment modal */}
      <Modal
        isOpen={!!paymentBill}
        onClose={() => setPaymentBill(null)}
        title="Record Payment"
        subtitle={paymentBill?.billCode}
      >
        <form onSubmit={handleRecordPayment} className="flex flex-col max-h-[75vh] text-sm">
          <div className="flex-1 overflow-y-auto px-1 space-y-4">
            <div className="rounded-xl border border-amber-100 bg-amber-50/60 p-3.5">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-amber-700">Outstanding due</p>
              <p className="text-lg font-bold text-amber-800 mt-0.5">
                {paymentBill ? formatMoney(paymentBill.amountDue, paymentBill.currency) : '—'}
              </p>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1.5">Payment Amount</label>
              <input
                type="number"
                min={0}
                step={0.01}
                required
                value={paymentAmount}
                onChange={e => setPaymentAmount(e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1.5">Notes</label>
              <textarea
                rows={2}
                value={paymentNotes}
                onChange={e => setPaymentNotes(e.target.value)}
                placeholder="Wire ref, UTR, cheque no…"
                className={`${inputClass} resize-none`}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-3 mt-3 border-t border-slate-100 shrink-0">
            <button
              type="button"
              onClick={() => setPaymentBill(null)}
              className="px-4 py-2.5 rounded-lg border border-slate-200 text-slate-600 font-medium hover:bg-slate-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isRecordingPayment}
              className="px-4 py-2.5 rounded-lg bg-emerald-600 text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-emerald-700 transition shadow-sm"
            >
              {isRecordingPayment ? 'Recording…' : 'Record Payment'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};