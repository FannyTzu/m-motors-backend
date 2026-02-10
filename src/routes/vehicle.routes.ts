import { Router } from "express";
import { PrismaClient, Role } from "@prisma/client";
import { vehicleController } from "../controllers/vehicle.controller";
import { authMiddleware, roleMiddleware } from "../middlewares/auth.middleware";
import { validateSchema } from "../middlewares/validateSchema";
import {
  createVehicleSchema,
  updateVehicleSchema,
} from "../schemas/vehicle.schema";

export const createVehicleRoutes = (prisma: PrismaClient) => {
  const router = Router();
  const controller = vehicleController(prisma);

  router.post(
    "/create",
    validateSchema(createVehicleSchema),
    authMiddleware,
    roleMiddleware(Role.admin),
    controller.createVehicle,
  );

  router.get("/", controller.getAllVehicles);

  router.get("/:id", controller.getVehicleById);

  router.get("/type/:type", controller.getVehiclesByType);

  router.put(
    "/:id",
    validateSchema(updateVehicleSchema),
    authMiddleware,
    roleMiddleware(Role.admin),
    controller.updateVehicle,
  );

  router.delete(
    "/:id",
    authMiddleware,
    roleMiddleware(Role.admin),
    controller.deleteVehicleById,
  );

  return router;
};
