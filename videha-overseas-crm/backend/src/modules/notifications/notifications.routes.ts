import { Router } from "express";
import { authenticate } from "../../middleware/auth";
import * as ctrl from "./notifications.controller";

export const notificationsRoutes = Router();

notificationsRoutes.use(authenticate);

notificationsRoutes.get("/", ctrl.list);
notificationsRoutes.patch("/:id/read", ctrl.markRead);
notificationsRoutes.post("/read-all", ctrl.markAllRead);
