import { PrismaClient } from "@prisma/client";
import { documentController } from "./document.controller";
import { documentService } from "../services/document.service.js";
import { Request, Response } from "express";

jest.mock("../services/document.service");

describe("DocumentController", () => {
  let mockPrisma: any;
  let controller: ReturnType<typeof documentController>;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockDocumentService: any;

  beforeEach(() => {
    jest.clearAllMocks();

    mockPrisma = {};

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    mockRequest = {
      body: {},
      params: {},
      file: undefined,
    };

    mockDocumentService = {
      uploadDocument: jest.fn(),
      getDocumentsByFolder: jest.fn(),
      getDocumentById: jest.fn(),
      deleteDocument: jest.fn(),
      updateDocument: jest.fn(),
    };

    (documentService as jest.Mock).mockReturnValue(mockDocumentService);

    controller = documentController(mockPrisma);
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

    const mockDocument = {
      id: 1,
      folder_id: 1,
      name: "test-document.pdf",
      url: "folder_1/1234567890_test-document.pdf",
      type: "application/pdf",
      created_at: new Date(),
      updated_at: new Date(),
    };

    it("should upload a document successfully", async () => {
      mockRequest.body = { folderId: "1", name: "My Document" };
      mockRequest.file = mockFile;
      mockDocumentService.uploadDocument.mockResolvedValue(mockDocument);

      await controller.uploadDocument(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith(mockDocument);
      expect(mockDocumentService.uploadDocument).toHaveBeenCalledWith({
        folderId: 1,
        file: mockFile,
        name: "My Document",
        type: undefined,
      });
    });

    it("should return 400 if folderId is missing", async () => {
      mockRequest.body = {};
      mockRequest.file = mockFile;

      await controller.uploadDocument(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: "folderId is required",
      });
    });

    it("should return 400 if no file is uploaded", async () => {
      mockRequest.body = { folderId: "1" };
      mockRequest.file = undefined;

      await controller.uploadDocument(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: "No file uploaded",
      });
    });

    it("should return 500 if service throws error", async () => {
      mockRequest.body = { folderId: "1" };
      mockRequest.file = mockFile;
      mockDocumentService.uploadDocument.mockRejectedValue(
        new Error("Upload failed"),
      );

      const consoleSpy = jest.spyOn(console, "error").mockImplementation();

      await controller.uploadDocument(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: "Failed to upload document",
        message: "Upload failed",
      });

      consoleSpy.mockRestore();
    });
  });

  describe("getDocumentsByFolder", () => {
    const mockDocuments = [
      {
        id: 1,
        folder_id: 1,
        name: "Document 1",
        url: "https://signed-url.example.com/file1",
        type: "application/pdf",
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: 2,
        folder_id: 1,
        name: "Document 2",
        url: "https://signed-url.example.com/file2",
        type: "application/pdf",
        created_at: new Date(),
        updated_at: new Date(),
      },
    ];

    it("should return documents for a folder", async () => {
      mockRequest.params = { folderId: "1" };
      mockDocumentService.getDocumentsByFolder.mockResolvedValue(mockDocuments);

      await controller.getDocumentsByFolder(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(mockDocumentService.getDocumentsByFolder).toHaveBeenCalledWith(1);
      expect(mockResponse.json).toHaveBeenCalledWith(mockDocuments);
    });

    it("should return empty array if folder has no documents", async () => {
      mockRequest.params = { folderId: "1" };
      mockDocumentService.getDocumentsByFolder.mockResolvedValue([]);

      await controller.getDocumentsByFolder(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(mockResponse.json).toHaveBeenCalledWith([]);
    });

    it("should return 500 if service throws error", async () => {
      mockRequest.params = { folderId: "1" };
      mockDocumentService.getDocumentsByFolder.mockRejectedValue(
        new Error("Database error"),
      );

      const consoleSpy = jest.spyOn(console, "error").mockImplementation();

      await controller.getDocumentsByFolder(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: "Failed to get documents",
        message: "Database error",
      });

      consoleSpy.mockRestore();
    });
  });

  describe("getDocumentById", () => {
    const mockDocument = {
      id: 1,
      folder_id: 1,
      name: "Document 1",
      url: "https://signed-url.example.com/file",
      type: "application/pdf",
      created_at: new Date(),
      updated_at: new Date(),
    };

    it("should return a document by ID", async () => {
      mockRequest.params = { id: "1" };
      mockDocumentService.getDocumentById.mockResolvedValue(mockDocument);

      await controller.getDocumentById(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(mockDocumentService.getDocumentById).toHaveBeenCalledWith(1);
      expect(mockResponse.json).toHaveBeenCalledWith(mockDocument);
    });

    it("should return 404 if document does not exist", async () => {
      mockRequest.params = { id: "999" };
      mockDocumentService.getDocumentById.mockResolvedValue(null);

      await controller.getDocumentById(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: "Document not found",
      });
    });

    it("should return 500 if service throws error", async () => {
      mockRequest.params = { id: "1" };
      mockDocumentService.getDocumentById.mockRejectedValue(
        new Error("Database error"),
      );

      const consoleSpy = jest.spyOn(console, "error").mockImplementation();

      await controller.getDocumentById(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: "Failed to get document",
        message: "Database error",
      });

      consoleSpy.mockRestore();
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

    it("should delete a document successfully", async () => {
      mockRequest.params = { id: "1" };
      mockDocumentService.deleteDocument.mockResolvedValue({
        message: "Document deleted successfully",
      });

      await controller.deleteDocument(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(mockDocumentService.deleteDocument).toHaveBeenCalledWith(1);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: "Document deleted successfully",
      });
    });

    it("should return 500 if service throws error", async () => {
      mockRequest.params = { id: "1" };
      mockDocumentService.deleteDocument.mockRejectedValue(
        new Error("Document not found"),
      );

      const consoleSpy = jest.spyOn(console, "error").mockImplementation();

      await controller.deleteDocument(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: "Failed to delete document",
        message: "Document not found",
      });

      consoleSpy.mockRestore();
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
      mockRequest.params = { id: "1" };
      mockRequest.body = { name: "Updated Document" };
      mockDocumentService.updateDocument.mockResolvedValue(mockDocument);

      await controller.updateDocument(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(mockDocumentService.updateDocument).toHaveBeenCalledWith(1, {
        name: "Updated Document",
        type: undefined,
      });
      expect(mockResponse.json).toHaveBeenCalledWith(mockDocument);
    });

    it("should update document type", async () => {
      mockRequest.params = { id: "1" };
      mockRequest.body = { type: "application/pdf" };
      mockDocumentService.updateDocument.mockResolvedValue(mockDocument);

      await controller.updateDocument(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(mockDocumentService.updateDocument).toHaveBeenCalledWith(1, {
        name: undefined,
        type: "application/pdf",
      });
      expect(mockResponse.json).toHaveBeenCalledWith(mockDocument);
    });

    it("should update both name and type", async () => {
      mockRequest.params = { id: "1" };
      mockRequest.body = { name: "Updated", type: "application/pdf" };
      mockDocumentService.updateDocument.mockResolvedValue(mockDocument);

      await controller.updateDocument(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(mockDocumentService.updateDocument).toHaveBeenCalledWith(1, {
        name: "Updated",
        type: "application/pdf",
      });
    });

    it("should return 400 if neither name nor type is provided", async () => {
      mockRequest.params = { id: "1" };
      mockRequest.body = {};

      await controller.updateDocument(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: "At least one field (name or type) is required",
      });
    });

    it("should return 500 if service throws error", async () => {
      mockRequest.params = { id: "1" };
      mockRequest.body = { name: "Updated" };
      mockDocumentService.updateDocument.mockRejectedValue(
        new Error("Document not found"),
      );

      const consoleSpy = jest.spyOn(console, "error").mockImplementation();

      await controller.updateDocument(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: "Failed to update document",
        message: "Document not found",
      });

      consoleSpy.mockRestore();
    });
  });
});
