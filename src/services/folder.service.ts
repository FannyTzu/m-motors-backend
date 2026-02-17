import { PrismaClient, FolderStatus } from "@prisma/client";

export const folderService = (prisma: PrismaClient) => {
  return {
    createFolder: async (userId: number, vehicleId: number) => {
      const folder = await prisma.folder.create({
        data: {
          user_id: userId,
          status: FolderStatus.active,
          vehicle_id: vehicleId,
        },
      });
      return folder;
    },
    getFoldersByUser: async (userId: number) => {
      return prisma.folder.findMany({
        where: { user_id: userId },
        include: { orders: true },
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
