import request from "supertest";
import { app } from "../app";
import * as vehicleService from "../services/vehicle.service";
import {
  VehiclesStatus,
  VehiclesTransmision,
  VehiclesType,
} from "@prisma/client";

jest.mock("../services/vehicle.service");
jest.mock("../middlewares/auth.middleware", () => ({
  authMiddleware: (req: any, res: any, next: any) => next(),
  roleMiddleware: () => (req: any, res: any, next: any) => next(),
}));

describe("vehicleController", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("POST /vehicle/create", () => {
    const validVehicleData = {
      brand: "Aastra",
      model: "Serie 1",
      year: 2023,
      energy: "Essence",
      km: 5000,
      color: "Blanc",
      place: 5,
      door: 4,
      type: VehiclesType.sale,
      price: 15000,
      image: "https://example.com/image.jpg",
      transmission: VehiclesTransmision.automatic,
      status: VehiclesStatus.available,
    };

    it("devrait créer un véhicule et retourner 201 avec les données", async () => {
      const mockVehicle = {
        id: 1,
        ...validVehicleData,
        price: 15000,
        created_at: new Date().toISOString(),
      };

      (vehicleService.vehicleService as jest.Mock).mockReturnValue({
        createVehicle: jest.fn().mockResolvedValue(mockVehicle),
      });

      const response = await request(app)
        .post("/vehicle/create")
        .send(validVehicleData);

      expect(response.status).toBe(201);
      expect(response.body).toEqual(mockVehicle);
      expect(response.body.id).toBe(1);
      expect(response.body.brand).toBe("Aastra");
    });

    it("devrait retourner 400 si des champs obligatoires manquent", async () => {
      const incompleteData = {
        brand: "Aastra",
        model: "Serie 1",
        year: 2023,
      };

      const response = await request(app)
        .post("/vehicle/create")
        .send(incompleteData);

      expect(response.status).toBe(400);
      expect(response.body.message).toBe("Validation failed");
      expect(response.body.errors).toBeDefined();
    });

    it("devrait retourner 400 si la marque manque", async () => {
      const { brand, ...dataWithoutBrand } = validVehicleData;

      const response = await request(app)
        .post("/vehicle/create")
        .send(dataWithoutBrand);

      expect(response.status).toBe(400);
      expect(response.body.message).toBe("Validation failed");
      expect(response.body.errors).toBeDefined();
    });

    it("devrait retourner 400 si le service lève une erreur", async () => {
      const error = new Error("Erreur de base de données");
      (vehicleService.vehicleService as jest.Mock).mockReturnValue({
        createVehicle: jest.fn().mockRejectedValue(error),
      });

      const response = await request(app)
        .post("/vehicle/create")
        .send(validVehicleData);

      expect(response.status).toBe(400);
      expect(response.body.error).toBeDefined();
    });

    it("devrait créer un véhicule sans image (optionnel)", async () => {
      const { image, ...vehicleDataWithoutImage } = validVehicleData;

      const mockVehicle = {
        id: 2,
        ...vehicleDataWithoutImage,
        price: 15000,
        image: null,
        created_at: new Date().toISOString(),
      };

      (vehicleService.vehicleService as jest.Mock).mockReturnValue({
        createVehicle: jest.fn().mockResolvedValue(mockVehicle),
      });

      const response = await request(app)
        .post("/vehicle/create")
        .send(vehicleDataWithoutImage);

      expect(response.status).toBe(201);
      expect(response.body.image).toBeNull();
    });

    it("devrait retourner 400 si transmission manque (champ requis)", async () => {
      const { transmission, ...vehicleDataWithoutTransmission } =
        validVehicleData;

      const response = await request(app)
        .post("/vehicle/create")
        .send(vehicleDataWithoutTransmission);

      expect(response.status).toBe(400);
      expect(response.body.message).toBe("Validation failed");
      expect(response.body.errors).toBeDefined();
    });

    it("devrait valider que type est requis", async () => {
      const { type, ...dataWithoutType } = validVehicleData;

      const response = await request(app)
        .post("/vehicle/create")
        .send(dataWithoutType);

      expect(response.status).toBe(400);
      expect(response.body.message).toBe("Validation failed");
      expect(response.body.errors).toBeDefined();
    });

    it("devrait valider que status est requis", async () => {
      const { status, ...dataWithoutStatus } = validVehicleData;

      const response = await request(app)
        .post("/vehicle/create")
        .send(dataWithoutStatus);

      expect(response.status).toBe(400);
      expect(response.body.message).toBe("Validation failed");
      expect(response.body.errors).toBeDefined();
    });
  });
});
