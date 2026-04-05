/*
  Warnings:

  - You are about to drop the `CaseOptions` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "CaseOptions" DROP CONSTRAINT "CaseOptions_option_id_fkey";

-- DropForeignKey
ALTER TABLE "CaseOptions" DROP CONSTRAINT "CaseOptions_order_id_fkey";

-- DropTable
DROP TABLE "CaseOptions";
