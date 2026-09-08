import "dotenv/config";
import mongoose from "mongoose";
import { backfillNullClientRequestIds } from "../db/backfillRevisions";
import { Lead } from "../models/Lead";
import { User } from "../models/User";
import { Quotation } from "../models/Quotation";
import { Order } from "../models/Order";
import { FollowUp } from "../models/FollowUp";
import * as importService from "../modules/import/import.service";
import type { AuthUser } from "../middleware/auth";
import type { ImportEntityType } from "../constants/importFields";

async function actorFromDb(): Promise<AuthUser> {
  const admin = await User.findOne({ status: "active" }).lean();
  if (!admin) throw new Error("No active user");
  return {
    id: String(admin._id),
    name: admin.name,
    email: admin.email,
    roleId: String(admin.roleId),
    roleName: "Admin",
    permissions: ["leads.create", "followups.create", "quotations.create", "orders.create"],
    departmentId: admin.departmentId ? String(admin.departmentId) : null,
  };
}

function file(csv: string): Express.Multer.File {
  return {
    buffer: Buffer.from(csv, "utf8"),
    originalname: "sample.csv",
    size: Buffer.byteLength(csv),
  } as Express.Multer.File;
}

async function runCase(
  label: string,
  entity: ImportEntityType,
  csv: string,
  actor: AuthUser,
  cleanup: () => Promise<void>,
) {
  await cleanup();
  const preview = await importService.previewImport(entity, file(csv), undefined, actor);
  console.log(`[${label}] preview:`, preview.summary);
  const confirm = await importService.confirmImport(preview.sessionId, actor);
  console.log(`[${label}] confirm:`, {
    processed: confirm.processed,
    imported: confirm.imported,
    failed: confirm.failed,
    skipped: confirm.skipped,
  });
  if (confirm.failed > 0) {
    for (const row of confirm.failedRows) {
      console.log(`  failed row ${row.rowNumber}:`, row.errors.join("; "));
    }
  }
  return confirm.imported === 5 && confirm.failed === 0;
}

async function main() {
  await mongoose.connect(process.env.MONGODB_URI!);
  await backfillNullClientRequestIds();
  const actor = await actorFromDb();
  const lead = await Lead.findOne({ archived: { $ne: true } }).select("leadCode company name").lean();
  const user = await User.findOne({ status: "active" }).select("name email").lean();
  if (!lead || !user) throw new Error("Need seed lead and user");

  const leadRef = lead.leadCode;
  const assigneeRef = user.email;

  const results: Record<string, boolean> = {};

  results.leads = await runCase(
    "leads",
    "leads",
    `Name,Company,Phone,Country,Email,Source,Product Interest,Status,Priority
Import One,Import Alpha,+1 555 1001,United States,imp1@test.com,Website,Spices,New,Medium
Import Two,Import Beta,+1 555 1002,United Kingdom,imp2@test.com,Trade Fair,Rice,New,High
Import Three,Import Gamma,+1 555 1003,Germany,imp3@test.com,Referral,Tea,New,Medium
Import Four,Import Delta,+1 555 1004,Japan,imp4@test.com,LinkedIn,Brassware,New,Low
Import Five,Import Epsilon,+1 555 1005,UAE,imp5@test.com,Direct Inquiry,Textiles,New,Urgent`,
    actor,
    async () => {
      await Lead.deleteMany({ email: { $regex: /^imp[1-5]@test\.com$/ } });
    },
  );

  results.followUps = await runCase(
    "follow-ups",
    "follow-ups",
    `lead,assignee,dueDate,type,notes
${leadRef},${assigneeRef},2026-12-01T10:00:00,Call,Import follow-up 1
${leadRef},${assigneeRef},2026-12-02T10:00:00,Email,Import follow-up 2
${leadRef},${assigneeRef},2026-12-03T10:00:00,WhatsApp,Import follow-up 3
${leadRef},${assigneeRef},2026-12-04T10:00:00,Meeting,Import follow-up 4
${leadRef},${assigneeRef},2026-12-05T10:00:00,Call,Import follow-up 5`,
    actor,
    async () => {
      await FollowUp.deleteMany({ notes: { $regex: /^Import follow-up / } });
    },
  );

  results.quotations = await runCase(
    "quotations",
    "quotations",
    `title,currency,status,totalAmount,leadCode,notes
Import Quote One,USD,Draft,1000,${leadRef},Notes 1
Import Quote Two,USD,Draft,2000,${leadRef},Notes 2
Import Quote Three,USD,Draft,3000,${leadRef},Notes 3
Import Quote Four,USD,Draft,4000,${leadRef},Notes 4
Import Quote Five,USD,Draft,5000,${leadRef},Notes 5`,
    actor,
    async () => {
      await Quotation.deleteMany({ title: { $regex: /^Import Quote / } });
    },
  );

  results.orders = await runCase(
    "orders",
    "orders",
    `customerName,company,country,products,phone,email,orderValue,currency,status
Buyer One,Order Co Alpha,United States,Brassware Sets,+1 555 2001,b1@test.com,5000,USD,Order Confirmed
Buyer Two,Order Co Beta,United Kingdom,Rice Bulk,+44 555 2002,b2@test.com,6000,USD,Order Confirmed
Buyer Three,Order Co Gamma,Germany,Spice Mix,+49 555 2003,b3@test.com,7000,USD,Order Confirmed
Buyer Four,Order Co Delta,Japan,Tea Leaves,+81 555 2004,b4@test.com,8000,USD,Order Confirmed
Buyer Five,Order Co Epsilon,UAE,Textiles,+971 555 2005,b5@test.com,9000,USD,Order Confirmed`,
    actor,
    async () => {
      await Order.deleteMany({ email: { $regex: /^b[1-5]@test\.com$/ } });
    },
  );

  console.log("Results:", results);
  await mongoose.disconnect();
  const ok = Object.values(results).every(Boolean);
  if (!ok) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
