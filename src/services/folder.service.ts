import { PrismaClient, FolderStatus } from "@prisma/client";

export const folderService = (prisma: PrismaClient) => {
  return {
    createFolder: async (userId: number, vehicleId: number) => {
      const existingFolder = await prisma.folder.findFirst({
        where: { vehicle_id: vehicleId },
      });

      if (existingFolder) {
        throw new Error("Un dossier existe déjà pour ce véhicule.");
      }
      const folder = await prisma.folder.create({
        data: {
          user_id: userId,
          status: FolderStatus.active,
          vehicle_id: vehicleId,
        },
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
    updateFolderStatus: async (id: number, status: FolderStatus) => {
      return prisma.folder.update({
        where: { id },
        data: { status },
      });
    },
  };
};
