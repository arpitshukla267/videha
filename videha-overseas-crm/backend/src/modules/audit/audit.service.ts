import { AuditLog } from "../../models/AuditLog";
import { serializeAudit } from "../../utils/serializers";

export async function listAuditLogs(page = 1, limit = 50) {
  const safeLimit = Math.min(200, Math.max(1, limit));
  const safePage = Math.max(1, page);
  const skip = (safePage - 1) * safeLimit;

  const [total, docs] = await Promise.all([
    AuditLog.countDocuments(),
    AuditLog.find().sort({ createdAt: -1 }).skip(skip).limit(safeLimit),
  ]);

  return {
    items: docs.map((d) => serializeAudit(d.toObject() as unknown as Record<string, unknown>)),
    total,
    page: safePage,
    limit: safeLimit,
    // frontend also accepts flat data array via limit query — provide both
    data: docs.map((d) => serializeAudit(d.toObject() as unknown as Record<string, unknown>)),
  };
}
