import React, { useState, useEffect } from "react";
import {
  Plus,
  Phone,
  Shield,
  AlertTriangle,
  Edit2,
  Power,
  LayoutGrid,
  List,
  MapPin,
  Mail,
  Building2,
  Lock,
  Briefcase,
  Loader2,
} from "lucide-react";
import { api } from "../../api/client";
import { User, Department } from "../../types/crm";
import { Modal } from "../../components/ui/Modal";
import { SearchableSelect } from "../../components/ui/SearchableSelect";
import { useAuth } from "../../context/AuthContext";
import { handleConflictWithReload, alertSaveError } from "../../lib/apiErrors";
import { PaginationBar } from "../../components/ui/PaginationBar";
import { LIST_PAGE_SIZE } from "../../lib/pagination";

const emptyMemberForm = {
  name: "",
  email: "",
  password: "",
  phone: "",
  departmentId: "",
  designation: "",
};

function initials(name?: string | null) {
  if (!name) return "?";
  return name.slice(0, 2).toUpperCase();
}

const inputClass =
  "w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-emerald-500 transition bg-white text-slate-800";

// Hoisted OUTSIDE of TeamPage so it keeps a stable component identity
// across renders. Defining this inside TeamPage would create a brand
// new function on every render, causing React to unmount/remount the
// subtree (and any focused <input> inside it) on every keystroke.
const FormSection: React.FC<{
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}> = ({ icon, title, children }) => (
  <div className="rounded-xl border border-slate-200 p-3.5">
    <div className="flex items-center gap-1.5 mb-3 text-slate-500">
      {icon}
      <p className="text-[11px] font-bold uppercase tracking-wider">{title}</p>
    </div>
    <div className="space-y-3">{children}</div>
  </div>
);

