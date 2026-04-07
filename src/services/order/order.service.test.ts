import Decimal from "decimal.js";
import { orderService, CreateOrderData } from "./order.service";
import type { PrismaClient } from "@prisma/client";

describe("orderService", () => {
  let mockPrisma: Partial<PrismaClient>;
  let service: ReturnType<typeof orderService>;

  beforeEach(() => {
    mockPrisma = {
      vehicle: {
        findUnique: jest.fn(),
      } as any,
      order: {
        create: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
      } as any,
    };

    service = orderService(mockPrisma as PrismaClient);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("createOrder", () => {
    it("should create an order with vehicle", async () => {
      const mockVehicle = {
        id: 1,
        price: new Decimal("25000"),
      };

      const mockCreatedOrder = {
        id: 1,
        folder_id: 10,
        vehicle_id: 1,
        total_amount: new Decimal("25000"),
        status: "draft",
        vehicle: mockVehicle,
      };

      (mockPrisma.vehicle!.findUnique as jest.Mock).mockResolvedValue(
        mockVehicle,
      );
      (mockPrisma.order!.create as jest.Mock).mockResolvedValue(
        mockCreatedOrder,
      );

      const data: CreateOrderData = {
        folder_id: 10,
        vehicle_id: 1,
        user_id: 5,
      };

      const result = await service.createOrder(data);

      expect(mockPrisma.vehicle!.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
      });
      expect(mockPrisma.order!.create).toHaveBeenCalledWith({
        data: {
          folder_id: 10,
          vehicle_id: 1,
          total_amount: new Decimal("25000"),
          status: "draft",
        },
        include: {
          vehicle: true,
        },
      });
      expect(result).toEqual(mockCreatedOrder);
    });

    it("should throw error if vehicle not found", async () => {
      (mockPrisma.vehicle!.findUnique as jest.Mock).mockResolvedValue(null);

      const data: CreateOrderData = {
        folder_id: 10,
        vehicle_id: 999,
        user_id: 5,
      };

      await expect(service.createOrder(data)).rejects.toThrow(
        "Vehicle not found",
      );
    });

    it("should correctly calculate total amount with decimal precision", async () => {
      const mockVehicle = {
        id: 1,
        price: new Decimal("25000.50"),
      };

      const mockCreatedOrder = {
        id: 1,
        folder_id: 10,
        vehicle_id: 1,
        total_amount: new Decimal("25000.50"),
        status: "draft",
        vehicle: mockVehicle,
      };

      (mockPrisma.vehicle!.findUnique as jest.Mock).mockResolvedValue(
        mockVehicle,
      );
      (mockPrisma.order!.create as jest.Mock).mockResolvedValue(
        mockCreatedOrder,
      );

      const data: CreateOrderData = {
        folder_id: 10,
        vehicle_id: 1,
        user_id: 5,
      };

      const result = await service.createOrder(data);

      expect(mockPrisma.order!.create).toHaveBeenCalledWith({
        data: {
          folder_id: 10,
          vehicle_id: 1,
          total_amount: new Decimal("25000.50"),
          status: "draft",
        },
        include: {
          vehicle: true,
        },
      });
      expect(result).toEqual(mockCreatedOrder);
    });
  });

  describe("getOrderById", () => {
    it("should retrieve order with related data", async () => {
      const mockOrder = {
        id: 1,
        folder_id: 10,
        vehicle_id: 1,
        total_amount: new Decimal("25000"),
        status: "draft",
        folder: { id: 10, user_id: 5 },
        vehicle: { id: 1, brand: "Tesla" },
        payments: [],
      };

      (mockPrisma.order!.findUnique as jest.Mock).mockResolvedValue(mockOrder);

      const result = await service.getOrderById(1);

      expect(mockPrisma.order!.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
        include: {
          folder: true,
          vehicle: true,
          payments: true,
        },
      });
      expect(result).toEqual(mockOrder);
    });

    it("should throw error if order not found", async () => {
      (mockPrisma.order!.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.getOrderById(999)).rejects.toThrow(
        "Order not found",
      );
    });
  });

  describe("getOrdersByFolderId", () => {
    it("should retrieve orders by folder", async () => {
      const mockOrders = [
        {
          id: 1,
          folder_id: 10,
          vehicle_id: 1,
          total_amount: new Decimal("25000"),
          status: "draft",
          vehicle: { id: 1 },
          payments: [],
        },
      ];

      (mockPrisma.order!.findMany as jest.Mock).mockResolvedValue(mockOrders);

      const result = await service.getOrdersByFolderId(10);

      expect(mockPrisma.order!.findMany).toHaveBeenCalledWith({
        where: { folder_id: 10 },
        include: {
          vehicle: true,
          payments: true,
        },
      });
      expect(result).toEqual(mockOrders);
    });

    it("should return empty array if no orders in folder", async () => {
      (mockPrisma.order!.findMany as jest.Mock).mockResolvedValue([]);

      const result = await service.getOrdersByFolderId(999);

      expect(result).toEqual([]);
    });
  });

  describe("updateOrderStatus", () => {
    it("should update order status", async () => {
      const mockUpdatedOrder = {
        id: 1,
        folder_id: 10,
        vehicle_id: 1,
        total_amount: new Decimal("25000"),
        status: "confirmed",
        vehicle: { id: 1 },
      };

      (mockPrisma.order!.update as jest.Mock).mockResolvedValue(
        mockUpdatedOrder,
      );

      const result = await service.updateOrderStatus(1, "confirmed");

      expect(mockPrisma.order!.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { status: "confirmed" },
        include: {
          vehicle: true,
        },
      });
      expect(result).toEqual(mockUpdatedOrder);
    });
  });
});
