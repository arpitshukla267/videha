import { Router } from "express";
import { authenticate, requirePermission } from "../../middleware/auth";
import * as ctrl from "./finance.controller";

export const financeRoutes = Router();

financeRoutes.use(authenticate);
financeRoutes.get("/overview", requirePermission("finance.view"), ctrl.overview);
