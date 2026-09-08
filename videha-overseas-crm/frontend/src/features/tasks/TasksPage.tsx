import React, { useState, useEffect, useMemo } from 'react';
import {
  Plus,
  Search,
  AlertCircle,
  Clock,
  Trash2,
  LayoutGrid,
  List,
  Check,
  Pencil,
  PhoneCall,
  PhoneOff
} from 'lucide-react';
import { api } from '../../api/client';
import {
  Task,
  User as CrmUser,
  Priority,
  TaskStatus,
  TaskType,
  TaskChannel,
  Lead
} from '../../types/crm';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { PriorityBadge } from '../../components/ui/PriorityBadge';
import { DueBadge } from '../../components/ui/OverdueBadge';
import { Modal } from '../../components/ui/Modal';
import { SearchableSelect } from '../../components/ui/SearchableSelect';
import { DateTimePicker } from '../../components/ui/DateTimePicker';
import { useAuth } from '../../context/AuthContext';
import { refreshNotifications } from '../../lib/notifications';
import { handleConflictWithReload, alertSaveError, isConflictError } from '../../lib/apiErrors';
import { PaginationBar } from '../../components/ui/PaginationBar';
import { createClientRequestId as generateClientRequestId } from '../../lib/clientRequestId';
import { ListStatePanel, ownScopeEmptyCopy } from '../../components/ui/ListStatePanel';

type TasksPageProps = {
  focusTaskId?: string | null;
  onFocusConsumed?: () => void;
};

const TASK_TYPE_OPTIONS: { value: TaskType; label: string }[] = [
  { value: 'follow_up_call', label: 'Follow-up Call' },
  { value: 'email', label: 'Email Follow-up' },
  { value: 'whatsapp', label: 'WhatsApp Follow-up' },
  { value: 'meeting', label: 'Meeting / Video Call' },
  { value: 'sample_dispatch', label: 'Sample Dispatch' },
  { value: 'documentation', label: 'Export Documentation' },
  { value: 'pricing_quote', label: 'Pricing / Quotation' },
  { value: 'logistics', label: 'Logistics / Shipment' },
  { value: 'internal', label: 'Internal Ops' },
  { value: 'other', label: 'Other' }
];

const TASK_CHANNEL_OPTIONS: { value: TaskChannel; label: string }[] = [
  { value: 'phone', label: 'Phone' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'email', label: 'Email' },
  { value: 'video', label: 'Video Call' },
  { value: 'in_person', label: 'In Person' },
  { value: 'none', label: 'Not applicable' }
];

const STATUS_OPTIONS: { value: TaskStatus; label: string }[] = [
  { value: 'Pending', label: 'Pending' },
  { value: 'In Progress', label: 'In Progress' },
  { value: 'Completed', label: 'Completed' },
  { value: 'Cancelled', label: 'Cancelled' }
];

const PRIORITY_OPTIONS: { value: Priority; label: string }[] = [
  { value: 'Low', label: 'Low' },
  { value: 'Medium', label: 'Medium' },
  { value: 'High', label: 'High' },
  { value: 'Urgent', label: 'Urgent' }
];

type TaskForm = {
  taskTitle: string;
  description: string;
  assignedToId: string;
  relatedLeadId: string;
  taskType: TaskType;
  channel: TaskChannel;
  priority: Priority;
  status: TaskStatus;
  dueDate: string;
  pickedUp: boolean | null;
  outcome: string;
  completionNotes: string;
};

const emptyTaskForm = (assigneeId = ''): TaskForm => ({
  taskTitle: '',
  description: '',
  assignedToId: assigneeId,
  relatedLeadId: '',
  taskType: 'follow_up_call',
  channel: 'phone',
  priority: 'Medium',
  status: 'Pending',
  dueDate: new Date(Date.now() + 86400000 * 2).toISOString().slice(0, 16),
  pickedUp: null,
  outcome: '',
  completionNotes: ''
});

