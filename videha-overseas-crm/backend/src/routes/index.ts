import { Router } from "express";
import { authenticate } from "../middleware/auth";
import { asyncHandler } from "../utils/asyncHandler";
import { CRM_COUNTRIES } from "../constants/countries";
import { authRoutes } from "../modules/auth/auth.routes";
import { departmentsRoutes } from "../modules/departments/departments.routes";
import { usersRoutes } from "../modules/users/users.routes";
import { rolesRoutes } from "../modules/roles/roles.routes";
import { leadsRoutes } from "../modules/leads/leads.routes";
import { tasksRoutes } from "../modules/tasks/tasks.routes";
import { ordersRoutes } from "../modules/orders/orders.routes";
import { notificationsRoutes } from "../modules/notifications/notifications.routes";
import { auditRoutes } from "../modules/audit/audit.routes";
import { dashboardRoutes } from "../modules/dashboard/dashboard.routes";
import { reportsRoutes } from "../modules/reports/reports.routes";
import { publicRoutes } from "../modules/public/public.routes";

export const apiRouter = Router();

apiRouter.get(
  "/meta/countries",
  authenticate,
  asyncHandler(async (_req, res) => {
    res.json({ success: true, data: [...CRM_COUNTRIES] });
  }),
);

apiRouter.use("/auth", authRoutes);
apiRouter.use("/departments", departmentsRoutes);
apiRouter.use("/users", usersRoutes);
apiRouter.use("/roles", rolesRoutes);
apiRouter.use("/leads", leadsRoutes);
apiRouter.use("/tasks", tasksRoutes);
apiRouter.use("/orders", ordersRoutes);
apiRouter.use("/notifications", notificationsRoutes);
apiRouter.use("/audit", auditRoutes);
apiRouter.use("/dashboard", dashboardRoutes);
apiRouter.use("/reports", reportsRoutes);
apiRouter.use("/public", publicRoutes);

apiRouter.get("/health", (_req, res) => {
  res.json({ success: true, message: "Videha Overseas CRM API is running" });
});
