import { Router } from "express";
import { authenticate, requirePermission } from "../../middleware/auth";
import * as ctrl from "./companies.controller";

export const companiesRoutes = Router();

companiesRoutes.use(authenticate);

companiesRoutes.get("/", requirePermission("companies.view", "leads.view"), ctrl.list);
companiesRoutes.get("/:id/customers", requirePermission("customers.view", "leads.view"), ctrl.listCustomers);
companiesRoutes.get("/:id", requirePermission("companies.view", "leads.view"), ctrl.getOne);
companiesRoutes.post("/", requirePermission("companies.create", "leads.edit"), ctrl.create);
companiesRoutes.put("/:id", requirePermission("companies.edit", "leads.edit"), ctrl.update);
