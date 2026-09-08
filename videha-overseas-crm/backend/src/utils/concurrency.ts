import type { ClientSession, Model } from "mongoose";
import { AppError } from "./AppError";

export class ConflictError extends AppError {
  constructor(
    message = "This record was modified by another user. Please refresh and try again.",
  ) {
    super(message, 409, "CONFLICT");
  }
}

export function parseRevision(body: Record<string, unknown>): number | undefined {
  const raw = body.revision ?? body.expectedRevision;
  if (raw === undefined || raw === null || raw === "") return undefined;
  const revision = Number(raw);
  if (!Number.isInteger(revision) || revision < 0) {
    throw new AppError("Invalid revision value.", 400, "INVALID_REVISION");
  }
  return revision;
}

export function parseClientRequestId(body: Record<string, unknown>): string | undefined {
  const raw = body.clientRequestId ?? body.requestId ?? body.idempotencyKey;
  if (typeof raw !== "string") return undefined;
  const trimmed = raw.trim();
  return trimmed.length > 0 ? trimmed.slice(0, 128) : undefined;
}

type OptimisticUpdateOptions = {
  session?: ClientSession;
  notFoundMessage?: string;
  extraFilter?: Record<string, unknown>;
  incFields?: Record<string, number>;
};

/** Match legacy documents that have no revision field yet (treated as revision 0). */
function applyRevisionFilter(filter: Record<string, unknown>, expectedRevision: number): void {
  if (expectedRevision === 0) {
    filter.$or = [{ revision: 0 }, { revision: { $exists: false } }];
    return;
  }
  filter.revision = expectedRevision;
}

export async function applyOptimisticUpdate<T>(
  model: Model<T>,
  id: string,
  expectedRevision: number | undefined,
  setFields: Record<string, unknown>,
  options: OptimisticUpdateOptions = {},
): Promise<InstanceType<Model<T>>> {
  const filter: Record<string, unknown> = { _id: id, ...options.extraFilter };
  if (expectedRevision !== undefined) {
    applyRevisionFilter(filter, expectedRevision);
  }

  const update: Record<string, unknown> = { $set: setFields, $inc: { revision: 1 } };
  if (options.incFields && Object.keys(options.incFields).length > 0) {
    update.$inc = { ...(update.$inc as Record<string, number>), ...options.incFields };
  }

  const doc = await model.findOneAndUpdate(
    filter,
    update,
    { new: true, session: options.session, runValidators: true },
  );

  if (doc) return doc as InstanceType<Model<T>>;

  const exists = await model.findById(id).select("_id revision").session(options.session ?? null).lean();
  if (!exists) {
    throw new AppError(options.notFoundMessage ?? "Record not found.", 404);
  }
  throw new ConflictError();
}
