import { Router } from "express";
import { authenticate, requirePermission } from "../../middleware/auth";
import * as ctrl from "./leads.controller";

export const leadsRoutes = Router();

leadsRoutes.use(authenticate);

leadsRoutes.get("/", requirePermission("leads.view"), ctrl.list);
leadsRoutes.get("/:id", requirePermission("leads.view"), ctrl.getOne);
leadsRoutes.post("/", requirePermission("leads.create"), ctrl.create);
leadsRoutes.put("/:id", requirePermission("leads.edit"), ctrl.update);
leadsRoutes.patch("/:id/assign", requirePermission("leads.assign"), ctrl.assign);
leadsRoutes.post("/:id/notes", requirePermission("leads.edit"), ctrl.addNote);
leadsRoutes.delete("/:id", requirePermission("leads.delete"), ctrl.remove);
