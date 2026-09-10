import React, { useEffect, useMemo, useState } from 'react';
import {
  Plus,
  Search,
  Eye,
  SquarePen,
  Download,
  Building2,
  User as UserIcon,
  Mail,
  Phone,
  MessageSquare,
  MapPin,
  Calendar,
  FileText,
  Package,
  Receipt,
  Ship,
  FolderOpen,
  ExternalLink,
  Star,
  CheckCircle2,
  Clock,
  Activity,
  Upload,
  Globe
} from 'lucide-react';
import { api } from '../../api/client';
import {
  Customer,
  Company,
  Lead,
  Quotation,
  Order,
  Bill,
  Shipment,
  CrmDocument,
  LeadActivity,
  User as CrmUser,
  DocumentCategory
} from '../../types/crm';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Modal } from '../../components/ui/Modal';
import { SearchableSelect } from '../../components/ui/SearchableSelect';
import { PaginationBar } from '../../components/ui/PaginationBar';
import { ListStatePanel } from '../../components/ui/ListStatePanel';
import { useAuth } from '../../context/AuthContext';
import { handleConflictWithReload, alertSaveError } from '../../lib/apiErrors';
import { NavigationTab } from '../../components/layout/Sidebar';

type CustomerStatusFilter = 'all' | 'active' | 'inactive';
type DetailTab = 'overview' | 'quotations' | 'orders' | 'bills' | 'shipments' | 'documents' | 'activity';

interface CustomerForm {
  companyId: string;
  name: string;
  email: string;
  phone: string;
  whatsAppNumber: string;
  designation: string;
  isPrimaryContact: boolean;
  notes: string;
  status: string;
}

const emptyForm: CustomerForm = {
  companyId: '',
  name: '',
  email: '',
  phone: '',
  whatsAppNumber: '',
  designation: '',
  isPrimaryContact: false,
  notes: '',
  status: 'active'
};

interface CustomersPageProps {
  onNavigate?: (tab: NavigationTab, entityId?: string) => void;
  focusCustomerId?: string | null;
  onFocusConsumed?: () => void;
}

