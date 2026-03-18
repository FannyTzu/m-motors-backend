import {
  PrismaClient,
  VehiclesStatus,
  VehiclesTransmision,
  VehiclesType,
} from "@prisma/client";
import { supabase, BUCKET_VEHICLES } from "../utils/supabase.js";

export interface VehicleData {
  brand: string;
  model: string;
  transmission?: VehiclesTransmision;
  year: number;
  energy: string;
  km: number;
  color: string;
  place: number;
  door: number;
  type: VehiclesType;
  price: number;
  image?: string;
  description?: string;
  status: VehiclesStatus;
}

export const vehicleService = (prisma: PrismaClient) => {
  return {
    createVehicle: async (data: VehicleData) => {
      const vehicle = await prisma.vehicle.create({
        data: {
          brand: data.brand,
          model: data.model,
          year: data.year,
          energy: data.energy,
          km: data.km,
          color: data.color,
          place: data.place,
          door: data.door,
          type: data.type,
          price: data.price.toString(),
          image: data.image,
          description: data.description,
          transmission: data.transmission,
          status: data.status,
        },
      });
      return vehicle;
    },
    updateVehicle: async (id: number, data: Partial<VehicleData>) => {
      const vehicle = await prisma.vehicle.update({
        where: { id },
        data: {
          brand: data.brand,
          model: data.model,
          year: data.year,
          energy: data.energy,
          km: data.km,
          color: data.color,
          place: data.place,
          door: data.door,
          type: data.type,
          price: data.price ? data.price.toString() : undefined,
          image: data.image,
          description: data.description,
          transmission: data.transmission,
          status: data.status,
        },
      });
      return vehicle;
    },
    getVehicleById: async (id: number) => {
      const vehicle = await prisma.vehicle.findUnique({
        where: { id },
      });
      return vehicle;
    },
    getAllVehicles: async () => {
      const vehicles = await prisma.vehicle.findMany();
      return vehicles;
    },
    getVehiclesByType: async (type: VehiclesType) => {
      const vehicles = await prisma.vehicle.findMany({
        where: { type },
      });
      return vehicles;
    },

    uploadVehicleImage: async (
      file: Express.Multer.File,
      vehicleId?: number,
    ) => {
      const fileName = vehicleId
        ? `vehicle_${vehicleId}/${Date.now()}_${file.originalname}`
        : `temp/${Date.now()}_${file.originalname}`;

      const { data, error } = await supabase.storage
        .from(BUCKET_VEHICLES)
        .upload(fileName, file.buffer, {
          contentType: file.mimetype,
          upsert: false,
        });

      if (error) {
        throw new Error(`Failed to upload image: ${error.message}`);
      }

      const { data: urlData } = supabase.storage
        .from(BUCKET_VEHICLES)
        .getPublicUrl(fileName);

      return {
        fileName,
        publicUrl: urlData.publicUrl,
      };
    },

    deleteVehicleImage: async (imageUrl: string) => {
      try {
        const url = new URL(imageUrl);
        const pathParts = url.pathname.split(
          `/storage/v1/object/public/${BUCKET_VEHICLES}/`,
        );
        const filePath = pathParts[1];

        if (filePath) {
          const { error } = await supabase.storage
            .from(BUCKET_VEHICLES)
            .remove([filePath]);

          if (error) {
            console.error("Failed to delete image from Supabase:", error);
          }
        }
      } catch (error) {
        console.error("Error deleting vehicle image:", error);
      }
    },

    deleteVehicleById: async (id: number) => {
      const vehicle = await prisma.vehicle.findUnique({
        where: { id },
      });
      if (vehicle?.image) {
        await vehicleService(prisma).deleteVehicleImage(vehicle.image);
      }

      await prisma.vehicle.delete({
        where: { id },
      });
    },
  };
};
