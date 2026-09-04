import React, { useState, useEffect } from 'react';
import {
  Shield,
  FileText,
  Check,
  Lock,
  Save,
  CheckCircle2,
  Building2,
  Plus,
  Edit2,
  Power,
  Trash2
} from 'lucide-react';
import { api } from '../../api/client';
import { Role, Permission, AuditLog, Department } from '../../types/crm';
import { Modal } from '../../components/ui/Modal';

export const SettingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'rbac' | 'audit' | 'departments'>('rbac');

  // RBAC State
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [rolePerms, setRolePerms] = useState<string[]>([]);
  const [isSavingPerms, setIsSavingPerms] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState(false);

  // Audit Logs State
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);

  // Departments State
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoadingDepartments, setIsLoadingDepartments] = useState(false);
  const [isDeptModalOpen, setIsDeptModalOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);
  const [deptForm, setDeptForm] = useState({ name: '', description: '' });
  const [isSubmittingDept, setIsSubmittingDept] = useState(false);

  const fetchRBAC = async () => {
    try {
      const res = await api.roles.getRolesAndPermissions();
      if (res.success) {
        setRoles(res.data.roles);
        setPermissions(res.data.permissions);
        if (!selectedRole && res.data.roles.length > 0) {
          setSelectedRole(res.data.roles[0]);
          setRolePerms(res.data.roles[0].permissions);
        }
      }
    } catch (err) {
      console.error('Failed to load RBAC matrix:', err);
    }
  };

  const fetchLogs = async () => {
    setIsLoadingLogs(true);
    try {
      const res = await api.audit.getLogs(60);
      if (res.success) {
        setLogs(res.data);
      }
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setIsLoadingLogs(false);
    }
  };

  const fetchDepartments = async () => {
    setIsLoadingDepartments(true);
    try {
      const res = await api.departments.getDepartments();
      if (res.success) {
        setDepartments(res.data);
      }
    } catch (err) {
      console.error('Failed to load departments:', err);
    } finally {
      setIsLoadingDepartments(false);
    }
  };

  useEffect(() => {
    fetchRBAC();
  }, []);

  useEffect(() => {
    if (activeTab === 'audit') {
      fetchLogs();
    }
    if (activeTab === 'departments') {
      fetchDepartments();
    }
  }, [activeTab]);

  const handleSelectRole = (r: Role) => {
    setSelectedRole(r);
    setRolePerms(r.permissions);
    setSaveSuccessMsg(false);
  };

  const handleTogglePermission = (code: string) => {
    if (selectedRole?.name === 'SUPER_ADMIN') {
      return;
    }
    setRolePerms(prev =>
      prev.includes(code) ? prev.filter(c => c !== code) : [...prev, code]
    );
  };

  const handleSavePermissions = async () => {
    if (!selectedRole) return;
    setIsSavingPerms(true);
    setSaveSuccessMsg(false);
    try {
      const res = await api.roles.updatePermissions(selectedRole.id, rolePerms);
      if (res.success) {
        setRoles(prev => prev.map(r => (r.id === res.data.id ? res.data : r)));
        setSelectedRole(res.data);
        setSaveSuccessMsg(true);
        setTimeout(() => setSaveSuccessMsg(false), 3000);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to update permissions');
    } finally {
      setIsSavingPerms(false);
    }
  };

  const openCreateDept = () => {
    setEditingDept(null);
    setDeptForm({ name: '', description: '' });
    setIsDeptModalOpen(true);
  };

  const openEditDept = (dept: Department) => {
    setEditingDept(dept);
    setDeptForm({ name: dept.name, description: dept.description || '' });
    setIsDeptModalOpen(true);
  };

  const handleSubmitDept = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingDept(true);
    try {
      if (editingDept) {
        const res = await api.departments.updateDepartment(editingDept.id, {
          name: deptForm.name,
          description: deptForm.description || undefined
        });
        if (res.success) {
          setIsDeptModalOpen(false);
          fetchDepartments();
        }
      } else {
        const res = await api.departments.createDepartment({
          name: deptForm.name,
          description: deptForm.description || undefined
        });
        if (res.success) {
          setIsDeptModalOpen(false);
          fetchDepartments();
        }
      }
    } catch (err: any) {
      alert(err.message || 'Failed to save department');
    } finally {
      setIsSubmittingDept(false);
    }
  };

  const handleDeactivateDept = async (dept: Department) => {
    if (!confirm(`Deactivate department "${dept.name}"?`)) return;
    try {
      await api.departments.updateDepartment(dept.id, { status: 'inactive' });
      fetchDepartments();
    } catch (err: any) {
      alert(err.message || 'Failed to deactivate department');
    }
  };

  const handleActivateDept = async (dept: Department) => {
    try {
      await api.departments.updateDepartment(dept.id, { status: 'active' });
      fetchDepartments();
    } catch (err: any) {
      alert(err.message || 'Failed to activate department');
    }
  };

  const handleDeleteDept = async (dept: Department) => {
    if (!confirm(`Permanently delete department "${dept.name}"?`)) return;
    try {
      await api.departments.deleteDepartment(dept.id);
      fetchDepartments();
    } catch (err: any) {
      alert(err.message || 'Failed to delete department');
    }
  };

  // Group permissions by category
  const categorizedPerms = permissions.reduce((acc, p) => {
    if (!acc[p.category]) acc[p.category] = [];
    acc[p.category].push(p);
    return acc;
  }, {} as Record<string, Permission[]>);

  const categoryLabels: Record<string, string> = {
    dashboard: 'Operations Dashboard',
    users: 'Team & User Directory',
    leads: 'Lead Management',
    tasks: 'Task & Workflow Control',
    orders: 'Order & Shipping Tracking',
    reports: 'Operational Reporting',
    settings: 'System & RBAC Settings'
  };

  return (
    <div className="p-6 space-y-5 max-w-7xl mx-auto">
      {/* Tabs */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab('rbac')}
          className={`px-4 py-2.5 text-xs font-medium border-b-2 transition-colors flex items-center gap-1.5 ${
            activeTab === 'rbac'
              ? 'border-slate-900 text-slate-900 font-semibold'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Shield className="w-3.5 h-3.5" />
          Roles & Permissions Matrix
        </button>
        <button
          onClick={() => setActiveTab('audit')}
          className={`px-4 py-2.5 text-xs font-medium border-b-2 transition-colors flex items-center gap-1.5 ${
            activeTab === 'audit'
              ? 'border-slate-900 text-slate-900 font-semibold'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          System Audit Logs
        </button>
        <button
          onClick={() => setActiveTab('departments')}
          className={`px-4 py-2.5 text-xs font-medium border-b-2 transition-colors flex items-center gap-1.5 ${
            activeTab === 'departments'
              ? 'border-slate-900 text-slate-900 font-semibold'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Building2 className="w-3.5 h-3.5" />
          Departments
        </button>
      </div>

      {/* TAB 1: RBAC MATRIX */}
      {activeTab === 'rbac' && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
          {/* Role selector card */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-2 lg:col-span-1">
            <h4 className="text-xs font-semibold text-slate-900 uppercase tracking-wider mb-2">
              System Roles
            </h4>
            <div className="space-y-1">
              {roles.map(r => (
                <button
                  key={r.id}
                  onClick={() => handleSelectRole(r)}
                  className={`w-full text-left p-2.5 rounded-lg text-xs font-medium transition-colors ${
                    selectedRole?.id === r.id
                      ? 'bg-slate-900 text-white font-semibold shadow-xs'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <p className="leading-tight">{r.displayName}</p>
                  <span
                    className={`text-[10px] block mt-0.5 ${
                      selectedRole?.id === r.id ? 'text-slate-300' : 'text-slate-400'
                    }`}
                  >
                    {r.permissions.length} permissions assigned
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Permission Editor Matrix */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs lg:col-span-3 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100">
              <div>
                <h4 className="text-sm font-semibold text-slate-900">
                  {selectedRole?.displayName} Permissions
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">{selectedRole?.description}</p>
              </div>

              {selectedRole?.name === 'SUPER_ADMIN' ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 text-slate-700 rounded-lg text-xs font-medium">
                  <Lock className="w-3.5 h-3.5" /> Full Root Access
                </span>
              ) : (
                <div className="flex items-center gap-2">
                  {saveSuccessMsg && (
                    <span className="inline-flex items-center gap-1 text-xs text-emerald-700 font-medium animate-in fade-in">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Saved!
                    </span>
                  )}
                  <button
                    onClick={handleSavePermissions}
                    disabled={isSavingPerms}
                    className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-medium hover:bg-slate-800 disabled:opacity-50 transition-colors shadow-xs"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>{isSavingPerms ? 'Updating...' : 'Save Matrix'}</span>
                  </button>
                </div>
              )}
            </div>

            {/* Categorized Permissions Grid */}
            <div className="space-y-5">
              {(Object.entries(categorizedPerms) as [string, Permission[]][]).map(([cat, perms]) => (
                <div key={cat} className="space-y-2">
                  <h5 className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    {categoryLabels[cat] || cat}
                  </h5>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {perms.map(p => {
                      const isGranted =
                        selectedRole?.name === 'SUPER_ADMIN' || rolePerms.includes(p.code);
                      const isSuperAdmin = selectedRole?.name === 'SUPER_ADMIN';
                      return (
                        <div
                          key={p.id}
                          onClick={() => !isSuperAdmin && handleTogglePermission(p.code)}
                          className={`p-3 rounded-lg border text-left transition-all ${
                            isGranted
                              ? 'bg-slate-50/90 border-slate-300'
                              : 'bg-white border-slate-200 opacity-60'
                          } ${isSuperAdmin ? 'cursor-default' : 'cursor-pointer hover:border-slate-400'}`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-slate-900">{p.name}</span>
                            <div
                              className={`w-4 h-4 rounded flex items-center justify-center text-[10px] ${
                                isGranted
                                  ? 'bg-slate-900 text-white'
                                  : 'border border-slate-300 bg-white'
                              }`}
                            >
                              {isGranted && <Check className="w-3 h-3" />}
                            </div>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-1">{p.description}</p>
                          <code className="text-[10px] text-slate-400 font-mono mt-1 block">
                            {p.code}
                          </code>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: AUDIT LOGS */}
      {activeTab === 'audit' && (
        <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h4 className="text-xs font-semibold text-slate-900 uppercase tracking-wider">
                System Activity & Security Audit Trail
              </h4>
              <p className="text-xs text-slate-500">
                Immutable audit records for user actions, status changes, and task assignments
              </p>
            </div>
            <button
              onClick={fetchLogs}
              className="text-xs font-medium text-slate-600 hover:text-slate-900 px-3 py-1 border border-slate-200 rounded-lg hover:bg-slate-50"
            >
              Refresh Logs
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-600 font-semibold">
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Entity</th>
                  <th className="py-3 px-4">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoadingLogs ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      Loading audit records...
                    </td>
                  </tr>
                ) : logs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      No audit records logged yet.
                    </td>
                  </tr>
                ) : (
                  logs.map(log => (
                    <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 whitespace-nowrap text-slate-500 font-mono text-[11px]">
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap font-medium text-slate-900">
                        {log.userName}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="text-[10px] font-medium bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                          {log.userRole}
                        </span>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap font-semibold text-slate-800">
                        {log.action}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap text-slate-600">
                        {log.entity}
                      </td>
                      <td className="py-3 px-4 text-slate-700 leading-relaxed max-w-md">
                        {log.details}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: DEPARTMENTS */}
      {activeTab === 'departments' && (
        <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h4 className="text-xs font-semibold text-slate-900 uppercase tracking-wider">
                Departments
              </h4>
              <p className="text-xs text-slate-500">
                Manage organizational departments for team assignment
              </p>
            </div>
            <button
              onClick={openCreateDept}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-medium hover:bg-slate-800 transition-colors shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Department
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-600 font-semibold">
                  <th className="py-3 px-4">Name</th>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Members</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoadingDepartments ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-400">
                      Loading departments...
                    </td>
                  </tr>
                ) : departments.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-400">
                      No departments created yet.
                    </td>
                  </tr>
                ) : (
                  departments.map(dept => (
                    <tr key={dept.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 font-semibold text-slate-900 whitespace-nowrap">
                        {dept.name}
                      </td>
                      <td className="py-3 px-4 text-slate-600 max-w-md">
                        {dept.description || '—'}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border ${
                            dept.status === 'active'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-slate-100 text-slate-500 border-slate-200'
                          }`}
                        >
                          <span className="w-1.5 h-1.5 rounded-full mr-1 bg-current" />
                          {dept.status === 'active' ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap text-slate-700">
                        {dept.memberCount ?? 0}
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => openEditDept(dept)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-sky-700 hover:bg-sky-50"
                            title="Edit Department"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          {dept.status === 'active' ? (
                            <button
                              onClick={() => handleDeactivateDept(dept)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50"
                              title="Deactivate Department"
                            >
                              <Power className="w-3.5 h-3.5" />
                            </button>
                          ) : (
                            <button
                              onClick={() => handleActivateDept(dept)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-teal-700 hover:bg-teal-50"
                              title="Activate Department"
                            >
                              <Power className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteDept(dept)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                            title="Delete Department"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
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

      {/* Add / Edit Department Modal */}
      <Modal
        isOpen={isDeptModalOpen}
        onClose={() => setIsDeptModalOpen(false)}
        title={editingDept ? 'Edit Department' : 'Add Department'}
        subtitle={editingDept ? editingDept.name : 'Create a new organizational department'}
      >
        <form onSubmit={handleSubmitDept} className="space-y-4 text-xs">
          <div>
            <label className="block font-medium text-slate-700 mb-1">Department Name *</label>
            <input
              type="text"
              required
              value={deptForm.name}
              onChange={e => setDeptForm({ ...deptForm, name: e.target.value })}
              placeholder="e.g. Sales & Export Desk"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-slate-900 text-slate-800"
            />
          </div>
          <div>
            <label className="block font-medium text-slate-700 mb-1">Description</label>
            <textarea
              rows={3}
              value={deptForm.description}
              onChange={e => setDeptForm({ ...deptForm, description: e.target.value })}
              placeholder="Optional short description"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-slate-900 text-slate-800"
            />
          </div>
          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsDeptModalOpen(false)}
              className="px-4 py-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmittingDept}
              className="px-5 py-2 rounded-lg bg-slate-900 text-white font-medium hover:bg-slate-800 disabled:opacity-50 transition-colors"
            >
              {isSubmittingDept ? 'Saving...' : editingDept ? 'Save Changes' : 'Create Department'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
