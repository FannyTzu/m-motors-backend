import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { paymentController } from "../controllers/payment/payment.controller.js";
import { catchAsync } from "../utils/sentry.js";

export const createPaymentRoutes = (prisma: PrismaClient) => {
  const router = Router();
  const controller = paymentController(prisma);

  router.post("/", authMiddleware, catchAsync(controller.createPayment));

  router.get("/:id", authMiddleware, catchAsync(controller.getPaymentById));

  router.patch(
    "/:id",
    authMiddleware,
    catchAsync(controller.updatePaymentStatus),
  );

  return router;
};
