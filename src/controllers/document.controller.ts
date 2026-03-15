import { PrismaClient } from "@prisma/client";
import { documentService } from "../services/document.service";
import { Request, Response } from "express";
import multer from "multer";

const storage = multer.memoryStorage();
export const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      "image/jpeg",
      "image/png",
      "image/jpg",
      "application/pdf",
      "application/x-pdf",
      "text/pdf",
      "application/x-bzpdf",
    ];

    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new Error(
          "Invalid file type. Only images and documents (PDF) are allowed.",
        ),
      );
    }
  },
});

export const documentController = (prisma: PrismaClient) => {
  const service = documentService(prisma);

  return {
    uploadDocument: async (req: Request, res: Response) => {
      try {
        const { folderId, name, type } = req.body;

        if (!folderId) {
          return res.status(400).json({ error: "folderId is required" });
        }

        if (!req.file) {
          return res.status(400).json({ error: "No file uploaded" });
        }

        const document = await service.uploadDocument({
          folderId: Number(folderId),
          file: req.file,
          name,
          type,
        });

        res.status(201).json(document);
      } catch (error) {
        console.error("Error uploading document:", error);
        res.status(500).json({
          error: "Failed to upload document",
          message: error instanceof Error ? error.message : "Unknown error",
        });
      }
    },

    getDocumentsByFolder: async (req: Request, res: Response) => {
      try {
        const { folderId } = req.params;
        const documents = await service.getDocumentsByFolder(Number(folderId));
        res.json(documents);
      } catch (error) {
        console.error("Error getting documents:", error);
        res.status(500).json({
          error: "Failed to get documents",
          message: error instanceof Error ? error.message : "Unknown error",
        });
      }
    },

    getDocumentById: async (req: Request, res: Response) => {
      try {
        const { id } = req.params;
        const document = await service.getDocumentById(Number(id));

        if (!document) {
          return res.status(404).json({ error: "Document not found" });
        }

        res.json(document);
      } catch (error) {
        console.error("Error getting document:", error);
        res.status(500).json({
          error: "Failed to get document",
          message: error instanceof Error ? error.message : "Unknown error",
        });
      }
    },

    deleteDocument: async (req: Request, res: Response) => {
      try {
        const { id } = req.params;
        const result = await service.deleteDocument(Number(id));
        res.json(result);
      } catch (error) {
        console.error("Error deleting document:", error);
        res.status(500).json({
          error: "Failed to delete document",
          message: error instanceof Error ? error.message : "Unknown error",
        });
      }
    },

    updateDocument: async (req: Request, res: Response) => {
      try {
        const { id } = req.params;
        const { name, type } = req.body;

        if (!name && !type) {
          return res.status(400).json({
            error: "At least one field (name or type) is required",
          });
        }

        const document = await service.updateDocument(Number(id), {
          name,
          type,
        });

        res.json(document);
      } catch (error) {
        console.error("Error updating document:", error);
        res.status(500).json({
          error: "Failed to update document",
          message: error instanceof Error ? error.message : "Unknown error",
        });
      }
    },
  };
};
