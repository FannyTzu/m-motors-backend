import { z } from "zod";

export const createOrderSchema = z.object({
  folder_id: z.number().int().positive("folder_id must be a positive integer"),
  vehicle_id: z.number().int().positive("vehicle_id must be a positive integer"),
  options: z
    .array(
      z.object({
        option_id: z
          .number()
          .int()
          .positive("option_id must be a positive integer"),
      })
    )
    .optional()
    .default([]),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;

export const updateOrderStatusSchema = z.object({
  status: z
    .enum(["draft", "confirmed", "cancelled"])
    .refine(
      (val) => ["draft", "confirmed", "cancelled"].includes(val),
      { message: "Status must be one of: draft, confirmed, cancelled" }
    ),
});

export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;
