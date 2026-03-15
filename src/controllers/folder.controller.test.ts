import { folderController } from "./folder.controller";
import { folderService } from "../services/folder.service";
import { FolderStatus } from "@prisma/client";
import { Request, Response } from "express";

jest.mock("../services/folder.service");

const prismaMock = {
  folder: {
    findFirst: jest.fn(),
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
  },
} as any;

describe("folderController", () => {
  let controller: ReturnType<typeof folderController>;
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;

  beforeEach(() => {
    controller = folderController(prismaMock);
    mockRes = {
      json: jest.fn().mockReturnThis(),
      status: jest.fn().mockReturnThis(),
    };
    mockReq = {};
    jest.clearAllMocks();
  });

  describe("getAllFolders", () => {
    it("should return all folders", async () => {
      const folders = [
        {
          id: 1,
          user_id: 1,
          vehicle_id: 1,
          status: FolderStatus.active,
          created_at: new Date(),
          updated_at: new Date(),
          orders: [],
          user: {
            id: 1,
            first_name: "John",
            last_name: "Doe",
            mail: "john@example.com",
            phone_number: "123456789",
            address: "1 rue de la fontaine",
            city: "Bordeaux",
            zip_code: "33000",
            country: "France",
            role: "user",
          },
          vehicle: { id: 1, brand: "Peugi", model: "Serie 2" },
        },
      ];

      (folderService as jest.Mock).mockReturnValue({
        getAllFolders: jest.fn().mockResolvedValue(folders),
      });

      await controller.getAllFolders(mockReq as Request, mockRes as Response);

      expect(mockRes.json).toHaveBeenCalledWith(folders);
    });

    it("should return 500 error when fetching folders fails", async () => {
      const error = new Error("Database error");
      (folderService as jest.Mock).mockReturnValue({
        getAllFolders: jest.fn().mockRejectedValue(error),
      });

      await controller.getAllFolders(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Failed to fetch all folders",
      });
    });
  });

  describe("createFolder", () => {
    it("should create a folder with valid userId and vehicleId", async () => {
      const newFolder = {
        id: 1,
        user_id: 1,
        vehicle_id: 1,
        status: FolderStatus.active,
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockReq = {
        body: { userId: 1, vehicleId: 1 },
      };

      (folderService as jest.Mock).mockReturnValue({
        createFolder: jest.fn().mockResolvedValue(newFolder),
      });

      await controller.createFolder(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith(newFolder);
    });

    it("should return 400 error if userId is missing", async () => {
      mockReq = {
        body: { vehicleId: 1 },
      };

      await controller.createFolder(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "userId and vehicleId are required",
      });
    });

    it("should return 400 error if vehicleId is missing", async () => {
      mockReq = {
        body: { userId: 1 },
      };

      await controller.createFolder(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "userId and vehicleId are required",
      });
    });

    it("should return 400 error if both userId and vehicleId are missing", async () => {
      mockReq = {
        body: {},
      };

      await controller.createFolder(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "userId and vehicleId are required",
      });
    });
  });

  describe("getFoldersByUser", () => {
    it("should return folders for a specific user", async () => {
      const folders = [
        {
          id: 1,
          user_id: 1,
          vehicle_id: 1,
          status: FolderStatus.active,
          created_at: new Date(),
          updated_at: new Date(),
          orders: [],
          user: {
            id: 1,
            first_name: "John",
            last_name: "Doe",
            mail: "john@example.com",
            phone_number: "123456789",
            address: "1 rue de la fontaine",
            city: "Bordeaux",
            zip_code: "33000",
            country: "France",
            role: "user",
          },
          vehicle: { id: 1, brand: "Peugi", model: "Serie 2" },
        },
      ];

      mockReq = {
        params: { userId: "1" },
      };

      (folderService as jest.Mock).mockReturnValue({
        getFoldersByUser: jest.fn().mockResolvedValue(folders),
      });

      await controller.getFoldersByUser(
        mockReq as Request,
        mockRes as Response,
      );

      expect(mockRes.json).toHaveBeenCalledWith(folders);
    });

    it("should convert userId string to number", async () => {
      mockReq = {
        params: { userId: "5" },
      };

      const mockGetFoldersByUser = jest.fn().mockResolvedValue([]);
      (folderService as jest.Mock).mockReturnValue({
        getFoldersByUser: mockGetFoldersByUser,
      });

      await controller.getFoldersByUser(
        mockReq as Request,
        mockRes as Response,
      );

      expect(mockGetFoldersByUser).toHaveBeenCalledWith(5);
    });
  });

  describe("getFolderById", () => {
    it("should return a folder by id", async () => {
      const folder = {
        id: 1,
        user_id: 1,
        vehicle_id: 1,
        status: FolderStatus.active,
        created_at: new Date(),
        updated_at: new Date(),
        orders: [],
        user: {
          id: 1,
          first_name: "John",
          last_name: "Doe",
          mail: "john@example.com",
          phone_number: "123456789",
        },
        vehicle: { id: 1, brand: "Peugi", model: "Serie 2" },
      };

      mockReq = {
        params: { id: "1" },
      };

      (folderService as jest.Mock).mockReturnValue({
        getFolderById: jest.fn().mockResolvedValue(folder),
      });

      await controller.getFolderById(mockReq as Request, mockRes as Response);

      expect(mockRes.json).toHaveBeenCalledWith(folder);
    });

    it("should return 404 if folder not found", async () => {
      mockReq = {
        params: { id: "999" },
      };

      (folderService as jest.Mock).mockReturnValue({
        getFolderById: jest.fn().mockResolvedValue(null),
      });

      await controller.getFolderById(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({ error: "Folder not found" });
    });

    it("should convert id string to number", async () => {
      mockReq = {
        params: { id: "3" },
      };

      const mockGetFolderById = jest.fn().mockResolvedValue(null);
      (folderService as jest.Mock).mockReturnValue({
        getFolderById: mockGetFolderById,
      });

      await controller.getFolderById(mockReq as Request, mockRes as Response);

      expect(mockGetFolderById).toHaveBeenCalledWith(3);
    });
  });

  describe("updateFolderStatus", () => {
    it("should update folder status", async () => {
      const updatedFolder = {
        id: 1,
        user_id: 1,
        vehicle_id: 1,
        status: FolderStatus.closed,
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockReq = {
        params: { id: "1" },
        body: { status: FolderStatus.closed },
      };

      (folderService as jest.Mock).mockReturnValue({
        updateFolderStatus: jest.fn().mockResolvedValue(updatedFolder),
      });

      await controller.updateFolderStatus(
        mockReq as Request,
        mockRes as Response,
      );

      expect(mockRes.json).toHaveBeenCalledWith(updatedFolder);
    });

    it("should return 400 if status is missing", async () => {
      mockReq = {
        params: { id: "1" },
        body: {},
      };

      await controller.updateFolderStatus(
        mockReq as Request,
        mockRes as Response,
      );

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Status is required",
      });
    });

    it("should convert id string to number", async () => {
      mockReq = {
        params: { id: "2" },
        body: { status: FolderStatus.active },
      };

      const mockUpdateFolderStatus = jest.fn().mockResolvedValue({});
      (folderService as jest.Mock).mockReturnValue({
        updateFolderStatus: mockUpdateFolderStatus,
      });

      await controller.updateFolderStatus(
        mockReq as Request,
        mockRes as Response,
      );

      expect(mockUpdateFolderStatus).toHaveBeenCalledWith(
        2,
        FolderStatus.active,
      );
    });
  });
});
