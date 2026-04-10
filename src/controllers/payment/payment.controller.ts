import { Request, Response } from "express";
import { PrismaClient, PaymentStatus } from "@prisma/client";
import { paymentService } from "../../services/payment/payment.service.js";
import { addBreadcrumb } from "../../utils/sentry.js";

export const paymentController = (prisma: PrismaClient) => {
  const service = paymentService(prisma);

  return {
    createPayment: async (req: Request, res: Response) => {
      try {
        const { order_id, amount, transaction_id } = req.body;
        const userId = req.user?.sub;

        if (!userId) {
          return res.status(401).json({ error: "Unauthorized" });
        }

        if (!order_id || !amount) {
          return res.status(400).json({
            error: "Missing required fields: order_id, amount",
          });
        }

        const order = await prisma.order.findUnique({
          where: { id: order_id },
          include: {
            folder: true,
          },
        });

        if (!order) {
          return res.status(404).json({
            error: "Order not found",
          });
        }

        if (order.folder.user_id !== userId) {
          return res.status(403).json({
            error: "Access denied to this order",
          });
        }

        const payment = await service.createPayment({
          order_id,
          amount,
          transaction_id,
        });

        addBreadcrumb("Payment created", "payment", {
          paymentId: payment.id,
          order_id,
          amount,
        });

        res.status(201).json({
          message: "Payment created successfully",
          data: payment,
        });
      } catch (error: any) {
        addBreadcrumb("Payment creation error", "payment", {
          error: error.message,
        });
        console.error("Error creating payment:", error);
        res.status(500).json({
          error: error.message || "Failed to create payment",
        });
      }
    },

    updatePaymentStatus: async (req: Request, res: Response) => {
      try {
        const id = req.params.id as string;
        const { status } = req.body;
        const userId = req.user?.sub;

        if (!userId) {
          return res.status(401).json({ error: "Unauthorized" });
        }

        if (!status) {
          return res.status(400).json({
            error: "Missing required field: status",
          });
        }

        const validStatuses = ["pending", "paid", "failed"];
        if (!validStatuses.includes(status)) {
          return res.status(400).json({
            error: `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
          });
        }

        const payment = await prisma.payment.findUnique({
          where: { id: parseInt(id) },
          include: {
            order: {
              include: {
                folder: true,
              },
            },
          },
        });

        if (!payment) {
          return res.status(404).json({
            error: "Payment not found",
          });
        }

        if (payment.order.folder.user_id !== userId) {
          return res.status(403).json({
            error: "Access denied to this payment",
          });
        }

        const updatedPayment = await service.updatePaymentStatus(
          parseInt(id),
          status as PaymentStatus,
        );

        addBreadcrumb("Payment status updated", "payment", {
          paymentId: parseInt(id),
          newStatus: status,
        });

        res.status(200).json({
          message: "Payment status updated successfully",
          data: updatedPayment,
        });
      } catch (error: any) {
        addBreadcrumb("Payment status update error", "payment", {
          error: error.message,
        });
        console.error("Error updating payment status:", error);
        res.status(500).json({
          error: error.message || "Failed to update payment status",
        });
      }
    },

    getPaymentById: async (req: Request, res: Response) => {
      try {
        const id = req.params.id as string;
        const userId = req.user?.sub;

        if (!userId) {
          return res.status(401).json({ error: "Unauthorized" });
        }

        const payment = await service.getPaymentById(parseInt(id));

        if (!payment) {
          return res.status(404).json({
            error: "Payment not found",
          });
        }

        if (payment.order.folder.user_id !== userId) {
          return res.status(403).json({
            error: "Access denied to this payment",
          });
        }

        res.status(200).json({
          data: payment,
        });
      } catch (error: any) {
        console.error("Error fetching payment:", error);
        res.status(500).json({
          error: error.message || "Failed to fetch payment",
        });
      }
    },
  };
};
