import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { Request, Response } from "express";
import { catchAsync } from "../utils/sentry.js";

export const createOptionRoutes = (prisma: PrismaClient) => {
  const router = Router();

  router.get(
    "/",
    catchAsync(async (_req: Request, res: Response) => {
      const options = await prisma.option.findMany({
        orderBy: { id: "asc" },
      });
      res.json(options);
    }),
  );

  return router;
};
