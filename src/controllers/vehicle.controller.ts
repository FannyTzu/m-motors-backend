import { PrismaClient } from "@prisma/client";
import { Request, Response } from "express";
import { vehicleService } from "../services/vehicle.service.js";
import { addBreadcrumb } from "../utils/sentry.js";
import multer from "multer";

const storage = multer.memoryStorage();
export const uploadVehicleImage = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = ["image/jpeg", "image/jpg", "image/png"];

    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type. Only images (JPEG, PNG) are allowed."));
    }
  },
});

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

    uploadImage: async (req: Request, res: Response) => {
      try {
        const vehicleId = req.params.id ? Number(req.params.id) : undefined;

        if (!req.file) {
          return res.status(400).json({ error: "No image uploaded" });
        }

        if (vehicleId) {
          const existingVehicle =
            await vehicleService(prisma).getVehicleById(vehicleId);
          if (existingVehicle?.image) {
            await vehicleService(prisma).deleteVehicleImage(
              existingVehicle.image,
            );
          }
        }

        const result = await vehicleService(prisma).uploadVehicleImage(
          req.file,
          vehicleId,
        );

        if (vehicleId) {
          await vehicleService(prisma).updateVehicle(vehicleId, {
            image: result.publicUrl,
          } as any);
        }

        res.status(201).json({
          message: "Image uploaded successfully",
          ...result,
        });
      } catch (error) {
        console.error("Error uploading vehicle image:", error);
        res.status(500).json({
          error: "Failed to upload image",
          message: error instanceof Error ? error.message : "Unknown error",
        });
      }
    },

    deleteVehicleById: async (req: Request, res: Response) => {
      const { id } = req.params;
      addBreadcrumb(`Vehicle ${id} deleted`, "vehicle", {
        vehicleId: id,
      });
      await vehicleService(prisma).deleteVehicleById(Number(id));
      res.status(204).send();
    },
  };
};
