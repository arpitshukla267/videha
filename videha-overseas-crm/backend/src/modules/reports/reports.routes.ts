import { Router } from "express";
import { authenticate, requirePermission } from "../../middleware/auth";
import * as ctrl from "./reports.controller";

export const reportsRoutes = Router();

reportsRoutes.use(authenticate);
reportsRoutes.get("/", requirePermission("reports.view"), ctrl.getReports);
