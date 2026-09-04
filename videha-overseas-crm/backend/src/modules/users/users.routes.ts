import { Router } from "express";
import { authenticate, requirePermission } from "../../middleware/auth";
import * as ctrl from "./users.controller";

export const usersRoutes = Router();

usersRoutes.use(authenticate);

usersRoutes.get("/", requirePermission("users.view"), ctrl.list);
usersRoutes.post("/", requirePermission("users.create"), ctrl.create);
usersRoutes.put("/:id", requirePermission("users.edit"), ctrl.update);
usersRoutes.patch("/:id/status", requirePermission("users.delete"), ctrl.patchStatus);
