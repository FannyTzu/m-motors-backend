import {
  PrismaClient,
  PaymentStatus,
  OrderStatus,
  VehiclesStatus,
} from "@prisma/client";

export interface CreatePaymentData {
  order_id: number;
  amount: number;
  transaction_id?: string;
}

export const paymentService = (prisma: PrismaClient) => {
  return {
    createPayment: async (data: CreatePaymentData) => {
      const order = await prisma.order.findUnique({
        where: { id: data.order_id },
        include: {
          vehicle: true,
          folder: true,
        },
      });

      if (!order) {
        throw new Error("Order not found");
      }

      const payment = await prisma.payment.create({
        data: {
          order_id: data.order_id,
          amount: data.amount,
          transaction_id: data.transaction_id,
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

      return payment;
    },

    updatePaymentStatus: async (paymentId: number, status: PaymentStatus) => {
      let updateData: any = {
        status,
      };

      if (status === "paid") {
        updateData.paid_at = new Date();
      }

      const payment = await prisma.payment.findUnique({
        where: { id: paymentId },
        include: {
          order: {
            include: {
              vehicle: true,
              folder: true,
            },
          },
        },
      });

      if (!payment) {
        throw new Error("Payment not found");
      }

      const result = await prisma.$transaction(async (tx) => {
        const updatedPayment = await tx.payment.update({
          where: { id: paymentId },
          data: updateData,
          include: {
            order: {
              include: {
                vehicle: true,
                folder: true,
              },
            },
          },
        });

        if (status === "paid" && payment.order) {
          await tx.order.update({
            where: { id: payment.order.id },
            data: { status: "confirmed" as OrderStatus },
          });

          await tx.vehicle.update({
            where: { id: payment.order.vehicle_id },
            data: { status: "sold" as VehiclesStatus },
          });
        }

        return updatedPayment;
      });

      return result;
    },

    getPaymentById: async (paymentId: number) => {
      const payment = await prisma.payment.findUnique({
        where: { id: paymentId },
        include: {
          order: {
            include: {
              vehicle: true,
              folder: true,
            },
          },
        },
      });

      return payment;
    },
  };
};
