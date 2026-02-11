import { vehicleService, VehicleData } from "./vehicle.service";
import {
  VehiclesStatus,
  VehiclesTransmision,
  VehiclesType,
} from "@prisma/client";

const prismaMock = {
  vehicle: {
    create: jest.fn(),
  },
} as any;

describe("vehicleService", () => {
  const service = vehicleService(prismaMock);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("createVehicle", () => {
    const validVehicleData: VehicleData = {
      brand: "AAstra",
      model: "serie 1",
      year: 2022,
      energy: "Essence",
      km: 5000,
      color: "Blanc",
      place: 5,
      door: 4,
      type: VehiclesType.sale,
      price: 15000,
      image: "image.jpg",
      description: "c'est un description",
      transmission: VehiclesTransmision.automatic,
      status: VehiclesStatus.available,
    };

    it("create vehicle without error and should return the created vehicle data", async () => {
      const mockVehicle = {
        id: 1,
        ...validVehicleData,
        price: 15000,
        created_at: new Date(),
      };

      prismaMock.vehicle.create.mockResolvedValue(mockVehicle);

      const result = await service.createVehicle(validVehicleData);

      expect(prismaMock.vehicle.create).toHaveBeenCalledWith({
        data: {
          brand: "AAstra",
          model: "serie 1",
          year: 2022,
          energy: "Essence",
          km: 5000,
          color: "Blanc",
          place: 5,
          door: 4,
          type: "sale",
          price: "15000",
          image: "image.jpg",
          transmission: "automatic",
          description: "c'est un description",
          status: "available",
        },
      });

      expect(result).toEqual(mockVehicle);
      expect(result.id).toBe(1);
      expect(result.brand).toBe("AAstra");
    });

    it("should return an error if the Prisma server fails", async () => {
      const error = new Error("Database error");
      prismaMock.vehicle.create.mockRejectedValue(error);

      await expect(service.createVehicle(validVehicleData)).rejects.toThrow(
        "Database error",
      );
    });

    it("should return an error if required fields are missing", async () => {
      const incompleteData = {
        brand: "AAstra",
        model: "serie 1",
        year: 2022,
        energy: "Essence",
        km: 5000,
      } as VehicleData;

      try {
        await service.createVehicle(incompleteData);
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it("should create a vehicle without image (optional)", async () => {
      const vehicleDataWithoutImage = { ...validVehicleData, image: undefined };

      const mockVehicle = {
        id: 2,
        ...vehicleDataWithoutImage,
        price: 15000,
        created_at: new Date(),
      };

      prismaMock.vehicle.create.mockResolvedValue(mockVehicle);

      const result = await service.createVehicle(vehicleDataWithoutImage);

      expect(result.image).toBeUndefined();
    });

    it("should create a vehicle without transmission (optional)", async () => {
      const vehicleDataWithoutTransmission = {
        ...validVehicleData,
        transmission: undefined,
      };

      const mockVehicle = {
        id: 3,
        ...vehicleDataWithoutTransmission,
        price: 15000,
        created_at: new Date(),
      };

      prismaMock.vehicle.create.mockResolvedValue(mockVehicle);

      const result = await service.createVehicle(
        vehicleDataWithoutTransmission,
      );

      expect(result.transmission).toBeUndefined();
    });
  });
  describe("updateVehicle", () => {
    const validVehicleData: VehicleData = {
      brand: "AAstra",
      model: "serie 1",
      year: 2022,
      energy: "Essence",
      km: 5000,
      color: "Blanc",
      place: 5,
      door: 4,
      type: VehiclesType.sale,
      price: 15000,
      image: "image.jpg",
      description: "c'est un description",
      transmission: VehiclesTransmision.automatic,
      status: VehiclesStatus.available,
    };

    it("updates vehicle without error and should return the updated vehicle data", async () => {
      const mockVehicle = {
        id: 1,
        ...validVehicleData,
        price: "16000",
        created_at: new Date(),
      };

      prismaMock.vehicle.update = jest.fn().mockResolvedValue(mockVehicle);

      const result = await service.updateVehicle(1, { price: 16000 });

      expect(prismaMock.vehicle.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: {
          price: "16000",
          brand: undefined,
          model: undefined,
          year: undefined,
          energy: undefined,
          km: undefined,
          color: undefined,
          place: undefined,
          door: undefined,
          type: undefined,
          image: undefined,
          description: undefined,
          transmission: undefined,
          status: undefined,
        },
      });

      expect(result).toEqual(mockVehicle);
      expect(result.id).toBe(1);
    });

    it("should return an error if the Prisma server fails during update", async () => {
      const error = new Error("Database error");
      prismaMock.vehicle.update = jest.fn().mockRejectedValue(error);

      await expect(service.updateVehicle(1, { price: 16000 })).rejects.toThrow(
        "Database error",
      );
    });
  });

  describe("getVehicleById", () => {
    it("should return vehicle by ID", async () => {
      const mockVehicle = {
        id: 1,
        brand: "AAstra",
        model: "serie 1",
        year: 2022,
        energy: "Essence",
        km: 5000,
        color: "Blanc",
        place: 5,
        door: 4,
        type: VehiclesType.sale,
        price: "15000",
        image: "image.jpg",
        transmission: VehiclesTransmision.automatic,
        status: VehiclesStatus.available,
        created_at: new Date(),
      };

      prismaMock.vehicle.findUnique = jest.fn().mockResolvedValue(mockVehicle);

      const result = await service.getVehicleById(1);

      expect(prismaMock.vehicle.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
      });
      expect(result).toEqual(mockVehicle);
    });

    it("should return null if the vehicle does not exist", async () => {
      prismaMock.vehicle.findUnique = jest.fn().mockResolvedValue(null);

      const result = await service.getVehicleById(999);

      expect(result).toBeNull();
    });
  });

  describe("getAllVehicles", () => {
    it("should return all vehicles", async () => {
      const mockVehicles = [
        {
          id: 1,
          brand: "AAstra",
          model: "serie 1",
          year: 2022,
          energy: "Essence",
          km: 5000,
          color: "Blanc",
          place: 5,
          door: 4,
          type: VehiclesType.sale,
          price: "15000",
          image: "image.jpg",
          transmission: VehiclesTransmision.automatic,
          status: VehiclesStatus.available,
          created_at: new Date(),
        },
        {
          id: 2,
          brand: "BMX",
          model: "P5",
          year: 2023,
          energy: "Diesel",
          km: 1000,
          color: "Noir",
          place: 5,
          door: 4,
          type: VehiclesType.rental,
          price: "25000",
          image: "image2.jpg",
          transmission: VehiclesTransmision.automatic,
          status: VehiclesStatus.available,
          created_at: new Date(),
        },
      ];

      prismaMock.vehicle.findMany = jest.fn().mockResolvedValue(mockVehicles);

      const result = await service.getAllVehicles();

      expect(prismaMock.vehicle.findMany).toHaveBeenCalled();
      expect(result).toEqual(mockVehicles);
      expect(result.length).toBe(2);
    });

    it("should return an empty array if there are no vehicles", async () => {
      prismaMock.vehicle.findMany = jest.fn().mockResolvedValue([]);

      const result = await service.getAllVehicles();

      expect(result).toEqual([]);
    });
  });

  describe("getVehiclesByType", () => {
    it("should return vehicles by type", async () => {
      const mockVehicles = [
        {
          id: 1,
          brand: "AAstra",
          model: "serie 1",
          year: 2022,
          energy: "Essence",
          km: 5000,
          color: "Blanc",
          place: 5,
          door: 4,
          type: VehiclesType.sale,
          price: "15000",
          image: "image.jpg",
          transmission: VehiclesTransmision.automatic,
          status: VehiclesStatus.available,
          created_at: new Date(),
        },
      ];

      prismaMock.vehicle.findMany = jest.fn().mockResolvedValue(mockVehicles);

      const result = await service.getVehiclesByType(VehiclesType.sale);

      expect(prismaMock.vehicle.findMany).toHaveBeenCalledWith({
        where: { type: VehiclesType.sale },
      });
      expect(result).toEqual(mockVehicles);
      expect(result[0].type).toBe(VehiclesType.sale);
    });
  });

  describe("deleteVehicleById", () => {
    it("should delete a vehicle by ID", async () => {
      prismaMock.vehicle.delete = jest.fn().mockResolvedValue({});

      await service.deleteVehicleById(1);

      expect(prismaMock.vehicle.delete).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });

    it("should return an error if the vehicle does not exist", async () => {
      const error = new Error("VVehicle not found");
      prismaMock.vehicle.delete = jest.fn().mockRejectedValue(error);

      await expect(service.deleteVehicleById(999)).rejects.toThrow(
        "Vehicle not found",
      );
    });
  });
});
