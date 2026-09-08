import { Router } from "express";
import { authenticate, requirePermission } from "../../middleware/auth";
import * as ctrl from "./quotations.controller";

export const quotationsRoutes = Router();

quotationsRoutes.use(authenticate);

quotationsRoutes.get("/", requirePermission("quotations.view", "leads.view"), ctrl.list);
quotationsRoutes.get("/:id", requirePermission("quotations.view", "leads.view"), ctrl.getOne);
quotationsRoutes.post("/", requirePermission("quotations.create", "leads.edit"), ctrl.create);
quotationsRoutes.put("/:id", requirePermission("quotations.edit", "leads.edit"), ctrl.update);
quotationsRoutes.patch(
  "/:id/status",
  requirePermission("quotations.edit", "leads.edit"),
  ctrl.updateStatus,
);
quotationsRoutes.delete("/:id", requirePermission("quotations.delete", "leads.edit"), ctrl.remove);
