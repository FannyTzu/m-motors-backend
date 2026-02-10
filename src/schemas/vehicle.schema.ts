import { z } from "zod";

export const createVehicleSchema = z.object({
  brand: z.string().min(1, "Brand is required"),
  model: z.string().min(1, "Model is required"),
  year: z.number().int().min(1950, "Year must be 1950 or later"),
  energy: z.string().min(1, "Energy type is required"),
  km: z.number().int().nonnegative("Kilometers must be a non-negative integer"),
  color: z.string().min(1, "Color is required"),
  place: z
    .number()
    .int()
    .positive("Place must be a positive integer")
    .max(9, "Place must be 9 or less"),
  door: z
    .number()
    .int()
    .positive("Door must be a positive integer")
    .max(5, "Door must be 5 or less"),
  type: z.enum(["sale", "rental"] as const),
  transmission: z.enum(["automatic", "manual"] as const),
  status: z.enum(["available", "reserved", "sold"] as const),
  price: z.number().positive("Price must be a positive number"),
  image: z.string().url("Image must be a valid URL").optional(),
  description: z.string().optional(),
});

export const updateVehicleSchema = z.object({
  brand: z.string().min(1, "Brand is required").optional(),
  model: z.string().min(1, "Model is required").optional(),
  year: z.number().int().min(1950, "Year must be 1950 or later").optional(),
  energy: z.string().min(1, "Energy type is required").optional(),
  km: z.number().int().nonnegative("Kilometers must be a non-negative integer").optional(),
  color: z.string().min(1, "Color is required").optional(),
  place: z
    .number()
    .int()
    .positive("Place must be a positive integer")
    .max(9, "Place must be 9 or less")
    .optional(),
  door: z
    .number()
    .int()
    .positive("Door must be a positive integer")
    .max(5, "Door must be 5 or less")
    .optional(),
  type: z.enum(["sale", "rental"] as const).optional(),
  transmission: z.enum(["automatic", "manual"] as const).optional(),
  status: z.enum(["available", "reserved", "sold"] as const).optional(),
  price: z.number().positive("Price must be a positive number").optional(),
  image: z.string().url("Image must be a valid URL").optional(),
  description: z.string().optional(),
});
