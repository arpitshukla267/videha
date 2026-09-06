import React, { useEffect, useMemo, useState } from 'react';
import {
  Search,
  Pencil,
  Download,
  RefreshCw,
  FileText,
  Plus,
  Trash2,
  CreditCard
} from 'lucide-react';
import { api } from '../../api/client';
import { Bill, BillLineItem, BillStatus } from '../../types/crm';
import { Modal } from '../../components/ui/Modal';
import { SearchableSelect } from '../../components/ui/SearchableSelect';
import { DateTimePicker } from '../../components/ui/DateTimePicker';
import { useAuth } from '../../context/AuthContext';

const STATUS_OPTIONS: { value: BillStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All Statuses' },
  { value: 'issued', label: 'Issued' },
  { value: 'partially_paid', label: 'Partially Paid' },
  { value: 'paid', label: 'Paid' },
  { value: 'overdue', label: 'Overdue' },
  { value: 'draft', label: 'Draft' },
  { value: 'void', label: 'Void' }
];

const STATUS_STYLES: Record<BillStatus, string> = {
  draft: 'bg-slate-100 text-slate-700 border-slate-200',
  issued: 'bg-sky-50 text-sky-700 border-sky-100',
  partially_paid: 'bg-amber-50 text-amber-700 border-amber-100',
  paid: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  overdue: 'bg-rose-50 text-rose-700 border-rose-100',
  void: 'bg-slate-50 text-slate-500 border-slate-200'
};

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
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [editBill, setEditBill] = useState<Bill | null>(null);
  const [editForm, setEditForm] = useState<BillForm | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [paymentBill, setPaymentBill] = useState<Bill | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [isRecordingPayment, setIsRecordingPayment] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const fetchBills = async () => {
    setIsLoading(true);
    try {
      const res = await api.bills.getBills({
        search,
        status: statusFilter
      });
      if (res.success) setBills(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBills();
  }, [search, statusFilter]);

  const preview = useMemo(
    () => (editForm ? recalcPreview(editForm) : null),
    [editForm]
  );

  const openEdit = (bill: Bill) => {
    setEditBill(bill);
    setEditForm(billToForm(bill));
  };

  const updateLineItem = (index: number, patch: Partial<BillLineItem>) => {
    setEditForm(prev => {
      if (!prev) return prev;
      const lineItems = prev.lineItems.map((item, i) => {
        if (i !== index) return item;
        const next = { ...item, ...patch };
        if (patch.unitPrice !== undefined || patch.quantity !== undefined) {
          next.amount = Number(next.unitPrice) || 0;
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

  return (
    <div className="p-6 space-y-5 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-slate-800">Bills & Invoices</h3>
          <p className="text-xs text-slate-500">
            Delivered orders appear here automatically — edit invoice details and download PDF
          </p>
        </div>
        {hasPermission('bills.edit') && (
          <button
            type="button"
            onClick={handleSync}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-700 hover:bg-slate-50"
          >
            <RefreshCw className="w-4 h-4" />
            Sync Delivered Orders
          </button>
        )}
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search bills, orders, companies…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-sky-600"
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

      <div className="bg-white border border-slate-200 rounded-xl shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-600 font-semibold">
                <th className="py-3 px-4">Invoice</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Order</th>
                <th className="py-3 px-4">Total</th>
                <th className="py-3 px-4">Paid</th>
                <th className="py-3 px-4">Due</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Due Date</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    Loading bills…
                  </td>
                </tr>
              ) : bills.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    No bills yet. Delivered orders will appear here automatically.
                  </td>
                </tr>
              ) : (
                bills.map(bill => (
                  <tr key={bill.id} className="hover:bg-slate-50/70">
                    <td className="py-3 px-4">
                      <p className="font-mono font-semibold text-slate-800">{bill.billCode}</p>
                      <p className="text-[10px] text-slate-400">
                        {bill.issuedAt ? new Date(bill.issuedAt).toLocaleDateString() : '—'}
                      </p>
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-medium text-slate-800">{bill.company}</p>
                      <p className="text-[10px] text-slate-500">{bill.customerName}</p>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-600">{bill.orderCode}</td>
                    <td className="py-3 px-4 font-semibold text-slate-800">
                      {formatMoney(bill.totalAmount, bill.currency)}
                    </td>
                    <td className="py-3 px-4 text-emerald-700">
                      {formatMoney(bill.amountPaid, bill.currency)}
                    </td>
                    <td className="py-3 px-4 text-amber-700 font-semibold">
                      {formatMoney(bill.amountDue, bill.currency)}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex text-[10px] font-medium px-2 py-0.5 rounded border capitalize ${
                          STATUS_STYLES[bill.status]
                        }`}
                      >
                        {bill.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {bill.dueDate ? new Date(bill.dueDate).toLocaleDateString() : '—'}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => handleDownload(bill)}
                          disabled={downloadingId === bill.id}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-sky-700 hover:bg-sky-50"
                          title="Download PDF invoice"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        {hasPermission('bills.edit') && (
                          <>
                            <button
                              type="button"
                              onClick={() => openEdit(bill)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-sky-700 hover:bg-sky-50"
                              title="Edit invoice"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setPaymentBill(bill);
                                setPaymentAmount(String(bill.amountDue));
                              }}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-700 hover:bg-emerald-50"
                              title="Record payment"
                            >
                              <CreditCard className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        isOpen={!!editBill && !!editForm}
        onClose={() => {
          setEditBill(null);
          setEditForm(null);
        }}
        title="Edit Invoice"
        subtitle={editBill ? `${editBill.billCode} · ${editBill.orderCode}` : ''}
        maxWidth="xl"
      >
        {editForm && editBill && (
          <form onSubmit={handleSave} className="space-y-4 text-xs max-h-[70vh] overflow-y-auto pr-1">
            <div className="rounded-lg border border-sky-100 bg-sky-50/40 p-3 flex items-start gap-2">
              <FileText className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
              <p className="text-slate-600 leading-relaxed">
                Update invoice fields below, then save and download the PDF. Changes apply to the
                generated invoice document.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-medium text-slate-700 mb-1">Company</label>
                <input
                  value={editForm.company}
                  onChange={e => setEditForm({ ...editForm, company: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                />
              </div>
              <div>
                <label className="block font-medium text-slate-700 mb-1">Contact Name</label>
                <input
                  value={editForm.customerName}
                  onChange={e => setEditForm({ ...editForm, customerName: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                />
              </div>
              <div>
                <label className="block font-medium text-slate-700 mb-1">Email</label>
                <input
                  value={editForm.email}
                  onChange={e => setEditForm({ ...editForm, email: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                />
              </div>
              <div>
                <label className="block font-medium text-slate-700 mb-1">Phone</label>
                <input
                  value={editForm.phone}
                  onChange={e => setEditForm({ ...editForm, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block font-medium text-slate-700 mb-1">Billing Address</label>
                <textarea
                  rows={2}
                  value={editForm.billingAddress}
                  onChange={e => setEditForm({ ...editForm, billingAddress: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                />
              </div>
              <div>
                <label className="block font-medium text-slate-700 mb-1">GST / Tax ID</label>
                <input
                  value={editForm.gstNumber}
                  onChange={e => setEditForm({ ...editForm, gstNumber: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                />
              </div>
              <div>
                <label className="block font-medium text-slate-700 mb-1">Currency</label>
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
                <label className="block font-medium text-slate-700 mb-1">Issue Date</label>
                <DateTimePicker
                  includeTime
                  value={editForm.issuedAt}
                  onChange={v => setEditForm({ ...editForm, issuedAt: v })}
                />
              </div>
              <div>
                <label className="block font-medium text-slate-700 mb-1">Due Date</label>
                <DateTimePicker
                  includeTime
                  value={editForm.dueDate}
                  onChange={v => setEditForm({ ...editForm, dueDate: v })}
                />
              </div>
              <div>
                <label className="block font-medium text-slate-700 mb-1">Tax Rate (%)</label>
                <input
                  type="number"
                  min={0}
                  step={0.1}
                  value={editForm.taxRate}
                  onChange={e =>
                    setEditForm({ ...editForm, taxRate: Number(e.target.value) || 0 })
                  }
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                />
              </div>
              <div>
                <label className="block font-medium text-slate-700 mb-1">Amount Paid</label>
                <input
                  type="number"
                  min={0}
                  step={0.01}
                  value={editForm.amountPaid}
                  onChange={e =>
                    setEditForm({ ...editForm, amountPaid: Number(e.target.value) || 0 })
                  }
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block font-medium text-slate-700 mb-1">Payment Terms</label>
                <input
                  value={editForm.paymentTerms}
                  onChange={e => setEditForm({ ...editForm, paymentTerms: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="font-medium text-slate-700">Line Items</label>
                <button
                  type="button"
                  onClick={addLineItem}
                  className="inline-flex items-center gap-1 text-[11px] text-sky-700 hover:text-sky-800"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add line
                </button>
              </div>
              <div className="space-y-2">
                {editForm.lineItems.map((item, index) => (
                  <div
                    key={index}
                    className="grid grid-cols-12 gap-2 items-start rounded-lg border border-slate-100 p-2"
                  >
                    <input
                      value={item.description}
                      onChange={e => updateLineItem(index, { description: e.target.value })}
                      placeholder="Description"
                      className="col-span-5 px-2 py-1.5 border border-slate-200 rounded-lg"
                    />
                    <input
                      value={item.quantity}
                      onChange={e => updateLineItem(index, { quantity: e.target.value })}
                      placeholder="Qty"
                      className="col-span-2 px-2 py-1.5 border border-slate-200 rounded-lg"
                    />
                    <input
                      type="number"
                      value={item.unitPrice}
                      onChange={e =>
                        updateLineItem(index, { unitPrice: Number(e.target.value) || 0 })
                      }
                      placeholder="Price"
                      className="col-span-2 px-2 py-1.5 border border-slate-200 rounded-lg"
                    />
                    <input
                      type="number"
                      value={item.amount}
                      onChange={e =>
                        updateLineItem(index, { amount: Number(e.target.value) || 0 })
                      }
                      placeholder="Amount"
                      className="col-span-2 px-2 py-1.5 border border-slate-200 rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => removeLineItem(index)}
                      className="col-span-1 p-1.5 text-slate-400 hover:text-rose-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Invoice Notes</label>
              <textarea
                rows={2}
                value={editForm.invoiceNotes}
                onChange={e => setEditForm({ ...editForm, invoiceNotes: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Bank Details (on PDF)</label>
              <textarea
                rows={3}
                value={editForm.bankDetails}
                onChange={e => setEditForm({ ...editForm, bankDetails: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono text-[11px]"
              />
            </div>

            {preview && (
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <p className="text-[10px] text-slate-400 uppercase">Subtotal</p>
                  <p className="font-semibold">{formatMoney(preview.subtotal, editForm.currency)}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 uppercase">Tax</p>
                  <p className="font-semibold">{formatMoney(preview.taxAmount, editForm.currency)}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 uppercase">Total</p>
                  <p className="font-semibold">{formatMoney(preview.totalAmount, editForm.currency)}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 uppercase">Due</p>
                  <p className="font-semibold text-amber-700">
                    {formatMoney(preview.amountDue, editForm.currency)}
                  </p>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setEditBill(null);
                  setEditForm(null);
                }}
                className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDownload(editBill)}
                className="px-4 py-2 rounded-lg border border-sky-200 text-sky-700 font-medium"
              >
                Download PDF
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="px-4 py-2 rounded-lg bg-sky-600 text-white font-medium disabled:opacity-50"
              >
                {isSaving ? 'Saving…' : 'Save Invoice'}
              </button>
            </div>
          </form>
        )}
      </Modal>

      <Modal
        isOpen={!!paymentBill}
        onClose={() => setPaymentBill(null)}
        title="Record Payment"
        subtitle={paymentBill?.billCode}
      >
        <form onSubmit={handleRecordPayment} className="space-y-4 text-xs">
          <p className="text-slate-600">
            Outstanding due:{' '}
            <span className="font-semibold text-amber-700">
              {paymentBill ? formatMoney(paymentBill.amountDue, paymentBill.currency) : '—'}
            </span>
          </p>
          <div>
            <label className="block font-medium text-slate-700 mb-1">Payment Amount</label>
            <input
              type="number"
              min={0}
              step={0.01}
              required
              value={paymentAmount}
              onChange={e => setPaymentAmount(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg"
            />
          </div>
          <div>
            <label className="block font-medium text-slate-700 mb-1">Notes</label>
            <textarea
              rows={2}
              value={paymentNotes}
              onChange={e => setPaymentNotes(e.target.value)}
              placeholder="Wire ref, UTR, cheque no…"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setPaymentBill(null)}
              className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isRecordingPayment}
              className="px-4 py-2 rounded-lg bg-emerald-600 text-white font-medium disabled:opacity-50"
            >
              {isRecordingPayment ? 'Recording…' : 'Record Payment'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
