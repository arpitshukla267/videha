import { Router } from "express";
import * as ctrl from "./public.controller";

export const publicRoutes = Router();

publicRoutes.get("/orders/track/:orderCode", ctrl.trackOrder);
