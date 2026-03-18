import { PrismaClient } from "@prisma/client";
import { supabase, BUCKET_DOCUMENTS } from "../utils/supabase.js";

export interface UploadDocumentInput {
  folderId: number;
  file: Express.Multer.File;
  name?: string;
  type?: string;
}

//Supabase storage which doesn't accept non-ASCII characters in keys, we need to convert
const convertFilename = (filename: string): string => {
  return filename
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .replace(/_{2,}/g, "_");
};

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

      const convertedName = convertFilename(file.originalname);
      const fileName = `folder_${folderId}/${Date.now()}_${convertedName}`;

      const { data, error } = await supabase.storage
        .from(BUCKET_DOCUMENTS)
        .upload(fileName, file.buffer, {
          contentType: file.mimetype,
          upsert: false,
        });

      if (error) {
        throw new Error(`Failed to upload file: ${error.message}`);
      }

      const document = await prisma.document.create({
        data: {
          folder_id: folderId,
          name: name || file.originalname,
          url: fileName,
          type: type || file.mimetype,
        },
      });

      return document;
    },

    getDocumentsByFolder: async (folderId: number) => {
      const documents = await prisma.document.findMany({
        where: { folder_id: folderId },
        orderBy: { created_at: "desc" },
      });

      const documentsWithUrls = await Promise.all(
        documents.map(async (doc) => {
          const { data, error } = await supabase.storage
            .from(BUCKET_DOCUMENTS)
            .createSignedUrl(doc.url, 3600);

          if (error) {
            console.error("Error creating signed URL:", error);
            return doc;
          }

          return {
            ...doc,
            url: data.signedUrl,
          };
        }),
      );

      return documentsWithUrls;
    },

    getDocumentById: async (documentId: number) => {
      const document = await prisma.document.findUnique({
        where: { id: documentId },
      });

      if (!document) {
        return null;
      }

      const { data, error } = await supabase.storage
        .from(BUCKET_DOCUMENTS)
        .createSignedUrl(document.url, 3600);

      if (error) {
        console.error("Error creating signed URL:", error);
        return document;
      }

      return {
        ...document,
        url: data.signedUrl,
      };
    },

    deleteDocument: async (documentId: number) => {
      const document = await prisma.document.findUnique({
        where: { id: documentId },
      });

      if (!document) {
        throw new Error("Document not found");
      }

      const filePath = document.url;

      if (filePath) {
        const { error } = await supabase.storage
          .from(BUCKET_DOCUMENTS)
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
