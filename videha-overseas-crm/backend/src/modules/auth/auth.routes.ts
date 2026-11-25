import { Router } from "express";
import { authenticate } from "../../middleware/auth";
import * as ctrl from "./auth.controller";

export const authRoutes = Router();

authRoutes.post("/login", ctrl.login);
authRoutes.post("/forgot-password", ctrl.forgotPassword);
authRoutes.post("/verify-otp", ctrl.verifyOtp);
authRoutes.post("/reset-password", ctrl.resetPassword);
authRoutes.get("/me", authenticate, ctrl.me);
authRoutes.post("/change-password", authenticate, ctrl.changePassword);
authRoutes.post("/change-email", authenticate, ctrl.changeEmail);
authRoutes.put("/profile", authenticate, ctrl.updateProfile);
authRoutes.post("/logout", authenticate, ctrl.logout);
