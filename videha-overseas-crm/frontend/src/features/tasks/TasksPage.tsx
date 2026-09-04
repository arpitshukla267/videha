import React, { useState, useEffect, useMemo } from 'react';
import {
  Plus,
  Search,
  AlertCircle,
  Clock,
  Trash2,
  UserCheck,
  LayoutGrid,
  List,
  Check
} from 'lucide-react';
import { api } from '../../api/client';
import { Task, User as CrmUser, Priority, TaskStatus } from '../../types/crm';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { PriorityBadge } from '../../components/ui/PriorityBadge';
import { DueBadge } from '../../components/ui/OverdueBadge';
import { Modal } from '../../components/ui/Modal';
import { SearchableSelect } from '../../components/ui/SearchableSelect';
import { DateTimePicker } from '../../components/ui/DateTimePicker';
import { useAuth } from '../../context/AuthContext';
import { refreshNotifications } from '../../lib/notifications';

type TasksPageProps = {
  focusTaskId?: string | null;
  onFocusConsumed?: () => void;
};

export const TasksPage: React.FC<TasksPageProps> = ({ focusTaskId, onFocusConsumed }) => {
  const { user, hasPermission } = useAuth();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeView, setActiveView] = useState<
    'my' | 'all' | 'pending' | 'in_progress' | 'completed' | 'overdue'
  >('all');
  const [search, setSearch] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [memberFilter, setMemberFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [teamMembers, setTeamMembers] = useState<CrmUser[]>([]);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newTaskForm, setNewTaskForm] = useState({
    taskTitle: '',
    description: '',
    assignedToId: '',
    priority: 'Medium' as Priority,
    status: 'Pending' as TaskStatus,
    dueDate: new Date(Date.now() + 86400000 * 2).toISOString().slice(0, 16)
  });
  const [isSubmittingCreate, setIsSubmittingCreate] = useState(false);

  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [viewingTask, setViewingTask] = useState<Task | null>(null);
  const [highlightedTaskId, setHighlightedTaskId] = useState<string | null>(null);
  const [reassignMemberId, setReassignMemberId] = useState('');

  const memberOptions = useMemo(
    () =>
      teamMembers.map(m => ({
        value: m.id,
        label: m.name,
        description: m.roleDisplayName || m.roleName
      })),
    [teamMembers]
  );

  useEffect(() => {
    api.users
      .getUsers()
      .then(res => {
        if (res.success) setTeamMembers(res.data);
      })
      .catch(() => {});
  }, []);

  const fetchTasks = async () => {
    setIsLoading(true);
    try {
      const res = await api.tasks.getTasks({
        view: activeView,
        search,
        priority: priorityFilter,
        assignedToId: memberFilter
      });
      if (res.success) setTasks(res.data);
    } catch (err) {
      console.error('Failed to fetch tasks:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [activeView, search, priorityFilter, memberFilter]);

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
        ...newTaskForm,
        assignedToId: newTaskForm.assignedToId || user?.id
      });
      if (res.success) {
        setIsCreateOpen(false);
        setNewTaskForm({
          taskTitle: '',
          description: '',
          assignedToId: '',
          priority: 'Medium',
          status: 'Pending',
          dueDate: new Date(Date.now() + 86400000 * 2).toISOString().slice(0, 16)
        });
        fetchTasks();
        refreshNotifications();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to create task');
    } finally {
      setIsSubmittingCreate(false);
    }
  };

  const handleStatusChange = async (taskId: string, newStatus: string) => {
    try {
      await api.tasks.updateStatus(taskId, newStatus);
      setTasks(prev => {
        const next = prev.map(t =>
          t.id === taskId
            ? {
                ...t,
                status: newStatus as TaskStatus,
                completedDate: newStatus === 'Completed' ? new Date().toISOString() : null,
                isOverdue:
                  newStatus === 'Completed' || newStatus === 'Cancelled' ? false : t.isOverdue
              }
            : t
        );
        if (activeView === 'completed') return next;
        return [...next].sort((a, b) => {
          const aDone = a.status === 'Completed' || a.status === 'Cancelled' ? 1 : 0;
          const bDone = b.status === 'Completed' || b.status === 'Cancelled' ? 1 : 0;
          return aDone - bDone;
        });
      });
      if (
        activeView === 'completed' ||
        activeView === 'overdue' ||
        activeView === 'pending' ||
        activeView === 'in_progress'
      ) {
        fetchTasks();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to update task status');
    }
  };

  const toggleComplete = (task: Task) => {
    handleStatusChange(task.id, task.status === 'Completed' ? 'Pending' : 'Completed');
  };

  const handleReassign = async () => {
    if (!editingTask || !reassignMemberId) return;
    try {
      await api.tasks.assignTask(editingTask.id, reassignMemberId);
      setEditingTask(null);
      fetchTasks();
      refreshNotifications();
    } catch (err: any) {
      alert(err.message || 'Failed to reassign task');
    }
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
              onClick={() => setIsCreateOpen(true)}
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
          {isLoading ? (
            <div className="py-16 text-center text-slate-400 bg-white border border-slate-200 rounded-xl">
              Loading tasks…
            </div>
          ) : tasks.length === 0 ? (
            <div className="py-16 text-center text-slate-400 bg-white border border-slate-200 rounded-xl">
              No tasks found.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {tasks.map(task => {
                const isDone = task.status === 'Completed';
                return (
                  <div
                    id={`task-card-${task.id}`}
                    key={task.id}
                    className={`group rounded-xl border bg-white p-4 transition-all ${
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
                        onClick={() => toggleComplete(task)}
                        title={isDone ? 'Mark pending' : 'Mark completed'}
                        className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                          isDone
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
                                <Clock className="w-3 h-3" />
                                {new Date(task.dueDate).toLocaleString([], {
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-0.5 opacity-70 group-hover:opacity-100">
                            {!isDone && (
                              <button
                                type="button"
                                onClick={() =>
                                  handleStatusChange(
                                    task.id,
                                    task.status === 'In Progress' ? 'Pending' : 'In Progress'
                                  )
                                }
                                className="px-2 py-1 text-[10px] font-semibold rounded-md text-sky-700 hover:bg-sky-50"
                              >
                                {task.status === 'In Progress' ? 'Pause' : 'Start'}
                              </button>
                            )}
                            {hasPermission('tasks.assign') && (
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingTask(task);
                                  setReassignMemberId(task.assignedToId);
                                }}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-sky-700 hover:bg-sky-50"
                                title="Reassign"
                              >
                                <UserCheck className="w-3.5 h-3.5" />
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
          )}
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
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      Loading…
                    </td>
                  </tr>
                ) : tasks.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      No tasks found.
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
                        {hasPermission('tasks.assign') && (
                          <button
                            type="button"
                            onClick={() => {
                              setEditingTask(task);
                              setReassignMemberId(task.assignedToId);
                            }}
                            className="p-1 rounded text-slate-500 hover:text-sky-700"
                          >
                            <UserCheck className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Create Task"
        subtitle="Assign a follow-up or operations action"
        maxWidth="lg"
      >
        <form onSubmit={handleCreateTask} className="space-y-4 text-xs">
          <div>
            <label className="block font-medium text-slate-700 mb-1">Title *</label>
            <input
              type="text"
              required
              value={newTaskForm.taskTitle}
              onChange={e => setNewTaskForm({ ...newTaskForm, taskTitle: e.target.value })}
              placeholder="e.g. Follow up with buyer on sample feedback"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-sky-600"
            />
          </div>
          <div>
            <label className="block font-medium text-slate-700 mb-1">Description</label>
            <textarea
              rows={3}
              value={newTaskForm.description}
              onChange={e => setNewTaskForm({ ...newTaskForm, description: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-sky-600"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Assignee *</label>
              <SearchableSelect
                options={memberOptions}
                value={newTaskForm.assignedToId}
                onChange={v => setNewTaskForm({ ...newTaskForm, assignedToId: v })}
                placeholder="Select member"
                searchPlaceholder="Search members…"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1">Due date *</label>
              <DateTimePicker
                includeTime
                value={newTaskForm.dueDate}
                onChange={v => setNewTaskForm({ ...newTaskForm, dueDate: v })}
                placeholder="Pick due date & time"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1">Priority</label>
              <SearchableSelect
                options={[
                  { value: 'Low', label: 'Low' },
                  { value: 'Medium', label: 'Medium' },
                  { value: 'High', label: 'High' },
                  { value: 'Urgent', label: 'Urgent' }
                ]}
                value={newTaskForm.priority}
                onChange={v => setNewTaskForm({ ...newTaskForm, priority: v as Priority })}
              />
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1">Status</label>
              <SearchableSelect
                options={[
                  { value: 'Pending', label: 'Pending' },
                  { value: 'In Progress', label: 'In Progress' },
                  { value: 'Completed', label: 'Completed' }
                ]}
                value={newTaskForm.status}
                onChange={v => setNewTaskForm({ ...newTaskForm, status: v as TaskStatus })}
              />
            </div>
          </div>
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
        isOpen={!!editingTask}
        onClose={() => setEditingTask(null)}
        title="Reassign Task"
        maxWidth="sm"
      >
        {editingTask && (
          <div className="space-y-4 text-xs">
            <p className="text-slate-600">{editingTask.taskTitle}</p>
            <SearchableSelect
              options={memberOptions}
              value={reassignMemberId}
              onChange={setReassignMemberId}
              placeholder="Select member"
              searchPlaceholder="Search members…"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditingTask(null)}
                className="px-4 py-2 rounded-lg border border-slate-200"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleReassign}
                className="px-4 py-2 rounded-lg bg-sky-600 text-white font-medium"
              >
                Save
              </button>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={!!viewingTask}
        onClose={() => {
          setViewingTask(null);
          setHighlightedTaskId(null);
        }}
        title="Task Details"
        subtitle={viewingTask?.taskCode}
        maxWidth="md"
      >
        {viewingTask && (
          <div className="space-y-4 text-xs">
            <div>
              <h4 className="text-sm font-semibold text-slate-800">{viewingTask.taskTitle}</h4>
              {viewingTask.description ? (
                <p className="text-slate-600 mt-1.5 leading-relaxed">{viewingTask.description}</p>
              ) : null}
            </div>
            <div className="grid grid-cols-2 gap-3">
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
            </div>
            <div className="flex justify-end pt-1">
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
