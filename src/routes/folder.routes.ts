import { PrismaClient, Role } from "@prisma/client";
import { Router } from "express";
import { folderController } from "../controllers/folder.controller.js";
import {
  authMiddleware,
  roleMiddleware,
} from "../middlewares/auth.middleware.js";

export const createFolderRoutes = (prisma: PrismaClient) => {
  const router = Router();
  const controller = folderController(prisma);

  router.use(authMiddleware);

  router.get("/", roleMiddleware(Role.admin), controller.getAllFolders);

  router.post("/create", controller.createFolder);

  router.get("/user/:userId", controller.getFoldersByUser);

  router.get("/:id", controller.getFolderById);

  router.put("/:id/status", controller.updateFolderStatus);

  router.delete("/:id", roleMiddleware(Role.admin), controller.deleteFolder);

  return router;
};
