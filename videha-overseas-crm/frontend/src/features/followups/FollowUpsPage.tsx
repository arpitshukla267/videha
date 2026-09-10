import React, { useEffect, useMemo, useState } from 'react';
import {
  Plus,
  Search,
  Check,
  CheckCircle,
  SquarePen,
  Trash2,
  Calendar,
  Clock,
  AlertTriangle,
  Download,
  Upload,
  Phone,
  Mail,
  MessageSquare,
  Users,
  Building2,
  User as UserIcon
} from 'lucide-react';
import { api } from '../../api/client';
import {
  FollowUp,
  FollowUpStatus,
  FollowUpType,
  Lead,
  LeadPipelineMeta,
  LeadStatus,
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
import { refreshNotifications } from '../../lib/notifications';
import { ImportWizard } from '../../components/import/ImportWizard';
import { ListStatePanel, ownScopeEmptyCopy } from '../../components/ui/ListStatePanel';

type ScheduleTab = 'today' | 'upcoming' | 'overdue' | 'all';

const TYPE_CONFIG: Record<
  FollowUpType,
  { label: string; icon: React.ComponentType<{ className?: string }>; bg: string; text: string; border: string }
> = {
  Call: {
    label: 'Call',
    icon: Phone,
    bg: 'bg-sky-50',
    text: 'text-sky-700',
    border: 'border-sky-200'
  },
  WhatsApp: {
    label: 'WhatsApp',
    icon: MessageSquare,
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200'
  },
  Email: {
    label: 'Email',
    icon: Mail,
    bg: 'bg-violet-50',
    text: 'text-violet-700',
    border: 'border-violet-200'
  },
  Meeting: {
    label: 'Meeting',
    icon: Users,
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-200'
  }
};

const DEFAULT_LEAD_STATUSES: LeadStatus[] = [
  'New',
  'Contacted',
  'Interested',
  'Qualified',
  'Sample Requested',
  'Sample Sent',
  'Negotiation',
  'Quotation Sent',
  'Converted',
  'Follow-up',
  'Lost',
  'Not Interested'
];

const OUTCOME_SUGGESTIONS = [
  'Discussed requirement & sent catalog',
  'Price negotiation in progress',
  'Sample requested by buyer',
  'Customer requested callback later',
  'Call not answered / voicemail left',
  'Not interested at this time'
];

type FollowUpForm = {
  leadId: string;
  assignedToId: string;
  dueAt: string;
  type: FollowUpType;
  notes: string;
};

const emptyForm = (assigneeId = ''): FollowUpForm => ({
  leadId: '',
  assignedToId: assigneeId,
  dueAt: new Date(Date.now() + 86400000).toISOString().slice(0, 16),
  type: 'Call',
  notes: ''
});

export const FollowUpsPage: React.FC = () => {
  const { user, hasPermission } = useAuth();
  const [schedule, setSchedule] = useState<ScheduleTab>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'Completed'>('all');
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit] = useState(15);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [teamMembers, setTeamMembers] = useState<CrmUser[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [pipelineMeta, setPipelineMeta] = useState<LeadPipelineMeta | null>(null);

  // Add / Edit Modal State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editing, setEditing] = useState<FollowUp | null>(null);
  const [form, setForm] = useState<FollowUpForm>(emptyForm(user?.id));
  const [createRequestId, setCreateRequestId] = useState(generateClientRequestId);
  const [isSaving, setIsSaving] = useState(false);

  // Complete Modal State
  const [completeModal, setCompleteModal] = useState<FollowUp | null>(null);
  const [connectedLead, setConnectedLead] = useState<Lead | null>(null);
  const [leadStatus, setLeadStatus] = useState<LeadStatus>('Contacted');
  const [lostReason, setLostReason] = useState('');
  const [completeOutcome, setCompleteOutcome] = useState('');
  const [completeNotes, setCompleteNotes] = useState('');
  const [scheduleNext, setScheduleNext] = useState(false);
  const [nextDueAt, setNextDueAt] = useState('');
  const [nextType, setNextType] = useState<FollowUpType>('Call');
  const [nextAssigneeId, setNextAssigneeId] = useState('');
  const [nextNotes, setNextNotes] = useState('');
  const [isSavingComplete, setIsSavingComplete] = useState(false);

  // Import / Export State
  const [isExporting, setIsExporting] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);

  const memberOptions = useMemo(
    () => teamMembers.map(m => ({ value: m.id, label: m.name })),
    [teamMembers]
  );

  const leadOptions = useMemo(
    () =>
      leads.map(l => ({
        value: l.id,
        label: `${l.leadCode} — ${l.company || l.name || 'Unnamed'}`
      })),
    [leads]
  );

  const leadStatusOptions = useMemo(() => {
    const statuses = pipelineMeta?.allStatuses || DEFAULT_LEAD_STATUSES;
    const list = statuses.includes('Converted') ? statuses : [...statuses, 'Converted'];
    return list.map(s => ({ value: s, label: s }));
  }, [pipelineMeta]);

  const fetchFollowUps = async (pageNum = page) => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const res = await api.followUps.getFollowUps({
        schedule: schedule === 'all' ? undefined : schedule,
        status: statusFilter === 'all' ? undefined : statusFilter,
        search: search.trim() || undefined,
        page: pageNum,
        limit
      });
      if (res.success) {
        setFollowUps(res.data);
        setTotal(res.total);
        setPage(res.page);
        setTotalPages(res.totalPages);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load follow-ups';
      setLoadError(message);
      alertSaveError(err, 'Failed to load follow-ups');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFollowUps(1);
  }, [schedule, statusFilter, search]);

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

    api.meta
      .getLeadPipeline()
      .then(res => {
        if (res.success) setPipelineMeta(res.data);
      })
      .catch(() => {});
  }, [user]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm(user?.id));
    setCreateRequestId(generateClientRequestId());
    setIsFormOpen(true);
  };

  const openEdit = (item: FollowUp) => {
    setEditing(item);
    setForm({
      leadId: item.leadId,
      assignedToId: item.assignedToId,
      dueAt: item.dueAt.slice(0, 16),
      type: item.type,
      notes: item.notes || ''
    });
    setIsFormOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.leadId || !form.assignedToId || !form.dueAt) return;
    setIsSaving(true);
    try {
      if (editing) {
        await api.followUps.updateFollowUp(editing.id, {
          leadId: form.leadId,
          assignedToId: form.assignedToId,
          dueAt: new Date(form.dueAt).toISOString(),
          type: form.type,
          notes: form.notes,
          revision: editing.revision
        });
      } else {
        await api.followUps.createFollowUp({
          leadId: form.leadId,
          assignedToId: form.assignedToId,
          dueAt: new Date(form.dueAt).toISOString(),
          type: form.type,
          notes: form.notes,
          clientRequestId: createRequestId
        } as FollowUp & { clientRequestId: string });
      }
      setIsFormOpen(false);
      fetchFollowUps(page);
      refreshNotifications();
    } catch (err: unknown) {
      if (editing) {
        await handleConflictWithReload(err, () => fetchFollowUps(page), 'Failed to save follow-up');
      } else {
        alertSaveError(err, 'Failed to create follow-up');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const openCompleteModal = async (item: FollowUp) => {
    setCompleteModal(item);
    setCompleteOutcome('');
    setCompleteNotes('');
    setLostReason('');
    setScheduleNext(false);
    // Default next follow-up: 2 days from now at 10:00 AM
    const nextDate = new Date(Date.now() + 86400000 * 2);
    nextDate.setHours(10, 0, 0, 0);
    setNextDueAt(nextDate.toISOString().slice(0, 16));
    setNextType(item.type || 'Call');
    setNextAssigneeId(item.assignedToId || user?.id || '');
    setNextNotes('');

    // Locate or fetch the connected lead for live status & details
    const existing = leads.find(l => l.id === item.leadId);
    if (existing) {
      setConnectedLead(existing);
      setLeadStatus(existing.leadStatus);
      if (existing.lostReason) setLostReason(existing.lostReason);
    }

    try {
      const res = await api.leads.getLead(item.leadId);
      if (res.success && res.data?.lead) {
        setConnectedLead(res.data.lead);
        setLeadStatus(res.data.lead.leadStatus);
        if (res.data.lead.lostReason) setLostReason(res.data.lead.lostReason);
      }
    } catch {
      // Fallback already assigned
    }
  };

  const handleCompleteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!completeModal) return;

    setIsSavingComplete(true);
    try {
      // 1. Complete the current follow-up
      await api.followUps.completeFollowUp(completeModal.id, {
        outcome: completeOutcome.trim(),
        notes: completeNotes.trim(),
        revision: completeModal.revision
      });

      // 2. Update the connected lead status if lead exists and status or nextFollowUp changed
      if (connectedLead) {
        if (leadStatus === 'Converted') {
          if (connectedLead.leadStatus !== 'Converted') {
            const convertible = [
              'Qualified',
              'Sample Requested',
              'Sample Sent',
              'Negotiation',
              'Quotation Sent',
              'Interested'
            ];
            let rev = connectedLead.revision;
            if (!convertible.includes(connectedLead.leadStatus)) {
              const qualRes = await api.leads.updateLead(connectedLead.id, {
                leadStatus: 'Qualified',
                revision: rev
              });
              if (qualRes.success && qualRes.data) {
                rev = qualRes.data.revision;
              }
            }
            await api.leads.convertLead(connectedLead.id, rev);
          }
        } else {
          const leadStatusChanged = leadStatus !== connectedLead.leadStatus;
          const lostReasonChanged = leadStatus === 'Lost' && lostReason !== connectedLead.lostReason;

          if (leadStatusChanged || lostReasonChanged || scheduleNext) {
            await api.leads.updateLead(connectedLead.id, {
              leadStatus,
              ...(leadStatus === 'Lost' ? { lostReason: lostReason.trim() } : {}),
              ...(scheduleNext && nextDueAt ? { nextFollowUp: new Date(nextDueAt).toISOString() } : {}),
              revision: connectedLead.revision
            });
          }
        }
      }

      // 3. If customer demanded another follow-up, create it directly
      if (scheduleNext && nextDueAt) {
        await api.followUps.createFollowUp({
          leadId: completeModal.leadId,
          assignedToId: nextAssigneeId || completeModal.assignedToId || user?.id || '',
          dueAt: new Date(nextDueAt).toISOString(),
          type: nextType,
          notes: nextNotes.trim(),
          clientRequestId: generateClientRequestId()
        } as FollowUp & { clientRequestId: string });
      }

      setCompleteModal(null);
      fetchFollowUps(page);
      refreshNotifications();

      // Refresh leads list to keep state fresh
      api.leads.getLeads({ limit: 100 }).then(res => {
        if (res.success) setLeads(res.items);
      });
    } catch (err: unknown) {
      await handleConflictWithReload(err, () => fetchFollowUps(page), 'Failed to complete follow-up');
    } finally {
      setIsSavingComplete(false);
    }
  };

  const handleDelete = async (item: FollowUp) => {
    if (!window.confirm('Delete this follow-up?')) return;
    try {
      await api.followUps.deleteFollowUp(item.id);
      fetchFollowUps(page);
    } catch (err: unknown) {
      alertSaveError(err, 'Failed to delete follow-up');
    }
  };

  const handleExportCsv = async () => {
    setIsExporting(true);
    try {
      await api.followUps.exportCsv({
        schedule: schedule === 'all' ? undefined : schedule,
        status: statusFilter === 'all' ? undefined : statusFilter,
        search: search.trim() || undefined
      });
    } catch (err: unknown) {
      alertSaveError(err, 'Failed to export follow-ups');
    } finally {
      setIsExporting(false);
    }
  };

  const setNextDaysOffset = (days: number) => {
    const target = new Date(Date.now() + 86400000 * days);
    target.setHours(10, 0, 0, 0);
    setNextDueAt(target.toISOString().slice(0, 16));
  };

  const setFormDaysOffset = (days: number) => {
    const target = new Date(Date.now() + 86400000 * days);
    target.setHours(10, 0, 0, 0);
    setForm(prev => ({ ...prev, dueAt: target.toISOString().slice(0, 16) }));
  };


  const scheduleTabs: { id: ScheduleTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'today', label: 'Today', icon: Calendar },
    { id: 'upcoming', label: 'Upcoming', icon: Clock },
    { id: 'overdue', label: 'Overdue', icon: AlertTriangle },
    { id: 'all', label: 'All', icon: Search }
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-lg sm:text-xl font-semibold text-slate-900 tracking-tight">Follow-ups</h1>
          <p className="text-sm text-slate-500 mt-1">
            Track and manage scheduled customer touchpoints, log call outcomes, and update lead pipelines.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          {hasPermission('followups.create') && (
            <button
              type="button"
              onClick={() => setIsImportOpen(true)}
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-sky-50 text-sky-800 hover:bg-sky-100 border border-sky-200/80 rounded-lg text-sm font-medium transition-colors shadow-2xs"
            >
              <Upload className="w-4 h-4 text-sky-600" />
              Import CSV
            </button>
          )}
          {hasPermission('followups.view') && (
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
          {hasPermission('followups.create') && (
            <button
              onClick={openCreate}
              className="inline-flex items-center gap-2 px-4 py-2 bg-sky-600 text-white text-sm font-medium rounded-lg hover:bg-sky-700 transition-colors shadow-xs"
            >
              <Plus className="w-4 h-4" />
              Schedule Follow-up
            </button>
          )}
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        <div className="flex flex-wrap items-center gap-2">
          {scheduleTabs.map(tab => {
            const Icon = tab.icon;
            const active = schedule === tab.id && statusFilter === 'all';
            return (
              <button
                key={tab.id}
                onClick={() => { setSchedule(tab.id); setStatusFilter('all'); }}
                className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium border transition-colors ${
                  active
                    ? 'bg-sky-50 text-sky-800 border-sky-200 shadow-2xs'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <Icon className={`w-4 h-4 ${active ? 'text-sky-600' : 'text-slate-400'}`} />
                {tab.label}
              </button>
            );
          })}

          {/* Completed Status Filter */}
          <button
            onClick={() => { setStatusFilter('Completed'); setSchedule('all'); }}
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium border transition-colors ${
              statusFilter === 'Completed'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200 shadow-2xs'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <CheckCircle className={`w-4 h-4 ${statusFilter === 'Completed' ? 'text-emerald-600' : 'text-slate-400'}`} />
            Completed
          </button>
        </div>

        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by company or lead code…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-3.5 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-600 transition-all bg-white"
          />
        </div>
      </div>

      {/* Follow-ups Table View */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        <ListStatePanel
          isLoading={isLoading}
          error={loadError}
          isEmpty={!loadError && followUps.length === 0}
          loadingLabel="Loading follow-ups…"
          emptyTitle={
            user?.roleName === 'SALES_MEMBER' && schedule === 'all' && !search.trim()
              ? ownScopeEmptyCopy('follow-ups').title
              : 'No follow-ups found'
          }
          emptyDescription={
            user?.roleName === 'SALES_MEMBER' && schedule === 'all' && !search.trim()
              ? ownScopeEmptyCopy('follow-ups').description
              : schedule !== 'all'
                ? 'Try the All tab, or schedule a follow-up on one of your leads.'
                : undefined
          }
          className="p-10 text-center text-sm text-slate-500"
        />

        {!isLoading && !loadError && followUps.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500">
                <tr>
                  <th className="text-left px-5 py-3.5 font-semibold text-xs uppercase tracking-wider">Lead</th>
                  <th className="text-left px-5 py-3.5 font-semibold text-xs uppercase tracking-wider">Type</th>
                  <th className="text-left px-5 py-3.5 font-semibold text-xs uppercase tracking-wider">Scheduled For</th>
                  <th className="text-left px-5 py-3.5 font-semibold text-xs uppercase tracking-wider">Assignee</th>
                  <th className="text-left px-5 py-3.5 font-semibold text-xs uppercase tracking-wider">Status</th>
                  <th className="text-right px-5 py-3.5 font-semibold text-xs uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {followUps.map(item => {
                  const typeMeta = TYPE_CONFIG[item.type] || TYPE_CONFIG.Call;
                  const TypeIcon = typeMeta.icon;
                  const isOverdue =
                    item.status === 'Pending' && new Date(item.dueAt).getTime() < Date.now();

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Lead Title & Code */}
                      <td className="px-5 py-4">
                        <div className="text-base font-medium text-slate-900 leading-snug">
                          {item.leadCompany || '—'}
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="font-mono text-xs text-slate-500">{item.leadCode}</span>
                          {item.notes && (
                            <span className="text-xs text-slate-400 truncate max-w-xs" title={item.notes}>
                              • {item.notes}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Type Badge */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border ${typeMeta.bg} ${typeMeta.text} ${typeMeta.border}`}
                        >
                          <TypeIcon className="w-3.5 h-3.5" />
                          {typeMeta.label}
                        </span>
                      </td>

                      {/* Due Date */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Clock className={`w-4 h-4 ${isOverdue ? 'text-rose-500' : 'text-slate-400'}`} />
                          <div>
                            <div className={`font-medium ${isOverdue ? 'text-rose-700 font-semibold' : 'text-slate-800'}`}>
                              {new Date(item.dueAt).toLocaleDateString(undefined, {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric'
                              })}
                              {isOverdue && (
                                <span className="ml-1.5 inline-block text-[11px] font-semibold text-rose-600 bg-rose-50 border border-rose-200 px-1.5 py-0.2 rounded">
                                  Overdue
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Assignee */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-xs font-semibold text-slate-600">
                            {(item.assignedToName || 'U').charAt(0).toUpperCase()}
                          </div>
                          <span className="text-slate-800 font-medium">{item.assignedToName || 'Unassigned'}</span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <StatusBadge status={item.status as FollowUpStatus} />
                        {item.status === 'Completed' && item.outcome && (
                          <div className="text-xs text-slate-500 mt-1 max-w-xs truncate" title={item.outcome}>
                            Outcome: {item.outcome}
                          </div>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-2">
                          {/* Green Tick Complete */}
                          {item.status === 'Pending' && hasPermission('followups.edit') && (
                            <button
                              type="button"
                              onClick={() => openCompleteModal(item)}
                              title="Mark Complete"
                              className="p-2 text-emerald-600 hover:text-emerald-700 bg-emerald-50/90 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors shadow-2xs"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                          )}

                          {/* Black Edit Icon */}
                          {hasPermission('followups.edit') && item.status === 'Pending' && (
                            <button
                              type="button"
                              onClick={() => openEdit(item)}
                              title="Edit Follow-up"
                              className="p-2 text-slate-800 hover:text-black bg-slate-100 hover:bg-slate-200/80 border border-slate-300 rounded-lg transition-colors shadow-2xs"
                            >
                              <SquarePen className="w-4 h-4" />
                            </button>
                          )}

                          {/* Red Trash Delete Icon */}
                          {hasPermission('followups.edit') && (
                            <button
                              type="button"
                              onClick={() => handleDelete(item)}
                              title="Delete Follow-up"
                              className="p-2 text-rose-600 hover:text-rose-700 bg-rose-50/90 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors shadow-2xs"
                            >
                              <Trash2 className="w-4 h-4" />
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
        onPageChange={p => fetchFollowUps(p)}
      />

      {/* Schedule / Edit Follow-up Modal */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={editing ? 'Edit Follow-up' : 'Schedule Follow-up'}
        subtitle="Set up a customer touchpoint to keep sales momentum moving."
        maxWidth="lg"
      >
        <form onSubmit={handleSave} className="space-y-4 pt-1">
          {/* Lead Selector */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Connected Lead *</label>
            <SearchableSelect
              options={leadOptions}
              value={form.leadId}
              onChange={v => setForm({ ...form, leadId: v })}
              placeholder="Search and select lead…"
              searchPlaceholder="Type company or lead code…"
            />
          </div>

          {/* Follow-up Type Chips */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Follow-up Channel</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(['Call', 'WhatsApp', 'Email', 'Meeting'] as FollowUpType[]).map(typeKey => {
                const meta = TYPE_CONFIG[typeKey];
                const Icon = meta.icon;
                const isSelected = form.type === typeKey;
                return (
                  <button
                    key={typeKey}
                    type="button"
                    onClick={() => setForm({ ...form, type: typeKey })}
                    className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg border text-sm font-medium transition-all ${
                      isSelected
                        ? `${meta.bg} ${meta.text} border-sky-500 ring-2 ring-sky-500/20 shadow-2xs`
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {meta.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Assignee & Due Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Assignee *</label>
              <SearchableSelect
                options={memberOptions}
                value={form.assignedToId}
                onChange={v => setForm({ ...form, assignedToId: v })}
                placeholder="Select team member…"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Scheduled Date & Time *</label>
              <DateTimePicker
                value={form.dueAt}
                onChange={v => setForm({ ...form, dueAt: v })}
              />
            </div>
          </div>

          {/* Quick Date Presets */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">Quick set:</span>
            <button
              type="button"
              onClick={() => setFormDaysOffset(1)}
              className="text-xs px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition-colors"
            >
              Tomorrow
            </button>
            <button
              type="button"
              onClick={() => setFormDaysOffset(2)}
              className="text-xs px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition-colors"
            >
              In 2 Days
            </button>
            <button
              type="button"
              onClick={() => setFormDaysOffset(7)}
              className="text-xs px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition-colors"
            >
              In 1 Week
            </button>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Notes & Agenda</label>
            <textarea
              rows={2}
              value={form.notes}
              onChange={e => setForm({ ...form, notes: e.target.value })}
              className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-600 transition-all"
              placeholder="e.g. Follow up on the revised quotation, confirm shipment terms..."
            />
          </div>

          {/* Modal Footer */}
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
              disabled={isSaving || !form.leadId || !form.assignedToId || !form.dueAt}
              className="px-4 py-2 text-sm font-medium bg-sky-600 text-white rounded-lg hover:bg-sky-700 disabled:opacity-50 transition-colors shadow-xs"
            >
              {isSaving ? 'Saving…' : editing ? 'Save Changes' : 'Schedule Follow-up'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Complete Follow-up Modal (With Connected Lead Status & Next Follow-up Option) */}
      <Modal
        isOpen={!!completeModal}
        onClose={() => setCompleteModal(null)}
        title="Complete Follow-up"
        subtitle="Log the outcome, update the lead's status, or schedule the next follow-up directly."
        maxWidth="2xl"
      >
        {completeModal && (
          <form onSubmit={handleCompleteSubmit} className="space-y-4 pt-1">
            {/* Connected Lead Card Banner */}
            <div className="p-3.5 bg-slate-50/90 border border-slate-200 rounded-xl space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-sky-600" />
                  <span className="text-base font-medium text-slate-900">
                    {connectedLead?.company || completeModal.leadCompany || 'Lead'}
                  </span>
                  <span className="font-mono text-xs px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-600 font-medium">
                    {connectedLead?.leadCode || completeModal.leadCode}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500 font-medium">Current Status:</span>
                  <StatusBadge status={connectedLead?.leadStatus || 'Contacted'} />
                </div>
              </div>

              {connectedLead && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t border-slate-200/80 text-xs text-slate-600">
                  <div className="flex items-center gap-1.5 truncate">
                    <UserIcon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{connectedLead.name || 'No contact person'}</span>
                  </div>
                  <div className="flex items-center gap-1.5 truncate">
                    <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{connectedLead.phoneNumber || connectedLead.whatsAppNumber || '—'}</span>
                  </div>
                  <div className="flex items-center gap-1.5 truncate">
                    <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{connectedLead.email || '—'}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Update Lead Status Section */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-slate-800">
                  Update Lead Pipeline Status
                </label>
                <span className="text-xs text-slate-500">Updated immediately without visiting Leads page</span>
              </div>
              <SearchableSelect
                options={leadStatusOptions}
                value={leadStatus}
                onChange={v => setLeadStatus(v as LeadStatus)}
                placeholder="Select new lead status…"
              />

              {/* If status is set to Lost, show reason input */}
              {leadStatus === 'Lost' && (
                <div className="pt-1.5">
                  <label className="block text-xs font-medium text-rose-700 mb-1">Reason for Lost *</label>
                  <input
                    type="text"
                    required
                    value={lostReason}
                    onChange={e => setLostReason(e.target.value)}
                    placeholder="Why was this lead lost? (e.g. competitor pricing, budget cut)..."
                    className="w-full px-3 py-2 border border-rose-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 bg-rose-50/30"
                  />
                </div>
              )}
            </div>

            {/* Outcome & Details */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-800">
                Follow-up Outcome & Discussion
              </label>

              {/* Quick Suggestion Chips */}
              <div className="flex flex-wrap gap-1.5">
                {OUTCOME_SUGGESTIONS.map((suggestion, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setCompleteOutcome(suggestion)}
                    className="text-xs px-2.5 py-1 rounded-md bg-slate-100 hover:bg-sky-50 hover:text-sky-700 hover:border-sky-200 border border-slate-200 text-slate-700 transition-colors"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>

              <input
                type="text"
                value={completeOutcome}
                onChange={e => setCompleteOutcome(e.target.value)}
                placeholder="Summary outcome (e.g. Discussed pricing terms, agreed on 5% discount)..."
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-600 transition-all"
              />

              <textarea
                rows={2}
                value={completeNotes}
                onChange={e => setCompleteNotes(e.target.value)}
                placeholder="Add any additional conversation notes or customer remarks..."
                className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-600 transition-all"
              />
            </div>

            {/* Schedule Next Follow-up Option */}
            <div className="border border-slate-200 rounded-xl p-4 bg-white space-y-3 shadow-2xs">
              <label className="flex items-center gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={scheduleNext}
                  onChange={e => setScheduleNext(e.target.checked)}
                  className="w-4 h-4 text-sky-600 rounded border-slate-300 focus:ring-sky-500 cursor-pointer"
                />
                <span className="text-sm font-medium text-slate-800">
                  Customer demanded another follow-up? (Schedule Next Follow-up)
                </span>
              </label>

              {scheduleNext && (
                <div className="space-y-3.5 pt-2 border-t border-slate-100">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">Next Follow-up Due *</label>
                      <DateTimePicker
                        value={nextDueAt}
                        onChange={v => setNextDueAt(v)}
                      />
                      <div className="flex items-center gap-1.5 mt-1.5">
                        <span className="text-[11px] text-slate-400">Quick date:</span>
                        <button
                          type="button"
                          onClick={() => setNextDaysOffset(1)}
                          className="text-[11px] px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium"
                        >
                          Tomorrow
                        </button>
                        <button
                          type="button"
                          onClick={() => setNextDaysOffset(2)}
                          className="text-[11px] px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium"
                        >
                          +2 Days
                        </button>
                        <button
                          type="button"
                          onClick={() => setNextDaysOffset(7)}
                          className="text-[11px] px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium"
                        >
                          +1 Week
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">Assign Next Touchpoint To</label>
                      <SearchableSelect
                        options={memberOptions}
                        value={nextAssigneeId}
                        onChange={v => setNextAssigneeId(v)}
                        placeholder="Select team member…"
                      />
                    </div>
                  </div>

                  {/* Next Follow-up Channel */}
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Channel for Next Follow-up</label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {(['Call', 'WhatsApp', 'Email', 'Meeting'] as FollowUpType[]).map(typeKey => {
                        const meta = TYPE_CONFIG[typeKey];
                        const Icon = meta.icon;
                        const isSelected = nextType === typeKey;
                        return (
                          <button
                            key={typeKey}
                            type="button"
                            onClick={() => setNextType(typeKey)}
                            className={`flex items-center justify-center gap-2 py-1.5 px-3 rounded-lg border text-xs font-medium transition-all ${
                              isSelected
                                ? `${meta.bg} ${meta.text} border-sky-500 ring-2 ring-sky-500/20 shadow-2xs`
                                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                            }`}
                          >
                            <Icon className="w-3.5 h-3.5" />
                            {meta.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Next Follow-up Agenda</label>
                    <input
                      type="text"
                      value={nextNotes}
                      onChange={e => setNextNotes(e.target.value)}
                      placeholder="e.g. Review updated sample test results..."
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-600"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Complete Modal Footer */}
            <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setCompleteModal(null)}
                className="px-4 py-2 text-sm font-medium text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSavingComplete || (leadStatus === 'Lost' && !lostReason.trim())}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors shadow-xs"
              >
                <Check className="w-4 h-4" />
                {isSavingComplete
                  ? 'Saving…'
                  : scheduleNext
                    ? 'Complete & Schedule Next'
                    : 'Mark as Completed'}
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* Import CSV Modal */}
      <ImportWizard
        entity="follow-ups"
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        onComplete={() => fetchFollowUps(page)}
      />
    </div>
  );
};
