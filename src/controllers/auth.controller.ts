import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { registerUser, loginUser } from "../services/auth.service.js";
import jwt from "jsonwebtoken";

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
    login: async (req: Request, res: Response) => {
      try {
        const { email, password } = req.body;
        const user = await loginUser(prisma, email, password);

        const secret = process.env.JWT_ACCESS_SECRET;
        if (!secret) {
          throw new Error("JWT_ACCESS_SECRET is not defined");
        }

        const token = jwt.sign({ userId: user.id }, secret, {
          expiresIn: "1h",
        });

        res.cookie("access_token", token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          maxAge: 3600000,
        });

        res.status(200).json({ user });
      } catch (error) {
        res.status(400).json({ error: (error as Error).message });
      }
    },
  };
};
