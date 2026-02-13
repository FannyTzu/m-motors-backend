import { Router } from "express";
import { PrismaClient, Role } from "@prisma/client";
import { vehicleController } from "../controllers/vehicle.controller.js";
import {
  authMiddleware,
  roleMiddleware,
} from "../middlewares/auth.middleware.js";
import { validateSchema } from "../middlewares/validateSchema.js";
import {
  createVehicleSchema,
  updateVehicleSchema,
} from "../schemas/vehicle.schema.js";
import { catchAsync } from "../utils/sentry.js";

export const createVehicleRoutes = (prisma: PrismaClient) => {
  const router = Router();
  const controller = vehicleController(prisma);

  router.post(
    "/create",
    validateSchema(createVehicleSchema),
    authMiddleware,
    roleMiddleware(Role.admin),
    catchAsync(controller.createVehicle),
  );

  router.get("/", catchAsync(controller.getAllVehicles));

  router.get("/:id", catchAsync(controller.getVehicleById));

  router.get("/type/:type", catchAsync(controller.getVehiclesByType));

  router.put(
    "/:id",
    validateSchema(updateVehicleSchema),
    authMiddleware,
    roleMiddleware(Role.admin),
    catchAsync(controller.updateVehicle),
  );

  router.delete(
    "/:id",
    authMiddleware,
    roleMiddleware(Role.admin),
    catchAsync(controller.deleteVehicleById),
  );

  return router;
};
