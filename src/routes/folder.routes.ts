import { PrismaClient } from "@prisma/client";
import { Router } from "express";
import { folderController } from "../controllers/folder.controller";

export const createFolderRoutes = (prisma: PrismaClient) => {
  const router = Router();
  const controller = folderController(prisma);

  router.post("/create", controller.createFolder);

  router.get("/user/:userId", controller.getFoldersByUser);

  router.put("/:id/status", controller.updateFolderStatus);

  return router;
};
