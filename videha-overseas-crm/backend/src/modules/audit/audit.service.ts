import { AuditLog } from "../../models/AuditLog";
import { serializeAudit } from "../../utils/serializers";
import { parsePagination, paginatedResponse } from "../../utils/pagination";

export async function listAuditLogs(query: { page?: unknown; limit?: unknown } = {}) {
  const { page, limit, skip } = parsePagination(query);

  const [total, docs] = await Promise.all([
    AuditLog.countDocuments(),
    AuditLog.find().sort({ createdAt: -1 }).skip(skip).limit(limit),
  ]);

  const items = docs.map((d) => serializeAudit(d.toObject() as unknown as Record<string, unknown>));
  const result = paginatedResponse(items, total, page, limit);

  return {
    ...result,
    data: result.items,
  };
}
