import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { registerUser } from "../services/auth.service.js";

export const authController = (prisma: PrismaClient) => {
  return {
    register: async (req: Request, res: Response) => {
      try {
        const { email, password } = req.body;
        const result = await registerUser(prisma, {
          mail: email,
          password,
        });
        res.status(201).json(result);
      } catch (error) {
        res.status(400).json({ error: (error as Error).message });
      }
    },
  };
};
