import { Router } from "express";
import { authenticate, requirePermission } from "../../middleware/auth";
import * as ctrl from "./dashboard.controller";

export const dashboardRoutes = Router();

dashboardRoutes.use(authenticate);
dashboardRoutes.get("/", requirePermission("dashboard.view"), ctrl.overview);
