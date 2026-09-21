import { Router } from "express";
import { authenticate, requirePermission } from "../../middleware/auth";
import * as ctrl from "./roles.controller";

export const rolesRoutes = Router();

rolesRoutes.use(authenticate);

const manage = requirePermission("settings.manage");

rolesRoutes.get("/permissions/catalog", requirePermission("users.view", "settings.manage"), ctrl.permissionsCatalog);
rolesRoutes.get("/", requirePermission("users.view", "settings.manage"), ctrl.list);
rolesRoutes.post("/", manage, ctrl.create);
rolesRoutes.put("/:id", manage, ctrl.update);
rolesRoutes.delete("/:id", manage, ctrl.remove);
rolesRoutes.put("/:id/permissions", manage, ctrl.updatePermissions);
