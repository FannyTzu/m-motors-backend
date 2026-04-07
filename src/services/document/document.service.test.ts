import { PrismaClient } from "@prisma/client";
import { documentService, UploadDocumentInput } from "./document.service";
import * as supabaseUtils from "../../utils/supabase.js";

jest.mock("@prisma/client");

jest.mock("../../utils/supabase", () => ({
  supabase: {
    storage: {
      from: jest.fn(),
    },
  },
  BUCKET_DOCUMENTS: "test-bucket",
}));

describe("DocumentService", () => {
  let mockPrisma: any;
  let service: ReturnType<typeof documentService>;
  let mockSupabaseStorage: any;

  beforeEach(() => {
    jest.clearAllMocks();

    mockPrisma = {
      folder: {
        findUnique: jest.fn() as jest.Mock,
      },
      document: {
        create: jest.fn() as jest.Mock,
        findMany: jest.fn() as jest.Mock,
        findUnique: jest.fn() as jest.Mock,
        delete: jest.fn() as jest.Mock,
        update: jest.fn() as jest.Mock,
      },
    };

    mockSupabaseStorage = {
      upload: jest.fn(),
      createSignedUrl: jest.fn(),
      remove: jest.fn(),
    };

    (supabaseUtils.supabase.storage.from as jest.Mock).mockReturnValue(
      mockSupabaseStorage,
    );

    service = documentService(mockPrisma);
  });

  describe("uploadDocument", () => {
    const mockFile: Express.Multer.File = {
      fieldname: "file",
      originalname: "test-document.pdf",
      encoding: "7bit",
      mimetype: "application/pdf",
      size: 1024,
      destination: "/tmp",
      filename: "test-document.pdf",
      path: "/tmp/test-document.pdf",
      buffer: Buffer.from("test content"),
      stream: {} as any,
    };

    const mockFolder = {
      id: 1,
      name: "Test Folder",
      user_id: 1,
      created_at: new Date(),
      updated_at: new Date(),
    };

    const uploadInput: UploadDocumentInput = {
      folderId: 1,
      file: mockFile,
      name: "Custom Document Name",
      type: "application/pdf",
    };

    it("should upload a document successfully", async () => {
      const mockDocument = {
        id: 1,
        folder_id: 1,
        name: "Custom Document Name",
        url: "folder_1/1234567890_test-document.pdf",
        type: "application/pdf",
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockPrisma.folder.findUnique.mockResolvedValue(mockFolder);
      mockSupabaseStorage.upload.mockResolvedValue({
        data: { path: mockDocument.url },
        error: null,
      });
      mockPrisma.document.create.mockResolvedValue(mockDocument);

      const result = await service.uploadDocument(uploadInput);

      expect(mockPrisma.folder.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
      });
      expect(mockSupabaseStorage.upload).toHaveBeenCalled();
      expect(mockPrisma.document.create).toHaveBeenCalledWith({
        data: {
          folder_id: 1,
          name: "Custom Document Name",
          url: expect.stringContaining("folder_1/"),
          type: "application/pdf",
        },
      });
      expect(result).toEqual(mockDocument);
    });

    it("should throw error if folder does not exist", async () => {
      mockPrisma.folder.findUnique.mockResolvedValue(null);

      await expect(service.uploadDocument(uploadInput)).rejects.toThrow(
        "Folder not found",
      );

      expect(mockPrisma.folder.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
      });
      expect(mockSupabaseStorage.upload).not.toHaveBeenCalled();
    });

    it("should throw error if Supabase upload fails", async () => {
      mockPrisma.folder.findUnique.mockResolvedValue(mockFolder);
      mockSupabaseStorage.upload.mockResolvedValue({
        data: null,
        error: { message: "Upload failed" },
      });

      await expect(service.uploadDocument(uploadInput)).rejects.toThrow(
        "Failed to upload file: Upload failed",
      );

      expect(mockPrisma.document.create).not.toHaveBeenCalled();
    });

    it("should use original filename if name is not provided", async () => {
      const mockDocument = {
        id: 1,
        folder_id: 1,
        name: "test-document.pdf",
        url: "folder_1/1234567890_test-document.pdf",
        type: "application/pdf",
        created_at: new Date(),
        updated_at: new Date(),
      };

      const inputWithoutName: UploadDocumentInput = {
        folderId: 1,
        file: mockFile,
      };

      mockPrisma.folder.findUnique.mockResolvedValue(mockFolder);
      mockSupabaseStorage.upload.mockResolvedValue({
        data: { path: mockDocument.url },
        error: null,
      });
      mockPrisma.document.create.mockResolvedValue(mockDocument);

      await service.uploadDocument(inputWithoutName);

      expect(mockPrisma.document.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          name: "test-document.pdf",
        }),
      });
    });

    it("should use file mimetype if type is not provided", async () => {
      const mockDocument = {
        id: 1,
        folder_id: 1,
        name: "test-document.pdf",
        url: "folder_1/1234567890_test-document.pdf",
        type: "application/pdf",
        created_at: new Date(),
        updated_at: new Date(),
      };

      const inputWithoutType: UploadDocumentInput = {
        folderId: 1,
        file: mockFile,
      };

      mockPrisma.folder.findUnique.mockResolvedValue(mockFolder);
      mockSupabaseStorage.upload.mockResolvedValue({
        data: { path: mockDocument.url },
        error: null,
      });
      mockPrisma.document.create.mockResolvedValue(mockDocument);

      await service.uploadDocument(inputWithoutType);

      expect(mockPrisma.document.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          type: "application/pdf",
        }),
      });
    });

    it("should convert special characters in filename", async () => {
      const fileWithSpecialChars: Express.Multer.File = {
        ...mockFile,
        originalname: "téléchargé-dossier-été.pdf",
      };

      const mockDocument = {
        id: 1,
        folder_id: 1,
        name: "téléchargé-dossier-été.pdf",
        url: "folder_1/1234567890_telecharge-dossier-ete.pdf",
        type: "application/pdf",
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockPrisma.folder.findUnique.mockResolvedValue(mockFolder);
      mockSupabaseStorage.upload.mockResolvedValue({
        data: { path: mockDocument.url },
        error: null,
      });
      mockPrisma.document.create.mockResolvedValue(mockDocument);

      const input: UploadDocumentInput = {
        folderId: 1,
        file: fileWithSpecialChars,
      };

      await service.uploadDocument(input);

      const callArgs = mockSupabaseStorage.upload.mock.calls[0];
      expect(callArgs[0]).toMatch(/folder_1\/\d+_telecharge-dossier-ete\.pdf/);
    });

    it("should replace multiple underscores with single underscore in converted filename", async () => {
      const fileWithMultipleSpecialChars: Express.Multer.File = {
        ...mockFile,
        originalname: "file###Name@@.pdf",
      };

      const mockDocument = {
        id: 1,
        folder_id: 1,
        name: "file###Name@@.pdf",
        url: "folder_1/1234567890_file_Name_.pdf",
        type: "application/pdf",
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockPrisma.folder.findUnique.mockResolvedValue(mockFolder);
      mockSupabaseStorage.upload.mockResolvedValue({
        data: { path: mockDocument.url },
        error: null,
      });
      mockPrisma.document.create.mockResolvedValue(mockDocument);

      const input: UploadDocumentInput = {
        folderId: 1,
        file: fileWithMultipleSpecialChars,
      };

      await service.uploadDocument(input);

      const callArgs = mockSupabaseStorage.upload.mock.calls[0];
      expect(callArgs[0]).not.toMatch(/__/);
    });
  });

  describe("getDocumentsByFolder", () => {
    const mockDocuments = [
      {
        id: 1,
        folder_id: 1,
        name: "Document 1",
        url: "folder_1/doc1.pdf",
        type: "application/pdf",
        created_at: new Date("2026-03-18"),
        updated_at: new Date("2026-03-18"),
      },
      {
        id: 2,
        folder_id: 1,
        name: "Document 2",
        url: "folder_1/doc2.pdf",
        type: "application/pdf",
        created_at: new Date("2026-03-17"),
        updated_at: new Date("2026-03-17"),
      },
    ];

    it("should return documents with signed URLs", async () => {
      const mockSignedUrl = "https://signed-url.example.com/file";

      mockPrisma.document.findMany.mockResolvedValue(mockDocuments);
      mockSupabaseStorage.createSignedUrl.mockResolvedValue({
        data: { signedUrl: mockSignedUrl },
        error: null,
      });

      const result = await service.getDocumentsByFolder(1);

      expect(mockPrisma.document.findMany).toHaveBeenCalledWith({
        where: { folder_id: 1 },
        orderBy: { created_at: "desc" },
      });
      expect(mockSupabaseStorage.createSignedUrl).toHaveBeenCalledTimes(2);
      expect(result).toHaveLength(2);
      expect(result[0].url).toBe(mockSignedUrl);
      expect(result[1].url).toBe(mockSignedUrl);
    });

    it("should return documents without signed URL if creation fails", async () => {
      mockPrisma.document.findMany.mockResolvedValue(mockDocuments);
      mockSupabaseStorage.createSignedUrl.mockResolvedValue({
        data: null,
        error: { message: "Error creating signed URL" },
      });

      const consoleSpy = jest.spyOn(console, "error").mockImplementation();

      const result = await service.getDocumentsByFolder(1);

      expect(result).toHaveLength(2);
      expect(result[0].url).toBe(mockDocuments[0].url);
      expect(consoleSpy).toHaveBeenCalledTimes(2);

      consoleSpy.mockRestore();
    });

    it("should return empty array if folder has no documents", async () => {
      mockPrisma.document.findMany.mockResolvedValue([]);

      const result = await service.getDocumentsByFolder(1);

      expect(result).toEqual([]);
      expect(mockPrisma.document.findMany).toHaveBeenCalledWith({
        where: { folder_id: 1 },
        orderBy: { created_at: "desc" },
      });
    });

    it("should order documents by creation date descending", async () => {
      mockPrisma.document.findMany.mockResolvedValue(mockDocuments);
      mockSupabaseStorage.createSignedUrl.mockResolvedValue({
        data: { signedUrl: "https://signed-url.example.com/file" },
        error: null,
      });

      await service.getDocumentsByFolder(1);

      expect(mockPrisma.document.findMany).toHaveBeenCalledWith({
        where: { folder_id: 1 },
        orderBy: { created_at: "desc" },
      });
    });
  });

  describe("getDocumentById", () => {
    const mockDocument = {
      id: 1,
      folder_id: 1,
      name: "Document 1",
      url: "folder_1/doc1.pdf",
      type: "application/pdf",
      created_at: new Date(),
      updated_at: new Date(),
    };

    it("should return document with signed URL", async () => {
      const mockSignedUrl = "https://signed-url.example.com/file";

      mockPrisma.document.findUnique.mockResolvedValue(mockDocument);
      mockSupabaseStorage.createSignedUrl.mockResolvedValue({
        data: { signedUrl: mockSignedUrl },
        error: null,
      });

      const result = await service.getDocumentById(1);

      expect(mockPrisma.document.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
      });
      expect(mockSupabaseStorage.createSignedUrl).toHaveBeenCalledWith(
        "folder_1/doc1.pdf",
        3600,
      );
      expect(result).toEqual({
        ...mockDocument,
        url: mockSignedUrl,
      });
    });

    it("should return null if document does not exist", async () => {
      mockPrisma.document.findUnique.mockResolvedValue(null);

      const result = await service.getDocumentById(999);

      expect(result).toBeNull();
      expect(mockPrisma.document.findUnique).toHaveBeenCalledWith({
        where: { id: 999 },
      });
      expect(mockSupabaseStorage.createSignedUrl).not.toHaveBeenCalled();
    });

    it("should return document without signed URL if creation fails", async () => {
      mockPrisma.document.findUnique.mockResolvedValue(mockDocument);
      mockSupabaseStorage.createSignedUrl.mockResolvedValue({
        data: null,
        error: { message: "Error creating signed URL" },
      });

      const consoleSpy = jest.spyOn(console, "error").mockImplementation();

      const result = await service.getDocumentById(1);

      expect(result).toEqual(mockDocument);
      expect(consoleSpy).toHaveBeenCalledWith("Error creating signed URL:", {
        message: "Error creating signed URL",
      });

      consoleSpy.mockRestore();
    });

    it("should create signed URL with 1 hour expiration", async () => {
      mockPrisma.document.findUnique.mockResolvedValue(mockDocument);
      mockSupabaseStorage.createSignedUrl.mockResolvedValue({
        data: { signedUrl: "https://signed-url.example.com/file" },
        error: null,
      });

      await service.getDocumentById(1);

      expect(mockSupabaseStorage.createSignedUrl).toHaveBeenCalledWith(
        mockDocument.url,
        3600,
      );
    });
  });

  describe("deleteDocument", () => {
    const mockDocument = {
      id: 1,
      folder_id: 1,
      name: "Document 1",
      url: "folder_1/doc1.pdf",
      type: "application/pdf",
      created_at: new Date(),
      updated_at: new Date(),
    };

    it("should delete document and file from storage", async () => {
      mockPrisma.document.findUnique.mockResolvedValue(mockDocument);
      mockSupabaseStorage.remove.mockResolvedValue({
        data: {},
        error: null,
      });
      mockPrisma.document.delete.mockResolvedValue(mockDocument);

      const result = await service.deleteDocument(1);

      expect(mockPrisma.document.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
      });
      expect(mockSupabaseStorage.remove).toHaveBeenCalledWith([
        "folder_1/doc1.pdf",
      ]);
      expect(mockPrisma.document.delete).toHaveBeenCalledWith({
        where: { id: 1 },
      });
      expect(result).toEqual({ message: "Document deleted successfully" });
    });

    it("should throw error if document does not exist", async () => {
      mockPrisma.document.findUnique.mockResolvedValue(null);

      await expect(service.deleteDocument(999)).rejects.toThrow(
        "Document not found",
      );

      expect(mockPrisma.document.findUnique).toHaveBeenCalledWith({
        where: { id: 999 },
      });
      expect(mockSupabaseStorage.remove).not.toHaveBeenCalled();
      expect(mockPrisma.document.delete).not.toHaveBeenCalled();
    });

    it("should delete document even if file deletion fails", async () => {
      mockPrisma.document.findUnique.mockResolvedValue(mockDocument);
      mockSupabaseStorage.remove.mockResolvedValue({
        data: null,
        error: { message: "Deletion failed" },
      });
      mockPrisma.document.delete.mockResolvedValue(mockDocument);

      const consoleSpy = jest.spyOn(console, "error").mockImplementation();

      const result = await service.deleteDocument(1);

      expect(consoleSpy).toHaveBeenCalledWith(
        "Failed to delete file from Supabase:",
        { message: "Deletion failed" },
      );
      expect(mockPrisma.document.delete).toHaveBeenCalledWith({
        where: { id: 1 },
      });
      expect(result).toEqual({ message: "Document deleted successfully" });

      consoleSpy.mockRestore();
    });

    it("should handle document without file path gracefully", async () => {
      const documentWithoutPath = {
        ...mockDocument,
        url: null as any,
      };

      mockPrisma.document.findUnique.mockResolvedValue(documentWithoutPath);
      mockPrisma.document.delete.mockResolvedValue(documentWithoutPath);

      const result = await service.deleteDocument(1);

      expect(mockSupabaseStorage.remove).not.toHaveBeenCalled();
      expect(mockPrisma.document.delete).toHaveBeenCalledWith({
        where: { id: 1 },
      });
      expect(result).toEqual({ message: "Document deleted successfully" });
    });
  });

  describe("updateDocument", () => {
    const mockDocument = {
      id: 1,
      folder_id: 1,
      name: "Updated Document",
      url: "folder_1/doc1.pdf",
      type: "application/pdf",
      created_at: new Date(),
      updated_at: new Date(),
    };

    it("should update document name", async () => {
      mockPrisma.document.update.mockResolvedValue(mockDocument);

      const result = await service.updateDocument(1, {
        name: "Updated Document",
      });

      expect(mockPrisma.document.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { name: "Updated Document" },
      });
      expect(result).toEqual(mockDocument);
    });

    it("should update document type", async () => {
      const mockUpdatedDocument = {
        ...mockDocument,
        type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      };

      mockPrisma.document.update.mockResolvedValue(mockUpdatedDocument);

      const result = await service.updateDocument(1, {
        type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      });

      expect(mockPrisma.document.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: {
          type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        },
      });
      expect(result).toEqual(mockUpdatedDocument);
    });

    it("should update both name and type", async () => {
      mockPrisma.document.update.mockResolvedValue(mockDocument);

      const result = await service.updateDocument(1, {
        name: "Updated Document",
        type: "application/pdf",
      });

      expect(mockPrisma.document.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: {
          name: "Updated Document",
          type: "application/pdf",
        },
      });
      expect(result).toEqual(mockDocument);
    });

    it("should handle partial updates", async () => {
      mockPrisma.document.update.mockResolvedValue(mockDocument);

      await service.updateDocument(1, { name: "New Name" });

      expect(mockPrisma.document.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { name: "New Name" },
      });
    });
  });
});
