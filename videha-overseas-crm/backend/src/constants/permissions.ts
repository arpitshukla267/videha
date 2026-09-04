export const PERMISSIONS = [
  {
    code: "dashboard.view",
    name: "View Dashboard",
    category: "dashboard",
    description: "View operations dashboard and KPIs",
  },
  { code: "users.view", name: "View Users", category: "users", description: "View team members" },
  { code: "users.create", name: "Create Users", category: "users", description: "Create team members" },
  { code: "users.edit", name: "Edit Users", category: "users", description: "Edit team members" },
  {
    code: "users.delete",
    name: "Deactivate Users",
    category: "users",
    description: "Activate/deactivate members",
  },
  { code: "leads.view", name: "View Leads", category: "leads", description: "View leads" },
  { code: "leads.create", name: "Create Leads", category: "leads", description: "Create leads" },
  { code: "leads.edit", name: "Edit Leads", category: "leads", description: "Edit leads" },
  { code: "leads.delete", name: "Delete Leads", category: "leads", description: "Delete/archive leads" },
  { code: "leads.assign", name: "Assign Leads", category: "leads", description: "Assign leads to members" },
  { code: "tasks.view", name: "View Tasks", category: "tasks", description: "View tasks" },
  { code: "tasks.create", name: "Create Tasks", category: "tasks", description: "Create tasks" },
  { code: "tasks.edit", name: "Edit Tasks", category: "tasks", description: "Edit tasks" },
  { code: "tasks.assign", name: "Assign Tasks", category: "tasks", description: "Reassign tasks" },
  { code: "tasks.complete", name: "Complete Tasks", category: "tasks", description: "Update task status" },
  { code: "orders.view", name: "View Orders", category: "orders", description: "View orders" },
  { code: "orders.create", name: "Create Orders", category: "orders", description: "Create orders" },
  { code: "orders.edit", name: "Edit Orders", category: "orders", description: "Edit orders" },
  {
    code: "orders.update_status",
    name: "Update Order Status",
    category: "orders",
    description: "Change order milestones",
  },
  { code: "reports.view", name: "View Reports", category: "reports", description: "View reports" },
  {
    code: "settings.manage",
    name: "Manage Settings",
    category: "settings",
    description: "Roles, departments, audit",
  },
  {
    code: "departments.manage",
    name: "Manage Departments",
    category: "settings",
    description: "Create/edit departments",
  },
] as const;

export type PermissionCode = (typeof PERMISSIONS)[number]["code"];

export const ALL_PERMISSION_CODES = PERMISSIONS.map((p) => p.code);

export const ROLE_PERMISSIONS: Record<string, string[]> = {
  SUPER_ADMIN: [...ALL_PERMISSION_CODES],
  ADMIN: [...ALL_PERMISSION_CODES],
  MANAGER: [
    "dashboard.view",
    "users.view",
    "leads.view",
    "leads.create",
    "leads.edit",
    "leads.assign",
    "tasks.view",
    "tasks.create",
    "tasks.edit",
    "tasks.assign",
    "tasks.complete",
    "orders.view",
    "reports.view",
  ],
  SALES_MEMBER: [
    "leads.view",
    "leads.create",
    "leads.edit",
    "tasks.view",
    "tasks.create",
    "tasks.edit",
    "tasks.complete",
  ],
  OPERATIONS: [
    "orders.view",
    "orders.create",
    "orders.edit",
    "orders.update_status",
    "tasks.view",
    "tasks.create",
    "tasks.edit",
    "tasks.complete",
  ],
};

/** Normalize permissions for a role, including soft-migration for new codes. */
export function resolveRolePermissions(
  roleName: string,
  stored: string[] | undefined | null,
): string[] {
  if (roleName === "SUPER_ADMIN" || roleName === "ADMIN") {
    return [...ALL_PERMISSION_CODES];
  }
  const permissions = stored ? [...stored] : [];
  const defaults = ROLE_PERMISSIONS[roleName] || [];
  // Soft-add newly introduced codes that belong to this role by default
  for (const code of defaults) {
    if (code === "dashboard.view" && !permissions.includes(code)) {
      permissions.push(code);
    }
  }
  return permissions;
}
