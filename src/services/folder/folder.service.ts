import { PrismaClient, FolderStatus, VehiclesStatus } from "@prisma/client";
import { supabase, BUCKET_DOCUMENTS } from "../../utils/supabase.js";

export const folderService = (prisma: PrismaClient) => {
  return {
    createFolder: async (userId: number, vehicleId: number) => {
      const existingFolder = await prisma.folder.findFirst({
        where: { vehicle_id: vehicleId },
      });

      if (existingFolder) {
        throw new Error("Un dossier existe déjà pour ce véhicule.");
      }

      const vehicle = await prisma.vehicle.findUnique({
        where: { id: vehicleId },
      });

      if (!vehicle) {
        throw new Error("Vehicle not found");
      }

      if (vehicle.status === VehiclesStatus.sold) {
        throw new Error("Ce véhicule est déjà vendu.");
      }

      if (vehicle.status === VehiclesStatus.reserved) {
        throw new Error("Ce véhicule est déjà réservé.");
      }

      const folder = await prisma.$transaction(async (tx) => {
        const createdFolder = await tx.folder.create({
          data: {
            user_id: userId,
            status: FolderStatus.active,
            vehicle_id: vehicleId,
          },
        });

        await tx.vehicle.update({
          where: { id: vehicleId },
          data: { status: VehiclesStatus.reserved },
        });

        return createdFolder;
      });

      return folder;
    },
    getAllFolders: async () => {
      return prisma.folder.findMany({
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
    },
    getFoldersByUser: async (userId: number) => {
      return prisma.folder.findMany({
        where: { user_id: userId },
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
    },
    getFolderById: async (id: number) => {
      return prisma.folder.findUnique({
        where: { id },
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
    },
    updateFolderStatus: async (
      id: number,
      newStatus: FolderStatus,
      userId: number,
      userRole?: string,
    ) => {
      const folder = await prisma.folder.findUnique({
        where: { id },
        include: { documents: true },
      });

      if (!folder) {
        throw new Error("Folder not found");
      }

      //user can update their own folder, or admin can update any
      const isUser = folder.user_id === userId;
      const isAdmin = userRole === "admin";

      if (!isUser && !isAdmin) {
        throw new Error("Forbidden: You can only update your own folders");
      }

      //status transitions
      const validTransitions: Record<FolderStatus, FolderStatus[]> = {
        [FolderStatus.active]: [FolderStatus.submitted],
        [FolderStatus.submitted]: [
          FolderStatus.active,
          FolderStatus.accepted,
          FolderStatus.rejected,
        ],
        [FolderStatus.accepted]: [FolderStatus.closed, FolderStatus.archived],
        [FolderStatus.rejected]: [FolderStatus.active],
        [FolderStatus.closed]: [FolderStatus.archived],
        [FolderStatus.cancelled]: [FolderStatus.active],
        [FolderStatus.archived]: [],
      };

      if (!validTransitions[folder.status]?.includes(newStatus)) {
        throw new Error(
          `Invalid status transition from ${folder.status} to ${newStatus}`,
        );
      }

      if (newStatus === FolderStatus.submitted) {
        if (folder.documents.length === 0) {
          throw new Error(
            "Cannot submit folder without documents. At least one document is required.",
          );
        }
      }

      return prisma.folder.update({
        where: { id },
        data: { status: newStatus },
        include: {
          user: {
            select: {
              id: true,
              first_name: true,
              last_name: true,
              mail: true,
            },
          },
          vehicle: true,
          documents: true,
        },
      });
    },
    deleteFolder: async (id: number, userId: number, userRole?: string) => {
      const folder = await prisma.folder.findUnique({ where: { id } });
      if (!folder) {
        throw new Error("Folder not found");
      }
      const isOwner = folder.user_id === userId;
      const isAdmin = userRole === "admin";
      if (!isOwner && !isAdmin) {
        throw new Error("Forbidden: You can only delete your own folders");
      }
      const documents = await prisma.document.findMany({
        where: { folder_id: id },
      });
      if (documents.length > 0) {
        const filePaths = documents.map((doc) => doc.url);
        const { error } = await supabase.storage
          .from(BUCKET_DOCUMENTS)
          .remove(filePaths);
        if (error) {
          console.error("Failed to delete files from Supabase:", error);
        }
      }
      return prisma.folder.delete({
        where: { id },
      });
    },
  };
};
