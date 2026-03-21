-- CreateEnum
CREATE TYPE "BucketType" AS ENUM ('documents', 'vehicles');

-- AlterTable
ALTER TABLE "Document" ADD COLUMN     "bucket_type" "BucketType" NOT NULL DEFAULT 'documents';
