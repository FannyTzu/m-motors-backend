import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { authController } from "../controllers/auth.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { validateSchema } from "../middlewares/validateSchema.js";
import { loginSchema, registerSchema } from "../schemas/auth.schema.js";
import { catchAsync } from "../utils/sentry.js";

export const createAuthRoutes = (prisma: PrismaClient) => {
  const router = Router();
  const controller = authController(prisma);

  router.post("/register", validateSchema(registerSchema), controller.register);

  router.post("/login", validateSchema(loginSchema), controller.login);

  router.get("/me", authMiddleware, catchAsync(controller.me));

  router.post("/logout", authMiddleware, catchAsync(controller.logout));

  router.post("/refresh-token", controller.refreshToken);

  return router;
};
