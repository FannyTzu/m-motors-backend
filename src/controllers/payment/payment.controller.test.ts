import { paymentController } from "./payment.controller";
import { paymentService } from "../../services/payment/payment.service";
import { PaymentStatus } from "@prisma/client";

jest.mock("../../services/payment/payment.service");
jest.mock("../../utils/sentry", () => ({
  addBreadcrumb: jest.fn(),
}));

describe("PaymentController", () => {
  let controller: ReturnType<typeof paymentController>;
  let mockRequest: any;
  let mockResponse: any;
  let mockPrisma: any;
  let mockPaymentService: any;

  beforeEach(() => {
    jest.clearAllMocks();

    mockRequest = {
      body: {},
      params: {},
      user: { sub: 1 },
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    mockPaymentService = {
      createPayment: jest.fn(),
      updatePaymentStatus: jest.fn(),
      getPaymentById: jest.fn(),
    };

    (paymentService as jest.Mock).mockReturnValue(mockPaymentService);

    mockPrisma = {
      order: {
        findUnique: jest.fn(),
      },
      payment: {
        findUnique: jest.fn(),
      },
    };

    controller = paymentController(mockPrisma);
  });

  describe("createPayment", () => {
    it("should create a payment successfully", async () => {
      const orderData = {
        id: 1,
        folder_id: 1,
        vehicle_id: 1,
        total_amount: 25000,
        status: "draft",
        folder: {
          id: 1,
          user_id: 1,
        },
      };

      const paymentData = {
        id: 1,
        order_id: 1,
        amount: 5000,
        status: "pending" as PaymentStatus,
        transaction_id: "txn_123",
        paid_at: null,
        order: orderData,
      };

      mockRequest.body = {
        order_id: 1,
        amount: 5000,
        transaction_id: "txn_123",
      };

      mockPrisma.order.findUnique.mockResolvedValue(orderData);
      mockPaymentService.createPayment.mockResolvedValue(paymentData);

      await controller.createPayment(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: "Payment created successfully",
        data: paymentData,
      });
      expect(mockPaymentService.createPayment).toHaveBeenCalledWith({
        order_id: 1,
        amount: 5000,
        transaction_id: "txn_123",
      });
    });

    it("should return 401 if user is not authenticated", async () => {
      mockRequest.user = undefined;
      mockRequest.body = { order_id: 1, amount: 5000 };

      await controller.createPayment(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: "Unauthorized",
      });
    });

    it("should return 400 if order_id is missing", async () => {
      mockRequest.body = { amount: 5000 };

      await controller.createPayment(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: "Missing required fields: order_id, amount",
      });
    });

    it("should return 400 if amount is missing", async () => {
      mockRequest.body = { order_id: 1 };

      await controller.createPayment(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: "Missing required fields: order_id, amount",
      });
    });

    it("should return 404 if order is not found", async () => {
      mockRequest.body = { order_id: 999, amount: 5000 };
      mockPrisma.order.findUnique.mockResolvedValue(null);

      await controller.createPayment(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: "Order not found",
      });
    });

    it("should return 403 if user does not own the order", async () => {
      const orderData = {
        id: 1,
        folder_id: 1,
        vehicle_id: 1,
        total_amount: 25000,
        status: "draft",
        folder: {
          id: 1,
          user_id: 999, // Different user
        },
      };

      mockRequest.body = { order_id: 1, amount: 5000 };
      mockRequest.user = { sub: 1 };
      mockPrisma.order.findUnique.mockResolvedValue(orderData);

      await controller.createPayment(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: "Access denied to this order",
      });
    });

    it("should handle service errors", async () => {
      const orderData = {
        id: 1,
        folder_id: 1,
        vehicle_id: 1,
        total_amount: 25000,
        status: "draft",
        folder: {
          id: 1,
          user_id: 1,
        },
      };

      mockRequest.body = { order_id: 1, amount: 5000 };
      mockPrisma.order.findUnique.mockResolvedValue(orderData);
      mockPaymentService.createPayment.mockRejectedValue(
        new Error("Database error"),
      );

      await controller.createPayment(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: "Database error",
      });
    });

    it("should create payment without transaction_id", async () => {
      const orderData = {
        id: 1,
        folder_id: 1,
        vehicle_id: 1,
        total_amount: 25000,
        status: "draft",
        folder: {
          id: 1,
          user_id: 1,
        },
      };

      const paymentData = {
        id: 1,
        order_id: 1,
        amount: 5000,
        status: "pending" as PaymentStatus,
        transaction_id: null,
        paid_at: null,
        order: orderData,
      };

      mockRequest.body = {
        order_id: 1,
        amount: 5000,
      };

      mockPrisma.order.findUnique.mockResolvedValue(orderData);
      mockPaymentService.createPayment.mockResolvedValue(paymentData);

      await controller.createPayment(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockPaymentService.createPayment).toHaveBeenCalledWith({
        order_id: 1,
        amount: 5000,
        transaction_id: undefined,
      });
    });
  });

  describe("updatePaymentStatus", () => {
    it("should update payment status successfully", async () => {
      const paymentData = {
        id: 1,
        order_id: 1,
        amount: 5000,
        status: "paid" as PaymentStatus,
        transaction_id: "txn_123",
        paid_at: new Date(),
        order: {
          id: 1,
          folder: {
            user_id: 1,
          },
        },
      };

      mockRequest.params.id = "1";
      mockRequest.body = { status: "paid" };
      mockRequest.user = { sub: 1 };

      mockPrisma.payment.findUnique.mockResolvedValue(paymentData);
      mockPaymentService.updatePaymentStatus.mockResolvedValue(paymentData);

      await controller.updatePaymentStatus(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: "Payment status updated successfully",
        data: paymentData,
      });
      expect(mockPaymentService.updatePaymentStatus).toHaveBeenCalledWith(
        1,
        "paid",
      );
    });

    it("should return 401 if user is not authenticated", async () => {
      mockRequest.user = undefined;
      mockRequest.params.id = "1";
      mockRequest.body = { status: "paid" };

      await controller.updatePaymentStatus(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: "Unauthorized",
      });
    });

    it("should return 400 if status is missing", async () => {
      mockRequest.params.id = "1";
      mockRequest.body = {};
      mockRequest.user = { sub: 1 };

      await controller.updatePaymentStatus(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: "Missing required field: status",
      });
    });

    it("should return 400 if status is invalid", async () => {
      mockRequest.params.id = "1";
      mockRequest.body = { status: "invalid_status" };
      mockRequest.user = { sub: 1 };

      await controller.updatePaymentStatus(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: "Invalid status. Must be one of: pending, paid, failed",
      });
    });

    it("should return 404 if payment is not found", async () => {
      mockRequest.params.id = "999";
      mockRequest.body = { status: "paid" };
      mockRequest.user = { sub: 1 };

      mockPrisma.payment.findUnique.mockResolvedValue(null);

      await controller.updatePaymentStatus(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: "Payment not found",
      });
    });

    it("should return 403 if user does not own the payment", async () => {
      const paymentData = {
        id: 1,
        order_id: 1,
        amount: 5000,
        status: "pending" as PaymentStatus,
        transaction_id: "txn_123",
        paid_at: null,
        order: {
          id: 1,
          folder: {
            user_id: 999, // Different user
          },
        },
      };

      mockRequest.params.id = "1";
      mockRequest.body = { status: "paid" };
      mockRequest.user = { sub: 1 };

      mockPrisma.payment.findUnique.mockResolvedValue(paymentData);

      await controller.updatePaymentStatus(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: "Access denied to this payment",
      });
    });

    it("should handle service errors", async () => {
      const paymentData = {
        id: 1,
        order_id: 1,
        amount: 5000,
        status: "pending" as PaymentStatus,
        transaction_id: "txn_123",
        paid_at: null,
        order: {
          id: 1,
          folder: {
            user_id: 1,
          },
        },
      };

      mockRequest.params.id = "1";
      mockRequest.body = { status: "paid" };
      mockRequest.user = { sub: 1 };

      mockPrisma.payment.findUnique.mockResolvedValue(paymentData);
      mockPaymentService.updatePaymentStatus.mockRejectedValue(
        new Error("Update error"),
      );

      await controller.updatePaymentStatus(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: "Update error",
      });
    });

    it("should accept pending status", async () => {
      const paymentData = {
        id: 1,
        order_id: 1,
        amount: 5000,
        status: "pending" as PaymentStatus,
        transaction_id: "txn_123",
        paid_at: null,
        order: {
          id: 1,
          folder: {
            user_id: 1,
          },
        },
      };

      mockRequest.params.id = "1";
      mockRequest.body = { status: "pending" };
      mockRequest.user = { sub: 1 };

      mockPrisma.payment.findUnique.mockResolvedValue(paymentData);
      mockPaymentService.updatePaymentStatus.mockResolvedValue(paymentData);

      await controller.updatePaymentStatus(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockPaymentService.updatePaymentStatus).toHaveBeenCalledWith(
        1,
        "pending",
      );
    });

    it("should accept failed status", async () => {
      const paymentData = {
        id: 1,
        order_id: 1,
        amount: 5000,
        status: "failed" as PaymentStatus,
        transaction_id: "txn_123",
        paid_at: null,
        order: {
          id: 1,
          folder: {
            user_id: 1,
          },
        },
      };

      mockRequest.params.id = "1";
      mockRequest.body = { status: "failed" };
      mockRequest.user = { sub: 1 };

      mockPrisma.payment.findUnique.mockResolvedValue(paymentData);
      mockPaymentService.updatePaymentStatus.mockResolvedValue(paymentData);

      await controller.updatePaymentStatus(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockPaymentService.updatePaymentStatus).toHaveBeenCalledWith(
        1,
        "failed",
      );
    });
  });

  describe("getPaymentById", () => {
    it("should retrieve payment successfully", async () => {
      const paymentData = {
        id: 1,
        order_id: 1,
        amount: 5000,
        status: "pending" as PaymentStatus,
        transaction_id: "txn_123",
        paid_at: null,
        order: {
          id: 1,
          status: "draft",
          folder: {
            user_id: 1,
          },
        },
      };

      mockRequest.params.id = "1";
      mockRequest.user = { sub: 1 };

      mockPaymentService.getPaymentById.mockResolvedValue(paymentData);

      await controller.getPaymentById(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        data: paymentData,
      });
      expect(mockPaymentService.getPaymentById).toHaveBeenCalledWith(1);
    });

    it("should return 401 if user is not authenticated", async () => {
      mockRequest.user = undefined;
      mockRequest.params.id = "1";

      await controller.getPaymentById(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: "Unauthorized",
      });
    });

    it("should return 404 if payment is not found", async () => {
      mockRequest.params.id = "999";
      mockRequest.user = { sub: 1 };

      mockPaymentService.getPaymentById.mockResolvedValue(null);

      await controller.getPaymentById(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: "Payment not found",
      });
    });

    it("should return 403 if user does not own the payment", async () => {
      const paymentData = {
        id: 1,
        order_id: 1,
        amount: 5000,
        status: "pending" as PaymentStatus,
        transaction_id: "txn_123",
        paid_at: null,
        order: {
          id: 1,
          status: "draft",
          folder: {
            user_id: 999, // Different user
          },
        },
      };

      mockRequest.params.id = "1";
      mockRequest.user = { sub: 1 };

      mockPaymentService.getPaymentById.mockResolvedValue(paymentData);

      await controller.getPaymentById(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: "Access denied to this payment",
      });
    });

    it("should handle service errors", async () => {
      mockRequest.params.id = "1";
      mockRequest.user = { sub: 1 };

      mockPaymentService.getPaymentById.mockRejectedValue(
        new Error("Fetch error"),
      );

      await controller.getPaymentById(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: "Fetch error",
      });
    });

    it("should return payment with all related data", async () => {
      const paymentData = {
        id: 1,
        order_id: 1,
        amount: 5000,
        status: "paid" as PaymentStatus,
        transaction_id: "txn_123",
        paid_at: new Date("2026-04-05"),
        order: {
          id: 1,
          status: "confirmed",
          vehicle_id: 1,
          folder: {
            id: 1,
            user_id: 1,
            status: "active",
          },
          vehicle: {
            id: 1,
            brand: "Tesla",
            model: "Model 3",
            status: "sold",
          },
        },
      };

      mockRequest.params.id = "1";
      mockRequest.user = { sub: 1 };

      mockPaymentService.getPaymentById.mockResolvedValue(paymentData);

      await controller.getPaymentById(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        data: paymentData,
      });
    });
  });
});
