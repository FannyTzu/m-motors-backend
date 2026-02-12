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

    it("should create vehicle and return 201 with data", async () => {
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

    it("should return 400 if required fields are missing", async () => {
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

    it("should return 400 if brand is missing", async () => {
      const { brand, ...dataWithoutBrand } = validVehicleData;

      const response = await request(app)
        .post("/vehicle/create")
        .send(dataWithoutBrand);

      expect(response.status).toBe(400);
      expect(response.body.message).toBe("Validation failed");
      expect(response.body.errors).toBeDefined();
    });

    it("should return 500 if the service throws an error", async () => {
      const error = new Error("Database error");
      (vehicleService.vehicleService as jest.Mock).mockReturnValue({
        createVehicle: jest.fn().mockRejectedValue(error),
      });

      const response = await request(app)
        .post("/vehicle/create")
        .send(validVehicleData);

      expect(response.status).toBe(500);
      expect(response.body.error).toBeDefined();
    });

    it("should create a vehicle without image (optional)", async () => {
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

    it("should validate that type must be defined", async () => {
      const { type, ...dataWithoutType } = validVehicleData;

      const response = await request(app)
        .post("/vehicle/create")
        .send(dataWithoutType);

      expect(response.status).toBe(400);
      expect(response.body.message).toBe("Validation failed");
      expect(response.body.errors).toBeDefined();
    });

    it("should validate that status must be defined", async () => {
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
    it("should return a list of vehicles", async () => {
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

    it("should return 500 if the service throws an error when fetching all vehicles", async () => {
      const error = new Error("Database error");
      (vehicleService.vehicleService as jest.Mock).mockReturnValue({
        getAllVehicles: jest.fn().mockRejectedValue(error),
      });

      const response = await request(app).get("/vehicle/");
      expect(response.status).toBe(500);
      expect(response.body.error).toBeDefined();
    });
  });

  describe("GET /vehicle/:id", () => {
    it("should return a vehicle by ID", async () => {
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

    it("should return 404 if the vehicle doesn't exist", async () => {
      (vehicleService.vehicleService as jest.Mock).mockReturnValue({
        getVehicleById: jest.fn().mockResolvedValue(null),
      });

      const response = await request(app).get("/vehicle/999");
      expect(response.status).toBe(404);
      expect(response.body.error).toBe("Vehicle not found");
    });

    it("should return 500 if the service throws an error", async () => {
      const error = new Error("Database error");
      (vehicleService.vehicleService as jest.Mock).mockReturnValue({
        getVehicleById: jest.fn().mockRejectedValue(error),
      });

      const response = await request(app).get("/vehicle/1");
      expect(response.status).toBe(500);
      expect(response.body.error).toBeDefined();
    });
  });

  describe("GET /vehicle/type/:type", () => {
    it("should return vehicles by type", async () => {
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

    it("should return an empty array if no vehicles of the type exist", async () => {
      (vehicleService.vehicleService as jest.Mock).mockReturnValue({
        getVehiclesByType: jest.fn().mockResolvedValue([]),
      });

      const response = await request(app).get("/vehicle/type/sale");
      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });

    it("should return 500 if the service throws an error", async () => {
      const error = new Error("Database error");
      (vehicleService.vehicleService as jest.Mock).mockReturnValue({
        getVehiclesByType: jest.fn().mockRejectedValue(error),
      });

      const response = await request(app).get("/vehicle/type/sale");
      expect(response.status).toBe(500);
      expect(response.body.error).toBeDefined();
    });
  });

  describe("PUT /vehicle/:id", () => {
    const updateData = {
      price: 16000,
      km: 6000,
    };

    it("should update vehicle and return 200 with the updated data", async () => {
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

    it("should return 500 if the service throws an error during update", async () => {
      const error = new Error("Database error");
      (vehicleService.vehicleService as jest.Mock).mockReturnValue({
        updateVehicle: jest.fn().mockRejectedValue(error),
      });

      const response = await request(app).put("/vehicle/1").send(updateData);

      expect(response.status).toBe(500);
      expect(response.body.error).toBeDefined();
    });
  });

  describe("DELETE /vehicle/:id", () => {
    it("should delete vehicle and return 204", async () => {
      (vehicleService.vehicleService as jest.Mock).mockReturnValue({
        deleteVehicleById: jest.fn().mockResolvedValue(undefined),
      });

      const response = await request(app).delete("/vehicle/1");

      expect(response.status).toBe(204);
    });

    it("should return 500 if the service throws an error during delete", async () => {
      const error = new Error("VVehicle not found");
      (vehicleService.vehicleService as jest.Mock).mockReturnValue({
        deleteVehicleById: jest.fn().mockRejectedValue(error),
      });

      const response = await request(app).delete("/vehicle/999");

      expect(response.status).toBe(500);
      expect(response.body.error).toBeDefined();
    });
  });
});
