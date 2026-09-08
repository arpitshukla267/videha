import { Router } from "express";
import { authenticate, requirePermission } from "../../middleware/auth";
import * as ctrl from "./followups.controller";

export const followupsRoutes = Router();

followupsRoutes.use(authenticate);

followupsRoutes.get("/", requirePermission("followups.view", "leads.view"), ctrl.list);
followupsRoutes.get("/export", requirePermission("followups.view", "leads.view"), ctrl.exportCsv);
followupsRoutes.get("/:id", requirePermission("followups.view", "leads.view"), ctrl.getOne);
followupsRoutes.post("/", requirePermission("followups.create", "leads.edit"), ctrl.create);
followupsRoutes.put("/:id", requirePermission("followups.edit", "leads.edit"), ctrl.update);
followupsRoutes.patch("/:id/complete", requirePermission("followups.edit", "leads.edit"), ctrl.complete);
followupsRoutes.patch("/:id/skip", requirePermission("followups.edit", "leads.edit"), ctrl.skip);
followupsRoutes.delete("/:id", requirePermission("followups.edit", "leads.edit"), ctrl.remove);
