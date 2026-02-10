import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { authController } from "../controllers/auth.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import { validateSchema } from "../middlewares/validateSchema";
import { loginSchema, registerSchema } from "../schemas/auth.schema";

export const createAuthRoutes = (prisma: PrismaClient) => {
  const router = Router();
  const controller = authController(prisma);

  router.post("/register", validateSchema(registerSchema), controller.register);

  router.post("/login", validateSchema(loginSchema), controller.login);

  router.get("/me", authMiddleware, controller.me);

  router.post("/logout", authMiddleware, controller.logout);

  router.post("/refresh-token", controller.refreshToken);

  return router;
};
