import { PrismaClient } from "@prisma/client";
import Decimal from "decimal.js";

export interface CreateOrderData {
  folder_id: number;
  vehicle_id: number;
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

      const vehiclePrice = new Decimal(vehicle.price.toString());
      const totalAmount = vehiclePrice;

      const order = await prisma.order.create({
        data: {
          folder_id: data.folder_id,
          vehicle_id: data.vehicle_id,
          total_amount: totalAmount,
          status: "draft",
        },
        include: {
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
          vehicle: true,
        },
      });

      return order;
    },
  };
};
