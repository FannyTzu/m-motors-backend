import { PrismaClient } from "@prisma/client";
import { folderService } from "../services/folder.service";
import { Request, Response } from "express";

export const folderController = (prisma: PrismaClient) => {
  return {
    getAllFolders: async (req: Request, res: Response) => {
      try {
        const folders = await folderService(prisma).getAllFolders();
        res.json(folders);
      } catch (error) {
        console.error("Error fetching all folders:", error);
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
      if (!status) {
        return res.status(400).json({ error: "Status is required" });
      }
      const updatedFolder = await folderService(prisma).updateFolderStatus(
        Number(id),
        status,
      );
      res.json(updatedFolder);
    },
  };
};
