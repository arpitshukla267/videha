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
import { Role, Permission, AuditLog, Department, VisibilityScope } from '../../types/crm';
import { Modal } from '../../components/ui/Modal';
import { SearchableSelect } from '../../components/ui/SearchableSelect';
import { handleConflictWithReload, alertSaveError } from '../../lib/apiErrors';
import { PaginationBar } from '../../components/ui/PaginationBar';

// Same manifest/ledger palette used across the rest of the CRM.
const INK = '#182430';
const INK_SOFT = '#4B5563';
const INK_FAINT = '#8B8D85';
const LINE = '#E2DED2';
const PAPER = '#F6F4EE';
const MARINE = '#155A52';
const MARINE_TINT = '#EEF4F2';
const BRASS = '#9C6B25';
const BRASS_TINT = '#F5EEE0';
const RUST = '#A6402F';
const RUST_TINT = '#F7ECE9';

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
  const [auditPage, setAuditPage] = useState(1);
  const [auditTotal, setAuditTotal] = useState(0);
  const [auditTotalPages, setAuditTotalPages] = useState(1);
  const [auditLimit] = useState(25);

  // Departments State
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoadingDepartments, setIsLoadingDepartments] = useState(false);
  const [isDeptModalOpen, setIsDeptModalOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);
  const [deptForm, setDeptForm] = useState({
    name: '',
    description: '',
    defaultRoleId: ''
  });
  const [isSubmittingDept, setIsSubmittingDept] = useState(false);

  // Role CRUD State
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [roleForm, setRoleForm] = useState({
    displayName: '',
    description: '',
    visibilityScope: 'own' as VisibilityScope
  });
  const [isSubmittingRole, setIsSubmittingRole] = useState(false);

  const VISIBILITY_OPTIONS = [
    { value: 'own', label: 'Own records only' },
    { value: 'team', label: 'Team / department peers' },
    { value: 'department', label: 'Entire department' },
    { value: 'all', label: 'Organization-wide' }
  ];

  const roleOptions = roles.map(r => ({ value: r.id, label: r.displayName }));

  const fetchRBAC = async () => {
    try {
      const res = await api.roles.getRolesAndPermissions();
      if (res.success) {
        setRoles(res.data.roles);
        setPermissions(res.data.permissions);
        if (selectedRole) {
          const refreshed = res.data.roles.find(r => r.id === selectedRole.id);
          if (refreshed) {
            setSelectedRole(refreshed);
            setRolePerms(refreshed.permissions);
          }
        } else if (res.data.roles.length > 0) {
          setSelectedRole(res.data.roles[0]);
          setRolePerms(res.data.roles[0].permissions);
        }
      }
    } catch (err) {
      console.error('Failed to load RBAC matrix:', err);
    }
  };

  const fetchLogs = async (page = auditPage) => {
    setIsLoadingLogs(true);
    try {
      const res = await api.audit.getLogs({ page, limit: auditLimit });
      if (res.success) {
        setLogs(res.data);
        setAuditTotal(res.total);
        setAuditPage(res.page);
        setAuditTotalPages(res.totalPages);
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
    fetchDepartments();
  }, []);

  useEffect(() => {
    if (activeTab === 'audit') {
      fetchLogs(auditPage);
    }
    if (activeTab === 'rbac' || activeTab === 'departments') {
      fetchDepartments();
    }
  }, [activeTab, auditPage]);

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

  const openCreateRole = () => {
    setEditingRole(null);
    setRoleForm({ displayName: '', description: '', visibilityScope: 'own' });
    setIsRoleModalOpen(true);
  };

  const openEditRole = (role: Role) => {
    setEditingRole(role);
    setRoleForm({
      displayName: role.displayName,
      description: role.description || '',
      visibilityScope: role.visibilityScope || 'own'
    });
    setIsRoleModalOpen(true);
  };

  const handleSubmitRole = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingRole(true);
    try {
      if (editingRole) {
        const res = await api.roles.updateRole(editingRole.id, {
          displayName: roleForm.displayName,
          description: roleForm.description,
          visibilityScope: roleForm.visibilityScope
        });
        if (res.success) {
          setIsRoleModalOpen(false);
          await fetchRBAC();
          if (selectedRole?.id === res.data.id) {
            setSelectedRole(res.data);
          }
        }
      } else {
        const res = await api.roles.createRole({
          displayName: roleForm.displayName,
          description: roleForm.description,
          visibilityScope: roleForm.visibilityScope,
          permissions: rolePerms.length ? rolePerms : ['leads.view']
        });
        if (res.success) {
          setIsRoleModalOpen(false);
          await fetchRBAC();
          setSelectedRole(res.data);
          setRolePerms(res.data.permissions);
        }
      }
    } catch (err: unknown) {
      alertSaveError(err, editingRole ? 'Failed to update role' : 'Failed to create role');
    } finally {
      setIsSubmittingRole(false);
    }
  };

  const handleDeleteRole = async (role: Role) => {
    if (role.isSystem || role.name === 'SUPER_ADMIN' || role.name === 'ADMIN') {
      alert('System roles cannot be deleted.');
      return;
    }
    if (!confirm(`Delete role "${role.displayName}"? Users must be reassigned first.`)) return;
    try {
      await api.roles.deleteRole(role.id);
      if (selectedRole?.id === role.id) {
        setSelectedRole(null);
        setRolePerms([]);
      }
      await fetchRBAC();
    } catch (err: unknown) {
      alertSaveError(err, 'Failed to delete role');
    }
  };

  const departmentsForRole = (roleId: string) =>
    departments.filter(d => d.defaultRoleId === roleId);

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
    setDeptForm({ name: '', description: '', defaultRoleId: '' });
    setIsDeptModalOpen(true);
  };

  const openEditDept = (dept: Department) => {
    setEditingDept(dept);
    setDeptForm({
      name: dept.name,
      description: dept.description || '',
      defaultRoleId: dept.defaultRoleId || ''
    });
    setIsDeptModalOpen(true);
  };

  const handleSubmitDept = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deptForm.defaultRoleId) {
      alert('Select a role for this department.');
      return;
    }
    setIsSubmittingDept(true);
    try {
      if (editingDept) {
        const res = await api.departments.updateDepartment(editingDept.id, {
          name: deptForm.name,
          description: deptForm.description || undefined,
          defaultRoleId: deptForm.defaultRoleId,
          revision: editingDept.revision
        });
        if (res.success) {
          setIsDeptModalOpen(false);
          fetchDepartments();
        }
      } else {
        const res = await api.departments.createDepartment({
          name: deptForm.name,
          description: deptForm.description || undefined,
          defaultRoleId: deptForm.defaultRoleId
        });
        if (res.success) {
          setIsDeptModalOpen(false);
          fetchDepartments();
        }
      }
    } catch (err: unknown) {
      if (editingDept) {
        await handleConflictWithReload(err, fetchDepartments, 'Failed to save department');
      } else {
        alertSaveError(err, 'Failed to save department');
      }
    } finally {
      setIsSubmittingDept(false);
    }
  };

  const handleDeactivateDept = async (dept: Department) => {
    if (!confirm(`Deactivate department "${dept.name}"?`)) return;
    try {
      await api.departments.updateDepartment(dept.id, {
        status: 'inactive',
        revision: dept.revision
      });
      fetchDepartments();
    } catch (err: unknown) {
      await handleConflictWithReload(err, fetchDepartments, 'Failed to deactivate department');
    }
  };

  const handleActivateDept = async (dept: Department) => {
    try {
      await api.departments.updateDepartment(dept.id, {
        status: 'active',
        revision: dept.revision
      });
      fetchDepartments();
    } catch (err: unknown) {
      await handleConflictWithReload(err, fetchDepartments, 'Failed to activate department');
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
    documents: 'Document Library',
    finance: 'Finance & Supplier Management',
    reports: 'Operational Reporting',
    settings: 'System & RBAC Settings'
  };

  const activeDepartments = departments.filter(d => d.status === 'active');

  const inputClass =
    'w-full px-3.5 py-2.5 bg-white border rounded-md text-sm focus:outline-none transition-colors';
  const labelClass = 'block text-sm font-medium mb-1.5';

  return (
    <div className="p-6 sm:p-8 space-y-6" style={{ backgroundColor: PAPER }}>
      {/* Header */}
      <div className="pb-2">
        <h1 className="text-2xl font-semibold tracking-tight" style={{ color: INK }}>Settings</h1>
        <p className="text-sm mt-1.5" style={{ color: INK_SOFT }}>
          Roles, permissions, departments, and the system audit trail.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b gap-1" style={{ borderColor: LINE }}>
        {[
          { id: 'rbac' as const, label: 'Roles & permissions', icon: Shield },
          { id: 'audit' as const, label: 'Audit logs', icon: FileText },
          { id: 'departments' as const, label: 'Departments', icon: Building2 }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="px-4 py-2.5 text-sm font-medium border-b-2 transition-colors flex items-center gap-1.5 -mb-px"
              style={{
                borderColor: isActive ? MARINE : 'transparent',
                color: isActive ? MARINE : INK_SOFT
              }}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* TAB 1: RBAC MATRIX */}
      {activeTab === 'rbac' && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-5 items-start">
          {/* Role selector card */}
          <div
            className="bg-white border rounded-lg lg:col-span-1 flex flex-col lg:h-[calc(100vh-250px)] lg:max-h-[850px] min-h-[420px] overflow-hidden"
            style={{ borderColor: LINE }}
          >
            <div className="flex items-center justify-between p-4 pb-3 border-b shrink-0" style={{ borderColor: LINE }}>
              <h4 className="text-sm font-semibold" style={{ color: INK }}>System roles</h4>
              <button
                type="button"
                onClick={openCreateRole}
                className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded transition-colors hover:bg-[#F6F4EE]"
                style={{ color: MARINE }}
              >
                <Plus className="w-3.5 h-3.5" />
                Add role
              </button>
            </div>
            <div className="p-3 space-y-1 overflow-y-auto flex-1">
              {roles.map(r => {
                const isSelected = selectedRole?.id === r.id;
                return (
                  <div
                    key={r.id}
                    className="flex items-stretch gap-1 rounded-md transition-colors"
                    style={isSelected ? { backgroundColor: INK } : undefined}
                    onMouseEnter={e => {
                      if (!isSelected) e.currentTarget.style.backgroundColor = MARINE_TINT;
                    }}
                    onMouseLeave={e => {
                      if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => handleSelectRole(r)}
                      className="flex-1 text-left p-2.5 text-sm font-medium"
                      style={{ color: isSelected ? '#fff' : INK }}
                    >
                      <p className="leading-tight">{r.displayName}</p>
                      <span className="text-xs block mt-0.5" style={{ color: isSelected ? 'rgba(255,255,255,0.65)' : INK_FAINT }}>
                        {r.permissions.length} perms · {r.visibilityScope || 'own'} scope
                        {r.isSystem ? ' · system' : ''}
                      </span>
                    </button>
                    <div className="flex items-center gap-0.5 pr-1">
                      <button
                        type="button"
                        onClick={() => openEditRole(r)}
                        className="p-1.5 rounded transition-colors"
                        style={{ color: isSelected ? 'rgba(255,255,255,0.7)' : INK_FAINT }}
                        title="Edit role"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      {!r.isSystem && r.name !== 'SUPER_ADMIN' && r.name !== 'ADMIN' && (
                        <button
                          type="button"
                          onClick={() => handleDeleteRole(r)}
                          className="p-1.5 rounded transition-colors"
                          style={{ color: isSelected ? 'rgba(255,255,255,0.7)' : INK_FAINT }}
                          title="Delete role"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Permission Editor Matrix */}
          <div
            className="bg-white border rounded-lg lg:col-span-3 flex flex-col lg:h-[calc(100vh-250px)] lg:max-h-[850px] min-h-[420px] overflow-hidden"
            style={{ borderColor: LINE }}
          >
            {/* Header: role details, save action, and linked departments */}
            <div className="p-5 pb-4 border-b shrink-0 space-y-3" style={{ borderColor: LINE }}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h4 className="text-base font-semibold" style={{ color: INK }}>
                    {selectedRole?.displayName} permissions
                  </h4>
                  <p className="text-sm mt-0.5" style={{ color: INK_SOFT }}>{selectedRole?.description}</p>
                  {selectedRole && (
                    <p className="text-xs mt-1" style={{ color: INK_FAINT }}>
                      Data visibility:{' '}
                      <span className="font-medium" style={{ color: INK_SOFT }}>
                        {VISIBILITY_OPTIONS.find(o => o.value === selectedRole.visibilityScope)?.label ||
                          'Own records only'}
                      </span>
                    </p>
                  )}
                </div>

                {selectedRole?.name === 'SUPER_ADMIN' ? (
                  <span
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium border"
                    style={{ borderColor: LINE, color: INK_SOFT }}
                  >
                    <Lock className="w-3.5 h-3.5" /> Full root access
                  </span>
                ) : (
                  <div className="flex items-center gap-2">
                    {saveSuccessMsg && (
                      <span className="inline-flex items-center gap-1 text-sm font-medium animate-in fade-in" style={{ color: MARINE }}>
                        <CheckCircle2 className="w-3.5 h-3.5" /> Saved
                      </span>
                    )}
                    <button
                      onClick={handleSavePermissions}
                      disabled={isSavingPerms}
                      className="inline-flex items-center gap-1.5 px-4 py-2 text-white rounded-md text-sm font-medium disabled:opacity-50 transition-colors"
                      style={{ backgroundColor: MARINE }}
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>{isSavingPerms ? 'Updating…' : 'Save matrix'}</span>
                    </button>
                  </div>
                )}
              </div>

              {selectedRole && departmentsForRole(selectedRole.id).length > 0 && (
                <div className="p-3 rounded-md border" style={{ borderColor: LINE, backgroundColor: MARINE_TINT }}>
                  <p className="text-xs font-semibold mb-1.5" style={{ color: MARINE }}>
                    Linked departments
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {departmentsForRole(selectedRole.id).map(dept => (
                      <span
                        key={dept.id}
                        className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-white border"
                        style={{ borderColor: LINE, color: INK }}
                      >
                        {dept.name}
                        {dept.defaultRoleId === selectedRole.id ? ' (assigned)' : ''}
                      </span>
                    ))}
                  </div>
                  <p className="text-xs mt-1.5" style={{ color: INK_SOFT }}>
                    Team members in these departments inherit this role automatically.
                  </p>
                </div>
              )}
            </div>

            {/* Scrollable Categorized Permissions Grid */}
            <div className="p-5 overflow-y-auto flex-1 space-y-5">
              {(Object.entries(categorizedPerms) as [string, Permission[]][]).map(([cat, perms]) => (
                <div key={cat} className="space-y-2">
                  <h5 className="text-sm font-semibold" style={{ color: INK }}>
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
                          className={`p-3 rounded-md border text-left transition-colors ${
                            isSuperAdmin ? 'cursor-default' : 'cursor-pointer'
                          }`}
                          style={{
                            borderColor: isGranted ? MARINE : LINE,
                            backgroundColor: isGranted ? MARINE_TINT : '#fff',
                            opacity: isGranted ? 1 : 0.75
                          }}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-sm font-semibold" style={{ color: INK }}>{p.name}</span>
                            <div
                              className="w-4 h-4 rounded flex items-center justify-center shrink-0"
                              style={
                                isGranted
                                  ? { backgroundColor: MARINE }
                                  : { border: `1px solid ${LINE}`, backgroundColor: '#fff' }
                              }
                            >
                              {isGranted && <Check className="w-3 h-3 text-white" />}
                            </div>
                          </div>
                          <p className="text-xs mt-1" style={{ color: INK_SOFT }}>{p.description}</p>
                          <code className="text-xs font-mono mt-1 block" style={{ color: INK_FAINT }}>
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
        <div className="bg-white border rounded-lg overflow-hidden" style={{ borderColor: LINE }}>
          <div className="p-4 border-b flex items-center justify-between" style={{ borderColor: LINE }}>
            <div>
              <h4 className="text-sm font-semibold" style={{ color: INK }}>
                System activity & security audit trail
              </h4>
              <p className="text-sm" style={{ color: INK_SOFT }}>
                Immutable audit records for user actions, status changes, and task assignments
              </p>
            </div>
            <button
              onClick={() => fetchLogs(auditPage)}
              className="text-sm font-medium px-3 py-2 border rounded-md transition-colors hover:bg-[#F6F4EE]"
              style={{ borderColor: LINE, color: INK }}
            >
              Refresh
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b" style={{ borderColor: LINE, color: INK_FAINT }}>
                  <th className="py-3 px-4 font-medium text-xs">Timestamp</th>
                  <th className="py-3 px-4 font-medium text-xs">User</th>
                  <th className="py-3 px-4 font-medium text-xs">Role</th>
                  <th className="py-3 px-4 font-medium text-xs">Action</th>
                  <th className="py-3 px-4 font-medium text-xs">Entity</th>
                  <th className="py-3 px-4 font-medium text-xs">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: LINE }}>
                {isLoadingLogs ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center" style={{ color: INK_FAINT }}>
                      Loading audit records…
                    </td>
                  </tr>
                ) : logs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center" style={{ color: INK_FAINT }}>
                      No audit records logged yet.
                    </td>
                  </tr>
                ) : (
                  logs.map(log => (
                    <tr key={log.id} className="transition-colors hover:bg-[#F6F4EE]">
                      <td className="py-3 px-4 whitespace-nowrap font-mono text-xs" style={{ color: INK_SOFT }}>
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap font-medium" style={{ color: INK }}>
                        {log.userName}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="text-xs font-medium px-2 py-0.5 rounded border" style={{ borderColor: LINE, color: INK_SOFT }}>
                          {log.userRole}
                        </span>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap font-semibold" style={{ color: INK }}>
                        {log.action}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap" style={{ color: INK_SOFT }}>
                        {log.entity}
                      </td>
                      <td className="py-3 px-4 leading-relaxed max-w-md" style={{ color: INK_SOFT }}>
                        {log.details}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="px-4 pb-4">
            <PaginationBar
              page={auditPage}
              totalPages={auditTotalPages}
              total={auditTotal}
              isLoading={isLoadingLogs}
              onPageChange={page => setAuditPage(page)}
              label="audit entries"
            />
          </div>
        </div>
      )}

      {/* TAB 3: DEPARTMENTS */}
      {activeTab === 'departments' && (
        <div className="bg-white border rounded-lg overflow-hidden" style={{ borderColor: LINE }}>
          <div className="p-4 border-b flex items-center justify-between" style={{ borderColor: LINE }}>
            <div>
              <h4 className="text-sm font-semibold" style={{ color: INK }}>Departments</h4>
              <p className="text-sm" style={{ color: INK_SOFT }}>
                Create departments and assign one role — team members inherit it
              </p>
            </div>
            <button
              onClick={openCreateDept}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-white rounded-md text-sm font-medium transition-colors"
              style={{ backgroundColor: MARINE }}
            >
              <Plus className="w-4 h-4" />
              Add department
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b" style={{ borderColor: LINE, color: INK_FAINT }}>
                  <th className="py-3 px-4 font-medium text-xs">Name</th>
                  <th className="py-3 px-4 font-medium text-xs">Description</th>
                  <th className="py-3 px-4 font-medium text-xs">Status</th>
                  <th className="py-3 px-4 font-medium text-xs">Assigned role</th>
                  <th className="py-3 px-4 font-medium text-xs">Members</th>
                  <th className="py-3 px-4 font-medium text-xs text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: LINE }}>
                {isLoadingDepartments ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center" style={{ color: INK_FAINT }}>
                      Loading departments…
                    </td>
                  </tr>
                ) : departments.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center" style={{ color: INK_FAINT }}>
                      No departments created yet.
                    </td>
                  </tr>
                ) : (
                  departments.map(dept => (
                    <tr key={dept.id} className="transition-colors hover:bg-[#F6F4EE]">
                      <td className="py-3 px-4 font-semibold whitespace-nowrap" style={{ color: INK }}>
                        {dept.name}
                      </td>
                      <td className="py-3 px-4 max-w-md" style={{ color: INK_SOFT }}>
                        {dept.description || '—'}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border"
                          style={
                            dept.status === 'active'
                              ? { backgroundColor: MARINE_TINT, color: MARINE, borderColor: MARINE }
                              : { backgroundColor: PAPER, color: INK_FAINT, borderColor: LINE }
                          }
                        >
                          <span className="w-1.5 h-1.5 rounded-full mr-1 bg-current" />
                          {dept.status === 'active' ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap" style={{ color: INK_SOFT }}>
                        {dept.defaultRoleName || '—'}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap" style={{ color: INK_SOFT }}>
                        {dept.memberCount ?? 0}
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => openEditDept(dept)}
                            className="p-2 rounded-md transition-colors hover:bg-[#F6F4EE]"
                            style={{ color: INK_SOFT }}
                            title="Edit department"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          {dept.status === 'active' ? (
                            <button
                              onClick={() => handleDeactivateDept(dept)}
                              className="p-2 rounded-md transition-colors"
                              style={{ color: INK_FAINT }}
                              onMouseEnter={e => {
                                e.currentTarget.style.color = BRASS;
                                e.currentTarget.style.backgroundColor = BRASS_TINT;
                              }}
                              onMouseLeave={e => {
                                e.currentTarget.style.color = INK_FAINT;
                                e.currentTarget.style.backgroundColor = 'transparent';
                              }}
                              title="Deactivate department"
                            >
                              <Power className="w-4 h-4" />
                            </button>
                          ) : (
                            <button
                              onClick={() => handleActivateDept(dept)}
                              className="p-2 rounded-md transition-colors"
                              style={{ color: INK_FAINT }}
                              onMouseEnter={e => {
                                e.currentTarget.style.color = MARINE;
                                e.currentTarget.style.backgroundColor = MARINE_TINT;
                              }}
                              onMouseLeave={e => {
                                e.currentTarget.style.color = INK_FAINT;
                                e.currentTarget.style.backgroundColor = 'transparent';
                              }}
                              title="Activate department"
                            >
                              <Power className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteDept(dept)}
                            className="p-2 rounded-md transition-colors"
                            style={{ color: INK_FAINT }}
                            onMouseEnter={e => {
                              e.currentTarget.style.color = RUST;
                              e.currentTarget.style.backgroundColor = RUST_TINT;
                            }}
                            onMouseLeave={e => {
                              e.currentTarget.style.color = INK_FAINT;
                              e.currentTarget.style.backgroundColor = 'transparent';
                            }}
                            title="Delete department"
                          >
                            <Trash2 className="w-4 h-4" />
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
        title={editingDept ? 'Edit department' : 'Add department'}
        subtitle={
          editingDept
            ? editingDept.name
            : 'Create a department and assign one role — team members inherit it'
        }
      >
        <form onSubmit={handleSubmitDept} className="space-y-4 text-sm">
          <div>
            <label className={labelClass} style={{ color: INK_SOFT }}>Department name</label>
            <input
              type="text"
              required
              value={deptForm.name}
              onChange={e => setDeptForm({ ...deptForm, name: e.target.value })}
              placeholder="Sales & Export Desk"
              className={inputClass}
              style={{ borderColor: LINE, color: INK }}
            />
          </div>
          <div>
            <label className={labelClass} style={{ color: INK_SOFT }}>Description</label>
            <textarea
              rows={3}
              value={deptForm.description}
              onChange={e => setDeptForm({ ...deptForm, description: e.target.value })}
              placeholder="Optional short description"
              className={inputClass}
              style={{ borderColor: LINE, color: INK }}
            />
          </div>
          <div>
            <label className={labelClass} style={{ color: INK_SOFT }}>Assigned role</label>
            <SearchableSelect
              options={roleOptions}
              value={deptForm.defaultRoleId}
              onChange={v => setDeptForm({ ...deptForm, defaultRoleId: v })}
              placeholder="Select role…"
            />
            <p className="text-xs mt-1.5" style={{ color: INK_FAINT }}>
              Every team member added to this department gets this role and its permissions.
            </p>
          </div>
          <div className="flex justify-end gap-2 pt-3 border-t" style={{ borderColor: LINE }}>
            <button
              type="button"
              onClick={() => setIsDeptModalOpen(false)}
              className="px-4 py-2.5 rounded-md border font-medium text-sm transition-colors hover:bg-[#F6F4EE]"
              style={{ borderColor: LINE, color: INK }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmittingDept}
              className="px-5 py-2.5 rounded-md text-white font-medium text-sm disabled:opacity-50 transition-colors"
              style={{ backgroundColor: MARINE }}
            >
              {isSubmittingDept ? 'Saving…' : editingDept ? 'Save changes' : 'Create department'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Add / Edit Role Modal */}
      <Modal
        isOpen={isRoleModalOpen}
        onClose={() => setIsRoleModalOpen(false)}
        title={editingRole ? 'Edit role' : 'Add role'}
        subtitle={
          editingRole
            ? `${editingRole.name} — configure display name and data visibility`
            : 'Create a custom role with its own permission matrix'
        }
      >
        <form onSubmit={handleSubmitRole} className="space-y-4 text-sm">
          <div>
            <label className={labelClass} style={{ color: INK_SOFT }}>Role name</label>
            <input
              type="text"
              required
              value={roleForm.displayName}
              onChange={e => setRoleForm({ ...roleForm, displayName: e.target.value })}
              placeholder="Export Desk Lead"
              className={inputClass}
              style={{ borderColor: LINE, color: INK }}
            />
          </div>
          <div>
            <label className={labelClass} style={{ color: INK_SOFT }}>Description</label>
            <textarea
              rows={2}
              value={roleForm.description}
              onChange={e => setRoleForm({ ...roleForm, description: e.target.value })}
              placeholder="What this role is responsible for"
              className={inputClass}
              style={{ borderColor: LINE, color: INK }}
            />
          </div>
          <div>
            <label className={labelClass} style={{ color: INK_SOFT }}>Data visibility scope</label>
            <SearchableSelect
              options={VISIBILITY_OPTIONS}
              value={roleForm.visibilityScope}
              onChange={v => setRoleForm({ ...roleForm, visibilityScope: v as VisibilityScope })}
            />
            <p className="text-xs mt-1.5" style={{ color: INK_FAINT }}>
              Controls how much data users with this role can see beyond their own records.
            </p>
          </div>
          <div className="flex justify-end gap-2 pt-3 border-t" style={{ borderColor: LINE }}>
            <button
              type="button"
              onClick={() => setIsRoleModalOpen(false)}
              className="px-4 py-2.5 rounded-md border font-medium text-sm transition-colors hover:bg-[#F6F4EE]"
              style={{ borderColor: LINE, color: INK }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmittingRole}
              className="px-5 py-2.5 rounded-md text-white font-medium text-sm disabled:opacity-50 transition-colors"
              style={{ backgroundColor: MARINE }}
            >
              {isSubmittingRole ? 'Saving…' : editingRole ? 'Save changes' : 'Create role'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};