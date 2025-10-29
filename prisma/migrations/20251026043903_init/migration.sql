/*
  Warnings:

  - You are about to drop the column `hederaEscrow` on the `Order` table. All the data in the column will be lost.
  - You are about to drop the `AgroVetProduct` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `EquipmentLease` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `EscrowTransaction` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ExpertAdvice` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `HealthRecord` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Message` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `NFT` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `NFTListing` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `NFTTransaction` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `QualityCheck` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ServiceBooking` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `SupplyChainStep` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[transactionHash,logIndex]` on the table `ContractEvent` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[walletAddress]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[hederaAccountId]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - Changed the type of `status` on the `TrackingUpdate` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Made the column `contractBalance` on table `User` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterEnum
ALTER TYPE "DeliveryStatus" ADD VALUE 'CANCELLED';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "ProfileType" ADD VALUE 'VETERINARIAN';
ALTER TYPE "ProfileType" ADD VALUE 'ADMIN';

-- AlterEnum
ALTER TYPE "Role" ADD VALUE 'VETERINARIAN';

-- DropForeignKey
ALTER TABLE "public"."AgroVetProduct" DROP CONSTRAINT "AgroVetProduct_agroVetId_fkey";

-- DropForeignKey
ALTER TABLE "public"."EquipmentLease" DROP CONSTRAINT "EquipmentLease_agroVetId_fkey";

-- DropForeignKey
ALTER TABLE "public"."EquipmentLease" DROP CONSTRAINT "EquipmentLease_clientId_fkey";

-- DropForeignKey
ALTER TABLE "public"."ExpertAdvice" DROP CONSTRAINT "ExpertAdvice_agroVetId_fkey";

-- DropForeignKey
ALTER TABLE "public"."ExpertAdvice" DROP CONSTRAINT "ExpertAdvice_clientId_fkey";

-- DropForeignKey
ALTER TABLE "public"."HealthRecord" DROP CONSTRAINT "HealthRecord_agroVetId_fkey";

-- DropForeignKey
ALTER TABLE "public"."HealthRecord" DROP CONSTRAINT "HealthRecord_animalOwnerId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Message" DROP CONSTRAINT "Message_orderId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Message" DROP CONSTRAINT "Message_recipientId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Message" DROP CONSTRAINT "Message_senderId_fkey";

-- DropForeignKey
ALTER TABLE "public"."NFTListing" DROP CONSTRAINT "NFTListing_nftId_fkey";

-- DropForeignKey
ALTER TABLE "public"."NFTTransaction" DROP CONSTRAINT "NFTTransaction_nftId_fkey";

-- DropForeignKey
ALTER TABLE "public"."QualityCheck" DROP CONSTRAINT "QualityCheck_nftId_fkey";

-- DropForeignKey
ALTER TABLE "public"."ServiceBooking" DROP CONSTRAINT "ServiceBooking_agroVetId_fkey";

-- DropForeignKey
ALTER TABLE "public"."ServiceBooking" DROP CONSTRAINT "ServiceBooking_clientId_fkey";

-- DropForeignKey
ALTER TABLE "public"."SupplyChainStep" DROP CONSTRAINT "SupplyChainStep_nftId_fkey";

-- DropIndex
DROP INDEX "public"."ContractEvent_transactionHash_key";

-- AlterTable
ALTER TABLE "Listing" ADD COLUMN     "certifications" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "contractMetadata" JSONB,
ALTER COLUMN "quantity" SET DATA TYPE DOUBLE PRECISION,
ALTER COLUMN "images" SET DEFAULT ARRAY[]::TEXT[],
ALTER COLUMN "contractPrice" SET DATA TYPE DECIMAL(65,30);

-- AlterTable
ALTER TABLE "Order" DROP COLUMN "hederaEscrow",
ALTER COLUMN "contractAmount" SET DATA TYPE DECIMAL(65,30),
ALTER COLUMN "deliveryProof" SET DEFAULT ARRAY[]::TEXT[];

-- AlterTable
ALTER TABLE "Profile" ADD COLUMN     "metadata" JSONB,
ALTER COLUMN "country" SET DEFAULT '',
ALTER COLUMN "address" SET DEFAULT '',
ALTER COLUMN "phone" SET DEFAULT '',
ALTER COLUMN "idNumber" SET DEFAULT '',
ALTER COLUMN "hederaWallet" SET DEFAULT '';

-- AlterTable
ALTER TABLE "TrackingUpdate" ADD COLUMN     "metadata" JSONB,
DROP COLUMN "status",
ADD COLUMN     "status" "DeliveryStatus" NOT NULL;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "contractRegistrationTx" TEXT,
ADD COLUMN     "hederaAccountId" TEXT,
ADD COLUMN     "metadata" JSONB,
ADD COLUMN     "walletAddress" TEXT,
ALTER COLUMN "role" SET DEFAULT 'BUYER',
ALTER COLUMN "contractBalance" SET NOT NULL,
ALTER COLUMN "contractBalance" SET DEFAULT 0,
ALTER COLUMN "contractBalance" SET DATA TYPE DECIMAL(65,30);

-- DropTable
DROP TABLE "public"."AgroVetProduct";

-- DropTable
DROP TABLE "public"."EquipmentLease";

-- DropTable
DROP TABLE "public"."EscrowTransaction";

-- DropTable
DROP TABLE "public"."ExpertAdvice";

-- DropTable
DROP TABLE "public"."HealthRecord";

-- DropTable
DROP TABLE "public"."Message";

-- DropTable
DROP TABLE "public"."NFT";

-- DropTable
DROP TABLE "public"."NFTListing";

-- DropTable
DROP TABLE "public"."NFTTransaction";

-- DropTable
DROP TABLE "public"."QualityCheck";

-- DropTable
DROP TABLE "public"."ServiceBooking";

-- DropTable
DROP TABLE "public"."SupplyChainStep";

-- DropEnum
DROP TYPE "public"."BookingStatus";

-- DropEnum
DROP TYPE "public"."LeaseStatus";

-- DropEnum
DROP TYPE "public"."MessageType";

-- CreateIndex
CREATE INDEX "ContractEvent_eventType_idx" ON "ContractEvent"("eventType");

-- CreateIndex
CREATE INDEX "ContractEvent_processed_idx" ON "ContractEvent"("processed");

-- CreateIndex
CREATE UNIQUE INDEX "ContractEvent_transactionHash_logIndex_key" ON "ContractEvent"("transactionHash", "logIndex");

-- CreateIndex
CREATE UNIQUE INDEX "User_walletAddress_key" ON "User"("walletAddress");

-- CreateIndex
CREATE UNIQUE INDEX "User_hederaAccountId_key" ON "User"("hederaAccountId");
