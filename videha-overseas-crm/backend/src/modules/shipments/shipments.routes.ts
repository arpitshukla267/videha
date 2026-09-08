import { Router } from "express";
import { authenticate, requirePermission } from "../../middleware/auth";
import * as ctrl from "./shipments.controller";

export const shipmentsRoutes = Router();

shipmentsRoutes.use(authenticate);

shipmentsRoutes.get("/", requirePermission("shipments.view", "orders.view"), ctrl.list);
shipmentsRoutes.get("/by-order/:orderId", requirePermission("shipments.view", "orders.view"), ctrl.listByOrder);
shipmentsRoutes.get("/:id", requirePermission("shipments.view", "orders.view"), ctrl.getOne);
shipmentsRoutes.post("/", requirePermission("shipments.create", "orders.edit"), ctrl.create);
shipmentsRoutes.put("/:id", requirePermission("shipments.edit", "orders.edit"), ctrl.update);