export const TeamPage: React.FC = () => {
  const { hasPermission } = useAuth();

  const [members, setMembers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalMembers, setTotalMembers] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // View Mode: Cards (default) or Table
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");

  // Add Member Modal
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newMemberForm, setNewMemberForm] = useState(emptyMemberForm);
  const [isSubmittingCreate, setIsSubmittingCreate] = useState(false);

  // Edit Member Modal
  const [editingMember, setEditingMember] = useState<User | null>(null);
  const [isLoadingMemberDetail, setIsLoadingMemberDetail] = useState(false);
  const [editForm, setEditForm] = useState({
    name: "",
    phone: "",
    departmentId: "",
    designation: "",
  });
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);

  const fetchDepartments = async () => {
    try {
      const dRes = await api.departments.getDepartments("active");
      if (dRes.success) setDepartments(dRes.data);
    } catch (err) {
      console.error("Failed to load departments:", err);
    }
  };

  // List endpoint returns a lightweight/partial projection of each member
  // (id, name, email, role, status, workload counters, etc.) — enough to
  // render the directory without paying for full profile payloads on
  // every page turn.
  const fetchData = async (page = currentPage) => {
    setIsLoading(true);
    try {
      const [uRes] = await Promise.all([
        api.users.getUsers({ page, limit: LIST_PAGE_SIZE }),
        fetchDepartments(),
      ]);
      if (uRes.success) {
        setMembers(uRes.data);
        setTotalMembers(uRes.total);
        setCurrentPage(uRes.page);
        setTotalPages(uRes.totalPages);
      }
    } catch (err) {
      console.error("Failed to load team data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData(currentPage);
  }, [currentPage]);

  const roleNameFromDepartment = (departmentId: string) => {
    const dept = departments.find((d) => d.id === departmentId);
    return dept?.defaultRoleName || "—";
  };

  const departmentHasRole = (departmentId: string) => {
    const dept = departments.find((d) => d.id === departmentId);
    return Boolean(dept?.defaultRoleId);
  };

  const handleCreateMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberForm.departmentId) {
      alert("Select a department for this team member.");
      return;
    }
    if (!departmentHasRole(newMemberForm.departmentId)) {
      alert(
        "This department has no assigned role. Assign a role to the department in Settings → Departments first.",
      );
      return;
    }
    setIsSubmittingCreate(true);
    try {
      const res = await api.users.createUser({
        name: newMemberForm.name,
        email: newMemberForm.email,
        password: newMemberForm.password,
        phone: newMemberForm.phone || undefined,
        departmentId: newMemberForm.departmentId,
        designation: newMemberForm.designation || undefined,
      });
      if (res.success) {
        setIsCreateOpen(false);
        setNewMemberForm(emptyMemberForm);
        fetchData(1);
      }
    } catch (err: unknown) {
      alertSaveError(err, "Failed to add team member");
    } finally {
      setIsSubmittingCreate(false);
    }
  };

  // Opens the modal immediately using the partial row already in memory,
  // then fetches the full member record in the background and reconciles
  // the form once it lands. Keeps the list payload light while still
  // giving the edit form complete, up-to-date data (including any fields
  // the list projection omits).
  const handleOpenEdit = async (member: User) => {
    void fetchDepartments();

    setEditingMember(member);
    setEditForm({
      name: member.name,
      phone: member.phone || "",
      departmentId: member.departmentId || "",
      designation: member.designation || "",
    });

    setIsLoadingMemberDetail(true);
    try {
      const res = await api.users.getUser(member.id);
      if (res.success) {
        const full = res.data;
        setEditingMember(full);
        setEditForm({
          name: full.name,
          phone: full.phone || "",
          departmentId: full.departmentId || "",
          designation: full.designation || "",
        });
      }
    } catch (err) {
      console.error("Failed to load member details:", err);
    } finally {
      setIsLoadingMemberDetail(false);
    }
  };

  const handleUpdateMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMember) return;
    if (!editForm.departmentId) {
      alert("Select a department for this team member.");
      return;
    }
    if (!departmentHasRole(editForm.departmentId)) {
      alert(
        "This department has no assigned role. Assign a role to the department in Settings → Departments first.",
      );
      return;
    }
    setIsSubmittingEdit(true);
    try {
      const res = await api.users.updateUser(editingMember.id, {
        name: editForm.name,
        phone: editForm.phone || undefined,
        departmentId: editForm.departmentId,
        designation: editForm.designation || undefined,
        revision: editingMember.revision,
      });
      if (res.success) {
        setEditingMember(null);
        fetchData(currentPage);
      }
    } catch (err: unknown) {
      if (editingMember) {
        await handleConflictWithReload(
          err,
          () => fetchData(currentPage),
          "Failed to update member",
        );
      } else {
        alertSaveError(err, "Failed to update member");
      }
    } finally {
      setIsSubmittingEdit(false);
    }
  };

  const handleToggleStatus = async (member: User) => {
    const newStatus = member.status === "active" ? "inactive" : "active";
    const confirmMsg = `Are you sure you want to ${
      newStatus === "active" ? "activate" : "deactivate"
    } access for ${member.name}?`;
    if (!confirm(confirmMsg)) return;

    try {
      await api.users.toggleStatus(member.id, newStatus, member.revision);
      fetchData(currentPage);
    } catch (err: unknown) {
      await handleConflictWithReload(
        err,
        () => fetchData(currentPage),
        "Failed to update member status",
      );
    }
  };

  const departmentName = (member: User) => {
    if (member.department) return member.department;
    const match = departments.find((d) => d.id === member.departmentId);
    return match?.name || "—";
  };

  const departmentOptions = departments.map((d) => ({
    value: d.id,
    label: d.defaultRoleName ? `${d.name} (${d.defaultRoleName})` : d.name,
    description: d.defaultRoleName ? undefined : "No default role assigned",
  }));

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-xl font-bold text-slate-900">
            Team Directory & Workload
          </h3>
          <p className="text-sm text-slate-500 mt-1">
            Monitor active workloads, overdue tasks by staff, and departmental
            RBAC assignments
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* View Mode Toggle */}
          <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200">
            <button
              onClick={() => setViewMode("cards")}
              className={`px-2.5 py-1.5 rounded-md text-sm font-medium flex items-center gap-1.5 transition-all ${
                viewMode === "cards"
                  ? "bg-white text-emerald-700 shadow-sm"
                  : "text-slate-600 hover:text-slate-800"
              }`}
              title="Card Form View"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Cards</span>
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`px-2.5 py-1.5 rounded-md text-sm font-medium flex items-center gap-1.5 transition-all ${
                viewMode === "table"
                  ? "bg-white text-emerald-700 shadow-sm"
                  : "text-slate-600 hover:text-slate-800"
              }`}
              title="Table View"
            >
              <List className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Table</span>
            </button>
          </div>

          {hasPermission("users.create") && (
            <button
              onClick={() => {
                setNewMemberForm(emptyMemberForm);
                void fetchDepartments();
                setIsCreateOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Add Team Member</span>
            </button>
          )}
        </div>
      </div>

      {/* Content: Cards View (Default) or Table View */}
      {viewMode === "cards" ? (
        <div>
          {isLoading ? (
            <div className="py-16 text-center text-slate-400 bg-white border border-slate-200 rounded-2xl animate-pulse">
              Loading team directory in card view...
            </div>
          ) : members.length === 0 ? (
            <div className="py-16 text-center text-slate-400 bg-white border border-slate-200 rounded-2xl">
              No team members registered yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {members.map((member) => (
                <div
                  key={member.id}
                  className="bg-white border border-slate-200 hover:border-emerald-300 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group"
                >
                  <div>
                    {/* Top Bar: Avatar, Name, Role, Status */}
                    <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-sm shadow-sm shrink-0">
                          {initials(member.name)}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <h4 className="text-sm font-semibold text-slate-800 leading-tight">
                              {member.name}
                            </h4>
                            {member.employeeId && (
                              <span className="text-[11px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded font-medium">
                                {member.employeeId}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 truncate max-w-[160px]">
                            {member.email}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border ${
                            member.status === "active"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : "bg-slate-100 text-slate-500 border-slate-200"
                          }`}
                        >
                          <span className="w-1.5 h-1.5 rounded-full mr-1 bg-current" />
                          {member.status === "active" ? "Active" : "Inactive"}
                        </span>
                        <span className="inline-flex items-center gap-1 font-medium text-slate-700 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                          <Shield className="w-2.5 h-2.5 text-slate-500" />
                          {member.roleDisplayName || member.roleName}
                        </span>
                      </div>
                    </div>

                    {/* Department & Designation */}
                    <div className="mt-3 space-y-1.5">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-500 font-medium">
                          Designation:
                        </span>
                        <span className="font-semibold text-slate-800">
                          {member.designation || "—"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-500 font-medium">
                          Department:
                        </span>
                        <span className="text-slate-700">
                          {departmentName(member)}
                        </span>
                      </div>
                      {member.assignedTerritory && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-500 font-medium">
                            Territory:
                          </span>
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-800 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded">
                            <MapPin className="w-2.5 h-2.5 text-emerald-600" />
                            {member.assignedTerritory}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Phone */}
                    <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
                      {member.phone ? (
                        <a
                          href={`tel:${member.phone}`}
                          className="hover:text-emerald-700 flex items-center gap-1 font-medium transition-colors"
                        >
                          <Phone className="w-3 h-3 text-slate-400" />
                          {member.phone}
                        </a>
                      ) : (
                        <span className="text-slate-400">No phone listed</span>
                      )}

                      <span className="text-[11px] text-slate-400">
                        Joined{" "}
                        {new Date(member.createdAt).toLocaleDateString([], {
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    </div>

                    {/* Workload Stats Row */}
                    <div className="grid grid-cols-3 gap-2 mt-3 text-center text-sm">
                      <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                        <span className="text-[11px] text-slate-400 block font-medium">
                          Active Tasks
                        </span>
                        <span className="font-bold text-slate-800">
                          {member.activeTasks || 0}
                        </span>
                      </div>
                      <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                        <span className="text-[11px] text-slate-400 block font-medium">
                          Overdue
                        </span>
                        {(member.overdueTasks || 0) > 0 ? (
                          <span className="font-bold text-rose-700 flex items-center justify-center gap-1">
                            <AlertTriangle className="w-2.5 h-2.5" />
                            {member.overdueTasks}
                          </span>
                        ) : (
                          <span className="font-semibold text-emerald-700">
                            0
                          </span>
                        )}
                      </div>
                      <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                        <span className="text-[11px] text-slate-400 block font-medium">
                          Leads
                        </span>
                        <span className="font-bold text-slate-800">
                          {member.leadsAssigned || 0}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Card Footer Actions */}
                  <div className="mt-4 pt-2.5 border-t border-slate-100 flex items-center justify-end gap-1.5">
                    {hasPermission("users.edit") && (
                      <button
                        onClick={() => handleOpenEdit(member)}
                        className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200/80 rounded-lg text-xs font-medium transition-colors flex items-center gap-1"
                      >
                        <Edit2 className="w-3 h-3" />
                        <span>Edit</span>
                      </button>
                    )}
                    {hasPermission("users.edit") &&
                      member.roleName !== "SUPER_ADMIN" && (
                        <button
                          onClick={() => handleToggleStatus(member)}
                          className={`p-1.5 rounded-lg border text-sm transition-colors ${
                            member.status === "active"
                              ? "text-slate-500 hover:text-rose-600 hover:bg-rose-50 border-slate-200"
                              : "text-teal-700 hover:bg-teal-50 border-teal-200"
                          }`}
                          title={
                            member.status === "active"
                              ? "Deactivate Member"
                              : "Activate Member"
                          }
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
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-semibold text-[11px] uppercase tracking-wide">
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
                    <td
                      colSpan={10}
                      className="py-12 text-center text-slate-400 animate-pulse"
                    >
                      Loading team members...
                    </td>
                  </tr>
                ) : members.length === 0 ? (
                  <tr>
                    <td
                      colSpan={10}
                      className="py-12 text-center text-slate-400"
                    >
                      No team members found.
                    </td>
                  </tr>
                ) : (
                  members.map((member) => (
                    <tr
                      key={member.id}
                      className="hover:bg-slate-50/70 transition-colors"
                    >
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                            {initials(member.name)}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-800">
                              {member.name}
                            </p>
                            <p className="text-xs text-slate-500">
                              {member.email}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 font-medium text-slate-800 bg-slate-100 px-2 py-0.5 rounded text-xs">
                          <Shield className="w-3 h-3 text-slate-500" />
                          {member.roleDisplayName || member.roleName}
                        </span>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          {departmentName(member)}
                        </p>
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        <p className="font-medium text-slate-800">
                          {member.designation || "—"}
                        </p>
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap text-slate-600">
                        {member.phone ? (
                          <a
                            href={`tel:${member.phone}`}
                            className="hover:text-emerald-700 flex items-center gap-1 text-xs transition-colors"
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
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${
                            member.status === "active"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : "bg-slate-100 text-slate-500 border-slate-200"
                          }`}
                        >
                          <span className="w-1.5 h-1.5 rounded-full mr-1 bg-current" />
                          {member.status === "active" ? "Active" : "Inactive"}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <span className="inline-flex items-center justify-center font-medium text-slate-800 bg-slate-50 border border-slate-200 px-2.5 py-0.5 rounded">
                          {member.activeTasks || 0}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        {(member.overdueTasks || 0) > 0 ? (
                          <span className="inline-flex items-center gap-1 font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded text-xs">
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

                      <td className="py-3 px-4 whitespace-nowrap text-slate-500 text-xs">
                        {new Date(member.createdAt).toLocaleDateString([], {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </td>

                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          {hasPermission("users.edit") && (
                            <button
                              onClick={() => handleOpenEdit(member)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 transition-colors"
                              title="Edit Role & Details"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {hasPermission("users.edit") &&
                            member.roleName !== "SUPER_ADMIN" && (
                              <button
                                onClick={() => handleToggleStatus(member)}
                                className={`p-1.5 rounded-lg transition-colors ${
                                  member.status === "active"
                                    ? "text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                                    : "text-slate-400 hover:text-teal-700 hover:bg-teal-50"
                                }`}
                                title={
                                  member.status === "active"
                                    ? "Deactivate Member"
                                    : "Activate Member"
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

      <PaginationBar
        page={currentPage}
        totalPages={totalPages}
        total={totalMembers}
        isLoading={isLoading}
        onPageChange={(page) => setCurrentPage(page)}
        label="members"
      />

      {/* ADD TEAM MEMBER MODAL */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Add New Team Member"
        subtitle="Assign a department — the role is inherited from that department"
        maxWidth="lg"
      >
        <form
          onSubmit={handleCreateMember}
          className="flex flex-col max-h-[75vh] text-sm"
        >
          <div className="flex-1 overflow-y-auto px-1 space-y-3">
            <FormSection
              icon={<Mail className="w-3.5 h-3.5" />}
              title="Account Details"
            >
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1.5">
                    Full Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={newMemberForm.name}
                    onChange={(e) =>
                      setNewMemberForm({
                        ...newMemberForm,
                        name: e.target.value,
                      })
                    }
                    placeholder="e.g. Samir Varma"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1.5">
                    Corporate Email <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={newMemberForm.email}
                    onChange={(e) =>
                      setNewMemberForm({
                        ...newMemberForm,
                        email: e.target.value,
                      })
                    }
                    placeholder="samir@videhaoverseas.com"
                    className={inputClass}
                  />
                </div>
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1.5 flex items-center gap-1">
                  <Lock className="w-3.5 h-3.5" /> Temporary Password{" "}
                  <span className="text-rose-500">*</span>
                </label>
                <input
                  type="password"
                  required
                  value={newMemberForm.password}
                  onChange={(e) =>
                    setNewMemberForm({
                      ...newMemberForm,
                      password: e.target.value,
                    })
                  }
                  placeholder="At least 6 characters"
                  className={inputClass}
                />
              </div>
            </FormSection>

            <FormSection
              icon={<Building2 className="w-3.5 h-3.5" />}
              title="Role & Department"
            >
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1.5">
                    Department <span className="text-rose-500">*</span>
                  </label>
                  <SearchableSelect
                    options={departmentOptions}
                    value={newMemberForm.departmentId}
                    onChange={(departmentId) =>
                      setNewMemberForm({ ...newMemberForm, departmentId })
                    }
                    placeholder="Select department…"
                    searchPlaceholder="Search departments…"
                  />
                  {departments.length === 0 && (
                    <p className="text-[11px] text-amber-700 mt-1.5">
                      No departments yet. Create a role and department in
                      Settings first.
                    </p>
                  )}
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1.5">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    value={newMemberForm.phone}
                    onChange={(e) =>
                      setNewMemberForm({
                        ...newMemberForm,
                        phone: e.target.value,
                      })
                    }
                    placeholder="+91 98765 43210"
                    className={inputClass}
                  />
                </div>
              </div>

              {newMemberForm.departmentId && (
                <div
                  className={`p-3 rounded-lg border text-xs ${
                    departmentHasRole(newMemberForm.departmentId)
                      ? "border-emerald-100 bg-emerald-50/60 text-emerald-900"
                      : "border-amber-200 bg-amber-50/60 text-amber-900"
                  }`}
                >
                  {departmentHasRole(newMemberForm.departmentId) ? (
                    <>
                      <span className="font-semibold">Assigned role:</span>{" "}
                      {roleNameFromDepartment(newMemberForm.departmentId)}
                      <span className="text-emerald-700/80">
                        {" "}
                        — inherited from the selected department
                      </span>
                    </>
                  ) : (
                    <>
                      This department has no role assigned yet. Edit it under
                      Settings → Departments and assign a role before adding a
                      member.
                    </>
                  )}
                </div>
              )}

              <div>
                <label className="block font-semibold text-slate-700 mb-1.5 flex items-center gap-1">
                  <Briefcase className="w-3.5 h-3.5" /> Official Designation
                </label>
                <input
                  type="text"
                  value={newMemberForm.designation}
                  onChange={(e) =>
                    setNewMemberForm({
                      ...newMemberForm,
                      designation: e.target.value,
                    })
                  }
                  placeholder="e.g. Export Sales Manager"
                  className={inputClass}
                />
              </div>
            </FormSection>
          </div>

          <div className="flex justify-end gap-2 pt-3 mt-3 border-t border-slate-100 shrink-0">
            <button
              type="button"
              onClick={() => setIsCreateOpen(false)}
              className="px-4 py-2.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 font-medium transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmittingCreate}
              className="px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
            >
              {isSubmittingCreate ? "Saving..." : "Add Team Member"}
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
        <form
          onSubmit={handleUpdateMember}
          className="flex flex-col max-h-[75vh] text-sm"
        >
          <div className="flex-1 overflow-y-auto px-1 space-y-3 relative">
            {isLoadingMemberDetail && (
              <div className="absolute inset-0 z-10 flex items-center justify-center gap-2 bg-white/70 backdrop-blur-[1px] text-slate-500 text-xs font-medium rounded-xl">
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading full profile…
              </div>
            )}
            <FormSection
              icon={<Building2 className="w-3.5 h-3.5" />}
              title="Profile & Department"
            >
              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editForm.name}
                  onChange={(e) =>
                    setEditForm({ ...editForm, name: e.target.value })
                  }
                  className={inputClass}
                  disabled={isLoadingMemberDetail}
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">
                  Department <span className="text-rose-500">*</span>
                </label>
                <SearchableSelect
                  options={departmentOptions}
                  value={editForm.departmentId}
                  onChange={(departmentId) =>
                    setEditForm({ ...editForm, departmentId })
                  }
                  placeholder="Select department…"
                  searchPlaceholder="Search departments…"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1.5">
                    Phone
                  </label>
                  <input
                    type="text"
                    value={editForm.phone}
                    onChange={(e) =>
                      setEditForm({ ...editForm, phone: e.target.value })
                    }
                    className={inputClass}
                    disabled={isLoadingMemberDetail}
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1.5">
                    Official Designation
                  </label>
                  <input
                    type="text"
                    value={editForm.designation}
                    onChange={(e) =>
                      setEditForm({ ...editForm, designation: e.target.value })
                    }
                    className={inputClass}
                    disabled={isLoadingMemberDetail}
                  />
                </div>
              </div>
            </FormSection>
          </div>

          <div className="flex justify-end gap-2 pt-3 mt-3 border-t border-slate-100 shrink-0">
            <button
              type="button"
              onClick={() => setEditingMember(null)}
              className="px-4 py-2.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 font-medium transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmittingEdit || isLoadingMemberDetail}
              className="px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
            >
              {isSubmittingEdit ? "Updating..." : "Save Changes"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
