/*
  Warnings:

  - You are about to drop the column `contractAddress` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `contractBalance` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `contractCreatedAt` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `contractFarmerId` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `contractRegistrationTx` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `hederaAccountId` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `isContractFarmer` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `walletAddress` on the `User` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "public"."User_contractAddress_key";

-- DropIndex
DROP INDEX "public"."User_contractFarmerId_key";

-- DropIndex
DROP INDEX "public"."User_hederaAccountId_key";

-- DropIndex
DROP INDEX "public"."User_walletAddress_key";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "contractAddress",
DROP COLUMN "contractBalance",
DROP COLUMN "contractCreatedAt",
DROP COLUMN "contractFarmerId",
DROP COLUMN "contractRegistrationTx",
DROP COLUMN "hederaAccountId",
DROP COLUMN "isContractFarmer",
DROP COLUMN "walletAddress";
