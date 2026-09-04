import { Router } from "express";
import { authenticate, requirePermission } from "../../middleware/auth";
import * as ctrl from "./orders.controller";

export const ordersRoutes = Router();

ordersRoutes.use(authenticate);

ordersRoutes.get("/", requirePermission("orders.view"), ctrl.list);
ordersRoutes.get("/:id", requirePermission("orders.view"), ctrl.getOne);
ordersRoutes.post("/", requirePermission("orders.create"), ctrl.create);
ordersRoutes.put("/:id", requirePermission("orders.edit"), ctrl.update);
ordersRoutes.patch("/:id/status", requirePermission("orders.update_status"), ctrl.patchStatus);
