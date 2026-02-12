import { Router } from "express";
import { PrismaClient, Role } from "@prisma/client";
import { vehicleController } from "../controllers/vehicle.controller";
import { authMiddleware, roleMiddleware } from "../middlewares/auth.middleware";
import { validateSchema } from "../middlewares/validateSchema";
import {
  createVehicleSchema,
  updateVehicleSchema,
} from "../schemas/vehicle.schema";
import { catchAsync } from "../utils/sentry";

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
