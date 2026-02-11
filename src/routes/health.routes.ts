import { Router, Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import * as Sentry from "@sentry/node";

export const createHealthRoutes = (prisma: PrismaClient) => {
  const router = Router();

  /**Health Check Endpoint*/
  router.get("/health", async (req: Request, res: Response) => {
    try {
      await prisma.$queryRaw`SELECT 1`;

      res.status(200).json({
        status: "healthy",
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV,
        version: "1.0.0",
      });
    } catch (error) {
      Sentry.captureException(error, {
        tags: {
          feature: "health",
          critical: "true",
        },
        level: "error",
      });

      res.status(503).json({
        status: "unhealthy",
        timestamp: new Date().toISOString(),
        error: "Database connection failed",
      });
    }
  });

  /**Detailed Status Endpoint*/
  router.get("/status", async (req: Request, res: Response) => {
    try {
      const userCount = await prisma.user.count();
      const vehicleCount = await prisma.vehicle.count();

      res.status(200).json({
        status: "operational",
        metrics: {
          users: userCount,
          vehicles: vehicleCount,
          uptime: process.uptime(),
          memory: process.memoryUsage(),
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      Sentry.captureException(error, {
        tags: {
          feature: "status",
          critical: "false",
        },
      });

      res.status(500).json({
        status: "error",
        error: "Failed to retrieve status",
      });
    }
  });

  return router;
};
