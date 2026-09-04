import { Router } from "express";
import { authenticate, requirePermission } from "../../middleware/auth";
import * as ctrl from "./roles.controller";

export const rolesRoutes = Router();

rolesRoutes.use(authenticate);

rolesRoutes.get("/permissions/catalog", requirePermission("users.view", "settings.manage"), ctrl.permissionsCatalog);
rolesRoutes.get("/", requirePermission("users.view"), ctrl.list);
rolesRoutes.put("/:id/permissions", requirePermission("settings.manage"), ctrl.updatePermissions);
