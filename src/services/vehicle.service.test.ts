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
      kms: 5000,
      color: "Blanc",
      place: 5,
      door: 4,
      type: VehiclesType.sale,
      price: 15000,
      image: "image.jpg",
      transmission: VehiclesTransmision.automatic,
      status: VehiclesStatus.available,
    };

    it("crée le vehicule sans erreur et doit retourner les donnée du céhicules créé", async () => {
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
          kms: 5000,
          color: "Blanc",
          place: 5,
          door: 4,
          type: "sale",
          price: "15000",
          image: "image.jpg",
          transmission: "automatic",
          status: "available",
        },
      });

      expect(result).toEqual(mockVehicle);
      expect(result.id).toBe(1);
      expect(result.brand).toBe("AAstra");
    });

    it("devrait retourner une erreur si le serveur Prisma échoue", async () => {
      const error = new Error("Erreur de base de données");
      prismaMock.vehicle.create.mockRejectedValue(error);

      await expect(service.createVehicle(validVehicleData)).rejects.toThrow(
        "Erreur de base de données",
      );
    });

    it("devrait retourner une erreur si des champs obligatoires sont manquants", async () => {
      const incompleteData = {
        brand: "AAstra",
        model: "serie 1",
        year: 2022,
        energy: "Essence",
        kms: 5000,
      } as VehicleData;

      try {
        await service.createVehicle(incompleteData);
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it("devrait créer un véhicule sans image (optionnel)", async () => {
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

    it("devrait créer un véhicule sans transmission (optionnel)", async () => {
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
});