function taskToForm(task: Task): TaskForm {
  return {
    taskTitle: task.taskTitle,
    description: task.description || '',
    assignedToId: task.assignedToId,
    relatedLeadId: task.relatedLeadId || '',
    taskType: (task.taskType || task.category || 'follow_up_call') as TaskType,
    channel: (task.channel || 'phone') as TaskChannel,
    priority: task.priority,
    status: task.status,
    dueDate: task.dueDate ? task.dueDate.slice(0, 16) : '',
    pickedUp: task.pickedUp ?? null,
    outcome: task.outcome || '',
    completionNotes: task.completionNotes || ''
  };
}

function taskTypeLabel(type?: TaskType | string) {
  return TASK_TYPE_OPTIONS.find(o => o.value === type)?.label || 'Task';
}

function channelLabel(channel?: TaskChannel | string) {
  return TASK_CHANNEL_OPTIONS.find(o => o.value === channel)?.label || null;
}

function formatOutcome(outcome?: string | null) {
  if (!outcome) return null;
  return outcome.replace(/_/g, ' ');
}

export const TasksPage: React.FC<TasksPageProps> = ({ focusTaskId, onFocusConsumed }) => {
  const { user, hasPermission } = useAuth();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalTasks, setTotalTasks] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [pageLimit] = useState(25);
  const [activeView, setActiveView] = useState<
    'my' | 'all' | 'pending' | 'in_progress' | 'completed' | 'overdue'
  >('my');
  const [search, setSearch] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [memberFilter, setMemberFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [teamMembers, setTeamMembers] = useState<CrmUser[]>([]);
  const [leadOptions, setLeadOptions] = useState<Lead[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createRequestId, setCreateRequestId] = useState(generateClientRequestId);
  const [newTaskForm, setNewTaskForm] = useState<TaskForm>(emptyTaskForm());
  const [isSubmittingCreate, setIsSubmittingCreate] = useState(false);

  const [editTaskId, setEditTaskId] = useState<string | null>(null);
  const [editRevision, setEditRevision] = useState<number | undefined>(undefined);
  const [editForm, setEditForm] = useState<TaskForm | null>(null);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [viewingTask, setViewingTask] = useState<Task | null>(null);
  const [highlightedTaskId, setHighlightedTaskId] = useState<string | null>(null);

  const memberOptions = useMemo(
    () =>
      teamMembers.map(m => ({
        value: m.id,
        label: m.name,
        description: m.roleDisplayName || m.roleName
      })),
    [teamMembers]
  );

  const relatedLeadSelectOptions = useMemo(
    () => [
      { value: '', label: 'No linked lead' },
      ...leadOptions.map(l => ({
        value: l.id,
        label: `${l.leadCode} · ${l.company}`,
        description: l.name
      }))
    ],
    [leadOptions]
  );

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
    api.leads
      .getLeads({ limit: 200, page: 1 })
      .then(res => {
        if (res.success) setLeadOptions(res.items);
      })
      .catch(() => {});
  }, [user]);

  const fetchTasks = async (page = currentPage) => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const res = await api.tasks.getTasks({
        view: activeView,
        search,
        priority: priorityFilter,
        assignedToId: memberFilter,
        page,
        limit: pageLimit
      });
      if (res.success) {
        setTasks(res.data);
        setTotalTasks(res.total);
        setCurrentPage(res.page);
        setTotalPages(res.totalPages);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load tasks';
      setLoadError(message);
      console.error('Failed to fetch tasks:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [activeView, search, priorityFilter, memberFilter]);

  useEffect(() => {
    fetchTasks(currentPage);
  }, [activeView, search, priorityFilter, memberFilter, currentPage]);

  useEffect(() => {
    if (!focusTaskId) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await api.tasks.getTask(focusTaskId);
        if (!cancelled && res.success) {
          setViewingTask(res.data);
          setHighlightedTaskId(res.data.id);
          setTimeout(() => {
            document
              .getElementById(`task-card-${res.data.id}`)
              ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }, 100);
        }
      } catch {
        // ignore
      } finally {
        if (!cancelled) onFocusConsumed?.();
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [focusTaskId]);

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingCreate(true);
    try {
      const res = await api.tasks.createTask({
        taskTitle: newTaskForm.taskTitle,
        description: newTaskForm.description,
        assignedToId: newTaskForm.assignedToId || user?.id,
        relatedLeadId: newTaskForm.relatedLeadId || null,
        taskType: newTaskForm.taskType,
        channel: newTaskForm.channel,
        priority: newTaskForm.priority,
        status: newTaskForm.status,
        dueDate: newTaskForm.dueDate,
        pickedUp: newTaskForm.pickedUp,
        outcome: newTaskForm.outcome,
        completionNotes: newTaskForm.completionNotes,
        clientRequestId: createRequestId
      });
      if (res.success) {
        setIsCreateOpen(false);
        setNewTaskForm(emptyTaskForm(user?.id));
        setCreateRequestId(generateClientRequestId());
        fetchTasks(1);
        refreshNotifications();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to create task');
    } finally {
      setIsSubmittingCreate(false);
    }
  };

  const buildTaskPayload = (form: TaskForm, revision?: number) => ({
    taskTitle: form.taskTitle,
    description: form.description,
    assignedToId: form.assignedToId,
    relatedLeadId: form.relatedLeadId || null,
    taskType: form.taskType,
    channel: form.channel,
    priority: form.priority,
    status: form.status,
    dueDate: form.dueDate,
    pickedUp: form.pickedUp,
    outcome: form.outcome,
    completionNotes: form.completionNotes,
    ...(revision !== undefined ? { revision } : {})
  });

  const openEditTask = (task: Task) => {
    setEditTaskId(task.id);
    setEditRevision(task.revision);
    setEditForm(taskToForm(task));
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTaskId || !editForm) return;
    setIsSavingEdit(true);
    try {
      const res = await api.tasks.updateTask(editTaskId, buildTaskPayload(editForm, editRevision));
      if (res.success) {
        setEditTaskId(null);
        setEditForm(null);
        setEditRevision(undefined);
        fetchTasks(currentPage);
        refreshNotifications();
        if (viewingTask?.id === editTaskId) setViewingTask(res.data);
      }
    } catch (err: unknown) {
      if (editTaskId) {
        await handleConflictWithReload(
          err,
          async () => {
            const refreshed = await api.tasks.getTask(editTaskId);
            if (refreshed.success) {
              openEditTask(refreshed.data);
              if (viewingTask?.id === editTaskId) setViewingTask(refreshed.data);
            }
          },
          'Failed to update task'
        );
      } else {
        alertSaveError(err, 'Failed to update task');
      }
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleStatusChange = async (taskId: string, newStatus: string) => {
    const task = tasks.find(t => t.id === taskId);
    try {
      const res = await api.tasks.updateStatus(taskId, newStatus, task?.revision);
      setTasks(prev =>
        prev.map(t => (t.id === taskId ? { ...res.data, isOverdue: res.data.isOverdue } : t))
      );
      if (viewingTask?.id === taskId) setViewingTask(res.data);
      if (
        activeView === 'completed' ||
        activeView === 'overdue' ||
        activeView === 'pending' ||
        activeView === 'in_progress'
      ) {
        fetchTasks(currentPage);
      }
    } catch (err: unknown) {
      if (isConflictError(err)) {
        await handleConflictWithReload(err, () => fetchTasks(currentPage), 'Failed to update task status');
        return;
      }
      alertSaveError(err, 'Failed to update task status');
    }
  };

  const toggleComplete = (task: Task) => {
    handleStatusChange(task.id, task.status === 'Completed' ? 'Pending' : 'Completed');
  };

  const handleDeleteTask = async (taskId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!confirm('Delete this task?')) return;
    try {
      await api.tasks.deleteTask(taskId);
      setTasks(prev => prev.filter(t => t.id !== taskId));
    } catch (err: any) {
      alert(err.message || 'Failed to delete task');
    }
  };

  const views = [
    { id: 'all', label: 'All' },
    { id: 'my', label: 'My Tasks' },
    { id: 'pending', label: 'Pending' },
    { id: 'in_progress', label: 'In Progress' },
    { id: 'completed', label: 'Completed' },
    { id: 'overdue', label: 'Overdue', alert: true }
  ];

  const renderTaskFormBody = (
    form: TaskForm,
    onChange: (patch: Partial<TaskForm>) => void
  ) => (
    <>
      <div>
        <label className="block font-medium text-slate-700 mb-1">Title *</label>
        <input
          type="text"
          required
          value={form.taskTitle}
          onChange={e => onChange({ taskTitle: e.target.value })}
          placeholder="e.g. Follow up with buyer on sample feedback"
          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-sky-600"
        />
      </div>
      <div>
        <label className="block font-medium text-slate-700 mb-1">Description</label>
        <textarea
          rows={3}
          value={form.description}
          onChange={e => onChange({ description: e.target.value })}
          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-sky-600"
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block font-medium text-slate-700 mb-1">Task type</label>
          <SearchableSelect
            options={TASK_TYPE_OPTIONS}
            value={form.taskType}
            onChange={v => onChange({ taskType: v as TaskType })}
            placeholder="Select type…"
          />
        </div>
        <div>
          <label className="block font-medium text-slate-700 mb-1">Channel</label>
          <SearchableSelect
            options={TASK_CHANNEL_OPTIONS}
            value={form.channel}
            onChange={v => onChange({ channel: v as TaskChannel })}
            placeholder="Select channel…"
          />
        </div>
        <div>
          <label className="block font-medium text-slate-700 mb-1">Assignee *</label>
          <SearchableSelect
            options={memberOptions}
            value={form.assignedToId}
            onChange={v => onChange({ assignedToId: v })}
            placeholder="Select member"
            searchPlaceholder="Search members…"
          />
        </div>
        <div>
          <label className="block font-medium text-slate-700 mb-1">Linked lead</label>
          <SearchableSelect
            options={relatedLeadSelectOptions}
            value={form.relatedLeadId}
            onChange={v => onChange({ relatedLeadId: v })}
            placeholder="No linked lead"
            searchPlaceholder="Search leads…"
            allowClear
          />
        </div>
        <div>
          <label className="block font-medium text-slate-700 mb-1">Due date *</label>
          <DateTimePicker
            includeTime
            value={form.dueDate}
            onChange={v => onChange({ dueDate: v })}
            placeholder="Pick due date & time"
          />
        </div>
        <div>
          <label className="block font-medium text-slate-700 mb-1">Priority</label>
          <SearchableSelect
            options={PRIORITY_OPTIONS}
            value={form.priority}
            onChange={v => onChange({ priority: v as Priority })}
          />
        </div>
        <div>
          <label className="block font-medium text-slate-700 mb-1">Status</label>
          <SearchableSelect
            options={STATUS_OPTIONS}
            value={form.status}
            onChange={v => onChange({ status: v as TaskStatus })}
          />
        </div>
        <div className="sm:col-span-2">
          <label className="block font-medium text-slate-700 mb-1.5">Call picked up?</label>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => onChange({ pickedUp: true, outcome: 'picked_up' })}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium ${
                form.pickedUp === true
                  ? 'bg-emerald-600 text-white border-emerald-600'
                  : 'bg-white text-slate-700 border-slate-200'
              }`}
            >
              <PhoneCall className="w-3.5 h-3.5" />
              Picked up
            </button>
            <button
              type="button"
              onClick={() => onChange({ pickedUp: false, outcome: 'not_picked_up' })}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium ${
                form.pickedUp === false
                  ? 'bg-amber-600 text-white border-amber-600'
                  : 'bg-white text-slate-700 border-slate-200'
              }`}
            >
              <PhoneOff className="w-3.5 h-3.5" />
              Not picked up
            </button>
            <button
              type="button"
              onClick={() => onChange({ pickedUp: null })}
              className={`px-3 py-1.5 rounded-lg border text-xs font-medium ${
                form.pickedUp === null
                  ? 'bg-slate-700 text-white border-slate-700'
                  : 'bg-white text-slate-700 border-slate-200'
              }`}
            >
              N/A
            </button>
          </div>
        </div>
        <div>
          <label className="block font-medium text-slate-700 mb-1">Outcome / result</label>
          <input
            type="text"
            value={form.outcome}
            onChange={e => onChange({ outcome: e.target.value })}
            placeholder="e.g. Sent quotation, requested sample"
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-sky-600"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="block font-medium text-slate-700 mb-1">Completion notes</label>
          <textarea
            rows={2}
            value={form.completionNotes}
            onChange={e => onChange({ completionNotes: e.target.value })}
            placeholder="What was discussed, agreed next steps, blockers…"
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-sky-600"
          />
        </div>
      </div>
    </>
  );

  return (
    <div className="p-6 space-y-5 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-slate-800">Tasks</h3>
          <p className="text-xs text-slate-500">Follow-ups, ops checkpoints, and assignments</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200">
            <button
              type="button"
              onClick={() => setViewMode('cards')}
              className={`p-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 ${
                viewMode === 'cards' ? 'bg-white text-sky-700 shadow-2xs' : 'text-slate-600'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              Cards
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 ${
                viewMode === 'table' ? 'bg-white text-sky-700 shadow-2xs' : 'text-slate-600'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              Table
            </button>
          </div>
          {hasPermission('tasks.create') && (
            <button
              type="button"
              onClick={() => {
                setNewTaskForm(emptyTaskForm(user?.id));
                setCreateRequestId(generateClientRequestId());
                setIsCreateOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-medium"
            >
              <Plus className="w-4 h-4" />
              Create Task
            </button>
          )}
        </div>
      </div>

      <div className="flex border-b border-slate-200 overflow-x-auto">
        {views.map(v => (
          <button
            key={v.id}
            type="button"
            onClick={() => setActiveView(v.id as any)}
            className={`px-4 py-2.5 text-xs font-medium border-b-2 whitespace-nowrap flex items-center gap-1.5 ${
              activeView === v.id
                ? v.alert
                  ? 'border-rose-600 text-rose-700'
                  : 'border-sky-600 text-sky-700'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            {v.alert && <AlertCircle className="w-3.5 h-3.5" />}
            {v.label}
          </button>
        ))}
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search tasks…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-sky-600"
            />
          </div>
          <SearchableSelect
            options={[
              { value: 'all', label: 'All Priorities' },
              { value: 'Urgent', label: 'Urgent' },
              { value: 'High', label: 'High' },
              { value: 'Medium', label: 'Medium' },
              { value: 'Low', label: 'Low' }
            ]}
            value={priorityFilter}
            onChange={setPriorityFilter}
            placeholder="Priority"
          />
          <SearchableSelect
            options={[{ value: 'all', label: 'All Assignees' }, ...memberOptions]}
            value={memberFilter}
            onChange={setMemberFilter}
            placeholder="Assignee"
            searchPlaceholder="Search members…"
          />
        </div>
      </div>

      {viewMode === 'cards' ? (
        <div>
          <ListStatePanel
            isLoading={isLoading}
            error={loadError}
            isEmpty={!loadError && tasks.length === 0}
            loadingLabel="Loading tasks…"
            emptyTitle={
              activeView === 'my' || user?.roleName === 'SALES_MEMBER'
                ? ownScopeEmptyCopy('tasks').title
                : 'No tasks found'
            }
            emptyDescription={
              activeView === 'my' || user?.roleName === 'SALES_MEMBER'
                ? ownScopeEmptyCopy('tasks').description
                : undefined
            }
          />
          {!isLoading && !loadError && tasks.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {tasks.map(task => {
                const isDone = task.status === 'Completed' || task.status === 'Cancelled';
                const channel = channelLabel(task.channel);
                const outcomeText = formatOutcome(task.outcome);
                return (
                  <div
                    id={`task-card-${task.id}`}
                    key={task.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => setViewingTask(task)}
                    onKeyDown={e => e.key === 'Enter' && setViewingTask(task)}
                    className={`group rounded-xl border bg-white p-4 transition-all cursor-pointer ${
                      highlightedTaskId === task.id
                        ? 'border-sky-400 ring-2 ring-sky-200 shadow-sm'
                        : isDone
                          ? 'border-slate-100 bg-slate-50/50'
                          : 'border-slate-200 hover:border-sky-200 hover:shadow-sm'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <button
                        type="button"
                        onClick={e => {
                          e.stopPropagation();
                          toggleComplete(task);
                        }}
                        title={task.status === 'Completed' ? 'Mark pending' : 'Mark completed'}
                        className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                          task.status === 'Completed'
                            ? 'bg-emerald-500 border-emerald-500 text-white'
                            : 'border-slate-300 hover:border-sky-500 text-transparent hover:text-sky-500'
                        }`}
                      >
                        <Check className="w-3 h-3" strokeWidth={3} />
                      </button>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-[10px] font-mono text-slate-400 mb-0.5">{task.taskCode}</p>
                            <div className="flex flex-wrap items-center gap-1.5 mb-1">
                              <span className="inline-flex text-[10px] font-medium uppercase tracking-wide text-sky-700 bg-sky-50 px-1.5 py-0.5 rounded border border-sky-100">
                                {taskTypeLabel(task.taskType || task.category)}
                          </span>
                              {channel && (
                                <span className="inline-flex text-[10px] font-medium text-slate-600 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100">
                                  {channel}
                            </span>
                          )}
                        </div>
                            <h4
                              className={`text-sm font-semibold leading-snug ${
                                isDone ? 'line-through text-slate-400' : 'text-slate-800'
                            }`}
                          >
                            {task.taskTitle}
                          </h4>
                        </div>
                          <PriorityBadge priority={task.priority} />
                      </div>

                        {task.description ? (
                          <p className="text-xs text-slate-500 mt-1.5 line-clamp-2">{task.description}</p>
                        ) : null}

                        <div className="mt-2 flex flex-wrap items-center gap-1.5">
                          {task.relatedLeadName && (
                            <span
                              className="inline-flex max-w-full text-[10px] text-slate-600 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100 truncate"
                              title={task.relatedLeadName}
                            >
                              Lead: {task.relatedLeadName}
                            </span>
                          )}
                          {task.pickedUp !== null && task.pickedUp !== undefined && (
                            <span
                              className={`inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded border ${
                                task.pickedUp
                                  ? 'text-emerald-700 bg-emerald-50 border-emerald-100'
                                  : 'text-amber-700 bg-amber-50 border-amber-100'
                              }`}
                            >
                              {task.pickedUp ? (
                                <PhoneCall className="w-3 h-3" />
                              ) : (
                                <PhoneOff className="w-3 h-3" />
                              )}
                              {task.pickedUp ? 'Picked up' : 'Not picked up'}
                            </span>
                          )}
                          {outcomeText && (
                            <span
                              className="inline-flex max-w-full text-[10px] text-violet-700 bg-violet-50 px-1.5 py-0.5 rounded border border-violet-100 truncate"
                              title={outcomeText}
                            >
                              {outcomeText}
                          </span>
                        )}
                      </div>

                        {task.completionNotes ? (
                          <p className="text-[11px] text-slate-500 mt-2 line-clamp-2 italic">
                            {task.completionNotes}
                          </p>
                        ) : null}

                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          <DueBadge
                            dueDate={task.dueDate}
                            status={task.status}
                            isOverdue={task.isOverdue}
                            overdueDays={task.overdueDays}
                          />
                          <StatusBadge status={task.status} />
                        </div>

                        <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="w-6 h-6 rounded-full bg-sky-600 text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                              {(task.assignedToName || '?').slice(0, 1).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className="text-[11px] text-slate-700 truncate">
                                {task.assignedToName || 'Unassigned'}
                              </p>
                              <p className="text-[10px] text-slate-400 flex items-center gap-1">
                                <Clock className="w-3 h-3 shrink-0" />
                                {new Date(task.dueDate).toLocaleString([], {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                              </p>
                      </div>
                    </div>

                          <div
                            className="flex items-center gap-0.5 opacity-70 group-hover:opacity-100"
                            onClick={e => e.stopPropagation()}
                          >
                            {hasPermission('tasks.edit') && (
                          <button
                                type="button"
                                onClick={() => openEditTask(task)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-sky-700 hover:bg-sky-50"
                                title="Edit task"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                          </button>
                        )}
                            {hasPermission('tasks.edit') && (
                          <button
                                type="button"
                            onClick={e => handleDeleteTask(task.id, e)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                                title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : null}
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-600 font-semibold">
                  <th className="py-3 px-4 w-12" />
                  <th className="py-3 px-4">Task</th>
                  <th className="py-3 px-4">Assignee</th>
                  <th className="py-3 px-4">Priority</th>
                  <th className="py-3 px-4">Due</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400 animate-pulse">
                      Loading tasks…
                    </td>
                  </tr>
                ) : loadError ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-rose-600 text-xs">
                      {loadError}
                    </td>
                  </tr>
                ) : tasks.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-500 text-xs">
                      {activeView === 'my' || user?.roleName === 'SALES_MEMBER'
                        ? ownScopeEmptyCopy('tasks').title
                        : 'No tasks found.'}
                    </td>
                  </tr>
                ) : (
                  tasks.map(task => (
                    <tr key={task.id} className="hover:bg-slate-50/70">
                      <td className="py-3 px-4">
                        <button
                          type="button"
                          onClick={() => toggleComplete(task)}
                          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                            task.status === 'Completed'
                              ? 'bg-emerald-500 border-emerald-500 text-white'
                              : 'border-slate-300'
                          }`}
                        >
                          <Check className="w-3 h-3" strokeWidth={3} />
                        </button>
                      </td>
                      <td className="py-3 px-4">
                        <p
                          className={`font-semibold ${
                            task.status === 'Completed' ? 'line-through text-slate-400' : 'text-slate-800'
                            }`}
                          >
                            {task.taskTitle}
                          </p>
                        <p className="text-[10px] font-mono text-slate-400">{task.taskCode}</p>
                      </td>
                      <td className="py-3 px-4 text-slate-700">{task.assignedToName || '—'}</td>
                      <td className="py-3 px-4">
                        <PriorityBadge priority={task.priority} />
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex flex-col gap-1">
                          <span>{new Date(task.dueDate).toLocaleDateString()}</span>
                          <DueBadge
                            dueDate={task.dueDate}
                            status={task.status}
                            isOverdue={task.isOverdue}
                            overdueDays={task.overdueDays}
                          />
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="inline-flex items-center gap-1">
                          {hasPermission('tasks.edit') && (
                          <button
                              type="button"
                              onClick={() => openEditTask(task)}
                              className="p-1 rounded text-slate-500 hover:text-sky-700"
                              title="Edit"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
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
      )}

      <PaginationBar
        page={currentPage}
        totalPages={totalPages}
        total={totalTasks}
        isLoading={isLoading}
        onPageChange={page => setCurrentPage(page)}
        label="tasks"
      />

      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Create Task"
        subtitle="Assign a follow-up or operations action"
        maxWidth="lg"
      >
        <form
          onSubmit={handleCreateTask}
          className="space-y-4 text-xs"
        >
          {renderTaskFormBody(newTaskForm, patch =>
            setNewTaskForm(prev => ({ ...prev, ...patch }))
          )}
          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsCreateOpen(false)}
              className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmittingCreate || !newTaskForm.assignedToId}
              className="px-4 py-2 rounded-lg bg-sky-600 text-white font-medium disabled:opacity-50"
            >
              {isSubmittingCreate ? 'Creating…' : 'Create Task'}
            </button>
            </div>
        </form>
      </Modal>

      <Modal
        isOpen={!!editTaskId && !!editForm}
        onClose={() => {
          setEditTaskId(null);
          setEditForm(null);
        }}
        title="Edit Task"
        subtitle={editForm?.taskTitle || ''}
        maxWidth="lg"
      >
        {editForm && (
          <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
            {renderTaskFormBody(editForm, patch =>
              setEditForm(prev => (prev ? { ...prev, ...patch } : prev))
            )}
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
                onClick={() => {
                  setEditTaskId(null);
                  setEditForm(null);
                }}
                className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600"
            >
              Cancel
            </button>
            <button
              type="submit"
                disabled={isSavingEdit || !editForm.assignedToId}
                className="px-4 py-2 rounded-lg bg-sky-600 text-white font-medium disabled:opacity-50"
            >
                {isSavingEdit ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        </form>
        )}
      </Modal>

      <Modal
        isOpen={!!viewingTask}
        onClose={() => {
          setViewingTask(null);
          setHighlightedTaskId(null);
        }}
        title={viewingTask ? `${viewingTask.taskCode} · ${viewingTask.taskTitle}` : 'Task Details'}
        subtitle={viewingTask ? taskTypeLabel(viewingTask.taskType || viewingTask.category) : ''}
        maxWidth="lg"
      >
        {viewingTask && (
        <div className="space-y-4 text-xs">
            {viewingTask.description ? (
              <p className="text-slate-600 leading-relaxed">{viewingTask.description}</p>
            ) : null}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="rounded-lg border border-slate-100 bg-slate-50/80 p-3">
                <p className="text-[10px] uppercase tracking-wider text-slate-400">Status</p>
                <div className="mt-1">
                  <StatusBadge status={viewingTask.status} />
                </div>
              </div>
              <div className="rounded-lg border border-slate-100 bg-slate-50/80 p-3">
                <p className="text-[10px] uppercase tracking-wider text-slate-400">Priority</p>
                <div className="mt-1">
                  <PriorityBadge priority={viewingTask.priority} />
                </div>
              </div>
              <div className="rounded-lg border border-slate-100 bg-slate-50/80 p-3">
                <p className="text-[10px] uppercase tracking-wider text-slate-400">Assignee</p>
                <p className="mt-1 font-medium text-slate-800">
                  {viewingTask.assignedToName || 'Unassigned'}
                </p>
              </div>
              <div className="rounded-lg border border-slate-100 bg-slate-50/80 p-3">
                <p className="text-[10px] uppercase tracking-wider text-slate-400">Due</p>
                <div className="mt-1">
                  <DueBadge
                    dueDate={viewingTask.dueDate}
                    status={viewingTask.status}
                    isOverdue={viewingTask.isOverdue}
                    overdueDays={viewingTask.overdueDays}
                  />
                </div>
              </div>
              <div className="rounded-lg border border-slate-100 bg-slate-50/80 p-3">
                <p className="text-[10px] uppercase tracking-wider text-slate-400">Channel</p>
                <p className="mt-1 font-medium text-slate-800 capitalize">
                  {viewingTask.channel?.replace('_', ' ') || '—'}
                </p>
              </div>
              <div className="rounded-lg border border-slate-100 bg-slate-50/80 p-3">
                <p className="text-[10px] uppercase tracking-wider text-slate-400">Linked lead</p>
                <p className="mt-1 font-medium text-slate-800 truncate">
                  {viewingTask.relatedLeadName || 'None'}
                </p>
              </div>
            </div>
            {(viewingTask.pickedUp !== null && viewingTask.pickedUp !== undefined) ||
            viewingTask.outcome ||
            viewingTask.completionNotes ? (
              <div className="rounded-xl border border-sky-100 bg-sky-50/40 p-4 space-y-2">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                  Call / outcome details
                </p>
                {viewingTask.pickedUp !== null && viewingTask.pickedUp !== undefined && (
                  <span
                    className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded border ${
                      viewingTask.pickedUp
                        ? 'text-emerald-700 bg-emerald-50 border-emerald-100'
                        : 'text-amber-700 bg-amber-50 border-amber-100'
                    }`}
                  >
                    {viewingTask.pickedUp ? (
                      <PhoneCall className="w-3.5 h-3.5" />
                    ) : (
                      <PhoneOff className="w-3.5 h-3.5" />
                    )}
                    {viewingTask.pickedUp ? 'Call picked up' : 'Call not picked up'}
                  </span>
                )}
                {viewingTask.outcome ? (
                  <p className="text-slate-700">
                    <span className="font-medium">Outcome:</span> {viewingTask.outcome}
                  </p>
                ) : null}
                {viewingTask.completionNotes ? (
                  <p className="text-slate-600 leading-relaxed">{viewingTask.completionNotes}</p>
                ) : null}
          </div>
            ) : null}
            <div className="flex justify-end gap-2 pt-1">
              {hasPermission('tasks.edit') && (
            <button
              type="button"
                  onClick={() => {
                    openEditTask(viewingTask);
                    setViewingTask(null);
                  }}
                  className="px-4 py-2 rounded-lg border border-slate-200 text-slate-700 font-medium"
                >
                  Edit
            </button>
              )}
            <button
              type="button"
                onClick={() => {
                  setViewingTask(null);
                  setHighlightedTaskId(null);
                }}
                className="px-4 py-2 rounded-lg bg-sky-600 text-white font-medium"
              >
                Close
            </button>
          </div>
        </div>
        )}
      </Modal>
    </div>
  );
};
