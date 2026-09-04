import type { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { AppError } from "../utils/AppError";
import { env } from "../config/env";

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
      ...(err.code ? { code: err.code } : {}),
      ...(err.details !== undefined ? { details: err.details } : {}),
    });
    return;
  }

  if (err instanceof ZodError) {
    res.status(400).json({
      success: false,
      message: "Validation failed",
      code: "VALIDATION_ERROR",
      details: err.issues.map((issue) => ({
        path: issue.path.join("."),
        message: issue.message,
      })),
    });
    return;
  }

  const anyErr = err as {
    name?: string;
    message?: string;
    code?: number | string;
    keyValue?: Record<string, unknown>;
    errors?: Record<string, { message?: string; path?: string; kind?: string }>;
    path?: string;
    value?: unknown;
    stack?: string;
  };

  if (anyErr?.name === "CastError") {
    res.status(400).json({
      success: false,
      message: `Invalid identifier${anyErr.path ? ` for ${anyErr.path}` : ""}`,
      code: "CAST_ERROR",
      details: env.isProd ? undefined : { path: anyErr.path, value: anyErr.value },
    });
    return;
  }

  if (anyErr?.name === "ValidationError" && anyErr.errors) {
    const details = Object.values(anyErr.errors).map((e) => ({
      path: e.path,
      message: e.message,
    }));
    res.status(400).json({
      success: false,
      message: "Document validation failed",
      code: "MONGOOSE_VALIDATION",
      details,
    });
    return;
  }

  if (anyErr?.code === 11000) {
    const fields = anyErr.keyValue ? Object.keys(anyErr.keyValue) : [];
    res.status(409).json({
      success: false,
      message: fields.length
        ? `Duplicate value for: ${fields.join(", ")}`
        : "Duplicate key conflict",
      code: "DUPLICATE_KEY",
      details: env.isProd ? undefined : anyErr.keyValue,
    });
    return;
  }

  console.error("[CRM] Unhandled error:", err);
  res.status(500).json({
    success: false,
    message: env.isProd ? "Internal server error" : anyErr?.message || "Internal server error",
    code: "INTERNAL_ERROR",
    ...(!env.isProd && anyErr?.stack ? { details: { stack: anyErr.stack } } : {}),
  });
}
