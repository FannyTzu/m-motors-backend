import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { registerUser } from "../services/auth.service.js";

export const createAuthRoutes = (prisma: PrismaClient) => {
  const router = Router();
  router.post("/register", async (req, res) => {
    try {
      const { mail, password } = req.body;
      const result = await registerUser(prisma, { mail, password });
      res.status(201).json(result);
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  });

  return router;
};
