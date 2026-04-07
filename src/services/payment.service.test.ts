import { paymentService } from "./payment.service";
import { PaymentStatus, OrderStatus, VehiclesStatus } from "@prisma/client";

const prismaMock = {
  order: {
    findUnique: jest.fn(),
  },
  payment: {
    findUnique: jest.fn(),
    create: jest.fn(),
    findMany: jest.fn(),
  },
  vehicle: {
    update: jest.fn(),
  },
  folder: {
    update: jest.fn(),
  },
  $transaction: jest.fn((cb) => cb(prismaMock)),
} as any;

describe("paymentService", () => {
  const service = paymentService(prismaMock);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("createPayment", () => {
    it("should create a payment successfully", async () => {
      const orderData = {
        id: 1,
        folder_id: 1,
        vehicle_id: 1,
        total_amount: 25000,
        status: "draft",
        created_at: new Date(),
        vehicle: {
          id: 1,
          brand: "Tesla",
          model: "Model 3",
          year: 2024,
          energy: "electric",
          km: 5000,
          color: "white",
          place: 5,
          door: 4,
          type: "sale",
          image: null,
          description: "Test vehicle",
          price: 25000,
          transmission: "automatic",
          status: "available",
          created_at: new Date(),
        },
        folder: {
          id: 1,
          user_id: 1,
          vehicle_id: 1,
          status: "active",
          created_at: new Date(),
        },
      };

      prismaMock.order.findUnique.mockResolvedValue(orderData);

      const paymentData = {
        amount: 5000,
        order_id: 1,
        transaction_id: "txn_123",
      };

      const createdPayment = {
        id: 1,
        order_id: 1,
        amount: 5000,
        status: "pending" as PaymentStatus,
        transaction_id: "txn_123",
        paid_at: null,
        order: orderData,
      };

      prismaMock.payment.create.mockResolvedValue(createdPayment);

      const result = await service.createPayment(paymentData);

      expect(prismaMock.order.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
        include: {
          vehicle: true,
          folder: true,
        },
      });

      expect(prismaMock.payment.create).toHaveBeenCalledWith({
        data: {
          order_id: 1,
          amount: 5000,
          transaction_id: "txn_123",
          status: "pending",
        },
        include: {
          order: {
            include: {
              vehicle: true,
              folder: true,
            },
          },
        },
      });

      expect(result).toEqual(createdPayment);
    });

    it("should throw error if order not found", async () => {
      prismaMock.order.findUnique.mockResolvedValue(null);

      const paymentData = {
        amount: 5000,
        order_id: 999,
      };

      await expect(service.createPayment(paymentData)).rejects.toThrow(
        "Order not found",
      );

      expect(prismaMock.order.findUnique).toHaveBeenCalledWith({
        where: { id: 999 },
        include: {
          vehicle: true,
          folder: true,
        },
      });
    });

    it("should create payment without transaction_id", async () => {
      const orderData = {
        id: 2,
        folder_id: 1,
        vehicle_id: 1,
        total_amount: 30000,
        status: "draft",
        created_at: new Date(),
        vehicle: { id: 1 },
        folder: { id: 1 },
      };

      prismaMock.order.findUnique.mockResolvedValue(orderData);

      const paymentData = {
        amount: 30000,
        order_id: 2,
      };

      const createdPayment = {
        id: 2,
        order_id: 2,
        amount: 30000,
        status: "pending" as PaymentStatus,
        transaction_id: null,
        paid_at: null,
        order: orderData,
      };

      prismaMock.payment.create.mockResolvedValue(createdPayment);

      const result = await service.createPayment(paymentData);

      expect(result.transaction_id).toBeNull();
      expect(prismaMock.payment.create).toHaveBeenCalledWith({
        data: {
          order_id: 2,
          amount: 30000,
          transaction_id: undefined,
          status: "pending",
        },
        include: {
          order: {
            include: {
              vehicle: true,
              folder: true,
            },
          },
        },
      });
    });
  });

  describe("updatePaymentStatus", () => {
    it("should update payment status to pending without changing order/vehicle", async () => {
      const payment = {
        id: 1,
        order_id: 1,
        amount: 5000,
        status: "pending" as PaymentStatus,
        transaction_id: "txn_123",
        paid_at: null,
        order: {
          id: 1,
          status: "draft" as OrderStatus,
          vehicle_id: 1,
          vehicle: { id: 1, status: "reserved" },
        },
      };

      prismaMock.payment.findUnique.mockResolvedValue(payment);

      const updatedPayment = {
        ...payment,
        status: "pending" as PaymentStatus,
      };

      prismaMock.payment.update = jest.fn().mockResolvedValue(updatedPayment);

      const result = await service.updatePaymentStatus(1, "pending");

      expect(prismaMock.payment.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
        include: {
          order: {
            include: {
              vehicle: true,
              folder: true,
            },
          },
        },
      });

      expect(prismaMock.payment.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { status: "pending" },
        include: {
          order: {
            include: {
              vehicle: true,
              folder: true,
            },
          },
        },
      });

      expect(result).toEqual(updatedPayment);
    });

    it("should update payment status to paid and update order/vehicle statuses", async () => {
      const payment = {
        id: 1,
        order_id: 1,
        amount: 5000,
        status: "pending" as PaymentStatus,
        transaction_id: "txn_123",
        paid_at: null,
        order: {
          id: 1,
          status: "draft" as OrderStatus,
          vehicle_id: 1,
          vehicle: { id: 1, status: "reserved" },
        },
      };

      prismaMock.payment.findUnique.mockResolvedValue(payment);

      const updatedPayment = {
        ...payment,
        status: "paid" as PaymentStatus,
        paid_at: new Date(),
      };

      prismaMock.payment.update = jest.fn().mockResolvedValue(updatedPayment);
      prismaMock.order.update = jest.fn().mockResolvedValue({
        ...payment.order,
        status: "confirmed",
      });
      prismaMock.vehicle.update = jest.fn().mockResolvedValue({
        id: 1,
        status: "sold",
      });

      const result = await service.updatePaymentStatus(1, "paid");

      expect(prismaMock.payment.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
        include: {
          order: {
            include: {
              vehicle: true,
              folder: true,
            },
          },
        },
      });

      expect(prismaMock.payment.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 1 },
          data: expect.objectContaining({
            status: "paid",
            paid_at: expect.any(Date),
          }),
        }),
      );

      expect(prismaMock.order.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { status: "confirmed" },
      });

      expect(prismaMock.vehicle.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { status: "sold" },
      });

      expect(result).toEqual(updatedPayment);
    });

    it("should update payment status to failed", async () => {
      const payment = {
        id: 1,
        order_id: 1,
        amount: 5000,
        status: "pending" as PaymentStatus,
        transaction_id: "txn_123",
        paid_at: null,
        order: {
          id: 1,
          status: "draft",
          vehicle_id: 1,
        },
      };

      prismaMock.payment.findUnique.mockResolvedValue(payment);

      const updatedPayment = {
        ...payment,
        status: "failed" as PaymentStatus,
      };

      prismaMock.payment.update = jest.fn().mockResolvedValue(updatedPayment);

      const result = await service.updatePaymentStatus(1, "failed");

      expect(prismaMock.payment.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { status: "failed" },
        include: {
          order: {
            include: {
              vehicle: true,
              folder: true,
            },
          },
        },
      });

      expect(result).toEqual(updatedPayment);
    });

    it("should throw error if payment not found", async () => {
      prismaMock.payment.findUnique.mockResolvedValue(null);

      await expect(service.updatePaymentStatus(999, "paid")).rejects.toThrow(
        "Payment not found",
      );
    });

    it("should use transaction for updating payment status to paid", async () => {
      const payment = {
        id: 1,
        order_id: 1,
        amount: 5000,
        status: "pending" as PaymentStatus,
        paid_at: null,
        order: {
          id: 1,
          vehicle_id: 1,
        },
      };

      prismaMock.payment.findUnique.mockResolvedValue(payment);

      await service.updatePaymentStatus(1, "paid");

      expect(prismaMock.$transaction).toHaveBeenCalled();
    });
  });

  describe("getPaymentById", () => {
    it("should return payment with related data", async () => {
      const payment = {
        id: 1,
        order_id: 1,
        amount: 5000,
        status: "pending" as PaymentStatus,
        transaction_id: "txn_123",
        paid_at: null,
        order: {
          id: 1,
          status: "draft",
          vehicle_id: 1,
          vehicle: {
            id: 1,
            brand: "Tesla",
            model: "Model 3",
            status: "reserved",
          },
          folder: {
            id: 1,
            user_id: 1,
            status: "active",
          },
        },
      };

      prismaMock.payment.findUnique.mockResolvedValue(payment);

      const result = await service.getPaymentById(1);

      expect(prismaMock.payment.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
        include: {
          order: {
            include: {
              vehicle: true,
              folder: true,
            },
          },
        },
      });

      expect(result).toEqual(payment);
    });

    it("should return null if payment does not exist", async () => {
      prismaMock.payment.findUnique.mockResolvedValue(null);

      const result = await service.getPaymentById(999);

      expect(prismaMock.payment.findUnique).toHaveBeenCalledWith({
        where: { id: 999 },
        include: {
          order: {
            include: {
              vehicle: true,
              folder: true,
            },
          },
        },
      });

      expect(result).toBeNull();
    });
  });
});
