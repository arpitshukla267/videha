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
  {
    code: "leads.convert",
    name: "Convert Leads",
    category: "leads",
    description: "Convert qualified leads into customer accounts",
  },
  {
    code: "followups.view",
    name: "View Follow-ups",
    category: "leads",
    description: "View scheduled lead follow-ups",
  },
  {
    code: "followups.create",
    name: "Create Follow-ups",
    category: "leads",
    description: "Schedule lead follow-ups",
  },
  {
    code: "followups.edit",
    name: "Edit Follow-ups",
    category: "leads",
    description: "Update, complete, or skip follow-ups",
  },
  {
    code: "companies.view",
    name: "View Companies",
    category: "leads",
    description: "View B2B company accounts",
  },
  {
    code: "companies.create",
    name: "Create Companies",
    category: "leads",
    description: "Create B2B company accounts",
  },
  {
    code: "companies.edit",
    name: "Edit Companies",
    category: "leads",
    description: "Edit B2B company accounts",
  },
  {
    code: "customers.view",
    name: "View Customers",
    category: "leads",
    description: "View customer contacts",
  },
  {
    code: "customers.create",
    name: "Create Customers",
    category: "leads",
    description: "Create customer contacts",
  },
  {
    code: "customers.edit",
    name: "Edit Customers",
    category: "leads",
    description: "Edit customer contacts",
  },
  {
    code: "quotations.view",
    name: "View Quotations",
    category: "leads",
    description: "View sales quotations",
  },
  {
    code: "quotations.create",
    name: "Create Quotations",
    category: "leads",
    description: "Create sales quotations",
  },
  {
    code: "quotations.edit",
    name: "Edit Quotations",
    category: "leads",
    description: "Edit quotations and change status",
  },
  {
    code: "quotations.delete",
    name: "Delete Quotations",
    category: "leads",
    description: "Delete draft quotations",
  },
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
    code: "finance.view",
    name: "View Finance",
    category: "finance",
    description: "View revenue, due payments, and finance overview",
  },
  {
    code: "bills.view",
    name: "View Bills",
    category: "finance",
    description: "View invoices and bills from delivered orders",
  },
  {
    code: "bills.edit",
    name: "Edit Bills",
    category: "finance",
    description: "Edit invoices, record payments, and manage bill status",
  },
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
    "leads.convert",
    "followups.view",
    "followups.create",
    "followups.edit",
    "companies.view",
    "companies.create",
    "companies.edit",
    "customers.view",
    "customers.create",
    "customers.edit",
    "quotations.view",
    "quotations.create",
    "quotations.edit",
    "tasks.view",
    "tasks.create",
    "tasks.edit",
    "tasks.assign",
    "tasks.complete",
    "orders.view",
    "reports.view",
    "finance.view",
    "bills.view",
    "bills.edit",
  ],
  SALES_MEMBER: [
    "leads.view",
    "leads.create",
    "leads.edit",
    "leads.convert",
    "followups.view",
    "followups.create",
    "followups.edit",
    "companies.view",
    "customers.view",
    "quotations.view",
    "quotations.create",
    "quotations.edit",
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
  for (const code of defaults) {
    if (!permissions.includes(code)) {
      permissions.push(code);
    }
  }
  return permissions;
}
