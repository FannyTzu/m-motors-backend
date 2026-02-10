import {
  PrismaClient,
  VehiclesStatus,
  VehiclesTransmision,
  VehiclesType,
} from "@prisma/client";

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
    deleteVehicleById: async (id: number) => {
      await prisma.vehicle.delete({
        where: { id },
      });
    },
  };
};
