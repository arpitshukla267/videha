import { Router } from "express";
import { authenticate, requirePermission } from "../../middleware/auth";
import * as ctrl from "./suppliers.controller";

export const suppliersRoutes = Router();

suppliersRoutes.use(authenticate);

suppliersRoutes.get("/", requirePermission("suppliers.view"), ctrl.list);
suppliersRoutes.get("/export", requirePermission("suppliers.view"), ctrl.exportCsv);
suppliersRoutes.get("/:id", requirePermission("suppliers.view"), ctrl.getOne);
suppliersRoutes.post("/", requirePermission("suppliers.create"), ctrl.create);
suppliersRoutes.put("/:id", requirePermission("suppliers.edit"), ctrl.update);
suppliersRoutes.delete("/:id", requirePermission("suppliers.edit"), ctrl.remove);
