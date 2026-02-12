import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import {
  registerUser,
  loginUser,
  refreshAccessToken,
} from "../services/auth.service";
import { addBreadcrumb, captureError } from "../utils/sentry";

export const authController = (prisma: PrismaClient) => {
  return {
    register: async (req: Request, res: Response) => {
      const { email, password } = req.body;
      try {
        const result = await registerUser(prisma, {
          mail: email,
          password,
        });

        addBreadcrumb("User registered", "auth", {
          userId: result.newUser.id,
          email: result.newUser.mail,
        });

        res.cookie("access_token", result.accessToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          maxAge: 15 * 60 * 1000,
        });

        res.cookie("refresh_token", result.refreshToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        res.status(201).json({
          user: {
            id: result.newUser.id,
            mail: result.newUser.mail,
            role: result.newUser.role,
          },
          accessToken: result.accessToken,
        });
      } catch (error) {
        const err = error instanceof Error ? error : new Error("Unknown error");
        if (err.message === "Cet email est déjà utilisé.") {
          return res.status(409).json({ error: err.message });
        }

        captureError(err, {
          tags: {
            feature: "auth",
            operation: "register",
          },
          extra: {
            email,
          },
        });

        return res.status(500).json({
          error:
            process.env.NODE_ENV === "production"
              ? "Internal server error"
              : err.message,
        });
      }
    },
    login: async (req: Request, res: Response) => {
      const { email, password } = req.body;
      try {
        const result = await loginUser(prisma, email, password);

        addBreadcrumb("User logged in", "auth", {
          userId: result.id,
          email: result.email,
        });

        res.cookie("access_token", result.accessToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          maxAge: 15 * 60 * 1000,
        });

        res.cookie("refresh_token", result.refreshToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        res.status(200).json({
          user: {
            id: result.id,
            email: result.email,
            role: result.role,
          },
        });
      } catch (error) {
        const err = error instanceof Error ? error : new Error("Unknown error");
        if (err.message === "Invalid credentials") {
          return res.status(401).json({ error: "Invalid credentials" });
        }

        captureError(err, {
          tags: {
            feature: "auth",
            operation: "login",
          },
          extra: {
            email,
          },
        });

        return res.status(500).json({
          error:
            process.env.NODE_ENV === "production"
              ? "Internal server error"
              : err.message,
        });
      }
    },
    me: async (req: Request, res: Response) => {
      if (!req.user) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const userId = req.user.sub;
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
      res.clearCookie("access_token", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
      });
      res.clearCookie("refresh_token", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
      });
      res.status(200).json({ message: "Logged out successfully" });
    },
    refreshToken: async (req: Request, res: Response) => {
      const refreshToken = req.cookies.refresh_token;
      if (!refreshToken) {
        return res.status(401).json({ error: "Refresh token not found" });
      }

      try {
        const result = await refreshAccessToken(prisma, refreshToken);

        res.cookie("access_token", result.accessToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          maxAge: 15 * 60 * 1000,
        });

        res.status(200).json({ accessToken: result.accessToken });
      } catch (error) {
        const err = error instanceof Error ? error : new Error("Unknown error");
        if (
          err.message === "Invalid or expired refresh token" ||
          err.message === "Refresh token is required"
        ) {
          return res
            .status(401)
            .json({ error: "Invalid or expired refresh token" });
        }

        captureError(err, {
          tags: {
            feature: "auth",
            operation: "refresh-token",
          },
        });

        return res.status(500).json({
          error:
            process.env.NODE_ENV === "production"
              ? "Internal server error"
              : err.message,
        });
      }
    },
  };
};
