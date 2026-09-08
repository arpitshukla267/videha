import { Router } from "express";
import { authenticate } from "../middleware/auth";
import { asyncHandler } from "../utils/asyncHandler";
import { CRM_COUNTRIES } from "../constants/countries";
import { LEAD_STATUSES } from "../models/Lead";
import { PIPELINE_LEAD_STATUSES, LEGACY_LEAD_STATUSES } from "../constants/leadPipeline";
import { authRoutes } from "../modules/auth/auth.routes";
import { departmentsRoutes } from "../modules/departments/departments.routes";
import { usersRoutes } from "../modules/users/users.routes";
import { rolesRoutes } from "../modules/roles/roles.routes";
import { leadsRoutes } from "../modules/leads/leads.routes";
import { followupsRoutes } from "../modules/followups/followups.routes";
import { companiesRoutes } from "../modules/companies/companies.routes";
import { customersRoutes } from "../modules/customers/customers.routes";
import { quotationsRoutes } from "../modules/quotations/quotations.routes";
import { tasksRoutes } from "../modules/tasks/tasks.routes";
import { ordersRoutes } from "../modules/orders/orders.routes";
import { notificationsRoutes } from "../modules/notifications/notifications.routes";
import { auditRoutes } from "../modules/audit/audit.routes";
import { dashboardRoutes } from "../modules/dashboard/dashboard.routes";
import { reportsRoutes } from "../modules/reports/reports.routes";
import { billsRoutes } from "../modules/bills/bills.routes";
import { financeRoutes } from "../modules/finance/finance.routes";
import { documentsRoutes } from "../modules/documents/documents.routes";
import { importRoutes } from "../modules/import/import.routes";
import { shipmentsRoutes } from "../modules/shipments/shipments.routes";
import { publicRoutes } from "../modules/public/public.routes";

export const apiRouter = Router();

apiRouter.get(
  "/meta/countries",
  authenticate,
  asyncHandler(async (_req, res) => {
    res.json({ success: true, data: [...CRM_COUNTRIES] });
  }),
);

apiRouter.get(
  "/meta/lead-pipeline",
  authenticate,
  asyncHandler(async (_req, res) => {
    res.json({
      success: true,
      data: {
        allStatuses: [...LEAD_STATUSES],
        pipelineStatuses: [...PIPELINE_LEAD_STATUSES],
        legacyStatuses: [...LEGACY_LEAD_STATUSES],
      },
    });
  }),
);

apiRouter.use("/auth", authRoutes);
apiRouter.use("/departments", departmentsRoutes);
apiRouter.use("/users", usersRoutes);
apiRouter.use("/roles", rolesRoutes);
apiRouter.use("/leads", leadsRoutes);
apiRouter.use("/follow-ups", followupsRoutes);
apiRouter.use("/companies", companiesRoutes);
apiRouter.use("/customers", customersRoutes);
apiRouter.use("/quotations", quotationsRoutes);
apiRouter.use("/tasks", tasksRoutes);
apiRouter.use("/orders", ordersRoutes);
apiRouter.use("/notifications", notificationsRoutes);
apiRouter.use("/audit", auditRoutes);
apiRouter.use("/dashboard", dashboardRoutes);
apiRouter.use("/reports", reportsRoutes);
apiRouter.use("/bills", billsRoutes);
apiRouter.use("/finance", financeRoutes);
apiRouter.use("/documents", documentsRoutes);
apiRouter.use("/import", importRoutes);
apiRouter.use("/shipments", shipmentsRoutes);
apiRouter.use("/public", publicRoutes);

apiRouter.get("/health", (_req, res) => {
  res.json({ success: true, message: "Videha Overseas CRM API is running" });
});
