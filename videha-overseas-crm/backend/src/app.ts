import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { env } from "./config/env";
import { apiRouter } from "./routes";
import { errorHandler } from "./middleware/errorHandler";
import { AppError } from "./utils/AppError";

function rateLimitHandler(_req: express.Request, _res: express.Response, next: express.NextFunction) {
  next(new AppError("Too many requests. Please try again later.", 429, "RATE_LIMIT"));
}

export function createApp() {
  const app = express();

  app.set("trust proxy", 1);
  app.use(helmet());
  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (e.g. server-to-server fetch, curl, mobile)
        if (!origin) return callback(null, true);
        // In development or if origin matches frontendUrl
        if (env.nodeEnv !== "production" || origin === env.frontendUrl) {
          return callback(null, true);
        }
        return callback(null, true);
      },
      credentials: true,
    }),
  );
  app.use(express.json({ limit: "2mb" }));

  const publicRfqLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 60,
    standardHeaders: true,
    legacyHeaders: false,
    handler: rateLimitHandler,
  });
  app.use("/api/public/rfq", publicRfqLimiter);

  const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 30,
    standardHeaders: true,
    legacyHeaders: false,
    handler: rateLimitHandler,
  });
  app.use("/api/auth/login", loginLimiter);

  const changePasswordLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    handler: rateLimitHandler,
  });
  app.use("/api/auth/change-password", changePasswordLimiter);

  const publicTrackLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 60,
    standardHeaders: true,
    legacyHeaders: false,
    handler: rateLimitHandler,
  });
  app.use("/api/public/orders/track", publicTrackLimiter);

  const unauthenticatedApiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 120,
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => req.headers.authorization?.startsWith("Bearer ") ?? false,
    handler: rateLimitHandler,
  });
  app.use("/api", unauthenticatedApiLimiter);

  app.use("/api", apiRouter);

  app.use(errorHandler);

  return app;
}
