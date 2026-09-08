/**
 * End-to-end verification for documents, RBAC, quotations.
 * Usage: npx tsx src/scripts/verify-crm-fixes.ts
 */
import "dotenv/config";

const BASE = process.env.CRM_API_URL || "http://localhost:5000/api";

async function login(email: string, password: string) {
  const res = await fetch(`${BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) throw new Error(`Login failed for ${email}: ${res.status} ${await res.text()}`);
  const payload = (await res.json()) as {
    success?: boolean;
    data?: {
      token: string;
      user: { name: string; roleName: string };
    };
  };
  const data = payload.data;
  if (!data?.token) throw new Error(`Unexpected login response for ${email}`);
  return { token: data.token, user: data.user };
}

async function apiGet(path: string, token: string, binary = false) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (binary) {
    const buffer = await res.arrayBuffer();
    return { status: res.status, body: buffer, headers: res.headers };
  }
  const text = await res.text();
  let body: unknown = text;
  try {
    body = JSON.parse(text);
  } catch {
    /* plain text */
  }
  return { status: res.status, body, headers: res.headers };
}

async function verifyUser(email: string, password: string) {
  console.log(`\n=== ${email} ===`);
  const { token, user } = await login(email, password);
  console.log(`Role: ${user.roleName}`);

  const leads = await apiGet("/leads?limit=100", token);
  const leadBody = leads.body as { total?: number; data?: unknown[] };
  const leadTotal = leadBody.total ?? leadBody.data?.length ?? 0;
  console.log(`Leads: ${leadTotal}`);

  const docs = await apiGet("/documents?limit=100", token);
  const docBody = docs.body as { total?: number; data?: unknown[] };
  const docRows = docBody.data || [];
  console.log(`Documents: ${docBody.total ?? docRows.length}`);

  const quotes = await apiGet("/quotations?limit=100", token);
  const quoteBody = quotes.body as { total?: number; data?: unknown[] };
  const quoteRows = quoteBody.data || [];
  console.log(`Quotations: ${quoteBody.total ?? quoteRows.length}`);

  if (docRows.length > 0) {
    const doc = docRows[0] as { id: string; title: string; previewUrl?: string };
    console.log(`Testing preview for "${doc.title}" (${doc.id})`);
    const preview = await apiGet(
      `/documents/${doc.id}/file?disposition=inline`,
      token,
      true,
    );
    console.log(`  Preview status: ${preview.status}, content-type: ${preview.headers.get("content-type")}`);
    const download = await apiGet(
      `/documents/${doc.id}/file?disposition=attachment`,
      token,
      true,
    );
    console.log(`  Download status: ${download.status}, content-type: ${download.headers.get("content-type")}`);
    if (preview.status !== 200 || download.status !== 200) {
      console.log("  FAIL: document file endpoints");
    } else {
      console.log(`  OK: preview ${(preview.body as ArrayBuffer).byteLength} bytes, download ${(download.body as ArrayBuffer).byteLength} bytes`);
    }
  }

  if (quoteRows.length > 0) {
    const q = quoteRows[0] as {
      quotationCode?: string;
      leadId?: string;
      leadLabel?: string;
      companyId?: string;
      customerId?: string;
    };
    console.log(
      `Sample quotation: ${q.quotationCode} leadId=${q.leadId || "MISSING"} companyId=${q.companyId || "-"} customerId=${q.customerId || "-"}`,
    );
  }
}

async function main() {
  await verifyUser("admin@videhaoverseas.com", "admin123");
  await verifyUser("manager@videhaoverseas.com", "admin123");
  console.log("\nDone.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
