import { PrismaClient } from "@prisma/client";
import Decimal from "decimal.js";

export interface CreateOrderData {
  folder_id: number;
  vehicle_id: number;
  options: { option_id: number }[];
  user_id: number;
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

      let optionsTotalPrice = new Decimal(0);
      const optionsData = [];

      if (data.options.length > 0) {
        const options = await prisma.option.findMany({
          where: {
            id: { in: data.options.map((o) => o.option_id) },
          },
        });

        if (options.length !== data.options.length) {
          throw new Error("One or more options not found");
        }

        for (const option of options) {
          optionsTotalPrice = optionsTotalPrice.plus(
            new Decimal(option.price.toString()),
          );
          optionsData.push({
            option_id: option.id,
            price_at_order: new Decimal(option.price.toString()),
          });
        }
      }

      const vehiclePrice = new Decimal(vehicle.price.toString());
      const totalAmount = vehiclePrice.plus(optionsTotalPrice);

      const order = await prisma.order.create({
        data: {
          folder_id: data.folder_id,
          vehicle_id: data.vehicle_id,
          total_amount: totalAmount,
          status: "draft",
          options: {
            createMany: {
              data: optionsData.map((opt) => ({
                option_id: opt.option_id,
                price_at_order: opt.price_at_order.toString(),
              })),
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

      return order;
    },

    getOrderById: async (id: number) => {
      const order = await prisma.order.findUnique({
        where: { id },
        include: {
          folder: true,
          vehicle: true,
          options: {
            include: {
              option: true,
            },
          },
          payments: true,
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
          options: {
            include: {
              option: true,
            },
          },
          payments: true,
        },
      });

      return orders;
    },

    updateOrderStatus: async (id: number, status: string) => {
      const order = await prisma.order.update({
        where: { id },
        data: { status: status as any },
        include: {
          options: {
            include: {
              option: true,
            },
          },
          vehicle: true,
        },
      });

      return order;
    },
  };
};
