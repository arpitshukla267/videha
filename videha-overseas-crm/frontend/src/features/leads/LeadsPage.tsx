import React, { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  Download,
  Phone,
  Mail,
  MessageSquare,
  Clock,
  Send,
  Trash2,
  CheckCircle2,
  FileSpreadsheet,
  MapPin,
  LayoutGrid,
  List
} from 'lucide-react';
import { api } from '../../api/client';
import {
  Lead,
  User as CrmUser,
  LeadStatus,
  Priority,
  LeadActivity,
  LeadNote,
  Department
} from '../../types/crm';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { PriorityBadge } from '../../components/ui/PriorityBadge';
import { Modal } from '../../components/ui/Modal';
import { SearchableSelect } from '../../components/ui/SearchableSelect';
import { DateTimePicker } from '../../components/ui/DateTimePicker';
import { useAuth } from '../../context/AuthContext';
import { CRM_COUNTRIES } from '../../constants/countries';
import { refreshNotifications } from '../../lib/notifications';

const LEAD_STATUSES: LeadStatus[] = [
  'New',
  'Contacted',
  'Interested',
  'Follow-up',
  'Not Interested',
  'Converted',
  'Lost'
];

const LEAD_SOURCES = [
  { value: 'Website', label: 'Website Form' },
  { value: 'Trade Fair', label: 'Trade Fair / Gulfood' },
  { value: 'Referral', label: 'Buyer Referral' },
  { value: 'LinkedIn', label: 'LinkedIn B2B' },
  { value: 'Direct Inquiry', label: 'Trade Inquiry' },
  { value: 'Cold Outreach', label: 'Cold Outreach' }
];

const PRIORITY_OPTIONS: { value: Priority; label: string }[] = [
  { value: 'Low', label: 'Low' },
  { value: 'Medium', label: 'Medium' },
  { value: 'High', label: 'High' },
  { value: 'Urgent', label: 'Urgent' }
];

type LeadDraft = {
  leadStatus: LeadStatus;
  priority: Priority;
  assignedMemberId: string;
  nextFollowUp: string; // YYYY-MM-DD or ''
  name: string;
  company: string;
  phoneNumber: string;
  whatsAppNumber: string;
  email: string;
  country: string;
  productInterest: string;
  leadSource: string;
  notes: string;
  departmentId: string;
};

const emptyLeadForm = {
  name: '',
  company: '',
  phoneNumber: '',
  whatsAppNumber: '',
  email: '',
  country: 'United Arab Emirates',
  productInterest: '',
  leadSource: 'Website' as const,
  leadStatus: 'New' as LeadStatus,
  priority: 'Medium' as Priority,
  assignedMemberId: '',
  departmentId: '',
  nextFollowUp: '',
  notes: ''
};

function leadToDraft(lead: Lead): LeadDraft {
  const followUp = lead.nextFollowUp
    ? String(lead.nextFollowUp).slice(0, 10)
    : '';
  return {
    leadStatus: lead.leadStatus,
    priority: lead.priority,
    assignedMemberId: lead.assignedMemberId || '',
    nextFollowUp: followUp,
    name: lead.name || '',
    company: lead.company || '',
    phoneNumber: lead.phoneNumber || '',
    whatsAppNumber: lead.whatsAppNumber || '',
    email: lead.email || '',
    country: lead.country || '',
    productInterest: lead.productInterest || '',
    leadSource: lead.leadSource || '',
    notes: lead.notes || '',
    departmentId: lead.departmentId || ''
  };
}

type LeadsPageProps = {
  focusLeadId?: string | null;
  onFocusConsumed?: () => void;
};

