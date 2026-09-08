import { Company, COMPANY_STATUSES, type CompanyStatus } from "../../models/Company";
import { Customer } from "../../models/Customer";
import { AppError } from "../../utils/AppError";
import { assertObjectId, optionalObjectId } from "../../utils/objectId";
import { nextCompanyCode } from "../../utils/codes";
import { serializeCompany, serializeCompanySummary, serializeCustomer } from "../../utils/serializers";
import { parsePagination, paginatedResponse } from "../../utils/pagination";
import { applyOptimisticUpdate, parseRevision } from "../../utils/concurrency";
import { writeAudit } from "../../services/audit.service";
import type { AuthUser } from "../../middleware/auth";
import { exportFilename } from "../../utils/csv";
import { streamCsvExport } from "../../utils/csvExport";
import { COMPANY_EXPORT_COLUMNS } from "../../constants/exportColumns";

const POPULATE = [{ path: "assignedToId", select: "name email" }];

function buildCompaniesQuery(filters: {
  search?: string;
  status?: string;
  country?: string;
}) {
  const query: Record<string, unknown> = {};

  if (filters.status && filters.status !== "all") query.status = filters.status;
  if (filters.country && filters.country !== "all") query.country = filters.country;

  if (filters.search?.trim()) {
    const s = filters.search.trim();
    query.$or = [
      { name: new RegExp(s, "i") },
      { legalName: new RegExp(s, "i") },
      { companyCode: new RegExp(s, "i") },
      { country: new RegExp(s, "i") },
      { industry: new RegExp(s, "i") },
    ];
  }

  return query;
}

export async function exportCompanies(
  filters: { search?: string; status?: string; country?: string },
  actor: AuthUser,
) {
  const query = buildCompaniesQuery(filters);
  const result = await streamCsvExport({
    columns: COMPANY_EXPORT_COLUMNS,
    count: () => Company.countDocuments(query),
    fetchBatch: async (skip, limit) => {
      const docs = await Company.find(query).populate(POPULATE).sort({ name: 1 }).skip(skip).limit(limit);
      return docs.map((d) =>
        serializeCompany(d.toObject() as unknown as Record<string, unknown>) as Record<string, unknown>,
      );
    },
  });

  await writeAudit({
    userId: actor.id,
    userName: actor.name,
    userRole: actor.roleName,
    action: "Companies Exported",
    entity: "Company",
    entityId: "export",
    details: `Exported ${result.total} company(ies) to CSV.`,
  });

  return { body: result.body, filename: exportFilename("companies"), total: result.total };
}

function normalizeCompanyInput(body: Record<string, unknown>) {
  const status = body.status ? String(body.status) : undefined;
  if (status && !COMPANY_STATUSES.includes(status as CompanyStatus)) {
    throw new AppError(`Invalid company status: ${status}`, 400);
  }

  return {
    name: body.name !== undefined ? String(body.name).trim() : undefined,
    legalName: body.legalName !== undefined ? String(body.legalName || "").trim() : undefined,
    country: body.country !== undefined ? String(body.country).trim() : undefined,
    city: body.city !== undefined ? String(body.city || "").trim() : undefined,
    address: body.address !== undefined ? String(body.address || "") : undefined,
    website: body.website !== undefined ? String(body.website || "") : undefined,
    industry: body.industry !== undefined ? String(body.industry || "") : undefined,
    taxId: body.taxId !== undefined ? String(body.taxId || "") : undefined,
    notes: body.notes !== undefined ? String(body.notes || "") : undefined,
    status: status as CompanyStatus | undefined,
    assignedToId: optionalObjectId((body.assignedToId as string | null | undefined) ?? null),
  };
}

export async function listCompanies(filters: {
  search?: string;
  status?: string;
  country?: string;
  page?: unknown;
  limit?: unknown;
}) {
  const { page, limit, skip } = parsePagination(filters);
  const query = buildCompaniesQuery(filters);

  const [total, docs] = await Promise.all([
    Company.countDocuments(query),
    Company.find(query).populate(POPULATE).sort({ name: 1 }).skip(skip).limit(limit),
  ]);

  const items = docs.map((d) => serializeCompanySummary(d.toObject() as unknown as Record<string, unknown>));
  return paginatedResponse(items, total, page, limit);
}

