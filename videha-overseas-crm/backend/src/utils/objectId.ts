import { Types } from "mongoose";
import { AppError } from "./AppError";

export function assertObjectId(id: string | undefined | null, label = "id"): string {
  if (!id || !Types.ObjectId.isValid(id)) {
    throw new AppError(`Invalid ${label}`, 400, "INVALID_ID");
  }
  return id;
}

export function optionalObjectId(id: string | null | undefined): string | null {
  if (id == null || id === "" || id === "null") return null;
  if (!Types.ObjectId.isValid(id)) {
    throw new AppError("Invalid id", 400, "INVALID_ID");
  }
  return id;
}

export function refId(value: unknown): string | null {
  if (value == null) return null;
  if (typeof value === "string") return value;
  if (typeof value === "object" && value !== null && "_id" in value) {
    return String((value as { _id: unknown })._id);
  }
  return String(value);
}

export function refName(value: unknown): string | undefined {
  if (value && typeof value === "object" && "name" in value) {
    return String((value as { name: unknown }).name);
  }
  return undefined;
}
