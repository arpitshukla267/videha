import React, { useEffect, useState } from 'react';
import {
  Plus,
  Search,
  Pencil,
  Download,
  Upload,
  Truck,
  Building2,
  User2,
  MapPin,
  Wallet,
  FileText,
  Package
} from 'lucide-react';
import { api } from '../../api/client';
import { Supplier } from '../../types/crm';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Modal } from '../../components/ui/Modal';
import { SearchableSelect } from '../../components/ui/SearchableSelect';
import { PaginationBar } from '../../components/ui/PaginationBar';
import { ListStatePanel } from '../../components/ui/ListStatePanel';
import { ImportWizard } from '../../components/import/ImportWizard';
import { useAuth } from '../../context/AuthContext';
import { alertSaveError, handleConflictWithReload } from '../../lib/apiErrors';
import { LIST_PAGE_SIZE } from '../../lib/pagination';

const STATUS_OPTIONS = [
  { value: 'all', label: 'All Statuses' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' }
];

const SORT_OPTIONS = [
  { value: 'supplierName:asc', label: 'Name (A–Z)' },
  { value: 'supplierName:desc', label: 'Name (Z–A)' },
  { value: 'supplierCode:asc', label: 'Code (A–Z)' },
  { value: 'createdAt:desc', label: 'Newest first' },
  { value: 'updatedAt:desc', label: 'Recently updated' }
];

const CURRENCY_OPTIONS = [
  { value: 'INR', label: 'INR' },
  { value: 'USD', label: 'USD' },
  { value: 'EUR', label: 'EUR' },
  { value: 'GBP', label: 'GBP' },
  { value: 'AED', label: 'AED' }
];

const emptyForm = () => ({
  supplierName: '',
  companyName: '',
  contactPerson: '',
  email: '',
  phone: '',
  address: '',
  country: '',
  taxId: '',
  paymentTerms: '',
  currency: 'USD',
  productsSupplied: '',
  status: 'active' as Supplier['status'],
  notes: ''
});

function initials(name?: string | null) {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export const SuppliersPage: React.FC = () => {
  const { hasPermission } = useAuth();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit] = useState(LIST_PAGE_SIZE);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortValue, setSortValue] = useState('supplierName:asc');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [editing, setEditing] = useState<Supplier | null>(null);
  const [form, setForm] = useState(emptyForm());
  const [isSaving, setIsSaving] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [selected, setSelected] = useState<Supplier | null>(null);
  const [isLoadingView, setIsLoadingView] = useState(false);

  const [sortBy, sortOrder] = sortValue.split(':') as [string, 'asc' | 'desc'];

  const fetchSuppliers = async (pageNum = page) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.suppliers.getSuppliers({
        search: search.trim() || undefined,
        status: statusFilter,
        sortBy,
        sortOrder,
        page: pageNum,
        limit
      });
      if (res.success) {
        setSuppliers(res.data);
        setTotal(res.total);
        setPage(res.page);
        setTotalPages(res.totalPages);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load suppliers.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers(1);
  }, [search, statusFilter, sortValue]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm());
    setIsFormOpen(true);
  };

  const openView = async (supplier: Supplier) => {
    setSelected(supplier);
    setIsLoadingView(true);
    try {
      const res = await api.suppliers.getSupplier(supplier.id);
      if (res.success) setSelected(res.data);
    } catch (err: unknown) {
      alertSaveError(err, 'Failed to load supplier details');
      setSelected(null);
    } finally {
      setIsLoadingView(false);
    }
  };

  const openEdit = (supplier: Supplier) => {
    setEditing(supplier);
    setForm({
      supplierName: supplier.supplierName,
      companyName: supplier.companyName,
      contactPerson: supplier.contactPerson,
      email: supplier.email,
      phone: supplier.phone,
      address: supplier.address,
      country: supplier.country,
      taxId: supplier.taxId,
      paymentTerms: supplier.paymentTerms,
      currency: supplier.currency || 'USD',
      productsSupplied: supplier.productsSupplied,
      status: supplier.status,
      notes: supplier.notes
    });
    setIsFormOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.supplierName.trim()) {
      alert('Supplier name is required.');
      return;
    }
    setIsSaving(true);
    try {
      const payload = {
        ...form,
        ...(editing ? { revision: editing.revision } : {})
      };
      if (editing) {
        await api.suppliers.updateSupplier(editing.id, payload);
      } else {
        await api.suppliers.createSupplier(payload);
      }
      setIsFormOpen(false);
      fetchSuppliers(page);
    } catch (err: unknown) {
      if (editing && (await handleConflictWithReload(err, () => fetchSuppliers(page), 'Failed to save supplier'))) {
        return;
      }
      alertSaveError(err, 'Failed to save supplier');
    } finally {
      setIsSaving(false);
    }
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      await api.suppliers.exportCsv({
        search: search.trim() || undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined
      });
    } catch (err: unknown) {
      alertSaveError(err, 'Failed to export suppliers');
    } finally {
      setIsExporting(false);
    }
  };

  const inputClass =
    'mt-1 w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-emerald-500 transition bg-white';

  // Labeled section wrapper — breaks the form into readable groups instead of one flat grid.
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
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">{children}</div>
    </div>
  );

  const DetailRow: React.FC<{ icon: React.ReactNode; label: string; value?: React.ReactNode }> = ({
    icon,
    label,
    value
  }) => (
    <div className="rounded-lg border border-slate-100 bg-slate-50/80 p-3">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1">
        {icon}
        {label}
      </p>
      <p className="mt-1.5 font-medium text-slate-800 break-words">{value || '—'}</p>
    </div>
  );

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center">
              <Truck className="w-4 h-4" />
            </span>
            Supplier Management
          </h2>
          <p className="text-sm text-slate-500 mt-1 ml-10">
            Internal supplier directory for procurement contacts, terms, and currencies
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {hasPermission('suppliers.view') && (
            <button
              type="button"
              onClick={handleExport}
              disabled={isExporting}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 border border-slate-200 bg-white text-sm font-semibold rounded-xl hover:bg-slate-50 disabled:opacity-50 transition"
            >
              <Download className="w-3.5 h-3.5" />
              {isExporting ? 'Exporting…' : 'Export CSV'}
            </button>
          )}
          {hasPermission('suppliers.create') && (
            <>
              <button
                type="button"
                onClick={() => setIsImportOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2.5 border border-slate-200 bg-white text-sm font-semibold rounded-xl hover:bg-slate-50 transition"
              >
                <Upload className="w-3.5 h-3.5" />
                Import CSV
              </button>
              <button
                type="button"
                onClick={openCreate}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-emerald-600 text-white text-sm font-semibold rounded-xl hover:bg-emerald-700 shadow-sm transition"
              >
                <Plus className="w-4 h-4" />
                New Supplier
              </button>
            </>
          )}
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-3 shadow-sm">
        <div className="flex flex-wrap gap-2">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search suppliers…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:outline-none focus:border-emerald-500 transition"
            />
          </div>
          <SearchableSelect options={STATUS_OPTIONS} value={statusFilter} onChange={setStatusFilter} className="w-40" />
          <SearchableSelect options={SORT_OPTIONS} value={sortValue} onChange={setSortValue} className="w-44" />
        </div>
      </div>

      <ListStatePanel
        isLoading={isLoading}
        error={error}
        isEmpty={!error && suppliers.length === 0}
        loadingLabel="Loading suppliers…"
        emptyTitle="No suppliers match the selected criteria"
      />

      {!isLoading && !error && suppliers.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-semibold text-[11px] uppercase tracking-wide">
                  <th className="px-4 py-3 text-left">Supplier</th>
                  <th className="px-4 py-3 text-left">Company</th>
                  <th className="px-4 py-3 text-left">Products</th>
                  <th className="px-4 py-3 text-left">Contact</th>
                  <th className="px-4 py-3 text-left">Country</th>
                  <th className="px-4 py-3 text-left">Currency</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {suppliers.map(supplier => (
                  <tr key={supplier.id} className="hover:bg-slate-50/70 transition">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-emerald-600 text-white text-[11px] font-bold flex items-center justify-center shrink-0">
                          {initials(supplier.supplierName)}
                        </div>
                        <div className="min-w-0">
                          <button
                            type="button"
                            onClick={() => openView(supplier)}
                            className="font-semibold text-slate-800 hover:text-emerald-700 transition truncate block"
                          >
                            {supplier.supplierName}
                          </button>
                          <span className="inline-block text-[11px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded mt-0.5">
                            {supplier.supplierCode}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{supplier.companyName || '—'}</td>
                    <td className="px-4 py-3 text-slate-600 max-w-[180px] truncate" title={supplier.productsSupplied || undefined}>
                      {supplier.productsSupplied || '—'}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      <div>{supplier.contactPerson || supplier.email || '—'}</div>
                      {supplier.phone && <div className="text-slate-400 text-[11px]">{supplier.phone}</div>}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{supplier.country || '—'}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex text-[11px] font-semibold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
                        {supplier.currency}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={supplier.status} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      {hasPermission('suppliers.edit') && (
                        <button
                          type="button"
                          onClick={() => openEdit(supplier)}
                          className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 transition font-medium"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                          Edit
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <PaginationBar page={page} totalPages={totalPages} total={total} onPageChange={p => fetchSuppliers(p)} />

      {/* Create / Edit modal */}
      <Modal isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} title={editing ? 'Edit Supplier' : 'New Supplier'}>
        <form onSubmit={handleSave} className="flex flex-col max-h-[75vh] text-sm">
          <div className="flex-1 overflow-y-auto px-1 space-y-3">
            <FormSection icon={<Building2 className="w-3.5 h-3.5" />} title="Company Identity">
              <label className="block sm:col-span-2">
                <span className="text-sm font-semibold text-slate-700">
                  Supplier Name <span className="text-rose-500">*</span>
                </span>
                <input
                  value={form.supplierName}
                  onChange={e => setForm({ ...form, supplierName: e.target.value })}
                  className={inputClass}
                  required
                />
              </label>
              <label className="block">
                <span className="text-sm font-semibold text-slate-700">Company Name</span>
                <input
                  value={form.companyName}
                  onChange={e => setForm({ ...form, companyName: e.target.value })}
                  className={inputClass}
                />
              </label>
              <label className="block">
                <span className="text-sm font-semibold text-slate-700">Country</span>
                <input
                  value={form.country}
                  onChange={e => setForm({ ...form, country: e.target.value })}
                  className={inputClass}
                />
              </label>
              <label className="block sm:col-span-2">
                <span className="text-sm font-semibold text-slate-700">Products Supplied</span>
                <input
                  value={form.productsSupplied}
                  onChange={e => setForm({ ...form, productsSupplied: e.target.value })}
                  placeholder="Granite, Marble, Limestone"
                  className={inputClass}
                />
              </label>
            </FormSection>

            <FormSection icon={<User2 className="w-3.5 h-3.5" />} title="Contact Details">
              <label className="block">
                <span className="text-sm font-semibold text-slate-700">Contact Person</span>
                <input
                  value={form.contactPerson}
                  onChange={e => setForm({ ...form, contactPerson: e.target.value })}
                  className={inputClass}
                />
              </label>
              <label className="block">
                <span className="text-sm font-semibold text-slate-700">Phone</span>
                <input
                  value={form.phone}
                  onChange={e => setForm({ ...form, phone: e.target.value })}
                  className={inputClass}
                />
              </label>
              <label className="block sm:col-span-2">
                <span className="text-sm font-semibold text-slate-700">Email</span>
                <input
                  type="email"
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  className={inputClass}
                />
              </label>
              <label className="block sm:col-span-2">
                <span className="text-sm font-semibold text-slate-700 flex items-center gap-1">
                  <MapPin className="w-3 h-3" /> Address
                </span>
                <textarea
                  value={form.address}
                  onChange={e => setForm({ ...form, address: e.target.value })}
                  className={`${inputClass} resize-none`}
                  rows={2}
                />
              </label>
            </FormSection>

            <FormSection icon={<Wallet className="w-3.5 h-3.5" />} title="Commercial Terms">
              <label className="block">
                <span className="text-sm font-semibold text-slate-700">Tax / GST / VAT</span>
                <input
                  value={form.taxId}
                  onChange={e => setForm({ ...form, taxId: e.target.value })}
                  className={inputClass}
                />
              </label>
              <label className="block">
                <span className="text-sm font-semibold text-slate-700">Payment Terms</span>
                <input
                  value={form.paymentTerms}
                  onChange={e => setForm({ ...form, paymentTerms: e.target.value })}
                  className={inputClass}
                />
              </label>
              <label className="block">
                <span className="text-sm font-semibold text-slate-700">Currency</span>
                <SearchableSelect
                  options={CURRENCY_OPTIONS}
                  value={form.currency}
                  onChange={v => setForm({ ...form, currency: v })}
                  className="mt-1"
                />
              </label>
              <label className="block">
                <span className="text-sm font-semibold text-slate-700">Status</span>
                <SearchableSelect
                  options={[
                    { value: 'active', label: 'Active' },
                    { value: 'inactive', label: 'Inactive' }
                  ]}
                  value={form.status}
                  onChange={v => setForm({ ...form, status: v as Supplier['status'] })}
                  className="mt-1"
                />
              </label>
            </FormSection>

            <FormSection icon={<FileText className="w-3.5 h-3.5" />} title="Notes">
              <label className="block sm:col-span-2">
                <textarea
                  value={form.notes}
                  onChange={e => setForm({ ...form, notes: e.target.value })}
                  placeholder="Anything worth remembering about this supplier…"
                  className={`${inputClass} resize-none mt-0`}
                  rows={3}
                />
              </label>
            </FormSection>
          </div>

          <div className="flex justify-end gap-2 pt-3 mt-3 border-t border-slate-100 shrink-0">
            <button
              type="button"
              onClick={() => setIsFormOpen(false)}
              className="px-4 py-2.5 text-sm font-medium border border-slate-200 rounded-lg hover:bg-slate-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-4 py-2.5 text-sm font-semibold bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-sm"
            >
              {isSaving ? 'Saving…' : editing ? 'Save Changes' : 'Create Supplier'}
            </button>
          </div>
        </form>
      </Modal>

      {/* View Supplier modal */}
      <Modal isOpen={!!selected} onClose={() => setSelected(null)} title={selected?.supplierName || 'Supplier'}>
        {isLoadingView ? (
          <div className="py-12 text-center text-slate-400 text-sm">Loading supplier details…</div>
        ) : selected ? (
          <div className="flex flex-col max-h-[75vh] text-sm">
            <div className="flex-1 overflow-y-auto px-1 space-y-4">
              {/* Identity strip */}
              <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50/80 p-3.5">
                <div className="w-10 h-10 rounded-full bg-emerald-600 text-white text-sm font-bold flex items-center justify-center shrink-0">
                  {initials(selected.supplierName)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-slate-800 truncate">{selected.supplierName}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="inline-block text-[11px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                      {selected.supplierCode}
                    </span>
                    <StatusBadge status={selected.status} />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <DetailRow icon={<Building2 className="w-3 h-3" />} label="Company" value={selected.companyName} />
                <DetailRow icon={<User2 className="w-3 h-3" />} label="Contact" value={selected.contactPerson} />
                <DetailRow icon={<MapPin className="w-3 h-3" />} label="Country" value={selected.country} />
                <DetailRow icon={<Package className="w-3 h-3" />} label="Products" value={selected.productsSupplied} />
                <DetailRow icon={<Wallet className="w-3 h-3" />} label="Currency" value={selected.currency} />
                <DetailRow icon={<FileText className="w-3 h-3" />} label="Tax ID" value={selected.taxId} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <DetailRow icon={<User2 className="w-3 h-3" />} label="Email" value={selected.email} />
                <DetailRow icon={<User2 className="w-3 h-3" />} label="Phone" value={selected.phone} />
              </div>

              <DetailRow icon={<Wallet className="w-3 h-3" />} label="Payment Terms" value={selected.paymentTerms} />

              {selected.notes ? (
                <div className="rounded-xl border border-emerald-100 bg-emerald-50/40 p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5">Notes</p>
                  <p className="text-slate-700 leading-relaxed">{selected.notes}</p>
                </div>
              ) : null}
            </div>

            <div className="flex justify-end gap-2 pt-3 mt-3 border-t border-slate-100 shrink-0">
              {hasPermission('suppliers.edit') && (
                <button
                  type="button"
                  onClick={() => {
                    openEdit(selected);
                    setSelected(null);
                  }}
                  className="px-4 py-2.5 rounded-lg border border-slate-200 text-slate-700 font-medium hover:bg-slate-50 transition"
                >
                  Edit
                </button>
              )}
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="px-4 py-2.5 rounded-lg bg-emerald-600 text-white font-semibold hover:bg-emerald-700 transition shadow-sm"
              >
                Close
              </button>
            </div>
          </div>
        ) : null}
      </Modal>

      <ImportWizard
        entity="suppliers"
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        onComplete={() => fetchSuppliers(1)}
      />
    </div>
  );
};