import { PrismaClient } from "@prisma/client";
import Decimal from "decimal.js";

export interface CreateOrderData {
  folder_id: number;
  vehicle_id: number;
  user_id: number;
  optionIds?: number[];
}

export const orderService = (prisma: PrismaClient) => {
  return {
    createOrder: async (data: CreateOrderData) => {
      const vehicle = await prisma.vehicle.findUnique({
        where: { id: data.vehicle_id },
      });

      if (!vehicle) {
        throw new Error("Vehicle not found");
      }

      const vehiclePrice = new Decimal(vehicle.price.toString());
      let totalAmount = vehiclePrice;
      let options: any[] = [];

      if (data.optionIds && data.optionIds.length > 0) {
        options = await prisma.option.findMany({
          where: {
            id: {
              in: data.optionIds,
            },
          },
        });

        const optionsTotal = options.reduce((sum, option) => {
          return sum.plus(new Decimal(option.price.toString()));
        }, new Decimal(0));

        totalAmount = vehiclePrice.plus(optionsTotal);
      }

      const order = await prisma.order.create({
        data: {
          folder_id: data.folder_id,
          vehicle_id: data.vehicle_id,
          total_amount: totalAmount,
          status: "draft",
          options:
            options.length > 0
              ? {
                  create: options.map((option) => ({
                    option_id: option.id,
                    price_at_order: option.price,
                  })),
                }
              : undefined,
        },
        include: {
          vehicle: true,
          options: {
            include: {
              option: true,
            },
          },
        },
      });

      return order;
    },

    getOrderById: async (id: number) => {
      const order = await prisma.order.findUnique({
        where: { id },
        include: {
          folder: true,
          vehicle: true,
          payments: true,
          options: {
            include: {
              option: true,
            },
          },
        },
      });

      if (!order) {
        throw new Error("Order not found");
      }

      return order;
    },

    getOrdersByFolderId: async (folder_id: number) => {
      const orders = await prisma.order.findMany({
        where: { folder_id },
        include: {
          vehicle: true,
          payments: true,
          options: {
            include: {
              option: true,
            },
          },
        },
      });

      return orders;
    },

    updateOrderStatus: async (id: number, status: string) => {
      const order = await prisma.order.update({
        where: { id },
        data: { status: status as any },
        include: {
          vehicle: true,
          options: {
            include: {
              option: true,
            },
          },
        },
      });

      return order;
    },
  };
};
