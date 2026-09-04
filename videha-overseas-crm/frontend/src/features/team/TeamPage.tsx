import React, { useState, useEffect } from 'react';
import {
  Plus,
  Phone,
  Shield,
  AlertTriangle,
  Edit2,
  Power,
  LayoutGrid,
  List,
  MapPin
} from 'lucide-react';
import { api } from '../../api/client';
import { User, Role, Department } from '../../types/crm';
import { Modal } from '../../components/ui/Modal';
import { SearchableSelect } from '../../components/ui/SearchableSelect';
import { useAuth } from '../../context/AuthContext';

const emptyMemberForm = {
  name: '',
  email: '',
  password: '',
  roleId: '',
  phone: '',
  departmentId: '',
  designation: ''
};

export const TeamPage: React.FC = () => {
  const { hasPermission } = useAuth();

  const [members, setMembers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // View Mode: Cards (default) or Table
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');

  // Add Member Modal
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newMemberForm, setNewMemberForm] = useState(emptyMemberForm);
  const [isSubmittingCreate, setIsSubmittingCreate] = useState(false);

  // Edit Member Modal
  const [editingMember, setEditingMember] = useState<User | null>(null);
  const [editForm, setEditForm] = useState({
    name: '',
    roleId: '',
    phone: '',
    departmentId: '',
    designation: ''
  });
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [uRes, rRes, dRes] = await Promise.all([
        api.users.getUsers(),
        api.roles.getRolesAndPermissions(),
        api.departments.getDepartments('active')
      ]);
      if (uRes.success) setMembers(uRes.data);
      if (rRes.success) setRoles(rRes.data.roles);
      if (dRes.success) setDepartments(dRes.data);
    } catch (err) {
      console.error('Failed to load team data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateMember = async (e: React.FormEvent) => {
    e.preventDefault();
    const roleId =
      newMemberForm.roleId ||
      roles.find(r => r.name === 'SALES_MEMBER')?.id ||
      roles[0]?.id ||
      '';
    setIsSubmittingCreate(true);
    try {
      const res = await api.users.createUser({
        name: newMemberForm.name,
        email: newMemberForm.email,
        password: newMemberForm.password,
        roleId,
        phone: newMemberForm.phone || undefined,
        departmentId: newMemberForm.departmentId || null,
        designation: newMemberForm.designation || undefined
      });
      if (res.success) {
        setIsCreateOpen(false);
        setNewMemberForm(emptyMemberForm);
        fetchData();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to add team member');
    } finally {
      setIsSubmittingCreate(false);
    }
  };

  const handleOpenEdit = (member: User) => {
    setEditingMember(member);
    setEditForm({
      name: member.name,
      roleId: member.roleId,
      phone: member.phone || '',
      departmentId: member.departmentId || '',
      designation: member.designation || ''
    });
  };

  const handleUpdateMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMember) return;
    setIsSubmittingEdit(true);
    try {
      const res = await api.users.updateUser(editingMember.id, {
        name: editForm.name,
        roleId: editForm.roleId,
        phone: editForm.phone || undefined,
        departmentId: editForm.departmentId || null,
        designation: editForm.designation || undefined
      });
      if (res.success) {
        setEditingMember(null);
        fetchData();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to update member');
    } finally {
      setIsSubmittingEdit(false);
    }
  };

  const handleToggleStatus = async (member: User) => {
    const newStatus = member.status === 'active' ? 'inactive' : 'active';
    const confirmMsg = `Are you sure you want to ${
      newStatus === 'active' ? 'activate' : 'deactivate'
    } access for ${member.name}?`;
    if (!confirm(confirmMsg)) return;

    try {
      await api.users.toggleStatus(member.id, newStatus);
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to update member status');
    }
  };

  const departmentName = (member: User) => {
    if (member.department) return member.department;
    const match = departments.find(d => d.id === member.departmentId);
    return match?.name || '—';
  };

  const roleOptions = roles.map(r => ({ value: r.id, label: r.displayName }));
  const departmentOptions = departments.map(d => ({ value: d.id, label: d.name }));

  return (
    <div className="p-6 space-y-5 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-slate-800">Team Directory & Workload</h3>
          <p className="text-xs text-slate-500">
            Monitor active workloads, overdue tasks by staff, and departmental RBAC assignments
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

          {hasPermission('users.create') && (
            <button
              onClick={() => {
                setNewMemberForm(prev => ({
                  ...prev,
                  roleId: roles.find(r => r.name === 'SALES_MEMBER')?.id || roles[0]?.id || ''
                }));
                setIsCreateOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-medium transition-colors shadow-2xs"
            >
              <Plus className="w-4 h-4" />
              <span>Add Team Member</span>
            </button>
          )}
        </div>
      </div>

      {/* Content: Cards View (Default) or Table View */}
      {viewMode === 'cards' ? (
        <div>
          {isLoading ? (
            <div className="py-16 text-center text-slate-400 bg-white border border-slate-200 rounded-xl">
              Loading team directory in card view...
            </div>
          ) : members.length === 0 ? (
            <div className="py-16 text-center text-slate-400 bg-white border border-slate-200 rounded-xl">
              No team members registered yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4.5">
              {members.map(member => (
                <div
                  key={member.id}
                  className="bg-white border border-slate-200 hover:border-sky-300 rounded-xl p-4 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between group"
                >
                  <div>
                    {/* Top Bar: Avatar, Name, Role, Status */}
                    <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-sky-500 to-teal-600 text-white flex items-center justify-center font-bold text-sm shadow-2xs shrink-0">
                          {member.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <h4 className="text-sm font-semibold text-slate-800 leading-tight">
                              {member.name}
                            </h4>
                            {member.employeeId && (
                              <span className="font-mono text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded font-medium">
                                {member.employeeId}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500 truncate max-w-[160px]">
                            {member.email}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border ${
                            member.status === 'active'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-slate-100 text-slate-500 border-slate-200'
                          }`}
                        >
                          <span className="w-1.5 h-1.5 rounded-full mr-1 bg-current" />
                          {member.status === 'active' ? 'Active' : 'Inactive'}
                        </span>
                        <span className="inline-flex items-center gap-1 font-medium text-slate-700 bg-slate-100 px-2 py-0.5 rounded text-[10px]">
                          <Shield className="w-2.5 h-2.5 text-slate-500" />
                          {member.roleDisplayName || member.roleName}
                        </span>
                      </div>
                    </div>

                    {/* Department & Designation */}
                    <div className="mt-3 space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500 font-medium">Designation:</span>
                        <span className="font-semibold text-slate-800">
                          {member.designation || '—'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500 font-medium">Department:</span>
                        <span className="text-slate-700">{departmentName(member)}</span>
                      </div>
                      {member.assignedTerritory && (
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-500 font-medium">Territory:</span>
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-sky-800 bg-sky-50 border border-sky-100 px-2 py-0.5 rounded">
                            <MapPin className="w-2.5 h-2.5 text-sky-600" />
                            {member.assignedTerritory}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Phone */}
                    <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-600">
                      {member.phone ? (
                        <a
                          href={`tel:${member.phone}`}
                          className="hover:text-sky-700 flex items-center gap-1 font-medium"
                        >
                          <Phone className="w-3 h-3 text-slate-400" />
                          {member.phone}
                        </a>
                      ) : (
                        <span className="text-slate-400">No phone listed</span>
                      )}

                      <span className="text-[10px] text-slate-400">
                        Joined{' '}
                        {new Date(member.createdAt).toLocaleDateString([], {
                          month: 'short',
                          year: 'numeric'
                        })}
                      </span>
                    </div>

                    {/* Workload Stats Row */}
                    <div className="grid grid-cols-3 gap-2 mt-3 text-center text-xs">
                      <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                        <span className="text-[10px] text-slate-400 block font-medium">Active Tasks</span>
                        <span className="font-bold text-slate-800">{member.activeTasks || 0}</span>
                      </div>
                      <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                        <span className="text-[10px] text-slate-400 block font-medium">Overdue</span>
                        {(member.overdueTasks || 0) > 0 ? (
                          <span className="font-bold text-rose-700 flex items-center justify-center gap-1">
                            <AlertTriangle className="w-2.5 h-2.5" />
                            {member.overdueTasks}
                          </span>
                        ) : (
                          <span className="font-semibold text-emerald-700">0</span>
                        )}
                      </div>
                      <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                        <span className="text-[10px] text-slate-400 block font-medium">Leads</span>
                        <span className="font-bold text-slate-800">{member.leadsAssigned || 0}</span>
                      </div>
                    </div>
                  </div>

                  {/* Card Footer Actions */}
                  <div className="mt-4 pt-2.5 border-t border-slate-100 flex items-center justify-end gap-1.5">
                    {hasPermission('users.edit') && (
                      <button
                        onClick={() => handleOpenEdit(member)}
                        className="px-2.5 py-1 bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200/80 rounded-lg text-[11px] font-medium transition-colors flex items-center gap-1"
                      >
                        <Edit2 className="w-3 h-3" />
                        <span>Edit</span>
                      </button>
                    )}
                    {hasPermission('users.edit') && member.roleName !== 'SUPER_ADMIN' && (
                      <button
                        onClick={() => handleToggleStatus(member)}
                        className={`p-1.5 rounded-lg border text-xs transition-colors ${
                          member.status === 'active'
                            ? 'text-slate-500 hover:text-rose-600 hover:bg-rose-50 border-slate-200'
                            : 'text-teal-700 hover:bg-teal-50 border-teal-200'
                        }`}
                        title={member.status === 'active' ? 'Deactivate Member' : 'Activate Member'}
                      >
                        <Power className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* Team Table */
        <div className="bg-white border border-slate-200 rounded-xl shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-600 font-semibold">
                  <th className="py-3 px-4">Member</th>
                  <th className="py-3 px-4">Role & Department</th>
                  <th className="py-3 px-4">Designation</th>
                  <th className="py-3 px-4">Contact</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-center">Active Tasks</th>
                  <th className="py-3 px-4 text-center">Overdue Tasks</th>
                  <th className="py-3 px-4 text-center">Leads Assigned</th>
                  <th className="py-3 px-4">Joined Date</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  <tr>
                    <td colSpan={10} className="py-12 text-center text-slate-400">
                      Loading team members...
                    </td>
                  </tr>
                ) : members.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-12 text-center text-slate-400">
                      No team members found.
                    </td>
                  </tr>
                ) : (
                  members.map(member => (
                    <tr key={member.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-sky-500 to-teal-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                            {member.name.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-800">{member.name}</p>
                            <p className="text-[11px] text-slate-500">{member.email}</p>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 font-medium text-slate-800 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                          <Shield className="w-3 h-3 text-slate-500" />
                          {member.roleDisplayName || member.roleName}
                        </span>
                        <p className="text-[10px] text-slate-400 mt-0.5">{departmentName(member)}</p>
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        <p className="font-medium text-slate-800">{member.designation || '—'}</p>
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap text-slate-600">
                        {member.phone ? (
                          <a
                            href={`tel:${member.phone}`}
                            className="hover:underline flex items-center gap-1 text-[11px]"
                          >
                            <Phone className="w-3 h-3 text-slate-400" />
                            {member.phone}
                          </a>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border ${
                            member.status === 'active'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-slate-100 text-slate-500 border-slate-200'
                          }`}
                        >
                          <span className="w-1.5 h-1.5 rounded-full mr-1 bg-current" />
                          {member.status === 'active' ? 'Active' : 'Inactive'}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <span className="inline-flex items-center justify-center font-medium text-slate-800 bg-slate-50 border border-slate-200 px-2.5 py-0.5 rounded">
                          {member.activeTasks || 0}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        {(member.overdueTasks || 0) > 0 ? (
                          <span className="inline-flex items-center gap-1 font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded text-[11px]">
                            <AlertTriangle className="w-3 h-3" />
                            {member.overdueTasks} overdue
                          </span>
                        ) : (
                          <span className="text-slate-400 font-medium">0</span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <span className="inline-flex items-center justify-center font-medium text-slate-800 bg-slate-50 border border-slate-200 px-2.5 py-0.5 rounded">
                          {member.leadsAssigned || 0}
                        </span>
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap text-slate-500 text-[11px]">
                        {new Date(member.createdAt).toLocaleDateString([], {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </td>

                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          {hasPermission('users.edit') && (
                            <button
                              onClick={() => handleOpenEdit(member)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-sky-700 hover:bg-sky-50"
                              title="Edit Role & Details"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {hasPermission('users.edit') && member.roleName !== 'SUPER_ADMIN' && (
                            <button
                              onClick={() => handleToggleStatus(member)}
                              className={`p-1.5 rounded-lg transition-colors ${
                                member.status === 'active'
                                  ? 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'
                                  : 'text-slate-400 hover:text-teal-700 hover:bg-teal-50'
                              }`}
                              title={
                                member.status === 'active' ? 'Deactivate Member' : 'Activate Member'
                              }
                            >
                              <Power className="w-3.5 h-3.5" />
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

      {/* ADD TEAM MEMBER MODAL */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Add New Team Member"
        subtitle="Provision credentials, assign role and department"
        maxWidth="lg"
      >
        <form onSubmit={handleCreateMember} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Full Name *</label>
              <input
                type="text"
                required
                value={newMemberForm.name}
                onChange={e => setNewMemberForm({ ...newMemberForm, name: e.target.value })}
                placeholder="e.g. Samir Varma"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-sky-600 text-slate-800"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1">Corporate Email *</label>
              <input
                type="email"
                required
                value={newMemberForm.email}
                onChange={e => setNewMemberForm({ ...newMemberForm, email: e.target.value })}
                placeholder="samir@videhaoverseas.com"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-sky-600 text-slate-800"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Temporary Password *</label>
              <input
                type="password"
                required
                value={newMemberForm.password}
                onChange={e => setNewMemberForm({ ...newMemberForm, password: e.target.value })}
                placeholder="At least 6 characters"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-sky-600 text-slate-800"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1">System Role *</label>
              <SearchableSelect
                options={roleOptions}
                value={newMemberForm.roleId}
                onChange={roleId => setNewMemberForm({ ...newMemberForm, roleId })}
                placeholder="Select role"
                searchPlaceholder="Search roles…"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Department</label>
              <SearchableSelect
                options={departmentOptions}
                value={newMemberForm.departmentId}
                onChange={departmentId => setNewMemberForm({ ...newMemberForm, departmentId })}
                placeholder="None"
                searchPlaceholder="Search departments…"
                allowClear
              />
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1">Phone Number</label>
              <input
                type="text"
                value={newMemberForm.phone}
                onChange={e => setNewMemberForm({ ...newMemberForm, phone: e.target.value })}
                placeholder="+91 98765 43210"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-sky-600 text-slate-800"
              />
            </div>
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">Official Designation</label>
            <input
              type="text"
              value={newMemberForm.designation}
              onChange={e => setNewMemberForm({ ...newMemberForm, designation: e.target.value })}
              placeholder="e.g. Export Sales Manager"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-sky-600 text-slate-800"
            />
          </div>

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
              {isSubmittingCreate ? 'Saving...' : 'Add Team Member'}
            </button>
          </div>
        </form>
      </Modal>

      {/* EDIT MEMBER MODAL */}
      <Modal
        isOpen={!!editingMember}
        onClose={() => setEditingMember(null)}
        title="Edit Team Member Profile"
        subtitle={editingMember?.name}
      >
        <form onSubmit={handleUpdateMember} className="space-y-4 text-xs">
          <div>
            <label className="block font-medium text-slate-700 mb-1">Full Name *</label>
            <input
              type="text"
              required
              value={editForm.name}
              onChange={e => setEditForm({ ...editForm, name: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-sky-600 text-slate-800"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-700 mb-1">System Role *</label>
              <SearchableSelect
                options={roleOptions}
                value={editForm.roleId}
                onChange={roleId => setEditForm({ ...editForm, roleId })}
                placeholder="Select role"
                searchPlaceholder="Search roles…"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1">Department</label>
              <SearchableSelect
                options={departmentOptions}
                value={editForm.departmentId}
                onChange={departmentId => setEditForm({ ...editForm, departmentId })}
                placeholder="None"
                searchPlaceholder="Search departments…"
                allowClear
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Phone</label>
              <input
                type="text"
                value={editForm.phone}
                onChange={e => setEditForm({ ...editForm, phone: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-sky-600 text-slate-800"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1">Official Designation</label>
              <input
                type="text"
                value={editForm.designation}
                onChange={e => setEditForm({ ...editForm, designation: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-sky-600 text-slate-800"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setEditingMember(null)}
              className="px-4 py-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmittingEdit}
              className="px-5 py-2 rounded-lg bg-sky-600 hover:bg-sky-700 text-white font-medium disabled:opacity-50 transition-colors shadow-2xs"
            >
              {isSubmittingEdit ? 'Updating...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
