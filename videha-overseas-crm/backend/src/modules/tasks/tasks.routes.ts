import { Router } from "express";
import { authenticate, requirePermission } from "../../middleware/auth";
import * as ctrl from "./tasks.controller";

export const tasksRoutes = Router();

tasksRoutes.use(authenticate);

tasksRoutes.get("/", requirePermission("tasks.view"), ctrl.list);
tasksRoutes.get("/:id", requirePermission("tasks.view"), ctrl.getOne);
tasksRoutes.post("/", requirePermission("tasks.create"), ctrl.create);
tasksRoutes.put("/:id", requirePermission("tasks.edit"), ctrl.update);
tasksRoutes.patch("/:id/status", requirePermission("tasks.complete"), ctrl.patchStatus);
tasksRoutes.patch("/:id/assign", requirePermission("tasks.assign"), ctrl.assign);
tasksRoutes.delete("/:id", requirePermission("tasks.edit"), ctrl.remove);
