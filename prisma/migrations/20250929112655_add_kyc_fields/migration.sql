/*
  Warnings:

  - Added the required column `address` to the `Profile` table without a default value. This is not possible if the table is not empty.
  - Added the required column `country` to the `Profile` table without a default value. This is not possible if the table is not empty.
  - Added the required column `hederaWallet` to the `Profile` table without a default value. This is not possible if the table is not empty.
  - Added the required column `idNumber` to the `Profile` table without a default value. This is not possible if the table is not empty.
  - Added the required column `phone` to the `Profile` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Profile" ADD COLUMN     "address" TEXT NOT NULL,
ADD COLUMN     "country" TEXT NOT NULL,
ADD COLUMN     "hederaWallet" TEXT NOT NULL,
ADD COLUMN     "idNumber" TEXT NOT NULL,
ADD COLUMN     "phone" TEXT NOT NULL;
