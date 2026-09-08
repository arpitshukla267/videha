import { Router } from "express";
import { authenticate, requirePermission } from "../../middleware/auth";
import * as ctrl from "./leads.controller";

export const leadsRoutes = Router();

leadsRoutes.use(authenticate);

leadsRoutes.get("/", requirePermission("leads.view"), ctrl.list);
leadsRoutes.get("/:id/activities", requirePermission("leads.view"), ctrl.getActivities);
leadsRoutes.get("/:id/notes", requirePermission("leads.view"), ctrl.getNotes);
leadsRoutes.get("/:id/calls", requirePermission("leads.view"), ctrl.getCalls);
leadsRoutes.get("/:id/follow-ups", requirePermission("followups.view", "leads.view"), ctrl.getFollowUps);
leadsRoutes.post("/:id/convert", requirePermission("leads.convert", "leads.edit"), ctrl.convert);
leadsRoutes.get("/:id", requirePermission("leads.view"), ctrl.getOne);
leadsRoutes.post("/", requirePermission("leads.create"), ctrl.create);
leadsRoutes.put("/:id", requirePermission("leads.edit"), ctrl.update);
leadsRoutes.patch("/:id/assign", requirePermission("leads.assign"), ctrl.assign);
leadsRoutes.post("/:id/notes", requirePermission("leads.edit"), ctrl.addNote);
leadsRoutes.post("/:id/calls", requirePermission("leads.edit"), ctrl.logCall);
leadsRoutes.delete("/:id", requirePermission("leads.delete"), ctrl.remove);
