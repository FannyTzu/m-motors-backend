import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { vehicleController } from "../controllers/vehicle.controller";

export const createVehicleRoutes = (prisma: PrismaClient) => {
  const router = Router();
  const controller = vehicleController(prisma);

  router.post("/create", controller.createVehicle);

  router.get("/", controller.getAllVehicles);

  router.get("/:id", controller.getVehicleById);

  router.get("/type/:type", controller.getVehiclesByType);

  router.put("/:id", controller.updateVehicle);

  router.delete("/:id", controller.deleteVehicleById);

  return router;
};
