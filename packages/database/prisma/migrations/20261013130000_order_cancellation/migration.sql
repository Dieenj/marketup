-- CreateEnum
CREATE TYPE "CancelActor" AS ENUM ('BUYER', 'SELLER');

-- CreateEnum
CREATE TYPE "CancelReason" AS ENUM ('CHANGED_MIND', 'WRONG_DETAILS', 'FOUND_BETTER_PRICE', 'OUT_OF_STOCK', 'BUYER_UNREACHABLE', 'DELIVERY_FAILED', 'OTHER');

-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "cancelNote" TEXT,
ADD COLUMN     "cancelReason" "CancelReason",
ADD COLUMN     "cancelledAt" TIMESTAMP(3),
ADD COLUMN     "cancelledBy" "CancelActor";

