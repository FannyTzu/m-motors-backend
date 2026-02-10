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

    it("devrait valider que type doit être défini", async () => {
      const { type, ...dataWithoutType } = validVehicleData;

      const response = await request(app)
        .post("/vehicle/create")
        .send(dataWithoutType);

      expect(response.status).toBe(400);
      expect(response.body.message).toBe("Validation failed");
      expect(response.body.errors).toBeDefined();
    });

    it("devrait valider que status doit être défini", async () => {
      const { status, ...dataWithoutStatus } = validVehicleData;

      const response = await request(app)
        .post("/vehicle/create")
        .send(dataWithoutStatus);

      expect(response.status).toBe(400);
      expect(response.body.message).toBe("Validation failed");
      expect(response.body.errors).toBeDefined();
    });
  });
  describe("GET /vehicle/", () => {
    it("devrait retourner une liste de véhicules", async () => {
      const mockVehicles = [
        {
          id: 1,
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
          created_at: new Date().toISOString(),
        },
      ];

      (vehicleService.vehicleService as jest.Mock).mockReturnValue({
        getAllVehicles: jest.fn().mockResolvedValue(mockVehicles),
      });

      const response = await request(app).get("/vehicle/");
      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockVehicles);
    });

    it("devrait retourner 400 si le service lève une erreur à la récupération de tous les véhicules", async () => {
      const error = new Error("Erreur de base de données");
      (vehicleService.vehicleService as jest.Mock).mockReturnValue({
        getAllVehicles: jest.fn().mockRejectedValue(error),
      });

      const response = await request(app).get("/vehicle/");
      expect(response.status).toBe(400);
      expect(response.body.error).toBeDefined();
    });
  });

  describe("GET /vehicle/:id", () => {
    it("devrait retourner un véhicule par ID", async () => {
      const mockVehicle = {
        id: 1,
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
        created_at: new Date().toISOString(),
      };

      (vehicleService.vehicleService as jest.Mock).mockReturnValue({
        getVehicleById: jest.fn().mockResolvedValue(mockVehicle),
      });

      const response = await request(app).get("/vehicle/1");
      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockVehicle);
      expect(response.body.id).toBe(1);
    });

    it("devrait retourner 404 si le véhicule n'existe pas", async () => {
      (vehicleService.vehicleService as jest.Mock).mockReturnValue({
        getVehicleById: jest.fn().mockResolvedValue(null),
      });

      const response = await request(app).get("/vehicle/999");
      expect(response.status).toBe(404);
      expect(response.body.error).toBe("Vehicle not found");
    });

    it("devrait retourner 400 si le service lève une erreur", async () => {
      const error = new Error("Erreur de base de données");
      (vehicleService.vehicleService as jest.Mock).mockReturnValue({
        getVehicleById: jest.fn().mockRejectedValue(error),
      });

      const response = await request(app).get("/vehicle/1");
      expect(response.status).toBe(400);
      expect(response.body.error).toBeDefined();
    });
  });

  describe("GET /vehicle/type/:type", () => {
    it("devrait retourner les véhicules par type", async () => {
      const mockVehicles = [
        {
          id: 1,
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
          created_at: new Date().toISOString(),
        },
      ];

      (vehicleService.vehicleService as jest.Mock).mockReturnValue({
        getVehiclesByType: jest.fn().mockResolvedValue(mockVehicles),
      });

      const response = await request(app).get("/vehicle/type/sale");
      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockVehicles);
      expect(response.body[0].type).toBe(VehiclesType.sale);
    });

    it("devrait retourner un tableau vide si aucun véhicule du type n'existe", async () => {
      (vehicleService.vehicleService as jest.Mock).mockReturnValue({
        getVehiclesByType: jest.fn().mockResolvedValue([]),
      });

      const response = await request(app).get("/vehicle/type/sale");
      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });

    it("devrait retourner 400 si le service lève une erreur", async () => {
      const error = new Error("Erreur de base de données");
      (vehicleService.vehicleService as jest.Mock).mockReturnValue({
        getVehiclesByType: jest.fn().mockRejectedValue(error),
      });

      const response = await request(app).get("/vehicle/type/sale");
      expect(response.status).toBe(400);
      expect(response.body.error).toBeDefined();
    });
  });

  describe("PUT /vehicle/:id", () => {
    const updateData = {
      price: 16000,
      km: 6000,
    };

    it("devrait mettre à jour un véhicule et retourner 200 avec les données mises à jour", async () => {
      const mockVehicle = {
        id: 1,
        brand: "Aastra",
        model: "Serie 1",
        year: 2023,
        energy: "Essence",
        km: 6000,
        color: "Blanc",
        place: 5,
        door: 4,
        type: VehiclesType.sale,
        price: 16000,
        image: "https://example.com/image.jpg",
        transmission: VehiclesTransmision.automatic,
        status: VehiclesStatus.available,
        created_at: new Date().toISOString(),
      };

      (vehicleService.vehicleService as jest.Mock).mockReturnValue({
        updateVehicle: jest.fn().mockResolvedValue(mockVehicle),
      });

      const response = await request(app).put("/vehicle/1").send(updateData);

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockVehicle);
      expect(response.body.price).toBe(16000);
      expect(response.body.km).toBe(6000);
    });

    it("devrait retourner 400 si le service lève une erreur lors de la mise à jour", async () => {
      const error = new Error("Erreur de base de données");
      (vehicleService.vehicleService as jest.Mock).mockReturnValue({
        updateVehicle: jest.fn().mockRejectedValue(error),
      });

      const response = await request(app).put("/vehicle/1").send(updateData);

      expect(response.status).toBe(400);
      expect(response.body.error).toBeDefined();
    });
  });

  describe("DELETE /vehicle/:id", () => {
    it("devrait supprimer un véhicule et retourner 204", async () => {
      (vehicleService.vehicleService as jest.Mock).mockReturnValue({
        deleteVehicleById: jest.fn().mockResolvedValue(undefined),
      });

      const response = await request(app).delete("/vehicle/1");

      expect(response.status).toBe(204);
    });

    it("devrait retourner 400 si le service lève une erreur lors de la suppression", async () => {
      const error = new Error("Véhicule non trouvé");
      (vehicleService.vehicleService as jest.Mock).mockReturnValue({
        deleteVehicleById: jest.fn().mockRejectedValue(error),
      });

      const response = await request(app).delete("/vehicle/999");

      expect(response.status).toBe(400);
      expect(response.body.error).toBeDefined();
    });
  });
});
