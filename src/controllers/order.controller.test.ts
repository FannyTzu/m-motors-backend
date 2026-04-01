import { orderController } from "./order.controller";
import { orderService } from "../services/order.service.js";
import { addBreadcrumb } from "../utils/sentry.js";
import { Request, Response } from "express";
import Decimal from "decimal.js";

jest.mock("../services/order.service");
jest.mock("../utils/sentry.js");

const prismaMock = {
  folder: {
    findUnique: jest.fn(),
  },
} as any;

describe("orderController", () => {
  let controller: ReturnType<typeof orderController>;
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;

  beforeEach(() => {
    controller = orderController(prismaMock);
    mockRes = {
      json: jest.fn().mockReturnThis(),
      status: jest.fn().mockReturnThis(),
    };
    mockReq = {
      user: { sub: 1 },
    };
    jest.clearAllMocks();
  });

  describe("createOrder", () => {
    it("should create an order successfully", async () => {
      const mockFolder = {
        id: 10,
        user_id: 1,
        vehicle_id: 1,
      };

      const mockOrder = {
        id: 1,
        folder_id: 10,
        vehicle_id: 1,
        total_amount: new Decimal("25000"),
        status: "draft",
        options: [],
        vehicle: { id: 1, price: new Decimal("25000") },
      };

      mockReq = {
        body: {
          folder_id: 10,
          vehicle_id: 1,
          options: [],
        },
        user: { sub: 1 },
      };

      (prismaMock.folder.findUnique as jest.Mock).mockResolvedValue(mockFolder);
      (orderService as jest.Mock).mockReturnValue({
        createOrder: jest.fn().mockResolvedValue(mockOrder),
      });

      await controller.createOrder(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith(mockOrder);
      expect(addBreadcrumb).toHaveBeenCalledWith(
        "Order created",
        "order",
        expect.objectContaining({
          orderId: 1,
          folderId: 10,
          vehicleId: 1,
        }),
      );
    });

    it("should create an order with options", async () => {
      const mockFolder = {
        id: 10,
        user_id: 1,
        vehicle_id: 1,
      };

      const mockOrder = {
        id: 1,
        folder_id: 10,
        vehicle_id: 1,
        total_amount: new Decimal("26500"),
        status: "draft",
        options: [
          {
            option_id: 1,
            price_at_order: "500",
            option: { id: 1, price: new Decimal("500") },
          },
          {
            option_id: 2,
            price_at_order: "1000",
            option: { id: 2, price: new Decimal("1000") },
          },
        ],
        vehicle: { id: 1, price: new Decimal("25000") },
      };

      mockReq = {
        body: {
          folder_id: 10,
          vehicle_id: 1,
          options: [{ option_id: 1 }, { option_id: 2 }],
        },
        user: { sub: 1 },
      };

      (prismaMock.folder.findUnique as jest.Mock).mockResolvedValue(mockFolder);
      (orderService as jest.Mock).mockReturnValue({
        createOrder: jest.fn().mockResolvedValue(mockOrder),
      });

      await controller.createOrder(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith(mockOrder);
    });

    it("should return 401 if user is not authenticated", async () => {
      mockReq = {
        body: {
          folder_id: 10,
          vehicle_id: 1,
          options: [],
        },
        user: undefined,
      };

      await controller.createOrder(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({ error: "Unauthorized" });
    });

    it("should return 403 if folder does not exist", async () => {
      mockReq = {
        body: {
          folder_id: 999,
          vehicle_id: 1,
          options: [],
        },
        user: { sub: 1 },
      };

      (prismaMock.folder.findUnique as jest.Mock).mockResolvedValue(null);

      await controller.createOrder(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Folder not found or access denied",
      });
    });

    it("should return 403 if folder belongs to another user", async () => {
      const mockFolder = {
        id: 10,
        user_id: 2, // Different user
        vehicle_id: 1,
      };

      mockReq = {
        body: {
          folder_id: 10,
          vehicle_id: 1,
          options: [],
        },
        user: { sub: 1 },
      };

      (prismaMock.folder.findUnique as jest.Mock).mockResolvedValue(mockFolder);

      await controller.createOrder(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Folder not found or access denied",
      });
    });

    it("should return 400 if vehicle ID does not match folder's vehicle", async () => {
      const mockFolder = {
        id: 10,
        user_id: 1,
        vehicle_id: 1,
      };

      mockReq = {
        body: {
          folder_id: 10,
          vehicle_id: 2, // Different vehicle
          options: [],
        },
        user: { sub: 1 },
      };

      (prismaMock.folder.findUnique as jest.Mock).mockResolvedValue(mockFolder);

      await controller.createOrder(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Vehicle ID does not match the folder's vehicle",
      });
    });

    it("should return 404 if vehicle not found", async () => {
      const mockFolder = {
        id: 10,
        user_id: 1,
        vehicle_id: 1,
      };

      mockReq = {
        body: {
          folder_id: 10,
          vehicle_id: 1,
          options: [],
        },
        user: { sub: 1 },
      };

      (prismaMock.folder.findUnique as jest.Mock).mockResolvedValue(mockFolder);
      (orderService as jest.Mock).mockReturnValue({
        createOrder: jest
          .fn()
          .mockRejectedValue(new Error("Vehicle not found")),
      });

      await controller.createOrder(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({ error: "Vehicle not found" });
    });

    it("should return 404 if options not found", async () => {
      const mockFolder = {
        id: 10,
        user_id: 1,
        vehicle_id: 1,
      };

      mockReq = {
        body: {
          folder_id: 10,
          vehicle_id: 1,
          options: [{ option_id: 999 }],
        },
        user: { sub: 1 },
      };

      (prismaMock.folder.findUnique as jest.Mock).mockResolvedValue(mockFolder);
      (orderService as jest.Mock).mockReturnValue({
        createOrder: jest
          .fn()
          .mockRejectedValue(new Error("One or more options not found")),
      });

      await controller.createOrder(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "One or more options not found",
      });
    });

    it("should return 500 on internal server error", async () => {
      const mockFolder = {
        id: 10,
        user_id: 1,
        vehicle_id: 1,
      };

      mockReq = {
        body: {
          folder_id: 10,
          vehicle_id: 1,
          options: [],
        },
        user: { sub: 1 },
      };

      (prismaMock.folder.findUnique as jest.Mock).mockResolvedValue(mockFolder);
      (orderService as jest.Mock).mockReturnValue({
        createOrder: jest.fn().mockRejectedValue(new Error("Database error")),
      });

      await controller.createOrder(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Internal server error",
      });
    });
  });

  describe("getOrder", () => {
    it("should return an order by id", async () => {
      const mockOrder = {
        id: 1,
        folder_id: 10,
        vehicle_id: 1,
        total_amount: new Decimal("25000"),
        status: "draft",
        options: [],
        vehicle: { id: 1, price: new Decimal("25000") },
      };

      const mockFolder = {
        id: 10,
        user_id: 1,
        vehicle_id: 1,
      };

      mockReq = {
        params: { id: "1" },
        user: { sub: 1 },
      };

      (orderService as jest.Mock).mockReturnValue({
        getOrderById: jest.fn().mockResolvedValue(mockOrder),
      });
      (prismaMock.folder.findUnique as jest.Mock).mockResolvedValue(mockFolder);

      await controller.getOrder(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(mockOrder);
    });

    it("should return 401 if user is not authenticated", async () => {
      mockReq = {
        params: { id: "1" },
        user: undefined,
      };

      await controller.getOrder(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({ error: "Unauthorized" });
    });

    it("should return 404 if order not found", async () => {
      mockReq = {
        params: { id: "999" },
        user: { sub: 1 },
      };

      (orderService as jest.Mock).mockReturnValue({
        getOrderById: jest.fn().mockRejectedValue(new Error("Order not found")),
      });

      await controller.getOrder(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({ error: "Order not found" });
    });

    it("should return 403 if order belongs to another user", async () => {
      const mockOrder = {
        id: 1,
        folder_id: 10,
        vehicle_id: 1,
        total_amount: new Decimal("25000"),
        status: "draft",
      };

      const mockFolder = {
        id: 10,
        user_id: 2, // Different user
        vehicle_id: 1,
      };

      mockReq = {
        params: { id: "1" },
        user: { sub: 1 },
      };

      (orderService as jest.Mock).mockReturnValue({
        getOrderById: jest.fn().mockResolvedValue(mockOrder),
      });
      (prismaMock.folder.findUnique as jest.Mock).mockResolvedValue(mockFolder);

      await controller.getOrder(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({ error: "Access denied" });
    });

    it("should return 500 on internal server error", async () => {
      mockReq = {
        params: { id: "1" },
        user: { sub: 1 },
      };

      (orderService as jest.Mock).mockReturnValue({
        getOrderById: jest.fn().mockRejectedValue(new Error("Database error")),
      });

      await controller.getOrder(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Internal server error",
      });
    });
  });

  describe("getOrdersByFolder", () => {
    it("should return all orders for a folder", async () => {
      const mockOrders = [
        {
          id: 1,
          folder_id: 10,
          vehicle_id: 1,
          total_amount: new Decimal("25000"),
          status: "draft",
          options: [],
        },
        {
          id: 2,
          folder_id: 10,
          vehicle_id: 1,
          total_amount: new Decimal("30000"),
          status: "confirmed",
          options: [],
        },
      ];

      const mockFolder = {
        id: 10,
        user_id: 1,
        vehicle_id: 1,
      };

      mockReq = {
        params: { folder_id: "10" },
        user: { sub: 1 },
      };

      (orderService as jest.Mock).mockReturnValue({
        getOrdersByFolderId: jest.fn().mockResolvedValue(mockOrders),
      });
      (prismaMock.folder.findUnique as jest.Mock).mockResolvedValue(mockFolder);

      await controller.getOrdersByFolder(
        mockReq as Request,
        mockRes as Response,
      );

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(mockOrders);
    });

    it("should return empty array if folder has no orders", async () => {
      const mockFolder = {
        id: 10,
        user_id: 1,
        vehicle_id: 1,
      };

      mockReq = {
        params: { folder_id: "10" },
        user: { sub: 1 },
      };

      (orderService as jest.Mock).mockReturnValue({
        getOrdersByFolderId: jest.fn().mockResolvedValue([]),
      });
      (prismaMock.folder.findUnique as jest.Mock).mockResolvedValue(mockFolder);

      await controller.getOrdersByFolder(
        mockReq as Request,
        mockRes as Response,
      );

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith([]);
    });

    it("should return 401 if user is not authenticated", async () => {
      mockReq = {
        params: { folder_id: "10" },
        user: undefined,
      };

      await controller.getOrdersByFolder(
        mockReq as Request,
        mockRes as Response,
      );

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({ error: "Unauthorized" });
    });

    it("should return 403 if folder does not exist", async () => {
      mockReq = {
        params: { folder_id: "999" },
        user: { sub: 1 },
      };

      (prismaMock.folder.findUnique as jest.Mock).mockResolvedValue(null);

      await controller.getOrdersByFolder(
        mockReq as Request,
        mockRes as Response,
      );

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Folder not found or access denied",
      });
    });

    it("should return 403 if folder belongs to another user", async () => {
      const mockFolder = {
        id: 10,
        user_id: 2, // Different user
        vehicle_id: 1,
      };

      mockReq = {
        params: { folder_id: "10" },
        user: { sub: 1 },
      };

      (prismaMock.folder.findUnique as jest.Mock).mockResolvedValue(mockFolder);

      await controller.getOrdersByFolder(
        mockReq as Request,
        mockRes as Response,
      );

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Folder not found or access denied",
      });
    });

    it("should return 500 on internal server error", async () => {
      const mockFolder = {
        id: 10,
        user_id: 1,
        vehicle_id: 1,
      };

      mockReq = {
        params: { folder_id: "10" },
        user: { sub: 1 },
      };

      (prismaMock.folder.findUnique as jest.Mock).mockResolvedValue(mockFolder);
      (orderService as jest.Mock).mockReturnValue({
        getOrdersByFolderId: jest
          .fn()
          .mockRejectedValue(new Error("Database error")),
      });

      await controller.getOrdersByFolder(
        mockReq as Request,
        mockRes as Response,
      );

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Internal server error",
      });
    });

    it("should convert folder_id string to number", async () => {
      const mockFolder = {
        id: 10,
        user_id: 1,
        vehicle_id: 1,
      };

      mockReq = {
        params: { folder_id: "10" },
        user: { sub: 1 },
      };

      (orderService as jest.Mock).mockReturnValue({
        getOrdersByFolderId: jest.fn().mockResolvedValue([]),
      });
      (prismaMock.folder.findUnique as jest.Mock).mockResolvedValue(mockFolder);

      await controller.getOrdersByFolder(
        mockReq as Request,
        mockRes as Response,
      );

      expect(prismaMock.folder.findUnique).toHaveBeenCalledWith({
        where: { id: 10 },
      });
    });
  });

  describe("updateOrderStatus", () => {
    it("should update order status successfully", async () => {
      const mockOrder = {
        id: 1,
        folder_id: 10,
        vehicle_id: 1,
        total_amount: new Decimal("25000"),
        status: "draft",
        options: [],
        vehicle: { id: 1, price: new Decimal("25000") },
      };

      const updatedOrder = {
        ...mockOrder,
        status: "confirmed",
      };

      const mockFolder = {
        id: 10,
        user_id: 1,
        vehicle_id: 1,
      };

      mockReq = {
        params: { id: "1" },
        body: { status: "confirmed" },
        user: { sub: 1 },
      };

      (orderService as jest.Mock).mockReturnValue({
        getOrderById: jest.fn().mockResolvedValue(mockOrder),
        updateOrderStatus: jest.fn().mockResolvedValue(updatedOrder),
      });
      (prismaMock.folder.findUnique as jest.Mock).mockResolvedValue(mockFolder);

      await controller.updateOrderStatus(
        mockReq as Request,
        mockRes as Response,
      );

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(updatedOrder);
      expect(addBreadcrumb).toHaveBeenCalledWith(
        "Order status updated",
        "order",
        expect.objectContaining({
          orderId: 1,
          status: "confirmed",
        }),
      );
    });

    it("should update order status to cancelled", async () => {
      const mockOrder = {
        id: 1,
        folder_id: 10,
        vehicle_id: 1,
        total_amount: new Decimal("25000"),
        status: "confirmed",
        options: [],
      };

      const updatedOrder = {
        ...mockOrder,
        status: "cancelled",
      };

      const mockFolder = {
        id: 10,
        user_id: 1,
        vehicle_id: 1,
      };

      mockReq = {
        params: { id: "1" },
        body: { status: "cancelled" },
        user: { sub: 1 },
      };

      (orderService as jest.Mock).mockReturnValue({
        getOrderById: jest.fn().mockResolvedValue(mockOrder),
        updateOrderStatus: jest.fn().mockResolvedValue(updatedOrder),
      });
      (prismaMock.folder.findUnique as jest.Mock).mockResolvedValue(mockFolder);

      await controller.updateOrderStatus(
        mockReq as Request,
        mockRes as Response,
      );

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(updatedOrder);
    });

    it("should return 401 if user is not authenticated", async () => {
      mockReq = {
        params: { id: "1" },
        body: { status: "confirmed" },
        user: undefined,
      };

      await controller.updateOrderStatus(
        mockReq as Request,
        mockRes as Response,
      );

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({ error: "Unauthorized" });
    });

    it("should return 404 if order not found", async () => {
      mockReq = {
        params: { id: "999" },
        body: { status: "confirmed" },
        user: { sub: 1 },
      };

      (orderService as jest.Mock).mockReturnValue({
        getOrderById: jest.fn().mockRejectedValue(new Error("Order not found")),
      });

      await controller.updateOrderStatus(
        mockReq as Request,
        mockRes as Response,
      );

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({ error: "Order not found" });
    });

    it("should return 403 if order belongs to another user", async () => {
      const mockOrder = {
        id: 1,
        folder_id: 10,
        vehicle_id: 1,
        total_amount: new Decimal("25000"),
        status: "draft",
      };

      const mockFolder = {
        id: 10,
        user_id: 2, // Different user
        vehicle_id: 1,
      };

      mockReq = {
        params: { id: "1" },
        body: { status: "confirmed" },
        user: { sub: 1 },
      };

      (orderService as jest.Mock).mockReturnValue({
        getOrderById: jest.fn().mockResolvedValue(mockOrder),
      });
      (prismaMock.folder.findUnique as jest.Mock).mockResolvedValue(mockFolder);

      await controller.updateOrderStatus(
        mockReq as Request,
        mockRes as Response,
      );

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({ error: "Access denied" });
    });

    it("should return 500 on internal server error", async () => {
      const mockOrder = {
        id: 1,
        folder_id: 10,
        vehicle_id: 1,
        total_amount: new Decimal("25000"),
        status: "draft",
      };

      const mockFolder = {
        id: 10,
        user_id: 1,
        vehicle_id: 1,
      };

      mockReq = {
        params: { id: "1" },
        body: { status: "confirmed" },
        user: { sub: 1 },
      };

      (orderService as jest.Mock).mockReturnValue({
        getOrderById: jest.fn().mockResolvedValue(mockOrder),
        updateOrderStatus: jest
          .fn()
          .mockRejectedValue(new Error("Database error")),
      });
      (prismaMock.folder.findUnique as jest.Mock).mockResolvedValue(mockFolder);

      await controller.updateOrderStatus(
        mockReq as Request,
        mockRes as Response,
      );

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Internal server error",
      });
    });
  });
});
