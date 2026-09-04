import { Types } from "mongoose";
import { AuditLog } from "../models/AuditLog";

export interface WriteAuditInput {
  userId?: string | null;
  userName: string;
  userRole: string;
  action: string;
  entity: string;
  entityId?: string;
  details?: string;
}

export async function writeAudit(input: WriteAuditInput) {
  return AuditLog.create({
    userId: input.userId && Types.ObjectId.isValid(input.userId) ? input.userId : null,
    userName: input.userName,
    userRole: input.userRole,
    action: input.action,
    entity: input.entity,
    entityId: input.entityId || "",
    details: input.details || "",
  });
}