export const LeadsPage: React.FC<LeadsPageProps> = ({ focusLeadId, onFocusConsumed }) => {
  const { hasPermission } = useAuth();

  const [leads, setLeads] = useState<Lead[]>([]);
  const [totalLeads, setTotalLeads] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit] = useState(12);

  // View Mode: Cards (default) or Table
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [countryFilter, setCountryFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [memberFilter, setMemberFilter] = useState('all');

  // Team Members & Departments
  const [teamMembers, setTeamMembers] = useState<CrmUser[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);

  // Export Modal State
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [exportTarget, setExportTarget] = useState<'all' | 'specific'>('specific');
  const [exportMemberId, setExportMemberId] = useState('');
  const [exportStatus, setExportStatus] = useState('all');
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccessMsg, setExportSuccessMsg] = useState<string | null>(null);

  // Create Lead Modal State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newLeadForm, setNewLeadForm] = useState(emptyLeadForm);
  const [isSubmittingCreate, setIsSubmittingCreate] = useState(false);

  // Lead Details Modal State
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [leadDetail, setLeadDetail] = useState<{
    lead: Lead;
    activities: LeadActivity[];
    notes: LeadNote[];
  } | null>(null);
  const [leadDraft, setLeadDraft] = useState<LeadDraft | null>(null);
  const [isSavingDetail, setIsSavingDetail] = useState(false);
  const [detailDirty, setDetailDirty] = useState(false);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [newNoteContent, setNewNoteContent] = useState('');
  const [isSubmittingNote, setIsSubmittingNote] = useState(false);

  const countryOptions = CRM_COUNTRIES.map(c => ({ value: c, label: c }));
  const statusOptions = LEAD_STATUSES.map(s => ({ value: s, label: s }));
  const memberOptions = teamMembers.map(m => ({
    value: m.id,
    label: m.name,
    description: m.roleDisplayName || m.roleName
  }));
  const departmentOptions = [
    { value: '', label: 'None' },
    ...departments.map(d => ({ value: d.id, label: d.name }))
  ];
  const countryFilterOptions = [
    { value: 'all', label: 'All Countries' },
    ...countryOptions
  ];
  const statusFilterOptions = [
    { value: 'all', label: 'All Statuses' },
    ...statusOptions
  ];
  const priorityFilterOptions = [
    { value: 'all', label: 'All Priorities' },
    { value: 'Urgent', label: 'Urgent' },
    { value: 'High', label: 'High' },
    { value: 'Medium', label: 'Medium' },
    { value: 'Low', label: 'Low' }
  ];
  const memberFilterOptions = [
    { value: 'all', label: 'All Team Members' },
    { value: 'unassigned', label: 'Unassigned Leads' },
    ...memberOptions
  ];

  // Load team members & departments
  useEffect(() => {
    api.users
      .getUsers()
      .then(res => {
        if (res.success) {
          setTeamMembers(res.data);
          if (res.data.length > 0 && !exportMemberId) {
            setExportMemberId(res.data[0].id);
          }
        }
      })
      .catch(() => {});

    api.departments
      .getDepartments('active')
      .then(res => {
        if (res.success) setDepartments(res.data);
      })
      .catch(() => {});
  }, []);

  // Fetch leads
  const fetchLeads = async (page = currentPage) => {
    setIsLoading(true);
    try {
      const res = await api.leads.getLeads({
        search,
        status: statusFilter,
        country: countryFilter,
        priority: priorityFilter,
        assignedMemberId: memberFilter,
        page,
        limit
      });
      if (res.success) {
        setLeads(res.items);
        setTotalLeads(res.total);
        setCurrentPage(res.page);
        setTotalPages(res.totalPages);
      }
    } catch (err) {
      console.error('Failed to fetch leads:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads(1);
  }, [search, statusFilter, countryFilter, priorityFilter, memberFilter]);

  const closeDetail = () => {
    setSelectedLeadId(null);
    setLeadDetail(null);
    setLeadDraft(null);
    setDetailDirty(false);
    setNewNoteContent('');
  };

  // Load Single Lead Details
  const handleOpenDetail = async (id: string) => {
    setSelectedLeadId(id);
    setIsLoadingDetail(true);
    try {
      const res = await api.leads.getLead(id);
      if (res.success) {
        setLeadDetail(res.data);
        setLeadDraft(leadToDraft(res.data.lead));
        setDetailDirty(false);
      }
    } catch (err) {
      console.error('Failed to load lead details:', err);
    } finally {
      setIsLoadingDetail(false);
    }
  };

  useEffect(() => {
    if (!focusLeadId) return;
    handleOpenDetail(focusLeadId).finally(() => onFocusConsumed?.());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusLeadId]);

  const updateDraft = <K extends keyof LeadDraft>(key: K, value: LeadDraft[K]) => {
    setLeadDraft(prev => (prev ? { ...prev, [key]: value } : prev));
    setDetailDirty(true);
  };

  const handleSaveDetail = async () => {
    if (!leadDetail || !leadDraft || !detailDirty) return;
    setIsSavingDetail(true);
    try {
      const originalAssignee = leadDetail.lead.assignedMemberId || '';
      await api.leads.updateLead(leadDetail.lead.id, {
        name: leadDraft.name,
        company: leadDraft.company,
        phoneNumber: leadDraft.phoneNumber,
        whatsAppNumber: leadDraft.whatsAppNumber,
        email: leadDraft.email,
        country: leadDraft.country,
        productInterest: leadDraft.productInterest,
        leadSource: leadDraft.leadSource,
        leadStatus: leadDraft.leadStatus,
        priority: leadDraft.priority,
        departmentId: leadDraft.departmentId || null,
        nextFollowUp: leadDraft.nextFollowUp || null,
        notes: leadDraft.notes
      });
      if (leadDraft.assignedMemberId !== originalAssignee) {
        await api.leads.assignLead(
          leadDetail.lead.id,
          leadDraft.assignedMemberId || null
        );
      }
      await handleOpenDetail(leadDetail.lead.id);
      fetchLeads(currentPage);
      refreshNotifications();
    } catch (err: any) {
      alert(err.message || 'Failed to save changes');
    } finally {
      setIsSavingDetail(false);
    }
  };

  const handleCreateLead = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingCreate(true);
    try {
      const res = await api.leads.createLead({
        name: newLeadForm.name,
        company: newLeadForm.company,
        phoneNumber: newLeadForm.phoneNumber,
        whatsAppNumber: newLeadForm.whatsAppNumber,
        email: newLeadForm.email,
        country: newLeadForm.country,
        productInterest: newLeadForm.productInterest,
        leadSource: newLeadForm.leadSource,
        leadStatus: newLeadForm.leadStatus,
        priority: newLeadForm.priority,
        assignedMemberId: newLeadForm.assignedMemberId || null,
        departmentId: newLeadForm.departmentId || null,
        nextFollowUp: newLeadForm.nextFollowUp || null,
        notes: newLeadForm.notes
      });
      if (res.success) {
        setIsCreateOpen(false);
        setNewLeadForm(emptyLeadForm);
        fetchLeads(1);
        refreshNotifications();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to create lead');
    } finally {
      setIsSubmittingCreate(false);
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leadDetail || !newNoteContent.trim()) return;
    setIsSubmittingNote(true);
    try {
      const res = await api.leads.addNote(leadDetail.lead.id, newNoteContent.trim());
      if (res.success) {
        setNewNoteContent('');
        setLeadDetail(prev =>
          prev
            ? {
                ...prev,
                notes: [res.data.note, ...prev.notes],
                activities: res.data.activities
              }
            : prev
        );
      }
    } catch (err: any) {
      alert(err.message || 'Failed to add note');
    } finally {
      setIsSubmittingNote(false);
    }
  };

  const handleDeleteLead = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!confirm('Are you sure you want to permanently delete this lead?')) return;
    try {
      await api.leads.deleteLead(id);
      if (selectedLeadId === id) {
        closeDetail();
      }
      fetchLeads(currentPage);
    } catch (err: any) {
      alert(err.message || 'Failed to delete lead');
    }
  };

  // Export Leads functionality (supports exporting for specific member only or all)
  const handleExportLeads = async () => {
    setIsExporting(true);
    setExportSuccessMsg(null);
    try {
      const targetMember =
        exportTarget === 'specific'
          ? teamMembers.find(m => m.id === exportMemberId)
          : null;

      const res = await api.leads.getLeads({
        assignedMemberId: exportTarget === 'specific' ? exportMemberId : undefined,
        status: exportStatus !== 'all' ? exportStatus : undefined,
        limit: 1000
      });

      if (!res.success || res.items.length === 0) {
        alert('No leads found matching the selected export parameters.');
        setIsExporting(false);
        return;
      }

      const headers = [
        'Lead Code',
        'Buyer Name',
        'Company',
        'Email',
        'Phone Number',
        'WhatsApp Number',
        'Secondary Phone',
        'Company Website',
        'Country',
        'City',
        'Destination Port',
        'Product of Interest',
        'HS Code',
        'IncoTerms',
        'Estimated Value (USD)',
        'Estimated Volume',
        'Lead Source',
        'Category',
        'Status',
        'Priority',
        'Preferred Contact',
        'Assigned Member',
        'Next Follow-Up',
        'Created Date',
        'Notes'
      ];

      const rows = res.items.map(lead => {
        const assigned = teamMembers.find(m => m.id === lead.assignedMemberId);
        const assignedName = assigned ? assigned.name : lead.assignedMemberName || 'Unassigned';

        return [
          `"${lead.leadCode || ''}"`,
          `"${(lead.name || '').replace(/"/g, '""')}"`,
          `"${(lead.company || '').replace(/"/g, '""')}"`,
          `"${lead.email || ''}"`,
          `"${lead.phoneNumber || ''}"`,
          `"${lead.whatsAppNumber || ''}"`,
          `"${lead.secondaryPhone || ''}"`,
          `"${lead.companyWebsite || ''}"`,
          `"${lead.country || ''}"`,
          `"${lead.city || ''}"`,
          `"${lead.destinationPort || ''}"`,
          `"${(lead.productInterest || '').replace(/"/g, '""')}"`,
          `"${lead.hsCode || ''}"`,
          `"${lead.tradeIncoTerms || ''}"`,
          `"${lead.estimatedValue || ''}"`,
          `"${lead.estimatedVolume || ''}"`,
          `"${lead.leadSource || ''}"`,
          `"${lead.leadCategory || ''}"`,
          `"${lead.leadStatus || ''}"`,
          `"${lead.priority || ''}"`,
          `"${lead.preferredContact || ''}"`,
          `"${assignedName.replace(/"/g, '""')}"`,
          `"${lead.nextFollowUp ? new Date(lead.nextFollowUp).toLocaleDateString() : ''}"`,
          `"${lead.createdDate ? new Date(lead.createdDate).toLocaleDateString() : ''}"`,
          `"${(lead.notes || '').replace(/"/g, '""').replace(/\n/g, ' ')}"`
        ].join(',');
      });

      const csvContent = [headers.join(','), ...rows].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');

      const dateStr = new Date().toISOString().slice(0, 10);
      const memberSlug = targetMember
        ? targetMember.name.toLowerCase().replace(/[^a-z0-9]/g, '_')
        : 'all_members';
      link.href = url;
      link.setAttribute('download', `videha_leads_${memberSlug}_${dateStr}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setExportSuccessMsg(
        `Exported ${res.items.length} leads successfully ${
          targetMember ? `for ${targetMember.name}` : ''
        }!`
      );

      setTimeout(() => {
        setIsExportOpen(false);
        setExportSuccessMsg(null);
      }, 1600);
    } catch (err: any) {
      alert(err.message || 'Failed to export leads');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="p-6 space-y-5 max-w-7xl mx-auto">
      {/* Header & Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-slate-800">Overseas Inquiries & Leads</h3>
          <p className="text-xs text-slate-500">
            Total records: {totalLeads} global buyer leads · Trade dispatch & commodity inquiries
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

          {/* Export Leads to Specific Member Only Button */}
          <button
            onClick={() => setIsExportOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-teal-50 text-teal-800 hover:bg-teal-100 border border-teal-200/80 rounded-lg text-xs font-medium transition-colors shadow-2xs"
            title="Export Leads Data for Specific Member"
          >
            <Download className="w-3.5 h-3.5 text-teal-600" />
            <span>Export Leads</span>
          </button>

          {/* Add New Lead Button */}
          {hasPermission('leads.create') && (
            <button
              onClick={() => setIsCreateOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-medium transition-colors shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Lead</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search buyer, company, product..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-sky-600 text-slate-800"
            />
          </div>

          {/* Status Filter */}
          <SearchableSelect
            options={statusFilterOptions}
            value={statusFilter}
            onChange={setStatusFilter}
            placeholder="All Statuses"
            searchPlaceholder="Search status…"
          />

          {/* Country Filter */}
          <SearchableSelect
            options={countryFilterOptions}
            value={countryFilter}
            onChange={setCountryFilter}
            placeholder="All Countries"
            searchPlaceholder="Search country…"
          />

          {/* Priority Filter */}
          <SearchableSelect
            options={priorityFilterOptions}
            value={priorityFilter}
            onChange={setPriorityFilter}
            placeholder="All Priorities"
            searchPlaceholder="Search priority…"
          />

          {/* Assigned Member Filter */}
          <SearchableSelect
            options={memberFilterOptions}
            value={memberFilter}
            onChange={setMemberFilter}
            placeholder="All Team Members"
            searchPlaceholder="Search member…"
          />
        </div>
      </div>

      {/* Main Content: Card View (Default) or Table View */}
      {viewMode === 'cards' ? (
        <div>
          {isLoading ? (
            <div className="py-16 text-center text-slate-400 bg-white border border-slate-200 rounded-xl">
              Loading leads in card view...
            </div>
          ) : leads.length === 0 ? (
            <div className="py-16 text-center text-slate-400 bg-white border border-slate-200 rounded-xl">
              No leads match the selected criteria.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4.5">
              {leads.map(lead => {
                const assigned = teamMembers.find(m => m.id === lead.assignedMemberId);
                const assignedName = assigned ? assigned.name : lead.assignedMemberName || 'Unassigned';
                const whatsappClean = (lead.whatsAppNumber || lead.phoneNumber || '').replace(/[^0-9]/g, '');

                return (
                  <div
                    key={lead.id}
                    onClick={() => handleOpenDetail(lead.id)}
                    className="bg-white border border-slate-200/90 hover:border-sky-300 rounded-xl p-4 shadow-2xs hover:shadow-xs transition-all cursor-pointer flex flex-col justify-between group relative"
                  >
                    <div>
                      {/* Top Bar: Code, Priority, Status */}
                      <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-slate-100">
                        <span className="font-mono text-[11px] font-semibold text-slate-600 bg-slate-100/90 px-2 py-0.5 rounded">
                          {lead.leadCode}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <PriorityBadge priority={lead.priority} />
                          <StatusBadge status={lead.leadStatus} />
                        </div>
                      </div>

                      {/* Buyer & Company Info */}
                      <div className="mt-3">
                        <h4 className="text-sm font-semibold text-slate-800 group-hover:text-sky-700 transition-colors leading-snug">
                          {lead.company}
                        </h4>
                        <p className="text-xs text-slate-600 mt-0.5 font-medium flex items-center gap-1.5">
                          <span>{lead.name}</span>
                          <span className="text-slate-300">·</span>
                          <span className="text-[11px] text-slate-500 font-normal">
                            {lead.leadCategory || 'Wholesale'}
                          </span>
                        </p>
                        <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-1">
                          <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="truncate">
                            {[lead.city, lead.country].filter(Boolean).join(', ')}
                            {lead.destinationPort ? ` (${lead.destinationPort})` : ''}
                          </span>
                        </p>
                      </div>

                      {/* Product of Interest Pill */}
                      <div className="mt-3 bg-sky-50/70 border border-sky-100 rounded-lg p-2.5 text-xs">
                        <div className="flex items-center justify-between text-[10px] text-sky-800 font-medium mb-0.5 uppercase tracking-wider">
                          <span>Product Requirement</span>
                          {lead.tradeIncoTerms && (
                            <span className="bg-sky-100 text-sky-700 px-1.5 py-0.2 rounded font-semibold">
                              {lead.tradeIncoTerms}
                            </span>
                          )}
                        </div>
                        <p className="text-slate-800 font-medium truncate" title={lead.productInterest}>
                          {lead.productInterest}
                        </p>
                      </div>

                      {/* Trade Parameters Specs */}
                      <div className="grid grid-cols-2 gap-2 mt-2.5 text-[11px]">
                        <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                          <span className="text-[10px] text-slate-400 block font-medium">Est. Value</span>
                          <span className="font-semibold text-slate-800">
                            {lead.estimatedValue ? `$${Number(lead.estimatedValue).toLocaleString()} USD` : 'Negotiable'}
                          </span>
                        </div>
                        <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                          <span className="text-[10px] text-slate-400 block font-medium">Order Volume</span>
                          <span className="font-medium text-slate-700 truncate block" title={lead.estimatedVolume || '1 FCL'}>
                            {lead.estimatedVolume || '1 FCL Container'}
                          </span>
                        </div>
                      </div>

                      {/* Contact Channels */}
                      <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center gap-2">
                          {lead.phoneNumber && (
                            <a
                              href={`tel:${lead.phoneNumber}`}
                              className="p-1.5 rounded-md text-slate-500 hover:text-sky-700 hover:bg-sky-50 transition-colors"
                              title={`Call: ${lead.phoneNumber}`}
                            >
                              <Phone className="w-3.5 h-3.5" />
                            </a>
                          )}
                          {whatsappClean && (
                            <a
                              href={`https://wa.me/${whatsappClean}?text=Hello%20${encodeURIComponent(lead.name)},%20greetings%20from%20Videha%20Overseas.`}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1.5 rounded-md text-emerald-600 hover:bg-emerald-50 transition-colors"
                              title="Chat on WhatsApp"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                            </a>
                          )}
                          {lead.email && (
                            <a
                              href={`mailto:${lead.email}`}
                              className="p-1.5 rounded-md text-slate-500 hover:text-sky-700 hover:bg-sky-50 transition-colors"
                              title={`Email: ${lead.email}`}
                            >
                              <Mail className="w-3.5 h-3.5" />
                            </a>
                          )}
                        </div>

                        {/* Next follow-up badge */}
                        {lead.nextFollowUp ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-medium text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-100">
                            <Clock className="w-3 h-3" />
                            {new Date(lead.nextFollowUp).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400">No follow-up set</span>
                        )}
                      </div>
                    </div>

                    {/* Card Footer: Assignee & Details Button */}
                    <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <div className="w-5 h-5 rounded-full bg-gradient-to-br from-sky-500 to-teal-600 text-white flex items-center justify-center text-[9px] font-bold shrink-0">
                          {assignedName.slice(0, 1).toUpperCase()}
                        </div>
                        <span className="text-[11px] text-slate-600 truncate max-w-[120px]" title={assignedName}>
                          {assignedName}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
                        <button
                          onClick={() => handleOpenDetail(lead.id)}
                          className="px-2.5 py-1 bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200/80 rounded-lg text-[11px] font-medium transition-colors"
                        >
                          View Details
                        </button>
                        {hasPermission('leads.delete') && (
                          <button
                            onClick={e => handleDeleteLead(lead.id, e)}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded"
                            title="Delete Lead"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* Table View */
        <div className="bg-white border border-slate-200 rounded-xl shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-600 font-semibold">
                  <th className="py-3 px-4">Lead ID</th>
                  <th className="py-3 px-4">Buyer / Contact</th>
                  <th className="py-3 px-4">Company</th>
                  <th className="py-3 px-4">Product Requirement</th>
                  <th className="py-3 px-4">Country & Port</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Priority</th>
                  <th className="py-3 px-4">Assigned Member</th>
                  <th className="py-3 px-4">Follow-up</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  <tr>
                    <td colSpan={10} className="py-12 text-center text-slate-400">
                      Loading leads database...
                    </td>
                  </tr>
                ) : leads.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-12 text-center text-slate-400">
                      No leads match the selected criteria.
                    </td>
                  </tr>
                ) : (
                  leads.map(lead => (
                    <tr
                      key={lead.id}
                      className="hover:bg-slate-50/70 transition-colors group cursor-pointer"
                      onClick={() => handleOpenDetail(lead.id)}
                    >
                      <td className="py-3 px-4 font-mono font-medium text-slate-700 whitespace-nowrap">
                        {lead.leadCode}
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-800 whitespace-nowrap">
                        <div>
                          <p>{lead.name}</p>
                          <span className="text-[10px] text-slate-400">{lead.phoneNumber}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-700 whitespace-nowrap">
                        {lead.company}
                      </td>
                      <td className="py-3 px-4 max-w-xs truncate" title={lead.productInterest}>
                        <span className="text-slate-700 font-medium">{lead.productInterest}</span>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap text-slate-600">
                        {[lead.city, lead.country].filter(Boolean).join(', ')}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <StatusBadge status={lead.leadStatus} />
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <PriorityBadge priority={lead.priority} />
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap text-slate-600">
                        {lead.assignedMemberName || 'Unassigned'}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap text-slate-600">
                        {lead.nextFollowUp ? new Date(lead.nextFollowUp).toLocaleDateString() : 'None'}
                      </td>
                      <td
                        className="py-3 px-4 text-right whitespace-nowrap"
                        onClick={e => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenDetail(lead.id)}
                            className="px-2 py-1 rounded bg-sky-50 text-sky-700 hover:bg-sky-100 border border-sky-200 text-[11px] font-medium"
                          >
                            Details
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

      {/* Pagination Bar */}
      <div className="flex items-center justify-between text-xs text-slate-500 pt-2">
        <span>
          Showing page {currentPage} of {totalPages} ({totalLeads} total leads)
        </span>
        <div className="flex gap-2">
          <button
            onClick={() => fetchLeads(currentPage - 1)}
            disabled={currentPage <= 1 || isLoading}
            className="px-3 py-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 transition-colors text-slate-700 font-medium"
          >
            Previous
          </button>
          <button
            onClick={() => fetchLeads(currentPage + 1)}
            disabled={currentPage >= totalPages || isLoading}
            className="px-3 py-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 transition-colors text-slate-700 font-medium"
          >
            Next
          </button>
        </div>
      </div>

      {/* EXPORT LEADS TO SPECIFIC MEMBER MODAL */}
      <Modal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        title="Export Leads Data"
        subtitle="Export international buyer inquiries to CSV for specific team member or entire organization"
        maxWidth="lg"
      >
        <div className="space-y-4 text-xs">
          {exportSuccessMsg && (
            <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{exportSuccessMsg}</span>
            </div>
          )}

          {/* Member Selection Option */}
          <div>
            <label className="block font-semibold text-slate-700 mb-2">Export Scope</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setExportTarget('specific')}
                className={`p-3 rounded-lg border text-left flex flex-col transition-all ${
                  exportTarget === 'specific'
                    ? 'border-sky-500 bg-sky-50/60 text-sky-900 ring-1 ring-sky-500'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                <span className="font-semibold text-xs">Specific Member Only</span>
                <span className="text-[11px] text-slate-500 mt-0.5">
                  Export buyer records delegated to one designated staff member
                </span>
              </button>

              <button
                type="button"
                onClick={() => setExportTarget('all')}
                className={`p-3 rounded-lg border text-left flex flex-col transition-all ${
                  exportTarget === 'all'
                    ? 'border-sky-500 bg-sky-50/60 text-sky-900 ring-1 ring-sky-500'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                <span className="font-semibold text-xs">All Team Members</span>
                <span className="text-[11px] text-slate-500 mt-0.5">
                  Full corporate export containing every inquiry and lead
                </span>
              </button>
            </div>
          </div>

          {/* Member Dropdown (When Specific Member Selected) */}
          {exportTarget === 'specific' && (
            <div className="bg-slate-50/80 p-3.5 rounded-xl border border-slate-200 space-y-2">
              <label className="block font-medium text-slate-800">
                Select Team Member to Export:
              </label>
              <SearchableSelect
                options={memberOptions}
                value={exportMemberId}
                onChange={setExportMemberId}
                placeholder="Select member…"
                searchPlaceholder="Search member…"
              />
              <p className="text-[11px] text-slate-500">
                The exported spreadsheet will solely include buyer leads currently assigned to this member.
              </p>
            </div>
          )}

          {/* Status Filter for Export */}
          <div>
            <label className="block font-medium text-slate-700 mb-1">Filter by Status (Optional)</label>
            <SearchableSelect
              options={statusFilterOptions}
              value={exportStatus}
              onChange={setExportStatus}
              placeholder="All Statuses"
              searchPlaceholder="Search status…"
            />
          </div>

          <div className="bg-sky-50/50 p-3 rounded-lg border border-sky-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-sky-600" />
              <span className="text-xs text-sky-900 font-medium">Export Format: Standard CSV (Excel / Google Sheets Compatible)</span>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsExportOpen(false)}
              className="px-4 py-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 font-medium"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleExportLeads}
              disabled={isExporting}
              className="px-5 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-medium flex items-center gap-1.5 disabled:opacity-50 transition-colors shadow-2xs"
            >
              <Download className="w-4 h-4" />
              <span>{isExporting ? 'Generating CSV...' : 'Download Leads CSV'}</span>
            </button>
          </div>
        </div>
      </Modal>

      {/* ADD NEW LEAD MODAL */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Add New Export Buyer Lead"
        subtitle="Register overseas trade inquiry and assign to a team member"
        maxWidth="2xl"
      >
        <form onSubmit={handleCreateLead} className="space-y-5 text-xs">
          {/* Contact */}
          <section className="space-y-3">
            <h4 className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Contact
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-medium text-slate-700 mb-1">Contact Person / Buyer *</label>
                <input
                  type="text"
                  required
                  value={newLeadForm.name}
                  onChange={e => setNewLeadForm({ ...newLeadForm, name: e.target.value })}
                  placeholder="e.g. Tariq Al-Mansoor"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-sky-600 text-slate-800"
                />
              </div>
              <div>
                <label className="block font-medium text-slate-700 mb-1">Company / Organization *</label>
                <input
                  type="text"
                  required
                  value={newLeadForm.company}
                  onChange={e => setNewLeadForm({ ...newLeadForm, company: e.target.value })}
                  placeholder="e.g. Al-Mansoor General Trading LLC"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-sky-600 text-slate-800"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-medium text-slate-700 mb-1">Business Email *</label>
                <input
                  type="email"
                  required
                  value={newLeadForm.email}
                  onChange={e => setNewLeadForm({ ...newLeadForm, email: e.target.value })}
                  placeholder="buyer@company.com"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-sky-600 text-slate-800"
                />
              </div>
              <div>
                <label className="block font-medium text-slate-700 mb-1">Primary Phone *</label>
                <input
                  type="text"
                  required
                  value={newLeadForm.phoneNumber}
                  onChange={e =>
                    setNewLeadForm({
                      ...newLeadForm,
                      phoneNumber: e.target.value,
                      whatsAppNumber: newLeadForm.whatsAppNumber || e.target.value
                    })
                  }
                  placeholder="+971 50 123 4567"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-sky-600 text-slate-800"
                />
              </div>
              <div>
                <label className="block font-medium text-slate-700 mb-1">WhatsApp Number</label>
                <input
                  type="text"
                  value={newLeadForm.whatsAppNumber}
                  onChange={e => setNewLeadForm({ ...newLeadForm, whatsAppNumber: e.target.value })}
                  placeholder="+971 50 123 4567"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-sky-600 text-slate-800"
                />
              </div>
            </div>
          </section>

          {/* Opportunity */}
          <section className="space-y-3">
            <h4 className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Opportunity
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-medium text-slate-700 mb-1">Destination Country *</label>
                <SearchableSelect
                  options={countryOptions}
                  value={newLeadForm.country}
                  onChange={v => setNewLeadForm({ ...newLeadForm, country: v })}
                  placeholder="Select country…"
                  searchPlaceholder="Search country…"
                />
              </div>
              <div>
                <label className="block font-medium text-slate-700 mb-1">Product of Interest *</label>
                <input
                  type="text"
                  required
                  value={newLeadForm.productInterest}
                  onChange={e => setNewLeadForm({ ...newLeadForm, productInterest: e.target.value })}
                  placeholder="e.g. Fox Nuts (Makhana) - Premium Grade"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-sky-600 text-slate-800"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-medium text-slate-700 mb-1">Lead Source</label>
                <SearchableSelect
                  options={LEAD_SOURCES}
                  value={newLeadForm.leadSource}
                  onChange={v => setNewLeadForm({ ...newLeadForm, leadSource: v as typeof newLeadForm.leadSource })}
                  placeholder="Select source…"
                />
              </div>
              <div>
                <label className="block font-medium text-slate-700 mb-1">Priority</label>
                <SearchableSelect
                  options={PRIORITY_OPTIONS}
                  value={newLeadForm.priority}
                  onChange={v => setNewLeadForm({ ...newLeadForm, priority: v as Priority })}
                  placeholder="Select priority…"
                />
              </div>
              <div>
                <label className="block font-medium text-slate-700 mb-1">Initial Status</label>
                <SearchableSelect
                  options={statusOptions}
                  value={newLeadForm.leadStatus}
                  onChange={v => setNewLeadForm({ ...newLeadForm, leadStatus: v as LeadStatus })}
                  placeholder="Select status…"
                />
              </div>
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1">Notes</label>
              <textarea
                rows={2}
                value={newLeadForm.notes}
                onChange={e => setNewLeadForm({ ...newLeadForm, notes: e.target.value })}
                placeholder="e.g. Requires phytosanitary certificate, lab testing report."
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-sky-600 text-slate-800"
              />
            </div>
          </section>

          {/* Assignment */}
          <section className="space-y-3">
            <h4 className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Assignment
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-medium text-slate-700 mb-1">Assign Team Member</label>
                <SearchableSelect
                  options={[{ value: '', label: 'Leave Unassigned' }, ...memberOptions]}
                  value={newLeadForm.assignedMemberId}
                  onChange={v => setNewLeadForm({ ...newLeadForm, assignedMemberId: v })}
                  placeholder="Leave Unassigned"
                  searchPlaceholder="Search member…"
                  allowClear
                />
              </div>
              <div>
                <label className="block font-medium text-slate-700 mb-1">Department</label>
                <SearchableSelect
                  options={departmentOptions}
                  value={newLeadForm.departmentId}
                  onChange={v => setNewLeadForm({ ...newLeadForm, departmentId: v })}
                  placeholder="None"
                  allowClear
                />
              </div>
              <div>
                <label className="block font-medium text-slate-700 mb-1">Next Follow-up Date</label>
                <DateTimePicker
                  value={newLeadForm.nextFollowUp}
                  onChange={v => setNewLeadForm({ ...newLeadForm, nextFollowUp: v })}
                  placeholder="Pick follow-up date"
                />
              </div>
            </div>
          </section>

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
              {isSubmittingCreate ? 'Saving Lead...' : 'Register Buyer Lead'}
            </button>
          </div>
        </form>
      </Modal>

      {/* LEAD DETAILS DRAWER / MODAL */}
      <Modal
        isOpen={!!selectedLeadId}
        onClose={closeDetail}
        title={leadDetail ? `${leadDetail.lead.leadCode} · ${leadDetail.lead.company}` : 'Lead Details'}
        subtitle={
          leadDetail
            ? `Contact Person: ${leadDetail.lead.name} · ${[leadDetail.lead.city, leadDetail.lead.country].filter(Boolean).join(', ')}`
            : ''
        }
        maxWidth="3xl"
      >
        {isLoadingDetail || !leadDetail || !leadDraft ? (
          <div className="py-12 text-center text-slate-400">Loading lead details...</div>
        ) : (
          <div className="space-y-5 text-xs">
            {/* Editable 2-column form */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-medium text-slate-700 mb-1">Contact Person</label>
                <input
                  type="text"
                  value={leadDraft.name}
                  onChange={e => updateDraft('name', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-sky-600 text-slate-800"
                />
              </div>
              <div>
                <label className="block font-medium text-slate-700 mb-1">Company</label>
                <input
                  type="text"
                  value={leadDraft.company}
                  onChange={e => updateDraft('company', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-sky-600 text-slate-800"
                />
              </div>
              <div>
                <label className="block font-medium text-slate-700 mb-1">Email</label>
                <input
                  type="email"
                  value={leadDraft.email}
                  onChange={e => updateDraft('email', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-sky-600 text-slate-800"
                />
              </div>
              <div>
                <label className="block font-medium text-slate-700 mb-1">Phone</label>
                <input
                  type="text"
                  value={leadDraft.phoneNumber}
                  onChange={e => updateDraft('phoneNumber', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-sky-600 text-slate-800"
                />
              </div>
              <div>
                <label className="block font-medium text-slate-700 mb-1">WhatsApp</label>
                <input
                  type="text"
                  value={leadDraft.whatsAppNumber}
                  onChange={e => updateDraft('whatsAppNumber', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-sky-600 text-slate-800"
                />
              </div>
              <div>
                <label className="block font-medium text-slate-700 mb-1">Country</label>
                <SearchableSelect
                  options={countryOptions}
                  value={leadDraft.country}
                  onChange={v => updateDraft('country', v)}
                  placeholder="Select country…"
                  searchPlaceholder="Search country…"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block font-medium text-slate-700 mb-1">Product Interest</label>
                <input
                  type="text"
                  value={leadDraft.productInterest}
                  onChange={e => updateDraft('productInterest', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-sky-600 text-slate-800"
                />
              </div>
              <div>
                <label className="block font-medium text-slate-700 mb-1">Lead Source</label>
                <SearchableSelect
                  options={LEAD_SOURCES}
                  value={leadDraft.leadSource}
                  onChange={v => updateDraft('leadSource', v)}
                  placeholder="Select source…"
                />
              </div>
              <div>
                <label className="block font-medium text-slate-700 mb-1">Status</label>
                <SearchableSelect
                  options={statusOptions}
                  value={leadDraft.leadStatus}
                  onChange={v => updateDraft('leadStatus', v as LeadStatus)}
                  placeholder="Select status…"
                />
              </div>
              <div>
                <label className="block font-medium text-slate-700 mb-1">Priority</label>
                <SearchableSelect
                  options={PRIORITY_OPTIONS}
                  value={leadDraft.priority}
                  onChange={v => updateDraft('priority', v as Priority)}
                  placeholder="Select priority…"
                />
              </div>
              <div>
                <label className="block font-medium text-slate-700 mb-1">Assigned Member</label>
                <SearchableSelect
                  options={[{ value: '', label: 'Unassigned' }, ...memberOptions]}
                  value={leadDraft.assignedMemberId}
                  onChange={v => updateDraft('assignedMemberId', v)}
                  placeholder="Unassigned"
                  searchPlaceholder="Search member…"
                  allowClear
                />
              </div>
              <div>
                <label className="block font-medium text-slate-700 mb-1">Department</label>
                <SearchableSelect
                  options={departmentOptions}
                  value={leadDraft.departmentId}
                  onChange={v => updateDraft('departmentId', v)}
                  placeholder="None"
                  allowClear
                />
              </div>
              <div>
                <label className="block font-medium text-slate-700 mb-1">Next Follow-up</label>
                <DateTimePicker
                  value={leadDraft.nextFollowUp}
                  onChange={v => updateDraft('nextFollowUp', v)}
                  placeholder="Pick follow-up date"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block font-medium text-slate-700 mb-1">Notes (summary)</label>
                <textarea
                  rows={2}
                  value={leadDraft.notes}
                  onChange={e => updateDraft('notes', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-sky-600 text-slate-800"
                />
              </div>
            </div>

            {/* Notes & Activity Timeline */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="border border-slate-200 rounded-xl p-4 bg-white flex flex-col h-80">
                <h4 className="text-xs font-semibold text-slate-800 uppercase tracking-wider mb-3">
                  Trade Notes & Remarks
                </h4>

                <form onSubmit={handleAddNote} className="mb-3 flex gap-2">
                  <input
                    type="text"
                    value={newNoteContent}
                    onChange={e => setNewNoteContent(e.target.value)}
                    placeholder="Add export note, CIF rate quote, sample feedback..."
                    className="flex-1 px-3 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-sky-600 text-slate-800"
                  />
                  <button
                    type="submit"
                    disabled={isSubmittingNote || !newNoteContent.trim()}
                    className="px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-medium disabled:opacity-40 transition-colors shadow-2xs"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </form>

                <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                  {leadDetail.notes.length === 0 ? (
                    <p className="text-slate-400 text-center py-8">No notes logged yet.</p>
                  ) : (
                    leadDetail.notes.map(note => (
                      <div
                        key={note.id}
                        className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs"
                      >
                        <p className="text-slate-800 leading-relaxed">{note.content}</p>
                        <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1.5">
                          <span>{note.authorName}</span>
                          <span>{new Date(note.createdAt).toLocaleString()}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="border border-slate-200 rounded-xl p-4 bg-white flex flex-col h-80">
                <h4 className="text-xs font-semibold text-slate-800 uppercase tracking-wider mb-3 flex items-center justify-between">
                  <span>Activity Timeline</span>
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                </h4>
                <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                  {leadDetail.activities.map(act => (
                    <div key={act.id} className="relative pl-4 border-l-2 border-slate-200">
                      <div className="absolute -left-[5px] top-1 w-2 h-2 rounded-full bg-sky-600" />
                      <p className="text-xs font-medium text-slate-800">{act.title}</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">{act.description}</p>
                      <span className="text-[10px] text-slate-400 mt-1 block">
                        {new Date(act.createdAt).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={closeDetail}
                className="px-4 py-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 font-medium"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveDetail}
                disabled={!detailDirty || isSavingDetail}
                className="px-5 py-2 rounded-lg bg-sky-600 hover:bg-sky-700 text-white font-medium disabled:opacity-40 transition-colors shadow-2xs"
              >
                {isSavingDetail ? 'Saving…' : 'Save changes'}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
