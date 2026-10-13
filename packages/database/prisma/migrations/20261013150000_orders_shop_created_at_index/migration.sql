-- Danh sách đơn của shop ở dashboard (mới nhất trước, phân trang)
CREATE INDEX "orders_shopId_createdAt_idx" ON "orders"("shopId", "createdAt");
