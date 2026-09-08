/**
 * Verify quotation view, accept, and build-order flow.
 * Usage: npx tsx src/scripts/verify-quotation-flow.ts
 */
import "dotenv/config";

const BASE = process.env.CRM_API_URL || "http://localhost:5000/api";

async function login(email: string, password: string) {
  const res = await fetch(`${BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const payload = (await res.json()) as { data?: { token: string } };
  if (!payload.data?.token) throw new Error(`Login failed for ${email}`);
  return payload.data.token;
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
  const body = await res.json();
  return { status: res.status, body };
}

async function main() {
  const token = await login("admin@videhaoverseas.com", "admin123");

  const list = await api(token, "/quotations?limit=5");
  const quotations = list.body.data as Array<{ id: string; quotationCode: string; status: string; revision?: number; leadId?: string }>;
  console.log("Quotations:", quotations.length);

  if (quotations.length === 0) {
    console.log("No quotations to test.");
    return;
  }

  const q = quotations[0];
  console.log(`\nTesting ${q.quotationCode} (${q.status})`);

  const detail = await api(token, `/quotations/${q.id}`);
  const d = detail.body.data as Record<string, unknown>;
  console.log("View detail fields:");
  console.log("  leadCode:", d.leadCode, "leadName:", d.leadName);
  console.log("  companyName:", d.companyName, "companyCountry:", d.companyCountry);
  console.log("  customerName:", d.customerName, "customerEmail:", d.customerEmail, "customerPhone:", d.customerPhone);

  if (q.status === "Accepted" && !d.orderId) {
    const draft = await api(token, `/quotations/${q.id}/order-draft`);
    console.log("\nOrder draft status:", draft.status, "alreadyLinked:", draft.body.data?.alreadyLinked);
    if (draft.body.data?.draft) {
      console.log("  customer:", draft.body.data.draft.customerName);
      console.log("  company:", draft.body.data.draft.company);
      console.log("  products:", draft.body.data.draft.products?.slice(0, 60));
    }

    const create1 = await api(token, `/quotations/${q.id}/order`, {
      method: "POST",
      body: JSON.stringify({
        revision: d.revision,
        clientRequestId: `test-order-${q.id}`,
        ...draft.body.data.draft,
      }),
    });
    console.log("\nCreate order #1:", create1.status, create1.body.data?.order?.orderCode);

    const create2 = await api(token, `/quotations/${q.id}/order`, {
      method: "POST",
      body: JSON.stringify({
        revision: create1.body.data?.quotation?.revision ?? d.revision,
        clientRequestId: `test-order-${q.id}`,
        ...draft.body.data.draft,
      }),
    });
    console.log("Create order #2 (retry):", create2.status, "alreadyExists:", create2.body.data?.alreadyExists);
  } else {
    console.log("\nSkipping build-order test (status not Accepted or order already linked).");
  }

  // nextOrderCode sanity via codes logic
  const { nextOrderCode } = await import("../utils/codes");
  const code = await nextOrderCode();
  console.log("\nNext order code would be:", code);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
