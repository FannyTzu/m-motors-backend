import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { authController } from "../controllers/auth.controller";
import { authMiddleware } from "../middlewares/auth.middleware";

export const createAuthRoutes = (prisma: PrismaClient) => {
  const router = Router();
  const controller = authController(prisma);

  router.post("/register", controller.register);

  router.post("/login", controller.login);

  router.get("/me", authMiddleware, controller.me);

  router.post("/logout", controller.logout);

  router.post("/refresh-token", controller.refreshToken);

  return router;
};