export async function getCompany(id: string) {
  assertObjectId(id, "company id");
  const doc = await Company.findById(id).populate(POPULATE);
  if (!doc) throw new AppError("Company not found.", 404);
  return serializeCompany(doc.toObject() as unknown as Record<string, unknown>);
}

export async function listCompanyCustomers(
  companyId: string,
  query: { page?: unknown; limit?: unknown },
) {
  assertObjectId(companyId, "company id");
  const company = await Company.findById(companyId);
  if (!company) throw new AppError("Company not found.", 404);

  const { page, limit, skip } = parsePagination(query);
  const filter = { companyId, status: { $ne: "inactive" } };

  const [total, docs] = await Promise.all([
    Customer.countDocuments(filter),
    Customer.find(filter).sort({ isPrimaryContact: -1, name: 1 }).skip(skip).limit(limit),
  ]);

  const items = docs.map((d) => serializeCustomer(d.toObject() as unknown as Record<string, unknown>));
  return paginatedResponse(items, total, page, limit);
}

export async function createCompany(body: Record<string, unknown>, actor: AuthUser) {
  const input = normalizeCompanyInput(body);
  if (!input.name || !input.country) {
    throw new AppError("Company name and country are required.", 400);
  }

  const companyCode = await nextCompanyCode();
  const doc = await Company.create({
    companyCode,
    name: input.name,
    legalName: input.legalName || input.name,
    country: input.country,
    city: input.city || "",
    address: input.address || "",
    website: input.website || "",
    industry: input.industry || "",
    taxId: input.taxId || "",
    notes: input.notes || "",
    status: input.status || "active",
    assignedToId: input.assignedToId,
    createdById: actor.id,
  });

  await writeAudit({
    userId: actor.id,
    userName: actor.name,
    userRole: actor.roleName,
    action: "Company Created",
    entity: "Setting",
    entityId: String(doc._id),
    details: `Created company ${doc.companyCode} (${doc.name}).`,
  });

  await doc.populate(POPULATE);
  return serializeCompany(doc.toObject() as unknown as Record<string, unknown>);
}

export async function updateCompany(id: string, body: Record<string, unknown>, actor: AuthUser) {
  assertObjectId(id, "company id");
  const existing = await Company.findById(id);
  if (!existing) throw new AppError("Company not found.", 404);

  const input = normalizeCompanyInput(body);
  const expectedRevision = parseRevision(body);
  const setFields: Record<string, unknown> = {};

  if (input.name !== undefined) setFields.name = input.name;
  if (input.legalName !== undefined) setFields.legalName = input.legalName;
  if (input.country !== undefined) setFields.country = input.country;
  if (input.city !== undefined) setFields.city = input.city;
  if (input.address !== undefined) setFields.address = input.address;
  if (input.website !== undefined) setFields.website = input.website;
  if (input.industry !== undefined) setFields.industry = input.industry;
  if (input.taxId !== undefined) setFields.taxId = input.taxId;
  if (input.notes !== undefined) setFields.notes = input.notes;
  if (input.status !== undefined) setFields.status = input.status;
  if (body.assignedToId !== undefined) setFields.assignedToId = input.assignedToId;

  if (Object.keys(setFields).length === 0) {
    await existing.populate(POPULATE);
    return serializeCompany(existing.toObject() as unknown as Record<string, unknown>);
  }

  const doc = await applyOptimisticUpdate(Company, id, expectedRevision, setFields, {
    notFoundMessage: "Company not found.",
  });

  await writeAudit({
    userId: actor.id,
    userName: actor.name,
    userRole: actor.roleName,
    action: "Company Updated",
    entity: "Setting",
    entityId: id,
    details: `Updated company ${doc.companyCode}.`,
  });

  await doc.populate(POPULATE);
  return serializeCompany(doc.toObject() as unknown as Record<string, unknown>);
}
