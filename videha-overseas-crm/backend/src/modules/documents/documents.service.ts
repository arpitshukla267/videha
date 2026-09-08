import { Types } from "mongoose";
import {
  Document,
  DOCUMENT_CATEGORIES,
  DOCUMENT_ENTITY_TYPES,
  type DocumentCategory,
  type DocumentEntityType,
} from "../../models/Document";
import { Lead } from "../../models/Lead";
import { Company } from "../../models/Company";
import { Customer } from "../../models/Customer";
import { Quotation } from "../../models/Quotation";
import { Order } from "../../models/Order";
import { AppError } from "../../utils/AppError";
import { assertObjectId, optionalObjectId } from "../../utils/objectId";
import { serializeDocument } from "../../utils/serializers";
import { parsePagination, paginatedResponse } from "../../utils/pagination";
import { applyOptimisticUpdate, parseRevision } from "../../utils/concurrency";
import { writeAudit } from "../../services/audit.service";
import type { AuthUser } from "../../middleware/auth";
import {
  assertDocumentAccess,
  buildDocumentVisibilityFilter,
} from "../../utils/entityAccess";
import { nextDocumentCode } from "../../utils/codes";
import {
  buildDocumentSignedDownloadUrl,
  deleteDocumentFromCloudinary,
  renameDocumentDisplayName,
  uploadDocumentToCloudinary,
} from "../../lib/cloudinary";

const POPULATE = [{ path: "createdById", select: "name email" }];

type EntityMeta = { entityLabel: string; entityCode: string };

async function resolveEntityMeta(
  entityType: DocumentEntityType,
  entityId: string,
): Promise<EntityMeta> {
  switch (entityType) {
    case "Lead": {
      const lead = await Lead.findById(entityId).select("leadCode company name").lean();
      if (!lead) throw new AppError("Lead not found.", 404);
      return {
        entityCode: lead.leadCode,
        entityLabel: `${lead.leadCode} — ${lead.company || lead.name}`,
      };
    }
    case "Company": {
      const company = await Company.findById(entityId).select("companyCode name").lean();
      if (!company) throw new AppError("Company not found.", 404);
      return {
        entityCode: company.companyCode,
        entityLabel: `${company.companyCode} — ${company.name}`,
      };
    }
    case "Customer": {
      const customer = await Customer.findById(entityId).select("customerCode name").lean();
      if (!customer) throw new AppError("Customer not found.", 404);
      return {
        entityCode: customer.customerCode,
        entityLabel: `${customer.customerCode} — ${customer.name}`,
      };
    }
    case "Quotation": {
      const quotation = await Quotation.findById(entityId).select("quotationCode title").lean();
      if (!quotation) throw new AppError("Quotation not found.", 404);
      return {
        entityCode: quotation.quotationCode,
        entityLabel: `${quotation.quotationCode} — ${quotation.title}`,
      };
    }
    case "Order": {
      const order = await Order.findById(entityId).select("orderCode company customerName").lean();
      if (!order) throw new AppError("Order not found.", 404);
      return {
        entityCode: order.orderCode,
        entityLabel: `${order.orderCode} — ${order.company || order.customerName}`,
      };
    }
    default:
      throw new AppError(`Invalid entity type: ${entityType}`, 400);
  }
}

function normalizeCategory(value: unknown): DocumentCategory {
  const category = String(value || "").trim();
  if (!DOCUMENT_CATEGORIES.includes(category as DocumentCategory)) {
    throw new AppError(`Invalid category: ${category}`, 400);
  }
  return category as DocumentCategory;
}

function normalizeEntityType(value: unknown): DocumentEntityType {
  const entityType = String(value || "").trim();
  if (!DOCUMENT_ENTITY_TYPES.includes(entityType as DocumentEntityType)) {
    throw new AppError(`Invalid entity type: ${entityType}`, 400);
  }
  return entityType as DocumentEntityType;
}

