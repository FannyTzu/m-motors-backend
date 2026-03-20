import { PrismaClient } from "@prisma/client";
import { Router } from "express";
import { folderController } from "../controllers/folder.controller.js";

export const createFolderRoutes = (prisma: PrismaClient) => {
  const router = Router();
  const controller = folderController(prisma);

  router.get("/", controller.getAllFolders);

  router.post("/create", controller.createFolder);

  router.get("/user/:userId", controller.getFoldersByUser);

  router.get("/:id", controller.getFolderById);

  router.put("/:id/status", controller.updateFolderStatus);

  router.delete("/:id", controller.deleteFolder);

  return router;
};