export const CustomersPage: React.FC<CustomersPageProps> = ({
  onNavigate,
  focusCustomerId,
  onFocusConsumed
}) => {
  const { user, hasPermission } = useAuth();

  // List State
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit] = useState(15);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<CustomerStatusFilter>('all');
  const [companyFilter, setCompanyFilter] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // References State
  const [companies, setCompanies] = useState<Company[]>([]);
  const [teamMembers, setTeamMembers] = useState<CrmUser[]>([]);
  const [isExporting, setIsExporting] = useState(false);

  // Detail Modal State
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [detailTab, setDetailTab] = useState<DetailTab>('overview');
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [linkedCompany, setLinkedCompany] = useState<Company | null>(null);
  const [linkedLead, setLinkedLead] = useState<{
    lead: Lead;
    activities: LeadActivity[];
  } | null>(null);
  const [linkedQuotations, setLinkedQuotations] = useState<Quotation[]>([]);
  const [linkedOrders, setLinkedOrders] = useState<Order[]>([]);
  const [linkedBills, setLinkedBills] = useState<Bill[]>([]);
  const [linkedShipments, setLinkedShipments] = useState<Shipment[]>([]);
  const [linkedDocuments, setLinkedDocuments] = useState<CrmDocument[]>([]);

  // Add / Edit Modal State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [form, setForm] = useState<CustomerForm>(emptyForm);
  const [isSaving, setIsSaving] = useState(false);

  // Document Upload in Detail Modal
  const [isDocModalOpen, setIsDocModalOpen] = useState(false);
  const [docFile, setDocFile] = useState<File | null>(null);
  const [docTitle, setDocTitle] = useState('');
  const [docCategory, setDocCategory] = useState<DocumentCategory>('KYC / Compliance');
  const [isUploadingDoc, setIsUploadingDoc] = useState(false);

  // Map for fast lookups
  const companyMap = useMemo(() => {
    const map = new Map<string, Company>();
    companies.forEach(c => map.set(c.id, c));
    return map;
  }, [companies]);

  const teamMap = useMemo(() => {
    const map = new Map<string, CrmUser>();
    teamMembers.forEach(m => map.set(m.id, m));
    return map;
  }, [teamMembers]);

  const companyOptions = useMemo(
    () => [
      { value: 'all', label: 'All Companies' },
      ...companies.map(c => ({
        value: c.id,
        label: `${c.name} (${c.companyCode}) — ${c.country || 'Global'}`
      }))
    ],
    [companies]
  );

  const formCompanyOptions = useMemo(
    () =>
      companies.map(c => ({
        value: c.id,
        label: `${c.name} (${c.companyCode}) — ${c.country || 'Global'}`
      })),
    [companies]
  );

  // Fetch Customers list
  const fetchCustomers = async (pageNum = page) => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const res = await api.customers.getCustomers({
        search: search.trim() || undefined,
        status: statusFilter === 'all' ? undefined : statusFilter,
        companyId: companyFilter === 'all' ? undefined : companyFilter,
        page: pageNum,
        limit
      });
      if (res.success) {
        setCustomers(res.data);
        setTotal(res.total);
        setPage(res.page);
        setTotalPages(res.totalPages);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load customers';
      setLoadError(msg);
      alertSaveError(err, 'Failed to load customers');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers(1);
  }, [search, statusFilter, companyFilter]);

  // Load Companies & Team members for cross-referencing
  useEffect(() => {
    api.companies
      .getCompanies({ limit: 200 })
      .then(res => {
        if (res.success) setCompanies(res.data);
      })
      .catch(() => {});

    api.users
      .getTeamDirectory()
      .then(res => {
        if (res.success) setTeamMembers(res.data as CrmUser[]);
      })
      .catch(() => {});
  }, []);

  // Handle focus entity
  useEffect(() => {
    if (focusCustomerId) {
      api.customers
        .getCustomer(focusCustomerId)
        .then(res => {
          if (res.success && res.data) {
            handleOpenDetail(res.data);
            if (onFocusConsumed) onFocusConsumed();
          }
        })
        .catch(() => {});
    }
  }, [focusCustomerId]);

  // Open Details Modal and fetch related entities
  const handleOpenDetail = async (customer: Customer) => {
    setSelectedCustomer(customer);
    setDetailTab('overview');
    setIsLoadingDetail(true);

    // Find linked company
    const comp = companyMap.get(customer.companyId);
    setLinkedCompany(comp || null);

    // Reset linked records
    setLinkedLead(null);
    setLinkedQuotations([]);
    setLinkedOrders([]);
    setLinkedBills([]);
    setLinkedShipments([]);
    setLinkedDocuments([]);

    try {
      // 1. Fetch original converted lead if exists
      if (customer.relatedLeadId) {
        api.leads
          .getLead(customer.relatedLeadId)
          .then(res => {
            if (res.success && res.data) {
              setLinkedLead(res.data);
            }
          })
          .catch(() => {});
      }

      // 2. Fetch quotations linked to customer
      api.quotations
        .getQuotations({
          customerId: customer.id,
          limit: 20
        })
        .then(res => {
          if (res.success) setLinkedQuotations(res.data);
        })
        .catch(() => {});

      // 3. Fetch orders matching customer code or name
      api.orders
        .getOrders({
          search: customer.customerCode,
          limit: 20
        })
        .then(res => {
          if (res.success) setLinkedOrders(res.data);
        })
        .catch(() => {});

      // 4. Fetch bills matching customer code
      api.bills
        .getBills({ search: customer.customerCode })
        .then(res => {
          if (res.success) setLinkedBills(res.data);
        })
        .catch(() => {});

      // 5. Fetch shipments matching customer code
      api.shipments
        .getShipments({ search: customer.customerCode, limit: 20 })
        .then(res => {
          if (res.success) setLinkedShipments(res.data);
        })
        .catch(() => {});

      // 6. Fetch documents linked to customer
      api.documents
        .getDocuments({
          entityId: customer.id,
          entityType: 'Customer',
          limit: 20
        })
        .then(res => {
          if (res.success) setLinkedDocuments(res.data);
        })
        .catch(() => {});
    } finally {
      setIsLoadingDetail(false);
    }
  };

  // Open Create Modal
  const openCreate = () => {
    setEditingCustomer(null);
    setForm(emptyForm);
    setIsFormOpen(true);
  };

  // Open Edit Modal
  const openEdit = (c: Customer) => {
    setEditingCustomer(c);
    setForm({
      companyId: c.companyId,
      name: c.name,
      email: c.email || '',
      phone: c.phone || '',
      whatsAppNumber: c.whatsAppNumber || '',
      designation: c.designation || '',
      isPrimaryContact: Boolean(c.isPrimaryContact),
      notes: c.notes || '',
      status: c.status || 'active'
    });
    setIsFormOpen(true);
  };

  // Save Customer (Create or Update)
  const handleSaveCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.companyId || !form.name.trim()) return;

    setIsSaving(true);
    try {
      if (editingCustomer) {
        const res = await api.customers.updateCustomer(editingCustomer.id, {
          companyId: form.companyId,
          name: form.name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          whatsAppNumber: form.whatsAppNumber.trim(),
          designation: form.designation.trim(),
          isPrimaryContact: form.isPrimaryContact,
          notes: form.notes.trim(),
          status: form.status,
          revision: editingCustomer.revision
        });
        if (res.success) {
          if (selectedCustomer?.id === editingCustomer.id) {
            setSelectedCustomer(res.data);
          }
        }
      } else {
        await api.customers.createCustomer({
          companyId: form.companyId,
          name: form.name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          whatsAppNumber: form.whatsAppNumber.trim(),
          designation: form.designation.trim(),
          isPrimaryContact: form.isPrimaryContact,
          notes: form.notes.trim(),
          status: form.status
        });
      }

      setIsFormOpen(false);
      fetchCustomers(page);
    } catch (err: unknown) {
      if (editingCustomer) {
        await handleConflictWithReload(
          err,
          () => fetchCustomers(page),
          'Failed to save customer changes'
        );
      } else {
        alertSaveError(err, 'Failed to create customer');
      }
    } finally {
      setIsSaving(false);
    }
  };

  // Export CSV
  const handleExportCsv = async () => {
    setIsExporting(true);
    try {
      await api.customers.exportCsv({
        search: search.trim() || undefined,
        status: statusFilter === 'all' ? undefined : statusFilter,
        companyId: companyFilter === 'all' ? undefined : companyFilter
      });
    } catch (err: unknown) {
      alertSaveError(err, 'Failed to export customers');
    } finally {
      setIsExporting(false);
    }
  };

  // Upload Document for selected customer
  const handleUploadCustomerDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer || !docFile || !docTitle.trim()) return;

    setIsUploadingDoc(true);
    try {
      const res = await api.documents.uploadDocument({
        file: docFile,
        title: docTitle.trim(),
        category: docCategory,
        entityType: 'Customer',
        entityId: selectedCustomer.id
      });
      if (res.success) {
        setLinkedDocuments(prev => [res.data, ...prev]);
        setIsDocModalOpen(false);
        setDocFile(null);
        setDocTitle('');
      }
    } catch (err: unknown) {
      alertSaveError(err, 'Failed to upload document');
    } finally {
      setIsUploadingDoc(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-lg sm:text-xl font-semibold text-slate-900 tracking-tight">Customers</h1>
          <p className="text-sm text-slate-500 mt-1">
            Verified accounts, primary buyer contacts, and converted clients connected across operations.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {(hasPermission('customers.view') || hasPermission('leads.view')) && (
            <button
              type="button"
              onClick={handleExportCsv}
              disabled={isExporting}
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-teal-50 text-teal-800 hover:bg-teal-100 border border-teal-200/80 rounded-lg text-sm font-medium transition-colors disabled:opacity-60 shadow-2xs"
            >
              <Download className="w-4 h-4 text-teal-600" />
              {isExporting ? 'Exporting…' : 'Export CSV'}
            </button>
          )}

          {(hasPermission('customers.create') || hasPermission('leads.edit')) && (
            <button
              type="button"
              onClick={openCreate}
              className="inline-flex items-center gap-2 px-4 py-2 bg-sky-600 text-white text-sm font-medium rounded-lg hover:bg-sky-700 transition-colors shadow-xs"
            >
              <Plus className="w-4 h-4" />
              Add Customer
            </button>
          )}
        </div>
      </div>

      {/* Filter Bar: Search, Status, Company */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        <div className="flex flex-wrap items-center gap-3">
          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100/90 rounded-lg border border-slate-200/80">
            {(['all', 'active', 'inactive'] as CustomerStatusFilter[]).map(st => (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md capitalize transition-colors ${
                  statusFilter === st
                    ? 'bg-white text-slate-800 shadow-2xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          {/* Company Filter */}
          <div className="w-60">
            <SearchableSelect
              options={companyOptions}
              value={companyFilter}
              onChange={v => setCompanyFilter(v)}
              placeholder="Filter by company…"
            />
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search code, name, phone, email…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-3.5 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-600 transition-all bg-white"
          />
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        <ListStatePanel
          isLoading={isLoading}
          error={loadError}
          isEmpty={!loadError && customers.length === 0}
          loadingLabel="Loading customer records…"
          emptyTitle="No customers found"
          emptyDescription={
            search || statusFilter !== 'all' || companyFilter !== 'all'
              ? 'Try adjusting your search criteria or clearing filters.'
              : 'Converted leads will automatically appear here once qualified and converted.'
          }
          className="p-10 text-center text-sm text-slate-500"
        />

        {!isLoading && !loadError && customers.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500">
                <tr>
                  <th className="text-left px-5 py-3.5 font-semibold text-xs uppercase tracking-wider">
                    Customer Code
                  </th>
                  <th className="text-left px-5 py-3.5 font-semibold text-xs uppercase tracking-wider">
                    Customer Name
                  </th>
                  <th className="text-left px-5 py-3.5 font-semibold text-xs uppercase tracking-wider">
                    Company
                  </th>
                  <th className="text-left px-5 py-3.5 font-semibold text-xs uppercase tracking-wider">
                    Country
                  </th>
                  <th className="text-left px-5 py-3.5 font-semibold text-xs uppercase tracking-wider">
                    Email
                  </th>
                  <th className="text-left px-5 py-3.5 font-semibold text-xs uppercase tracking-wider">
                    Phone
                  </th>
                  <th className="text-left px-5 py-3.5 font-semibold text-xs uppercase tracking-wider">
                    Assigned Member
                  </th>
                  <th className="text-left px-5 py-3.5 font-semibold text-xs uppercase tracking-wider">
                    Status
                  </th>
                  <th className="text-left px-5 py-3.5 font-semibold text-xs uppercase tracking-wider">
                    Created Date
                  </th>
                  <th className="text-right px-5 py-3.5 font-semibold text-xs uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {customers.map(customer => {
                  const company = companyMap.get(customer.companyId);
                  const assignedMember = company?.assignedToId
                    ? teamMap.get(company.assignedToId)
                    : null;
                  const countryName = company?.country || '—';

                  return (
                    <tr
                      key={customer.id}
                      onClick={() => handleOpenDetail(customer)}
                      className="hover:bg-slate-50/70 transition-colors cursor-pointer group"
                    >
                      {/* Customer Code */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className="font-mono text-xs font-semibold text-slate-700 bg-slate-100 px-2 py-1 rounded border border-slate-200/80">
                          {customer.customerCode}
                        </span>
                      </td>

                      {/* Customer Name */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-sky-50 text-sky-700 border border-sky-200 flex items-center justify-center text-xs font-semibold shrink-0">
                            {customer.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-medium text-slate-900 group-hover:text-sky-700 transition-colors flex items-center gap-1.5">
                              {customer.name}
                              {customer.isPrimaryContact && (
                                <span
                                  title="Primary Contact"
                                  className="inline-flex items-center gap-0.5 text-[10px] bg-amber-50 text-amber-700 border border-amber-200 px-1.5 py-0.2 rounded font-medium"
                                >
                                  <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-500" />
                                  Primary
                                </span>
                              )}
                            </div>
                            {customer.designation && (
                              <div className="text-xs text-slate-500">{customer.designation}</div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Company */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="font-medium text-slate-800">
                          {customer.companyName || company?.name || '—'}
                        </div>
                        {company?.companyCode && (
                          <div className="text-xs font-mono text-slate-400">{company.companyCode}</div>
                        )}
                      </td>

                      {/* Country */}
                      <td className="px-5 py-4 whitespace-nowrap text-slate-600">
                        <div className="flex items-center gap-1.5">
                          <Globe className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{countryName}</span>
                        </div>
                      </td>

                      {/* Email */}
                      <td className="px-5 py-4 whitespace-nowrap text-slate-600">
                        {customer.email ? (
                          <a
                            href={`mailto:${customer.email}`}
                            onClick={e => e.stopPropagation()}
                            className="text-sky-600 hover:text-sky-800 hover:underline flex items-center gap-1"
                          >
                            <Mail className="w-3.5 h-3.5 text-slate-400" />
                            {customer.email}
                          </a>
                        ) : (
                          '—'
                        )}
                      </td>

                      {/* Phone */}
                      <td className="px-5 py-4 whitespace-nowrap text-slate-600">
                        {customer.phone || customer.whatsAppNumber ? (
                          <div className="flex items-center gap-2">
                            <Phone className="w-3.5 h-3.5 text-slate-400" />
                            <span>{customer.phone || customer.whatsAppNumber}</span>
                          </div>
                        ) : (
                          '—'
                        )}
                      </td>

                      {/* Assigned Member */}
                      <td className="px-5 py-4 whitespace-nowrap text-slate-600">
                        {company?.assignedToName || assignedMember?.name || 'Unassigned'}
                      </td>

                      {/* Status */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <StatusBadge status={customer.status || 'active'} />
                      </td>

                      {/* Created Date */}
                      <td className="px-5 py-4 whitespace-nowrap text-slate-500 text-xs">
                        {customer.createdAt
                          ? new Date(customer.createdAt).toLocaleDateString(undefined, {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            })
                          : '—'}
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4 whitespace-nowrap text-right" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => handleOpenDetail(customer)}
                            title="View Customer Details"
                            className="p-2 text-slate-600 hover:text-sky-700 bg-slate-50 hover:bg-sky-50 border border-slate-200 rounded-lg transition-colors shadow-2xs"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {(hasPermission('customers.edit') || hasPermission('leads.edit')) && (
                            <button
                              type="button"
                              onClick={() => openEdit(customer)}
                              title="Edit Customer"
                              className="p-2 text-slate-800 hover:text-black bg-slate-100 hover:bg-slate-200/80 border border-slate-300 rounded-lg transition-colors shadow-2xs"
                            >
                              <SquarePen className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : null}
      </div>

      <PaginationBar
        page={page}
        totalPages={totalPages}
        total={total}
        onPageChange={p => fetchCustomers(p)}
      />

      {/* Customer Detail Modal */}
      <Modal
        isOpen={!!selectedCustomer}
        onClose={() => setSelectedCustomer(null)}
        title={selectedCustomer?.name || 'Customer Details'}
        subtitle={
          selectedCustomer
            ? `${selectedCustomer.customerCode} • ${selectedCustomer.companyName || linkedCompany?.name || 'B2B Client'}`
            : undefined
        }
        maxWidth="4xl"
      >
        {selectedCustomer && (
          <div className="space-y-5">
            {/* Header Profile Summary */}
            <div className="p-4 bg-slate-50/90 border border-slate-200 rounded-xl flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-sky-600 text-white flex items-center justify-center font-bold text-lg shadow-xs">
                  {selectedCustomer.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-semibold text-slate-900">{selectedCustomer.name}</h2>
                    <span className="font-mono text-xs px-2 py-0.5 rounded bg-white border border-slate-200 font-medium text-slate-700">
                      {selectedCustomer.customerCode}
                    </span>
                    {selectedCustomer.isPrimaryContact && (
                      <span className="inline-flex items-center gap-1 text-xs bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-full font-medium">
                        <Star className="w-3 h-3 fill-amber-400 text-amber-500" />
                        Primary Contact
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-3">
                    <span>{selectedCustomer.designation || 'Account Contact'}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1 font-medium text-slate-700">
                      <Building2 className="w-3.5 h-3.5 text-slate-400" />
                      {selectedCustomer.companyName || linkedCompany?.name || 'Company'}
                    </span>
                    {linkedCompany?.country && (
                      <>
                        <span>•</span>
                        <span className="flex items-center gap-1 text-slate-600">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          {linkedCompany.country}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <StatusBadge status={selectedCustomer.status || 'active'} />
                {(hasPermission('customers.edit') || hasPermission('leads.edit')) && (
                  <button
                    type="button"
                    onClick={() => openEdit(selectedCustomer)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 rounded-lg text-xs font-medium transition-colors shadow-2xs"
                  >
                    <SquarePen className="w-3.5 h-3.5" />
                    Edit
                  </button>
                )}
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto pb-px">
              {[
                { id: 'overview', label: 'Overview', icon: UserIcon },
                { id: 'quotations', label: `Quotations (${linkedQuotations.length})`, icon: FileText },
                { id: 'orders', label: `Orders (${linkedOrders.length})`, icon: Package },
                { id: 'bills', label: `Bills & Invoices (${linkedBills.length})`, icon: Receipt },
                { id: 'shipments', label: `Shipments (${linkedShipments.length})`, icon: Ship },
                { id: 'documents', label: `Documents (${linkedDocuments.length})`, icon: FolderOpen },
                { id: 'activity', label: 'Activity & Timeline', icon: Activity }
              ].map(tab => {
                const Icon = tab.icon;
                const active = detailTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setDetailTab(tab.id as DetailTab)}
                    className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium border-b-2 whitespace-nowrap transition-colors ${
                      active
                        ? 'border-sky-600 text-sky-700 font-semibold'
                        : 'border-transparent text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Tab 1: Overview */}
            {detailTab === 'overview' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Contact Details Card */}
                  <div className="border border-slate-200 rounded-xl p-4 bg-white space-y-3 shadow-2xs">
                    <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-sky-600" />
                      Contact Coordinates
                    </h3>
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between py-1 border-b border-slate-100">
                        <span className="text-slate-500">Email Address:</span>
                        {selectedCustomer.email ? (
                          <a
                            href={`mailto:${selectedCustomer.email}`}
                            className="text-sky-600 hover:underline font-medium"
                          >
                            {selectedCustomer.email}
                          </a>
                        ) : (
                          <span className="text-slate-400">Not provided</span>
                        )}
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-100">
                        <span className="text-slate-500">Phone Number:</span>
                        {selectedCustomer.phone ? (
                          <a
                            href={`tel:${selectedCustomer.phone}`}
                            className="text-slate-800 hover:text-sky-600 font-medium"
                          >
                            {selectedCustomer.phone}
                          </a>
                        ) : (
                          <span className="text-slate-400">Not provided</span>
                        )}
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-100">
                        <span className="text-slate-500">WhatsApp:</span>
                        {selectedCustomer.whatsAppNumber ? (
                          <a
                            href={`https://wa.me/${selectedCustomer.whatsAppNumber.replace(/[^0-9]/g, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-emerald-600 hover:underline font-medium inline-flex items-center gap-1"
                          >
                            <MessageSquare className="w-3 h-3" />
                            {selectedCustomer.whatsAppNumber}
                          </a>
                        ) : (
                          <span className="text-slate-400">Not provided</span>
                        )}
                      </div>
                      <div className="flex justify-between py-1">
                        <span className="text-slate-500">Designation / Role:</span>
                        <span className="font-medium text-slate-800">
                          {selectedCustomer.designation || 'Account Contact'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Connected Company Card */}
                  <div className="border border-slate-200 rounded-xl p-4 bg-white space-y-3 shadow-2xs">
                    <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                      <Building2 className="w-3.5 h-3.5 text-sky-600" />
                      Connected B2B Company
                    </h3>
                    {linkedCompany ? (
                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between py-1 border-b border-slate-100">
                          <span className="text-slate-500">Company Name:</span>
                          <span className="font-medium text-slate-900">{linkedCompany.name}</span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-slate-100">
                          <span className="text-slate-500">Company Code:</span>
                          <span className="font-mono text-slate-700">{linkedCompany.companyCode}</span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-slate-100">
                          <span className="text-slate-500">Country & City:</span>
                          <span className="text-slate-800 font-medium">
                            {[linkedCompany.city, linkedCompany.country].filter(Boolean).join(', ') || 'Global'}
                          </span>
                        </div>
                        {linkedCompany.website && (
                          <div className="flex justify-between py-1 border-b border-slate-100">
                            <span className="text-slate-500">Website:</span>
                            <a
                              href={
                                linkedCompany.website.startsWith('http')
                                  ? linkedCompany.website
                                  : `https://${linkedCompany.website}`
                              }
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sky-600 hover:underline flex items-center gap-1 font-medium"
                            >
                              {linkedCompany.website}
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                        )}
                        <div className="flex justify-between py-1">
                          <span className="text-slate-500">Account Manager:</span>
                          <span className="text-slate-800 font-medium">
                            {linkedCompany.assignedToName || 'Unassigned'}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="text-xs text-slate-500 py-4 text-center">
                        Company information loading or unlinked.
                      </div>
                    )}
                  </div>
                </div>

                {/* Original Converted Lead Card */}
                {selectedCustomer.relatedLeadId && linkedLead && (
                  <div className="border border-emerald-200 bg-emerald-50/40 rounded-xl p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <h4 className="text-xs font-semibold text-emerald-950 uppercase tracking-wider">
                          Original Converted Lead
                        </h4>
                        <span className="font-mono text-xs px-2 py-0.5 rounded bg-white border border-emerald-200 font-medium text-emerald-800">
                          {linkedLead.lead.leadCode}
                        </span>
                      </div>
                      {onNavigate && (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedCustomer(null);
                            onNavigate('leads', linkedLead.lead.id);
                          }}
                          className="inline-flex items-center gap-1 text-xs text-emerald-800 hover:text-emerald-950 font-medium underline"
                        >
                          View Lead Record
                          <ExternalLink className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 text-xs text-slate-700">
                      <div>
                        <span className="text-slate-500">Product Interest: </span>
                        <span className="font-medium text-slate-900">{linkedLead.lead.productInterest || '—'}</span>
                      </div>
                      <div>
                        <span className="text-slate-500">Source: </span>
                        <span className="font-medium text-slate-900">{linkedLead.lead.leadSource || 'Direct'}</span>
                      </div>
                      <div>
                        <span className="text-slate-500">Converted Date: </span>
                        <span className="font-medium text-slate-900">
                          {linkedLead.lead.convertedAt
                            ? new Date(linkedLead.lead.convertedAt).toLocaleDateString()
                            : '—'}
                        </span>
                      </div>
                    </div>
                    {linkedLead.lead.notes && (
                      <div className="text-xs text-slate-600 bg-white/70 p-2.5 rounded-lg border border-emerald-200/60 mt-2">
                        <span className="font-medium text-slate-700">Lead Conversion Notes: </span>
                        {linkedLead.lead.notes}
                      </div>
                    )}
                  </div>
                )}

                {/* Additional Customer Notes */}
                {selectedCustomer.notes && (
                  <div className="border border-slate-200 rounded-xl p-4 bg-white space-y-1.5">
                    <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Account Notes & Remarks
                    </h4>
                    <p className="text-xs text-slate-700 whitespace-pre-wrap">{selectedCustomer.notes}</p>
                  </div>
                )}
              </div>
            )}

            {/* Tab 2: Quotations */}
            {detailTab === 'quotations' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Quotations for this Customer
                  </h3>
                  {onNavigate && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedCustomer(null);
                        onNavigate('quotations');
                      }}
                      className="text-xs text-sky-600 hover:text-sky-800 font-medium inline-flex items-center gap-1"
                    >
                      Open Quotations Module
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  )}
                </div>

                {linkedQuotations.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl">
                    No quotations generated for this customer contact yet.
                  </div>
                ) : (
                  <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                    <table className="w-full text-xs">
                      <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                        <tr>
                          <th className="text-left px-4 py-2.5 font-semibold">Quote Code</th>
                          <th className="text-left px-4 py-2.5 font-semibold">Title</th>
                          <th className="text-left px-4 py-2.5 font-semibold">Amount</th>
                          <th className="text-left px-4 py-2.5 font-semibold">Status</th>
                          <th className="text-left px-4 py-2.5 font-semibold">Date</th>
                          <th className="text-right px-4 py-2.5 font-semibold">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {linkedQuotations.map(q => (
                          <tr key={q.id} className="hover:bg-slate-50/70">
                            <td className="px-4 py-3 font-mono font-medium text-slate-800">{q.quoteCode}</td>
                            <td className="px-4 py-3 text-slate-700">{q.title}</td>
                            <td className="px-4 py-3 font-semibold text-slate-900">
                              {q.currency} {q.totalAmount.toLocaleString()}
                            </td>
                            <td className="px-4 py-3">
                              <StatusBadge status={q.status} />
                            </td>
                            <td className="px-4 py-3 text-slate-500">
                              {new Date(q.createdAt).toLocaleDateString()}
                            </td>
                            <td className="px-4 py-3 text-right">
                              {onNavigate && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedCustomer(null);
                                    onNavigate('quotations', q.id);
                                  }}
                                  className="text-xs text-sky-600 hover:text-sky-800 font-medium"
                                >
                                  View
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Tab 3: Orders */}
            {detailTab === 'orders' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Orders for this Customer
                  </h3>
                  {onNavigate && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedCustomer(null);
                        onNavigate('orders');
                      }}
                      className="text-xs text-sky-600 hover:text-sky-800 font-medium inline-flex items-center gap-1"
                    >
                      Open Orders Module
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  )}
                </div>

                {linkedOrders.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl">
                    No confirmed purchase orders linked to this customer yet.
                  </div>
                ) : (
                  <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                    <table className="w-full text-xs">
                      <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                        <tr>
                          <th className="text-left px-4 py-2.5 font-semibold">Order Code</th>
                          <th className="text-left px-4 py-2.5 font-semibold">Product</th>
                          <th className="text-left px-4 py-2.5 font-semibold">Amount</th>
                          <th className="text-left px-4 py-2.5 font-semibold">Destination Port</th>
                          <th className="text-left px-4 py-2.5 font-semibold">Status</th>
                          <th className="text-right px-4 py-2.5 font-semibold">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {linkedOrders.map(o => (
                          <tr key={o.id} className="hover:bg-slate-50/70">
                            <td className="px-4 py-3 font-mono font-medium text-slate-800">{o.orderCode}</td>
                            <td className="px-4 py-3 text-slate-700">{o.productName}</td>
                            <td className="px-4 py-3 font-semibold text-slate-900">
                              {o.currency} {o.totalAmount.toLocaleString()}
                            </td>
                            <td className="px-4 py-3 text-slate-600">{o.destinationPort || '—'}</td>
                            <td className="px-4 py-3">
                              <StatusBadge status={o.status} />
                            </td>
                            <td className="px-4 py-3 text-right">
                              {onNavigate && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedCustomer(null);
                                    onNavigate('orders', o.id);
                                  }}
                                  className="text-xs text-sky-600 hover:text-sky-800 font-medium"
                                >
                                  View
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Tab 4: Bills & Invoices */}
            {detailTab === 'bills' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Bills & Invoices
                  </h3>
                  {onNavigate && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedCustomer(null);
                        onNavigate('bills');
                      }}
                      className="text-xs text-sky-600 hover:text-sky-800 font-medium inline-flex items-center gap-1"
                    >
                      Open Bills Module
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  )}
                </div>

                {linkedBills.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl">
                    No bills or invoices issued to this customer.
                  </div>
                ) : (
                  <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                    <table className="w-full text-xs">
                      <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                        <tr>
                          <th className="text-left px-4 py-2.5 font-semibold">Bill Code</th>
                          <th className="text-left px-4 py-2.5 font-semibold">Order</th>
                          <th className="text-left px-4 py-2.5 font-semibold">Total Amount</th>
                          <th className="text-left px-4 py-2.5 font-semibold">Paid Amount</th>
                          <th className="text-left px-4 py-2.5 font-semibold">Status</th>
                          <th className="text-left px-4 py-2.5 font-semibold">Due Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {linkedBills.map(b => (
                          <tr key={b.id} className="hover:bg-slate-50/70">
                            <td className="px-4 py-3 font-mono font-medium text-slate-800">{b.billCode}</td>
                            <td className="px-4 py-3 text-slate-700">{b.orderCode || '—'}</td>
                            <td className="px-4 py-3 font-semibold text-slate-900">
                              {b.currency} {b.totalAmount.toLocaleString()}
                            </td>
                            <td className="px-4 py-3 text-emerald-700 font-medium">
                              {b.currency} {b.paidAmount.toLocaleString()}
                            </td>
                            <td className="px-4 py-3">
                              <StatusBadge status={b.status} />
                            </td>
                            <td className="px-4 py-3 text-slate-500">
                              {new Date(b.dueDate).toLocaleDateString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Tab 5: Shipments */}
            {detailTab === 'shipments' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Linked Shipments
                  </h3>
                  {onNavigate && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedCustomer(null);
                        onNavigate('shipments');
                      }}
                      className="text-xs text-sky-600 hover:text-sky-800 font-medium inline-flex items-center gap-1"
                    >
                      Open Shipments Module
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  )}
                </div>

                {linkedShipments.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl">
                    No container or vessel shipments dispatched for this customer yet.
                  </div>
                ) : (
                  <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                    <table className="w-full text-xs">
                      <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                        <tr>
                          <th className="text-left px-4 py-2.5 font-semibold">Tracking #</th>
                          <th className="text-left px-4 py-2.5 font-semibold">Carrier / Vessel</th>
                          <th className="text-left px-4 py-2.5 font-semibold">Route</th>
                          <th className="text-left px-4 py-2.5 font-semibold">Status</th>
                          <th className="text-left px-4 py-2.5 font-semibold">ETA</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {linkedShipments.map(s => (
                          <tr key={s.id} className="hover:bg-slate-50/70">
                            <td className="px-4 py-3 font-mono font-medium text-slate-800">
                              {s.trackingNumber}
                            </td>
                            <td className="px-4 py-3 text-slate-700">{s.carrier}</td>
                            <td className="px-4 py-3 text-slate-600">
                              {s.originPort} → {s.destinationPort}
                            </td>
                            <td className="px-4 py-3">
                              <StatusBadge status={s.status} />
                            </td>
                            <td className="px-4 py-3 text-slate-500">
                              {s.estimatedArrival
                                ? new Date(s.estimatedArrival).toLocaleDateString()
                                : 'TBD'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Tab 6: Documents */}
            {detailTab === 'documents' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Customer Documents & Files
                  </h3>
                  <button
                    type="button"
                    onClick={() => setIsDocModalOpen(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-sky-50 text-sky-800 hover:bg-sky-100 border border-sky-200 rounded-lg text-xs font-medium transition-colors"
                  >
                    <Upload className="w-3.5 h-3.5 text-sky-600" />
                    Upload Customer File
                  </button>
                </div>

                {linkedDocuments.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl">
                    No documents uploaded for this customer yet.
                  </div>
                ) : (
                  <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                    <table className="w-full text-xs">
                      <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                        <tr>
                          <th className="text-left px-4 py-2.5 font-semibold">Title</th>
                          <th className="text-left px-4 py-2.5 font-semibold">Category</th>
                          <th className="text-left px-4 py-2.5 font-semibold">File Name</th>
                          <th className="text-left px-4 py-2.5 font-semibold">Uploaded</th>
                          <th className="text-right px-4 py-2.5 font-semibold">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {linkedDocuments.map(doc => (
                          <tr key={doc.id} className="hover:bg-slate-50/70">
                            <td className="px-4 py-3 font-medium text-slate-900">{doc.title}</td>
                            <td className="px-4 py-3 text-slate-600">{doc.category}</td>
                            <td className="px-4 py-3 text-slate-500 font-mono">{doc.originalName}</td>
                            <td className="px-4 py-3 text-slate-500">
                              {new Date(doc.createdAt).toLocaleDateString()}
                            </td>
                            <td className="px-4 py-3 text-right">
                              <a
                                href={`/api/documents/${doc.id}/download`}
                                download
                                className="text-sky-600 hover:text-sky-800 font-medium inline-flex items-center gap-1"
                              >
                                <Download className="w-3.5 h-3.5" />
                                Download
                              </a>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Tab 7: Activity Timeline */}
            {detailTab === 'activity' && (
              <div className="space-y-3">
                <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Lead & Customer History
                </h3>
                {linkedLead?.activities && linkedLead.activities.length > 0 ? (
                  <div className="border border-slate-200 rounded-xl p-4 bg-white space-y-3">
                    {linkedLead.activities.map(act => (
                      <div key={act.id} className="flex items-start gap-3 text-xs">
                        <div className="w-6 h-6 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0 text-slate-500">
                          <Clock className="w-3.5 h-3.5" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-slate-800">{act.title}</span>
                            <span className="text-slate-400 text-[11px]">
                              {new Date(act.createdAt).toLocaleString()}
                            </span>
                          </div>
                          <p className="text-slate-600 mt-0.5">{act.details}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl">
                    No historical logs recorded for this account.
                  </div>
                )}
              </div>
            )}

            {/* Modal Footer */}
            <div className="flex justify-end pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setSelectedCustomer(null)}
                className="px-4 py-2 text-sm font-medium text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Add / Edit Customer Modal */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={editingCustomer ? 'Edit Customer Contact' : 'Add New Customer'}
        subtitle="Manage B2B buyer accounts and individual primary contacts."
        maxWidth="lg"
      >
        <form onSubmit={handleSaveCustomer} className="space-y-4 pt-1">
          {/* Company Selector */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              B2B Company Organization *
            </label>
            <SearchableSelect
              options={formCompanyOptions}
              value={form.companyId}
              onChange={v => setForm({ ...form, companyId: v })}
              placeholder="Select company…"
              searchPlaceholder="Search company by name or code…"
            />
          </div>

          {/* Customer Name */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Customer / Contact Name *</label>
            <input
              type="text"
              required
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. John Doe, Purchase Director"
              className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-600 transition-all"
            />
          </div>

          {/* Email & Designation */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Email Address</label>
              <input
                type="email"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                placeholder="buyer@clientcorp.com"
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-600 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Designation</label>
              <input
                type="text"
                value={form.designation}
                onChange={e => setForm({ ...form, designation: e.target.value })}
                placeholder="e.g. Head of Procurement"
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-600 transition-all"
              />
            </div>
          </div>

          {/* Phone & WhatsApp */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Phone Number</label>
              <input
                type="tel"
                value={form.phone}
                onChange={e => setForm({ ...form, phone: e.target.value })}
                placeholder="+1 234 567 8900"
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-600 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">WhatsApp Number</label>
              <input
                type="tel"
                value={form.whatsAppNumber}
                onChange={e => setForm({ ...form, whatsAppNumber: e.target.value })}
                placeholder="+1 234 567 8900"
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-600 transition-all"
              />
            </div>
          </div>

          {/* Status & Primary Contact Checkbox */}
          <div className="flex flex-wrap items-center justify-between gap-4 p-3 bg-slate-50 border border-slate-200 rounded-lg">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={form.isPrimaryContact}
                onChange={e => setForm({ ...form, isPrimaryContact: e.target.checked })}
                className="w-4 h-4 text-sky-600 rounded border-slate-300 focus:ring-sky-500"
              />
              <span className="text-sm font-medium text-slate-800">Set as Primary Company Contact</span>
            </label>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 font-medium">Status:</span>
              <select
                value={form.status}
                onChange={e => setForm({ ...form, status: e.target.value })}
                className="px-2.5 py-1 border border-slate-200 rounded-md text-xs font-medium bg-white text-slate-800"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Notes & Background</label>
            <textarea
              rows={2}
              value={form.notes}
              onChange={e => setForm({ ...form, notes: e.target.value })}
              placeholder="Add any specific context regarding this customer contact..."
              className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-600 transition-all"
            />
          </div>

          {/* Form Footer */}
          <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsFormOpen(false)}
              className="px-4 py-2 text-sm font-medium text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving || !form.companyId || !form.name.trim()}
              className="px-4 py-2 text-sm font-medium bg-sky-600 text-white rounded-lg hover:bg-sky-700 disabled:opacity-50 transition-colors shadow-xs"
            >
              {isSaving ? 'Saving…' : editingCustomer ? 'Save Changes' : 'Create Customer'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Upload Document Modal */}
      <Modal
        isOpen={isDocModalOpen}
        onClose={() => setIsDocModalOpen(false)}
        title="Upload Customer File"
        subtitle={`Attach compliance, KYC, or contract files to ${selectedCustomer?.name}`}
        maxWidth="md"
      >
        <form onSubmit={handleUploadCustomerDoc} className="space-y-4 pt-1">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Document Title *</label>
            <input
              type="text"
              required
              value={docTitle}
              onChange={e => setDocTitle(e.target.value)}
              placeholder="e.g. Buyer Business License / Tax Certificate"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-600"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Category</label>
            <select
              value={docCategory}
              onChange={e => setDocCategory(e.target.value as DocumentCategory)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-800 bg-white"
            >
              <option value="KYC / Compliance">KYC / Compliance</option>
              <option value="Agreement / Contract">Agreement / Contract</option>
              <option value="Purchase Order">Purchase Order</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Select File *</label>
            <input
              type="file"
              required
              onChange={e => setDocFile(e.target.files?.[0] || null)}
              className="w-full text-xs text-slate-600 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-sky-50 file:text-sky-700 hover:file:bg-sky-100"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsDocModalOpen(false)}
              className="px-3.5 py-2 text-xs font-medium text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isUploadingDoc || !docFile || !docTitle.trim()}
              className="px-4 py-2 text-xs font-medium bg-sky-600 text-white rounded-lg hover:bg-sky-700 disabled:opacity-50"
            >
              {isUploadingDoc ? 'Uploading…' : 'Upload File'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
