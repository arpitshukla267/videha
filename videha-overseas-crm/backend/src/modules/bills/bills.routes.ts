import { Router } from "express";
import { authenticate, requirePermission } from "../../middleware/auth";
import * as ctrl from "./bills.controller";

export const billsRoutes = Router();

billsRoutes.use(authenticate);

billsRoutes.get("/", requirePermission("bills.view"), ctrl.list);
billsRoutes.post("/sync", requirePermission("bills.edit"), ctrl.sync);
billsRoutes.get("/:id", requirePermission("bills.view"), ctrl.getOne);
billsRoutes.put("/:id", requirePermission("bills.edit"), ctrl.update);
billsRoutes.post("/:id/payments", requirePermission("bills.edit"), ctrl.recordPayment);
billsRoutes.get("/:id/pdf", requirePermission("bills.view"), ctrl.downloadPdf);
