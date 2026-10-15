-- isDefault chỉ do seed ghi, không nơi nào đọc; sản phẩm tạo qua API không bao giờ có biến thể mặc định
ALTER TABLE "product_variants" DROP COLUMN "isDefault";
