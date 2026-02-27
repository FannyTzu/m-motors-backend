/*
  Warnings:

  - You are about to drop the column `bucket_type` on the `Document` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Document" DROP COLUMN "bucket_type";

-- DropEnum
DROP TYPE "BucketType";
