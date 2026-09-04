import { Router } from "express";
import { authenticate, requirePermission } from "../../middleware/auth";
import * as ctrl from "./departments.controller";

export const departmentsRoutes = Router();

const manage = requirePermission("settings.manage", "departments.manage");

departmentsRoutes.use(authenticate);

departmentsRoutes.get("/", manage, ctrl.list);
departmentsRoutes.post("/", manage, ctrl.create);
departmentsRoutes.put("/:id", manage, ctrl.update);
departmentsRoutes.patch("/:id/status", manage, ctrl.patchStatus);
departmentsRoutes.delete("/:id", manage, ctrl.remove);
