import { PrismaClient } from "@prisma/client";
import { folderService } from "../services/folder.service";
import { Request, Response } from "express";

export const folderController = (prisma: PrismaClient) => {
  return {
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