function applyFileKindFilter(query: Record<string, unknown>, fileKind?: string) {
  if (!fileKind || fileKind === "all") return;
  if (fileKind === "image") {
    query.mimeType = { $regex: "^image/", $options: "i" };
    return;
  }
  if (fileKind === "pdf") {
    query.mimeType = "application/pdf";
    return;
  }
  if (fileKind === "document") {
    query.mimeType = {
      $in: [
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      ],
    };
    return;
  }
  throw new AppError(`Invalid file type filter: ${fileKind}`, 400);
}

export async function listDocuments(
  filters: {
    search?: string;
    category?: string;
    entityType?: string;
    entityId?: string;
    fileKind?: string;
    page?: unknown;
    limit?: unknown;
  },
  actor: AuthUser,
) {
  const { page, limit, skip } = parsePagination(filters);
  const clauses: Record<string, unknown>[] = [];

  const visibility = await buildDocumentVisibilityFilter(actor);
  if (Object.keys(visibility).length > 0) {
    clauses.push(visibility);
  }

  if (filters.category && filters.category !== "all") {
    clauses.push({ category: normalizeCategory(filters.category) });
  }

  if (filters.entityType && filters.entityType !== "all") {
    clauses.push({ entityType: normalizeEntityType(filters.entityType) });
  }

  const entityId = optionalObjectId(filters.entityId ?? null);
  if (entityId) {
    clauses.push({ entityId: new Types.ObjectId(entityId) });
  }

  const fileKindQuery: Record<string, unknown> = {};
  applyFileKindFilter(fileKindQuery, filters.fileKind);
  if (Object.keys(fileKindQuery).length > 0) {
    clauses.push(fileKindQuery);
  }

  if (filters.search?.trim()) {
    const pattern = new RegExp(filters.search.trim(), "i");
    clauses.push({
      $or: [
        { title: pattern },
        { fileName: pattern },
        { documentCode: pattern },
        { entityLabel: pattern },
        { entityCode: pattern },
      ],
    });
  }

  const query = clauses.length > 0 ? { $and: clauses } : {};

  const [total, rows] = await Promise.all([
    Document.countDocuments(query),
    Document.find(query)
      .populate(POPULATE)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
  ]);

  return paginatedResponse(
    rows.map((row) =>
      serializeDocument(row as Record<string, unknown>, String(row._id ?? "")),
    ),
    total,
    page,
    limit,
  );
}

export async function getDocument(id: string, actor: AuthUser) {
  assertObjectId(id, "document id");
  const doc = await Document.findById(id).populate(POPULATE).lean();
  if (!doc) throw new AppError("Document not found.", 404);

  await assertDocumentAccess(actor, id);

  return serializeDocument(doc as Record<string, unknown>, id);
}

