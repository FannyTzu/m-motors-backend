import { PrismaClient } from "@prisma/client";
import { folderService } from "../../services/folder/folder.service.js";
import { Request, Response } from "express";
import { captureError } from "../../utils/sentry.js";

export const folderController = (prisma: PrismaClient) => {
  return {
    getAllFolders: async (req: Request, res: Response) => {
      try {
        const folders = await folderService(prisma).getAllFolders();
        res.json(folders);
      } catch (error) {
        console.error("Error fetching all folders:", error);
        captureError(
          error instanceof Error ? error : new Error("Unknown error"),
          {
            tags: { feature: "folder", operation: "getAll" },
          },
        );
        res.status(500).json({ error: "Failed to fetch all folders" });
      }
    },
    createFolder: async (req: Request, res: Response) => {
      const { userId, vehicleId } = req.body;
      if (!userId || !vehicleId) {
        return res

          .status(400)
          .json({ error: "userId and vehicleId are required" });
      }
      const folder = await folderService(prisma).createFolder(
        userId,
        vehicleId,
      );
      res.status(201).json(folder);
    },
    getFoldersByUser: async (req: Request, res: Response) => {
      const { userId } = req.params;
      const folders = await folderService(prisma).getFoldersByUser(
        Number(userId),
      );
      res.json(folders);
    },
    getFolderById: async (req: Request, res: Response) => {
      const { id } = req.params;
      const folder = await folderService(prisma).getFolderById(Number(id));
      if (!folder) {
        return res.status(404).json({ error: "Folder not found" });
      }
      res.json(folder);
    },
    updateFolderStatus: async (req: Request, res: Response) => {
      const { id } = req.params;
      const { status } = req.body;
      const userId = req.user?.sub;

      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      if (!status) {
        return res.status(400).json({ error: "Status is required" });
      }

      try {
        const updatedFolder = await folderService(prisma).updateFolderStatus(
          Number(id),
          status,
          userId,
          req.user?.role,
        );
        res.json(updatedFolder);
      } catch (error) {
        const err = error instanceof Error ? error : new Error("Unknown error");
        if (err.message.includes("not found")) {
          return res.status(404).json({ error: err.message });
        }
        if (
          err.message.includes("not authorized") ||
          err.message.includes("Forbidden")
        ) {
          return res.status(403).json({ error: err.message });
        }
        if (
          err.message.includes("Invalid") ||
          err.message.includes("required")
        ) {
          return res.status(400).json({ error: err.message });
        }
        console.error("Error updating folder status:", err);
        captureError(err, {
          tags: { feature: "folder", operation: "updateStatus" },
          extra: { folderId: id, status },
        });
        return res.status(500).json({
          error: "Failed to update folder status",
          message: err.message,
        });
      }
    },
    deleteFolder: async (req: Request, res: Response) => {
      const { id } = req.params;
      const userId = req.user?.sub;
      const userRole = req.user?.role;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      try {
        await folderService(prisma).deleteFolder(Number(id), userId, userRole);
        res.status(204).send();
      } catch (error) {
        const err = error instanceof Error ? error : new Error("Unknown error");
        if (err.message.includes("not found")) {
          return res.status(404).json({ error: err.message });
        }
        if (
          err.message.includes("not authorized") ||
          err.message.includes("Forbidden")
        ) {
          return res.status(403).json({ error: err.message });
        }
        console.error("Error deleting folder:", err);
        captureError(err, {
          tags: { feature: "folder", operation: "delete" },
          extra: { folderId: id },
        });
        return res.status(500).json({
          error: "Failed to delete folder",
          message: err.message,
        });
      }
    },
  };
};
