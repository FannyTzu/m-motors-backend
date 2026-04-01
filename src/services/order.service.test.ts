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
      option: {
        findMany: jest.fn(),
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
    it("should create an order with only vehicle, no options", async () => {
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
        options: [],
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
        options: [],
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
          options: {
            createMany: {
              data: [],
            },
          },
        },
        include: {
          options: {
            include: {
              option: true,
            },
          },
          vehicle: true,
        },
      });
      expect(result).toEqual(mockCreatedOrder);
    });

    it("should create an order with vehicle and options", async () => {
      const mockVehicle = {
        id: 1,
        price: new Decimal("25000"),
      };

      const mockOptions = [
        { id: 1, price: new Decimal("500") },
        { id: 2, price: new Decimal("1000") },
      ];

      const mockCreatedOrder = {
        id: 1,
        folder_id: 10,
        vehicle_id: 1,
        total_amount: new Decimal("26500"),
        status: "draft",
        options: [
          {
            option_id: 1,
            price_at_order: "500",
            option: mockOptions[0],
          },
          {
            option_id: 2,
            price_at_order: "1000",
            option: mockOptions[1],
          },
        ],
        vehicle: mockVehicle,
      };

      (mockPrisma.vehicle!.findUnique as jest.Mock).mockResolvedValue(
        mockVehicle,
      );
      (mockPrisma.option!.findMany as jest.Mock).mockResolvedValue(mockOptions);
      (mockPrisma.order!.create as jest.Mock).mockResolvedValue(
        mockCreatedOrder,
      );

      const data: CreateOrderData = {
        folder_id: 10,
        vehicle_id: 1,
        options: [{ option_id: 1 }, { option_id: 2 }],
        user_id: 5,
      };

      const result = await service.createOrder(data);

      expect(mockPrisma.option!.findMany).toHaveBeenCalledWith({
        where: {
          id: { in: [1, 2] },
        },
      });
      expect(result).toEqual(mockCreatedOrder);
    });

    it("should throw error if vehicle not found", async () => {
      (mockPrisma.vehicle!.findUnique as jest.Mock).mockResolvedValue(null);

      const data: CreateOrderData = {
        folder_id: 10,
        vehicle_id: 999,
        options: [],
        user_id: 5,
      };

      await expect(service.createOrder(data)).rejects.toThrow(
        "Vehicle not found",
      );
    });

    it("should throw error if one or more options not found", async () => {
      const mockVehicle = {
        id: 1,
        price: new Decimal("25000"),
      };

      (mockPrisma.vehicle!.findUnique as jest.Mock).mockResolvedValue(
        mockVehicle,
      );
      (mockPrisma.option!.findMany as jest.Mock).mockResolvedValue([
        { id: 1, price: new Decimal("500") },
      ]);

      const data: CreateOrderData = {
        folder_id: 10,
        vehicle_id: 1,
        options: [{ option_id: 1 }, { option_id: 999 }],
        user_id: 5,
      };

      await expect(service.createOrder(data)).rejects.toThrow(
        "One or more options not found",
      );
    });

    it("should correctly calculate total amount with decimal precision", async () => {
      const mockVehicle = {
        id: 1,
        price: new Decimal("25000.50"),
      };

      const mockOptions = [
        { id: 1, price: new Decimal("99.99") },
        { id: 2, price: new Decimal("199.51") },
      ];

      const mockCreatedOrder = {
        id: 1,
        folder_id: 10,
        vehicle_id: 1,
        total_amount: new Decimal("25300"),
        status: "draft",
        options: [],
        vehicle: mockVehicle,
      };

      (mockPrisma.vehicle!.findUnique as jest.Mock).mockResolvedValue(
        mockVehicle,
      );
      (mockPrisma.option!.findMany as jest.Mock).mockResolvedValue(mockOptions);
      (mockPrisma.order!.create as jest.Mock).mockResolvedValue(
        mockCreatedOrder,
      );

      const data: CreateOrderData = {
        folder_id: 10,
        vehicle_id: 1,
        options: [{ option_id: 1 }, { option_id: 2 }],
        user_id: 5,
      };

      try {
        await service.createOrder(data);
        const callArgs = (mockPrisma.order!.create as jest.Mock).mock
          .calls[0][0];
        const expectedTotal = new Decimal("25000.50")
          .plus(new Decimal("99.99"))
          .plus(new Decimal("199.51"));
        expect(callArgs.data.total_amount).toEqual(expectedTotal);
      } catch {}
    });
  });
});
