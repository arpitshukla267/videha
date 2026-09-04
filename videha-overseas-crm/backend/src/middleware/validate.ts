import type { Request, Response, NextFunction, RequestHandler } from "express";
import type { ZodType } from "zod";

type Source = "body" | "query" | "params";

export function validate(schema: ZodType, source: Source = "body"): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction) => {
    const parsed = schema.safeParse(req[source]);
    if (!parsed.success) {
      next(parsed.error);
      return;
    }
    // Assign parsed (coerced) values back
    (req as Request & Record<Source, unknown>)[source] = parsed.data;
    next();
  };
}
