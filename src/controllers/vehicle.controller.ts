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
          year,
          energy,
          kms,
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
          !kms ||
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
          year,
          energy,
          kms,
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
  };
};
