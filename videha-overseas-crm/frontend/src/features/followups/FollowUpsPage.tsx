import React, { useEffect, useMemo, useState } from 'react';
import {
  Plus,
  Search,
  Check,
  SkipForward,
  Pencil,
  Trash2,
  Calendar,
  Clock,
  AlertTriangle,
  Download,
  Upload
} from 'lucide-react';
import { api } from '../../api/client';
import { FollowUp, FollowUpStatus, FollowUpType, Lead, User as CrmUser } from '../../types/crm';
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

const TYPE_OPTIONS: { value: FollowUpType; label: string }[] = [
  { value: 'Call', label: 'Call' },
  { value: 'Email', label: 'Email' },
  { value: 'WhatsApp', label: 'WhatsApp' },
  { value: 'Meeting', label: 'Meeting' }
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
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editing, setEditing] = useState<FollowUp | null>(null);
  const [form, setForm] = useState<FollowUpForm>(emptyForm(user?.id));
  const [createRequestId, setCreateRequestId] = useState(generateClientRequestId);
  const [isSaving, setIsSaving] = useState(false);
  const [completeModal, setCompleteModal] = useState<FollowUp | null>(null);
  const [completeNotes, setCompleteNotes] = useState('');
  const [completeOutcome, setCompleteOutcome] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);

  const memberOptions = useMemo(
    () => teamMembers.map(m => ({ value: m.id, label: m.name })),
    [teamMembers]
  );
  const leadOptions = useMemo(
    () => leads.map(l => ({ value: l.id, label: `${l.leadCode} — ${l.company}` })),
    [leads]
  );

  const fetchFollowUps = async (pageNum = page) => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const res = await api.followUps.getFollowUps({
        schedule: schedule === 'all' ? undefined : schedule,
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
  }, [schedule, search]);

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

  const handleComplete = async () => {
    if (!completeModal) return;
    try {
      await api.followUps.completeFollowUp(completeModal.id, {
        outcome: completeOutcome,
        notes: completeNotes,
        revision: completeModal.revision
      });
      setCompleteModal(null);
      setCompleteNotes('');
      setCompleteOutcome('');
      fetchFollowUps(page);
      refreshNotifications();
    } catch (err: unknown) {
      await handleConflictWithReload(err, () => fetchFollowUps(page), 'Failed to complete follow-up');
    }
  };

  const handleSkip = async (item: FollowUp) => {
    if (!window.confirm('Skip this follow-up?')) return;
    try {
      await api.followUps.skipFollowUp(item.id, { revision: item.revision });
      fetchFollowUps(page);
      refreshNotifications();
    } catch (err: unknown) {
      await handleConflictWithReload(err, () => fetchFollowUps(page), 'Failed to skip follow-up');
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
        search: search.trim() || undefined
      });
    } catch (err: unknown) {
      alertSaveError(err, 'Failed to export follow-ups');
    } finally {
      setIsExporting(false);
    }
  };

  const scheduleTabs: { id: ScheduleTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'today', label: 'Today', icon: Calendar },
    { id: 'upcoming', label: 'Upcoming', icon: Clock },
    { id: 'overdue', label: 'Overdue', icon: AlertTriangle },
    { id: 'all', label: 'All', icon: Search }
  ];

  return (
    <div className="p-6 space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-slate-800">Follow-ups</h2>
          <p className="text-xs text-slate-500 mt-0.5">Scheduled lead touchpoints — today, upcoming, and overdue</p>
        </div>
        <div className="flex items-center gap-2">
          {hasPermission('followups.create') && (
            <button
              type="button"
              onClick={() => setIsImportOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-sky-50 text-sky-800 hover:bg-sky-100 border border-sky-200/80 rounded-lg text-xs font-medium transition-colors"
            >
              <Upload className="w-3.5 h-3.5 text-sky-600" />
              Import CSV
            </button>
          )}
          {hasPermission('followups.view') && (
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
          {hasPermission('followups.create') && (
            <button
              onClick={openCreate}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-sky-600 text-white text-xs font-medium rounded-lg hover:bg-sky-700"
            >
              <Plus className="w-3.5 h-3.5" />
              Schedule Follow-up
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {scheduleTabs.map(tab => {
          const Icon = tab.icon;
          const active = schedule === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setSchedule(tab.id)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border ${
                active
                  ? 'bg-sky-50 text-sky-800 border-sky-200'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
        <input
          type="text"
          placeholder="Search by lead code or company…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-sky-600"
        />
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <ListStatePanel
          isLoading={isLoading}
          error={loadError}
          isEmpty={!loadError && followUps.length === 0}
          loadingLabel="Loading follow-ups…"
          emptyTitle={
            user?.roleName === 'SALES_MEMBER' && schedule === 'all' && !search.trim()
              ? ownScopeEmptyCopy('follow-ups').title
              : 'No follow-ups in this view'
          }
          emptyDescription={
            user?.roleName === 'SALES_MEMBER' && schedule === 'all' && !search.trim()
              ? ownScopeEmptyCopy('follow-ups').description
              : schedule !== 'all'
                ? 'Try the All tab, or schedule a follow-up on one of your leads.'
                : undefined
          }
          className="p-8 text-center text-xs text-slate-500"
        />
        {!isLoading && !loadError && followUps.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500">
                <tr>
                  <th className="text-left px-4 py-2.5 font-medium">Lead</th>
                  <th className="text-left px-4 py-2.5 font-medium">Type</th>
                  <th className="text-left px-4 py-2.5 font-medium">Due</th>
                  <th className="text-left px-4 py-2.5 font-medium">Assignee</th>
                  <th className="text-left px-4 py-2.5 font-medium">Status</th>
                  <th className="text-right px-4 py-2.5 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {followUps.map(item => (
                  <tr key={item.id} className="hover:bg-slate-50/60">
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-800">{item.leadCompany || '—'}</div>
                      <div className="text-[10px] text-slate-500">{item.leadCode}</div>
                    </td>
                    <td className="px-4 py-3">{item.type}</td>
                    <td className="px-4 py-3">{new Date(item.dueAt).toLocaleString()}</td>
                    <td className="px-4 py-3">{item.assignedToName || '—'}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={item.status as FollowUpStatus} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        {item.status === 'Pending' && hasPermission('followups.edit') && (
                          <>
                            <button
                              onClick={() => {
                                setCompleteModal(item);
                                setCompleteNotes('');
                                setCompleteOutcome('');
                              }}
                              title="Complete"
                              className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleSkip(item)}
                              title="Skip"
                              className="p-1.5 text-amber-600 hover:bg-amber-50 rounded"
                            >
                              <SkipForward className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                        {hasPermission('followups.edit') && item.status === 'Pending' && (
                          <button
                            onClick={() => openEdit(item)}
                            className="p-1.5 text-sky-600 hover:bg-sky-50 rounded"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {hasPermission('followups.edit') && (
                          <button
                            onClick={() => handleDelete(item)}
                            className="p-1.5 text-rose-600 hover:bg-rose-50 rounded"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
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

      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={editing ? 'Edit Follow-up' : 'Schedule Follow-up'}
      >
        <form onSubmit={handleSave} className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Lead *</label>
            <SearchableSelect
              options={leadOptions}
              value={form.leadId}
              onChange={v => setForm({ ...form, leadId: v })}
              placeholder="Select lead…"
              searchPlaceholder="Search leads…"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Assignee *</label>
            <SearchableSelect
              options={memberOptions}
              value={form.assignedToId}
              onChange={v => setForm({ ...form, assignedToId: v })}
              placeholder="Select member…"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Due date *</label>
            <DateTimePicker
              value={form.dueAt}
              onChange={v => setForm({ ...form, dueAt: v })}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Type</label>
            <SearchableSelect
              options={TYPE_OPTIONS}
              value={form.type}
              onChange={v => setForm({ ...form, type: v as FollowUpType })}
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
            <button
              type="button"
              onClick={() => setIsFormOpen(false)}
              className="px-3 py-2 text-xs border border-slate-200 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-3 py-2 text-xs bg-sky-600 text-white rounded-lg disabled:opacity-50"
            >
              {isSaving ? 'Saving…' : editing ? 'Save Changes' : 'Schedule'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={!!completeModal}
        onClose={() => setCompleteModal(null)}
        title="Complete Follow-up"
      >
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Outcome</label>
            <input
              type="text"
              value={completeOutcome}
              onChange={e => setCompleteOutcome(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
              placeholder="e.g. Discussed pricing, sent samples"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Add any relevant details or next steps...</label>
            <textarea
              rows={2}
              value={completeNotes}
              onChange={e => setCompleteNotes(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setCompleteModal(null)}
              className="px-3 py-2 text-xs border border-slate-200 rounded-lg"
            >
              Cancel
            </button>
            <button
              onClick={handleComplete}
              className="px-3 py-2 text-xs bg-emerald-600 text-white rounded-lg"
            >
              Mark Complete
            </button>
          </div>
        </div>
      </Modal>

      <ImportWizard
        entity="follow-ups"
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        onComplete={() => fetchFollowUps(page)}
      />
    </div>
  );
};
