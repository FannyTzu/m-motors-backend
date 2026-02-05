import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { vehicleController } from "../controllers/vehicle.controller";

export const createVehicleRoutes = (prisma: PrismaClient) => {
  const router = Router();
  const controller = vehicleController(prisma);

  router.post("/create", controller.createVehicle);

  return router;
};
