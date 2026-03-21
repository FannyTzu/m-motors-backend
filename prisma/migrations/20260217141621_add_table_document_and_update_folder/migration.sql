/*
  Warnings:

  - You are about to drop the column `vehicles_id` on the `Order` table. All the data in the column will be lost.
  - Added the required column `vehicle_id` to the `Folder` table without a default value. This is not possible if the table is not empty.
  - Added the required column `vehicle_id` to the `Order` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "FolderStatus" ADD VALUE 'submitted';
ALTER TYPE "FolderStatus" ADD VALUE 'accepted';
ALTER TYPE "FolderStatus" ADD VALUE 'rejected';
ALTER TYPE "FolderStatus" ADD VALUE 'cancelled';

-- DropForeignKey
ALTER TABLE "Order" DROP CONSTRAINT "Order_vehicles_id_fkey";

-- AlterTable
ALTER TABLE "Folder" ADD COLUMN     "vehicle_id" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "Order" DROP COLUMN "vehicles_id",
ADD COLUMN     "vehicle_id" INTEGER NOT NULL;

-- CreateTable
CREATE TABLE "Document" (
    "id" SERIAL NOT NULL,
    "folder_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "type" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Folder" ADD CONSTRAINT "Folder_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "Vehicle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "Vehicle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_folder_id_fkey" FOREIGN KEY ("folder_id") REFERENCES "Folder"("id") ON DELETE CASCADE ON UPDATE CASCADE;