export async function createDocument(
  input: {
    title?: string;
    category?: string;
    entityType?: string;
    entityId?: string;
    file?: Express.Multer.File;
  },
  actor: AuthUser,
) {
  if (!input.file) {
    throw new AppError("No file uploaded.", 400);
  }

  const entityType = normalizeEntityType(input.entityType);
  const entityId = assertObjectId(String(input.entityId || ""), "entityId");
  const category = normalizeCategory(input.category);
  const title = String(input.title || input.file.originalname || "Untitled").trim();
  if (!title) {
    throw new AppError("Document title is required.", 400);
  }

  const { entityLabel, entityCode } = await resolveEntityMeta(entityType, entityId);

  const documentId = new Types.ObjectId();
  let uploadResult: Awaited<ReturnType<typeof uploadDocumentToCloudinary>>;
  try {
    uploadResult = await uploadDocumentToCloudinary(input.file.buffer, {
      entityType,
      entityId,
      documentId: String(documentId),
      mime: input.file.mimetype,
      originalName: input.file.originalname,
      displayName: title,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    throw new AppError(message, 400);
  }

  const documentCode = await nextDocumentCode();
  const created = await Document.create({
    _id: documentId,
    documentCode,
    title,
    fileName: input.file.originalname,
    category,
    entityType,
    entityId: new Types.ObjectId(entityId),
    entityLabel,
    entityCode,
    mimeType: input.file.mimetype,
    fileSize: input.file.size,
    publicId: uploadResult.publicId,
    url: uploadResult.url,
    resourceType: uploadResult.resourceType,
    createdById: new Types.ObjectId(actor.id),
  });

  await writeAudit({
    userId: actor.id,
    userName: actor.name,
    userRole: actor.roleName,
    action: "Document Uploaded",
    entity: "Document",
    entityId: String(created._id),
    details: `Uploaded "${title}" (${input.file.originalname}) for ${entityType} ${entityCode} under ${category}.`,
  });

  const populated = await Document.findById(created._id).populate(POPULATE).lean();
  return serializeDocument(populated as Record<string, unknown>, String(created._id));
}

export async function renameDocument(
  id: string,
  body: Record<string, unknown>,
  actor: AuthUser,
) {
  assertObjectId(id, "document id");
  const revision = parseRevision(body);
  const title = String(body.title || "").trim();
  if (!title) {
    throw new AppError("Document title is required.", 400);
  }

  const existing = await Document.findById(id);
  if (!existing) throw new AppError("Document not found.", 404);

  await assertDocumentAccess(actor, id);

  if (existing.title !== title) {
    try {
      await renameDocumentDisplayName(
        existing.publicId,
        existing.resourceType as "image" | "raw",
        title,
      );
    } catch {
      // Cloudinary display_name sync is best-effort; MongoDB title is source of truth in CRM.
    }
  }

  const updated = await applyOptimisticUpdate(Document, id, revision, { title });
  const populated = await Document.findById(updated._id).populate(POPULATE).lean();
  if (!populated) throw new AppError("Document not found.", 404);

  await writeAudit({
    userId: actor.id,
    userName: actor.name,
    userRole: actor.roleName,
    action: "Document Renamed",
    entity: "Document",
    entityId: id,
    details: `Renamed document from "${existing.title}" to "${title}".`,
  });

  return serializeDocument(populated as Record<string, unknown>, id);
}

export async function streamDocumentFile(
  id: string,
  actor: AuthUser,
  disposition: "inline" | "attachment",
) {
  assertObjectId(id, "document id");
  const doc = await Document.findById(id).lean();
  if (!doc) throw new AppError("Document not found.", 404);

  await assertDocumentAccess(actor, id);

  const resourceType = doc.resourceType as "image" | "raw";
  const deliveryUrl = buildDocumentSignedDownloadUrl(doc.publicId, resourceType, {
    attachment: disposition === "attachment",
    mime: doc.mimeType,
  });

  const response = await fetch(deliveryUrl);
  if (!response.ok) {
    throw new AppError("File is not available from Cloudinary.", 502);
  }

  const buffer = Buffer.from(await response.arrayBuffer());

  return {
    buffer,
    contentType: doc.mimeType || response.headers.get("content-type") || "application/octet-stream",
    fileName: doc.fileName,
    disposition,
  };
}

export async function deleteDocument(id: string, actor: AuthUser) {
  assertObjectId(id, "document id");
  const existing = await Document.findById(id);
  if (!existing) throw new AppError("Document not found.", 404);

  await assertDocumentAccess(actor, id);

  try {
    await deleteDocumentFromCloudinary(
      existing.publicId,
      existing.resourceType as "image" | "raw",
    );
  } catch {
    throw new AppError("Failed to delete file from Cloudinary.", 502);
  }

  await existing.deleteOne();

  await writeAudit({
    userId: actor.id,
    userName: actor.name,
    userRole: actor.roleName,
    action: "Document Deleted",
    entity: "Document",
    entityId: id,
    details: `Deleted "${existing.title}" (${existing.fileName}) from ${existing.entityType} ${existing.entityCode}.`,
  });
}
