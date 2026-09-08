import "dotenv/config";
import mongoose from "mongoose";
import { parseCsv, rowsToObjects } from "../utils/csvParse";
import { suggestMapping, IMPORT_FIELDS_BY_ENTITY } from "../constants/importFields";
import { ImportSession, type ImportSessionRow } from "../models/ImportSession";
import { Lead } from "../models/Lead";
import { User } from "../models/User";
import * as importService from "../modules/import/import.service";

import { backfillNullClientRequestIds } from "../db/backfillRevisions";

const SAMPLE_CSV = `Name,Company,Phone,Country,Email,Source,Product Interest,Status,Priority
Import User One,Import Co Alpha,+1 555 0001,United States,import1@example.com,Website,Spices,New,Medium
Import User Two,Import Co Beta,+1 555 0002,United Kingdom,import2@example.com,Trade Fair,Rice,New,High
Import User Three,Import Co Gamma,+1 555 0003,Germany,import3@example.com,Referral,Tea,New,Medium
Import User Four,Import Co Delta,+1 555 0004,Japan,import4@example.com,LinkedIn,Brassware,New,Low
Import User Five,Import Co Epsilon,+1 555 0005,United Arab Emirates,import5@example.com,Direct Inquiry,Textiles,New,Urgent
`;

async function main() {
  await mongoose.connect(process.env.MONGODB_URI!);
  await backfillNullClientRequestIds();

  const parsed = parseCsv(SAMPLE_CSV);
  console.log("Parsed headers:", parsed.headers.length, "rows:", parsed.rows.length);

  const mapping = suggestMapping(parsed.headers, IMPORT_FIELDS_BY_ENTITY.leads);
  const rawRows = rowsToObjects(parsed.headers, parsed.rows);
  console.log("Raw row count:", rawRows.length);

  const admin = await User.findOne({ status: "active" }).lean();
  if (!admin) throw new Error("No active user found");

  const actor: AuthUser = {
    id: String(admin._id),
    name: admin.name,
    email: admin.email,
    roleId: String(admin.roleId),
    roleName: "Admin",
    permissions: ["leads.create"],
    departmentId: admin.departmentId ? String(admin.departmentId) : null,
  };

  const beforeCount = await Lead.countDocuments({
    email: { $regex: /^import[1-5]@example\.com$/ },
  });
  console.log("Existing sample import leads before:", beforeCount);

  await Lead.deleteMany({ email: { $regex: /^import[1-5]@example\.com$/ } });

  const file = {
    buffer: Buffer.from(SAMPLE_CSV, "utf8"),
    originalname: "sample-leads.csv",
    size: Buffer.byteLength(SAMPLE_CSV),
  } as Express.Multer.File;

  const preview = await importService.previewImport("leads", file, undefined, actor);
  console.log("Preview summary:", preview.summary);
  console.log(
    "Preview valid rows:",
    preview.previewRows.filter((r) => r.valid).length,
    "/",
    preview.summary.totalRows,
  );

  const session = await ImportSession.findById(preview.sessionId).lean();
  console.log("Session stored rows:", session?.rows.length);
  console.log(
    "Session valid rows:",
    session?.rows.filter((r) => r.valid).length,
  );

  const confirm = await importService.confirmImport(preview.sessionId, actor);
  console.log("Confirm result:", {
    imported: confirm.imported,
    failed: confirm.failed,
    skipped: confirm.skipped,
    totalRows: confirm.totalRows,
  });
  for (const row of confirm.failedRows) {
    const plain = row as ImportSessionRow & { errors?: string[]; mapped?: Record<string, unknown> };
    console.log("Failed row", plain.rowNumber, plain.errors);
  }

  const afterCount = await Lead.countDocuments({
    email: { $regex: /^import[1-5]@example\.com$/ },
  });
  console.log("Leads created after confirm:", afterCount);

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
