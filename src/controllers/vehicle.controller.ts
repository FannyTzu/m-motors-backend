import { PrismaClient } from "@prisma/client";
import { Request, Response } from "express";
import { vehicleService } from "../services/vehicle.service";
import { captureError } from "../utils/sentry";

export const vehicleController = (prisma: PrismaClient) => {
  return {
    createVehicle: async (req: Request, res: Response) => {
      const {
        brand,
        model,
        transmission,
        year,
        energy,
        km,
        color,
        place,
        door,
        type,
        price,
        image,
        description,
        status,
      } = req.body;

      if (
        !brand ||
        !model ||
        !year ||
        !energy ||
        !km ||
        !color ||
        !place ||
        !door ||
        !type ||
        !price ||
        !status
      ) {
        return res
          .status(400)
          .json({ error: "All fields except image are required" });
      }

      const vehicle = await vehicleService(prisma).createVehicle({
        brand,
        model,
        transmission,
        year,
        energy,
        km,
        color,
        place,
        door,
        type,
        price,
        description,
        image,
        status,
      });
      res.status(201).json(vehicle);
    },
    updateVehicle: async (req: Request, res: Response) => {
      const { id } = req.params;
      const {
        brand,
        model,
        transmission,
        year,
        energy,
        km,
        color,
        place,
        door,
        type,
        price,
        image,
        description,
        status,
      } = req.body;

      const vehicle = await vehicleService(prisma).updateVehicle(Number(id), {
        brand,
        model,
        transmission,
        year,
        energy,
        km,
        color,
        place,
        door,
        type,
        price,
        image,
        description,
        status,
      });
      res.status(200).json(vehicle);
    },
    getVehicleById: async (req: Request, res: Response) => {
      const { id } = req.params;
      const vehicle = await vehicleService(prisma).getVehicleById(Number(id));
      if (!vehicle) {
        captureError(new Error(`Vehicle not found`), {
          tags: {
            feature: "vehicles",
            operation: "getById",
            status: "404",
          },
          extra: {
            vehicleId: id,
            userId: req.user?.sub,
          },
          level: "warning",
        });
        return res.status(404).json({ error: "Vehicle not found" });
      }
      res.status(200).json(vehicle);
    },
    getAllVehicles: async (req: Request, res: Response) => {
      const vehicles = await vehicleService(prisma).getAllVehicles();
      res.status(200).json(vehicles);
    },
    getVehiclesByType: async (req: Request, res: Response) => {
      const { type } = req.params;
      const vehicles = await vehicleService(prisma).getVehiclesByType(
        type as any,
      );
      res.status(200).json(vehicles);
    },
    deleteVehicleById: async (req: Request, res: Response) => {
      const { id } = req.params;
      await vehicleService(prisma).deleteVehicleById(Number(id));

      captureError(new Error(`Vehicle ${id} deleted`), {
        tags: {
          feature: "vehicles",
          operation: "delete",
          action: "success",
        },
        extra: {
          vehicleId: id,
        },
        level: "info",
      });

      res.status(204).send();
    },
  };
};
