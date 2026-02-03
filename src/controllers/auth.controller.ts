import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import {
  registerUser,
  loginUser,
  refreshAccessToken,
} from "../services/auth.service";

export const authController = (prisma: PrismaClient) => {
  return {
    register: async (req: Request, res: Response) => {
      try {
        const { email, password } = req.body;
        const result = await registerUser(prisma, {
          mail: email,
          password,
        });

        res.cookie("refresh_token", result.refreshToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        res.status(201).json({
          user: result.newUser,
          accessToken: result.accessToken,
        });
      } catch (error) {
        res.status(400).json({ error: (error as Error).message });
      }
    },
    login: async (req: Request, res: Response) => {
      try {
        const { email, password } = req.body;
        const result = await loginUser(prisma, email, password);

        res.cookie("refresh_token", result.refreshToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        res.status(200).json({
          user: { id: result.id, email: result.email },
          accessToken: result.accessToken,
        });
      } catch (error) {
        res.status(400).json({ error: (error as Error).message });
      }
    },
    me: async (req: Request, res: Response) => {
      if (!req.user) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const userId = req.user.userId;
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          mail: true,
          role: true,
        },
      });
      res.status(200).json({ user });
    },
    logout: (req: Request, res: Response) => {
      res.clearCookie("refresh_token", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
      });
      res.status(200).json({ message: "Logged out successfully" });
    },
    refreshToken: async (req: Request, res: Response) => {
      try {
        const refreshToken = req.cookies.refresh_token;
        if (!refreshToken) {
          return res.status(401).json({ error: "Refresh token not found" });
        }

        const result = await refreshAccessToken(prisma, refreshToken);
        res.status(200).json({ accessToken: result.accessToken });
      } catch (error) {
        res.status(401).json({ error: (error as Error).message });
      }
    },
  };
};
