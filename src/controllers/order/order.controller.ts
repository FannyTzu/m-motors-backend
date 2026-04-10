import { PrismaClient } from "@prisma/client";
import { Request, Response } from "express";
import { orderService } from "../../services/order/order.service.js";
import { addBreadcrumb, captureError } from "../../utils/sentry.js";

export const orderController = (prisma: PrismaClient) => {
  return {
    createOrder: async (req: Request, res: Response) => {
      const { folder_id, vehicle_id, optionIds } = req.body;
      const userId = req.user?.sub;

      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      try {
        const folder = await prisma.folder.findUnique({
          where: { id: folder_id },
        });

        if (!folder || folder.user_id !== userId) {
          return res
            .status(403)
            .json({ error: "Folder not found or access denied" });
        }

        if (folder.vehicle_id !== vehicle_id) {
          return res.status(400).json({
            error: "Vehicle ID does not match the folder's vehicle",
          });
        }

        const order = await orderService(prisma).createOrder({
          folder_id,
          vehicle_id,
          user_id: userId,
          optionIds: optionIds || [],
        });

        const formattedOrder = {
          ...order,
          options:
            order.options?.map((o: any) => ({
              id: o.option.id,
              name: o.option.name,
              price: o.price_at_order,
              description: o.option.description,
            })) || [],
        };

        addBreadcrumb("Order created", "order", {
          orderId: order.id,
          folderId: folder_id,
          vehicleId: vehicle_id,
          optionsCount: optionIds?.length || 0,
        });

        res.status(201).json(formattedOrder);
      } catch (error: any) {
        captureError(
          error instanceof Error
            ? error
            : new Error(error?.message ?? "Unknown error"),
          {
            tags: { feature: "order", operation: "create" },
            extra: { folder_id, vehicle_id },
          },
        );

        if (error.message === "Vehicle not found") {
          return res.status(404).json({ error: "Vehicle not found" });
        }

        res.status(500).json({ error: "Internal server error" });
      }
    },

    getOrder: async (req: Request, res: Response) => {
      const { id } = req.params;
      const userId = req.user?.sub;

      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      try {
        const order = await orderService(prisma).getOrderById(Number(id));

        const folder = await prisma.folder.findUnique({
          where: { id: order.folder_id },
        });

        if (!folder || folder.user_id !== userId) {
          return res.status(403).json({ error: "Access denied" });
        }

        const formattedOrder = {
          ...order,
          options:
            order.options?.map((o: any) => ({
              id: o.option.id,
              name: o.option.name,
              price: o.price_at_order,
              description: o.option.description,
            })) || [],
        };

        res.status(200).json(formattedOrder);
      } catch (error: any) {
        if (error.message === "Order not found") {
          return res.status(404).json({ error: "Order not found" });
        }

        res.status(500).json({ error: "Internal server error" });
      }
    },

    getOrdersByFolder: async (req: Request, res: Response) => {
      const { folder_id } = req.params;
      const userId = req.user?.sub;

      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      try {
        const folder = await prisma.folder.findUnique({
          where: { id: Number(folder_id) },
        });

        if (!folder || folder.user_id !== userId) {
          return res
            .status(403)
            .json({ error: "Folder not found or access denied" });
        }

        const orders = await orderService(prisma).getOrdersByFolderId(
          Number(folder_id),
        );

        const formattedOrders = orders.map((order: any) => ({
          ...order,
          options:
            order.options?.map((o: any) => ({
              id: o.option.id,
              name: o.option.name,
              price: o.price_at_order,
              description: o.option.description,
            })) || [],
        }));

        res.status(200).json(formattedOrders);
      } catch (error) {
        res.status(500).json({ error: "Internal server error" });
      }
    },

    updateOrderStatus: async (req: Request, res: Response) => {
      const { id } = req.params;
      const { status } = req.body;
      const userId = req.user?.sub;

      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      try {
        const order = await orderService(prisma).getOrderById(Number(id));

        const folder = await prisma.folder.findUnique({
          where: { id: order.folder_id },
        });

        if (!folder || folder.user_id !== userId) {
          return res.status(403).json({ error: "Access denied" });
        }

        const updatedOrder = await orderService(prisma).updateOrderStatus(
          Number(id),
          status,
        );

        const formattedOrder = {
          ...updatedOrder,
          options:
            updatedOrder.options?.map((o: any) => ({
              id: o.option.id,
              name: o.option.name,
              price: o.price_at_order,
              description: o.option.description,
            })) || [],
        };

        addBreadcrumb("Order status updated", "order", {
          orderId: formattedOrder.id,
          status,
        });

        res.status(200).json(formattedOrder);
      } catch (error: any) {
        captureError(
          error instanceof Error
            ? error
            : new Error(error?.message ?? "Unknown error"),
          {
            tags: { feature: "order", operation: "updateStatus" },
            extra: { orderId: id, status },
          },
        );

        if (error.message === "Order not found") {
          return res.status(404).json({ error: "Order not found" });
        }

        res.status(500).json({ error: "Internal server error" });
      }
    },
  };
};
