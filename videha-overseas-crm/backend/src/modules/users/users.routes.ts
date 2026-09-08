import { Router } from "express";
import { authenticate, requirePermission } from "../../middleware/auth";
import * as ctrl from "./users.controller";

export const usersRoutes = Router();

usersRoutes.use(authenticate);

usersRoutes.get(
  "/directory",
  requirePermission(
    "leads.create",
    "followups.create",
    "quotations.create",
    "tasks.create",
    "orders.create",
  ),
  ctrl.directory,
);
usersRoutes.get("/", requirePermission("users.view"), ctrl.list);
usersRoutes.post("/", requirePermission("users.create"), ctrl.create);
usersRoutes.put("/:id", requirePermission("users.edit"), ctrl.update);
usersRoutes.patch("/:id/status", requirePermission("users.delete"), ctrl.patchStatus);
