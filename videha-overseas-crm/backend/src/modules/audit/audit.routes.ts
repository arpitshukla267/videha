import { Router } from "express";
import { authenticate, requirePermission } from "../../middleware/auth";
import * as ctrl from "./audit.controller";

export const auditRoutes = Router();

auditRoutes.use(authenticate);
auditRoutes.get("/", requirePermission("settings.manage"), ctrl.list);
