import { folderService } from "./folder.service";
import { FolderStatus } from "@prisma/client";

const prismaMock = {
  folder: {
    findFirst: jest.fn(),
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
  },
} as any;

describe("folderService", () => {
  const service = folderService(prismaMock);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("createFolder", () => {
    it("should throw error if folder already exists for vehicle", async () => {
      prismaMock.folder.findFirst.mockResolvedValue({
        id: 1,
        user_id: 1,
        vehicle_id: 1,
        status: FolderStatus.active,
      });

      await expect(service.createFolder(1, 1)).rejects.toThrow(
        "Un dossier existe déjà pour ce véhicule.",
      );

      expect(prismaMock.folder.findFirst).toHaveBeenCalledWith({
        where: { vehicle_id: 1 },
      });
    });

    it("should create a new folder if none exists", async () => {
      prismaMock.folder.findFirst.mockResolvedValue(null);
      const newFolder = {
        id: 1,
        user_id: 1,
        vehicle_id: 1,
        status: FolderStatus.active,
        created_at: new Date(),
        updated_at: new Date(),
      };
      prismaMock.folder.create.mockResolvedValue(newFolder);

      const result = await service.createFolder(1, 1);

      expect(prismaMock.folder.findFirst).toHaveBeenCalledWith({
        where: { vehicle_id: 1 },
      });
      expect(prismaMock.folder.create).toHaveBeenCalledWith({
        data: {
          user_id: 1,
          status: FolderStatus.active,
          vehicle_id: 1,
        },
      });
      expect(result).toEqual(newFolder);
    });
  });

  describe("getAllFolders", () => {
    it("should return all folders with related data ordered by creation date", async () => {
      const folders = [
        {
          id: 1,
          user_id: 1,
          vehicle_id: 1,
          status: FolderStatus.active,
          created_at: new Date("2026-03-15"),
          updated_at: new Date("2026-03-15"),
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
          vehicle: {
            id: 1,
            brand: "Peugi",
            model: "Serie 2",
          },
        },
      ];

      prismaMock.folder.findMany.mockResolvedValue(folders);

      const result = await service.getAllFolders();

      expect(prismaMock.folder.findMany).toHaveBeenCalledWith({
        include: {
          orders: true,
          user: {
            select: {
              id: true,
              first_name: true,
              last_name: true,
              mail: true,
              phone_number: true,
              address: true,
              city: true,
              zip_code: true,
              country: true,
              role: true,
            },
          },
          vehicle: true,
        },
        orderBy: {
          created_at: "desc",
        },
      });
      expect(result).toEqual(folders);
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
          vehicle: {
            id: 1,
            brand: "Peugi",
            model: "Serie 2",
          },
        },
      ];

      prismaMock.folder.findMany.mockResolvedValue(folders);

      const result = await service.getFoldersByUser(1);

      expect(prismaMock.folder.findMany).toHaveBeenCalledWith({
        where: { user_id: 1 },
        include: {
          orders: true,
          user: {
            select: {
              id: true,
              first_name: true,
              last_name: true,
              mail: true,
              phone_number: true,
              address: true,
              city: true,
              zip_code: true,
              country: true,
              role: true,
            },
          },
          vehicle: true,
        },
      });
      expect(result).toEqual(folders);
    });

    it("should return empty array if user has no folders", async () => {
      prismaMock.folder.findMany.mockResolvedValue([]);

      const result = await service.getFoldersByUser(999);

      expect(result).toEqual([]);
    });
  });

  describe("getFolderById", () => {
    it("should return folder with related data by id", async () => {
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
        vehicle: {
          id: 1,
          brand: "Peugeot",
          model: "Serie 2",
        },
      };

      prismaMock.folder.findUnique.mockResolvedValue(folder);

      const result = await service.getFolderById(1);

      expect(prismaMock.folder.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
        include: {
          orders: true,
          user: {
            select: {
              id: true,
              first_name: true,
              last_name: true,
              mail: true,
              phone_number: true,
            },
          },
          vehicle: true,
        },
      });
      expect(result).toEqual(folder);
    });

    it("should return null if folder does not exist", async () => {
      prismaMock.folder.findUnique.mockResolvedValue(null);

      const result = await service.getFolderById(999);

      expect(result).toBeNull();
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

      prismaMock.folder.update.mockResolvedValue(updatedFolder);

      const result = await service.updateFolderStatus(1, FolderStatus.closed);

      expect(prismaMock.folder.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { status: FolderStatus.closed },
      });
      expect(result).toEqual(updatedFolder);
    });

    it("should update folder status to active", async () => {
      const updatedFolder = {
        id: 1,
        user_id: 1,
        vehicle_id: 1,
        status: FolderStatus.active,
        created_at: new Date(),
        updated_at: new Date(),
      };

      prismaMock.folder.update.mockResolvedValue(updatedFolder);

      const result = await service.updateFolderStatus(1, FolderStatus.active);

      expect(prismaMock.folder.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { status: FolderStatus.active },
      });
      expect(result).toEqual(updatedFolder);
    });
  });
});
