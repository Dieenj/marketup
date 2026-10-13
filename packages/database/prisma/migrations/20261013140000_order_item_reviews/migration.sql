-- Đánh giá cũ không gắn với sản phẩm trong đơn → bỏ (chưa có người dùng thật; dữ liệu mẫu tạo lại bằng seed)
DELETE FROM "reviews";

-- AlterTable
ALTER TABLE "reviews" DROP COLUMN "buyerEmail",
DROP COLUMN "isVerified",
DROP COLUMN "status",
ADD COLUMN     "editedAt" TIMESTAMP(3),
ADD COLUMN     "orderItemId" TEXT NOT NULL,
ADD COLUMN     "sellerRepliedAt" TIMESTAMP(3),
ALTER COLUMN "productId" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "reviews_orderItemId_key" ON "reviews"("orderItemId");

-- CreateIndex
CREATE INDEX "reviews_productId_createdAt_idx" ON "reviews"("productId", "createdAt");

-- CreateIndex
CREATE INDEX "reviews_shopId_createdAt_idx" ON "reviews"("shopId", "createdAt");

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_orderItemId_fkey" FOREIGN KEY ("orderItemId") REFERENCES "order_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

