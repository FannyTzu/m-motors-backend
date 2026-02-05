import { PrismaClient, VehiclesStatus, VehiclesType } from "@prisma/client";

export interface VehicleData {
  brand: string;
  model: string;
  year: number;
  energy: string;
  kms: number;
  color: string;
  place: number;
  door: number;
  type: VehiclesType;
  price: number;
  image?: string;
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
          kms: data.kms,
          color: data.color,
          place: data.place,
          door: data.door,
          type: data.type,
          price: data.price.toString(),
          image: data.image,
          status: data.status,
        },
      });
      return vehicle;
    },
  };
};
