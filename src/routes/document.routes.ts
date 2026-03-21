import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import {
  documentController,
  upload,
} from "../controllers/document.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

export const documentRoutes = (prisma: PrismaClient): Router => {
  const router = Router();
  const controller = documentController(prisma);

  router.use(authMiddleware);

  router.post("/", upload.single("file"), controller.uploadDocument);

  router.get("/folder/:folderId", controller.getDocumentsByFolder);

  router.get("/:id", controller.getDocumentById);

  router.patch("/:id", controller.updateDocument);

  router.delete("/:id", controller.deleteDocument);

  return router;
};
