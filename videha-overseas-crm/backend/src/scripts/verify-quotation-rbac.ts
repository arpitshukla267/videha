/**
 * Verify quotation RBAC for Super Admin, Manager, and Sales Member.
 * Usage: npx tsx src/scripts/verify-quotation-rbac.ts
 */
import "dotenv/config";

const BASE = process.env.CRM_API_URL || "http://localhost:5000/api";

type Account = { email: string; password: string; label: string };

const ACCOUNTS: Account[] = [
  { email: "superadmin@videhaoverseas.com", password: "admin123", label: "Super Admin" },
  { email: "manager@videhaoverseas.com", password: "admin123", label: "Manager" },
  { email: "rahul.sharma@videhaoverseas.com", password: "sales123", label: "Sales (Rahul)" },
  { email: "priya.patel@videhaoverseas.com", password: "sales123", label: "Sales (Priya)" },
];

async function login(email: string, password: string) {
  const res = await fetch(`${BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const payload = (await res.json()) as { data?: { token: string; user: { id: string; roleName: string } } };
  if (!payload.data?.token) throw new Error(`Login failed: ${email}`);
  return payload.data;
}

async function api(token: string, path: string, init?: RequestInit) {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(init?.headers || {}),
    },
  });
  const body = await res.json().catch(() => ({}));
  return { status: res.status, body };
}

async function main() {
  const sessions = new Map<string, { token: string; userId: string; roleName: string }>();
  for (const acct of ACCOUNTS) {
    const data = await login(acct.email, acct.password);
    sessions.set(acct.label, { token: data.token, userId: data.user.id, roleName: data.user.roleName });
    console.log(`Logged in ${acct.label} (${data.user.roleName})`);
  }

  const admin = sessions.get("Super Admin")!;
  const adminList = await api(admin.token, "/quotations?limit=20");
  const quotations = adminList.body.data as Array<{
    id: string;
    quotationCode: string;
    status: string;
    assignedToId: string | null;
    createdById: string;
    revision?: number;
  }>;

  console.log(`\nTotal quotations visible to Super Admin: ${adminList.body.total}`);

  let draft = quotations.find((q) => q.status === "Draft");
  if (!draft) {
    const leads = await api(admin.token, "/leads?limit=1");
    const leadId = leads.body.items?.[0]?.id || leads.body.data?.[0]?.id;
    if (!leadId) throw new Error("No lead for test draft");
    const created = await api(admin.token, "/quotations", {
      method: "POST",
      body: JSON.stringify({
        title: "RBAC Test Draft",
        leadId,
        lineItems: [{ description: "Test item", quantity: "1", unitPrice: 100, discountPercent: 0, amount: 100 }],
        assignedToId: sessions.get("Sales (Rahul)")!.userId,
        clientRequestId: `rbac-draft-${Date.now()}`,
      }),
    });
    draft = created.body.data;
    console.log("Created test draft:", draft?.quotationCode, "assigned to Rahul");
  }

  if (!draft) throw new Error("No draft quotation available");

  const rahul = sessions.get("Sales (Rahul)")!;
  const priya = sessions.get("Sales (Priya)")!;
  const manager = sessions.get("Manager")!;

  // Priya must NOT edit Rahul's draft
  const priyaEdit = await api(priya.token, `/quotations/${draft.id}`, {
    method: "PUT",
    body: JSON.stringify({ title: "Hijack", revision: draft.revision }),
  });
  console.log(`\nPriya edit Rahul draft: ${priyaEdit.status} ${priyaEdit.body.message || priyaEdit.body.code}`);

  // Rahul CAN edit own/assigned draft
  const rahulEdit = await api(rahul.token, `/quotations/${draft.id}`, {
    method: "PUT",
    body: JSON.stringify({ title: "Rahul edit OK", revision: draft.revision }),
  });
  console.log(`Rahul edit assigned draft: ${rahulEdit.status}`);
  if (rahulEdit.body.data) draft.revision = rahulEdit.body.data.revision;

  // Priya must NOT send Rahul's draft
  const priyaSend = await api(priya.token, `/quotations/${draft.id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status: "Sent", revision: draft.revision }),
  });
  console.log(`Priya send Rahul draft: ${priyaSend.status} ${priyaSend.body.message || ""}`);

  // Manager CAN send department draft
  const managerSend = await api(manager.token, `/quotations/${draft.id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status: "Sent", revision: draft.revision }),
  });
  console.log(`Manager send draft: ${managerSend.status}`);
  if (managerSend.body.data?.quotation) draft.revision = managerSend.body.data.quotation.revision;

  // Rahul must NOT edit sent quotation
  const rahulEditSent = await api(rahul.token, `/quotations/${draft.id}`, {
    method: "PUT",
    body: JSON.stringify({ title: "Edit sent", revision: draft.revision }),
  });
  console.log(`Rahul edit sent quotation: ${rahulEditSent.status} ${rahulEditSent.body.message || ""}`);

  // Super Admin CAN edit sent (non-accepted)
  const adminEditSent = await api(admin.token, `/quotations/${draft.id}`, {
    method: "PUT",
    body: JSON.stringify({ notes: "Admin note", revision: draft.revision }),
  });
  console.log(`Super Admin edit sent quotation: ${adminEditSent.status}`);

  // List visibility for sales vs manager
  for (const label of ["Sales (Rahul)", "Sales (Priya)", "Manager"]) {
    const s = sessions.get(label)!;
    const list = await api(s.token, "/quotations?limit=20");
    console.log(`${label} sees ${list.body.total} quotation(s)`);
  }

  console.log("\nRBAC verification complete.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
