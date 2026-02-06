import { PrismaClient } from "@prisma/client";
import { Request, Response } from "express";
import { vehicleService } from "../services/vehicle.service";

export const vehicleController = (prisma: PrismaClient) => {
  return {
    createVehicle: async (req: Request, res: Response) => {
      try {
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
          image,
          status,
        });
        res.status(201).json(vehicle);
      } catch (error) {
        res.status(400).json({ error: (error as Error).message });
      }
    },
    updateVehicle: async (req: Request, res: Response) => {
      try {
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
          status,
        });
        res.status(200).json(vehicle);
      } catch (error) {
        res.status(400).json({ error: (error as Error).message });
      }
    },
    getVehicleById: async (req: Request, res: Response) => {
      try {
        const { id } = req.params;
        const vehicle = await vehicleService(prisma).getVehicleById(Number(id));
        if (!vehicle) {
          return res.status(404).json({ error: "Vehicle not found" });
        }
        res.status(200).json(vehicle);
      } catch (error) {
        res.status(400).json({ error: (error as Error).message });
      }
    },
    getAllVehicles: async (req: Request, res: Response) => {
      try {
        const vehicles = await vehicleService(prisma).getAllVehicles();
        res.status(200).json(vehicles);
      } catch (error) {
        res.status(400).json({ error: (error as Error).message });
      }
    },
  };
};
