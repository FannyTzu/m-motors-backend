import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { orderController } from "../controllers/order.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { validateSchema } from "../middlewares/validateSchema.js";
import {
  createOrderSchema,
  updateOrderStatusSchema,
} from "../schemas/order.schema.js";
import { catchAsync } from "../utils/sentry.js";

export const createOrderRoutes = (prisma: PrismaClient) => {
  const router = Router();
  const controller = orderController(prisma);

  router.post(
    "/create",
    validateSchema(createOrderSchema),
    authMiddleware,
    catchAsync(controller.createOrder),
  );

  router.get("/:id", authMiddleware, catchAsync(controller.getOrder));

  router.get(
    "/folder/:folder_id",
    authMiddleware,
    catchAsync(controller.getOrdersByFolder),
  );

  router.patch(
    "/:id/status",
    validateSchema(updateOrderStatusSchema),
    authMiddleware,
    catchAsync(controller.updateOrderStatus),
  );

  return router;
};
