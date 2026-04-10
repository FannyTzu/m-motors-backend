/*
  Warnings:

  - Added the required column `price_at_order` to the `OrderOption` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "OrderOption" ADD COLUMN     "price_at_order" DECIMAL(12,2) NOT NULL;
