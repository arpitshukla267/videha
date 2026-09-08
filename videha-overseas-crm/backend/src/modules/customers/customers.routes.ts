import { Router } from "express";
import { authenticate, requirePermission } from "../../middleware/auth";
import * as ctrl from "./customers.controller";

export const customersRoutes = Router();

customersRoutes.use(authenticate);

customersRoutes.get("/", requirePermission("customers.view", "leads.view"), ctrl.list);
customersRoutes.get("/export", requirePermission("customers.view", "leads.view"), ctrl.exportCsv);
customersRoutes.get("/:id", requirePermission("customers.view", "leads.view"), ctrl.getOne);
customersRoutes.post("/", requirePermission("customers.create", "leads.edit"), ctrl.create);
customersRoutes.put("/:id", requirePermission("customers.edit", "leads.edit"), ctrl.update);
