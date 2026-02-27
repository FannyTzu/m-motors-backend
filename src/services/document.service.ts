import { PrismaClient } from "@prisma/client";
import { supabase, BUCKET_NAME } from "../utils/supabase";

export interface UploadDocumentInput {
  folderId: number;
  file: Express.Multer.File;
  name?: string;
  type?: string;
}

export const documentService = (prisma: PrismaClient) => {
  return {
    uploadDocument: async (input: UploadDocumentInput) => {
      const { folderId, file, name, type } = input;

      const folder = await prisma.folder.findUnique({
        where: { id: folderId },
      });

      if (!folder) {
        throw new Error("Folder not found");
      }

      const fileExtension = file.originalname.split(".").pop();
      const fileName = `folder_${folderId}/${Date.now()}_${file.originalname}`;

      const { data, error } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(fileName, file.buffer, {
          contentType: file.mimetype,
          upsert: false,
        });

      if (error) {
        throw new Error(`Failed to upload file: ${error.message}`);
      }

      const { data: urlData } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(fileName);

      const document = await prisma.document.create({
        data: {
          folder_id: folderId,
          name: name || file.originalname,
          url: urlData.publicUrl,
          type: type || file.mimetype,
        },
      });

      return document;
    },

    getDocumentsByFolder: async (folderId: number) => {
      return prisma.document.findMany({
        where: { folder_id: folderId },
        orderBy: { created_at: "desc" },
      });
    },

    getDocumentById: async (documentId: number) => {
      return prisma.document.findUnique({
        where: { id: documentId },
      });
    },

    deleteDocument: async (documentId: number) => {
      const document = await prisma.document.findUnique({
        where: { id: documentId },
      });

      if (!document) {
        throw new Error("Document not found");
      }

      // extract the file path from the URL
      const url = new URL(document.url);
      const pathParts = url.pathname.split(
        `/storage/v1/object/public/${BUCKET_NAME}/`,
      );
      const filePath = pathParts[1];

      if (filePath) {
        const { error } = await supabase.storage
          .from(BUCKET_NAME)
          .remove([filePath]);

        if (error) {
          console.error("Failed to delete file from Supabase:", error);
        }
      }

      await prisma.document.delete({
        where: { id: documentId },
      });

      return { message: "Document deleted successfully" };
    },

    updateDocument: async (
      documentId: number,
      data: { name?: string; type?: string },
    ) => {
      return prisma.document.update({
        where: { id: documentId },
        data,
      });
    },
  };
};
