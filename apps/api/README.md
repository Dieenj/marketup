# MarketUp Backend — NestJS REST API

Ứng dụng Backend của **MarketUp** được phát triển trên nền tảng **NestJS**, sử dụng **Prisma ORM** để tương tác với cơ sở dữ liệu **PostgreSQL**. Dự án cung cấp toàn bộ các RESTful API phục vụ cho cả trang quản trị của người bán (Dashboard) lẫn cửa hàng mua sắm công khai của khách hàng (Storefront).

---

## Cấu trúc Module

Backend được chia nhỏ thành các module rõ ràng theo chức năng:

- **`AuthModule`**: Quản lý đăng ký, đăng nhập và phân quyền của chủ shop (Seller) sử dụng JWT. Mọi token có trường `typ` (seller / buyer / order) nên token người mua không mở được dashboard.
- **`BuyerAuthModule`**: Người mua đăng nhập bằng mã 6 số gửi qua email (băm HMAC, hết hạn 10 phút, tối đa 5 lần thử, giới hạn gửi theo email và IP).
- **`ShopModule`**: Xử lý thông tin cửa hàng, slug định danh độc nhất, cấu hình và trạng thái của shop.
- **`ProductModule`**: CRUD sản phẩm, quản lý tồn kho và thông số các biến thể (Product Variants).
- **`CategoryModule`**: Quản lý các danh mục sản phẩm theo từng shop.
- **`OrderModule`**: Tạo đơn (trừ kho nguyên tử), cập nhật trạng thái, huỷ đơn có lý do kiểu Shopee, API phía người mua (`/buyer/orders`) dùng phiên đăng nhập hoặc link của đơn.
- **`ReviewModule`**: Đánh giá kiểu Shopee: chỉ từ sản phẩm trong đơn đã giao, mỗi sản phẩm một đánh giá, trong 30 ngày, sửa được một lần, tên hiển thị được che. Shop chỉ trả lời, không ẩn/xoá.
- **`MailModule`**: Hệ thống xử lý gửi email tự động được xây dựng trên **Nodemailer**, hỗ trợ gửi email HTML chuẩn SEO/Aesthetics cực đẹp.
- **`DashboardModule`**: Cung cấp số liệu thống kê tổng hợp (doanh thu, biểu đồ doanh thu 7 ngày theo giờ Việt Nam, đơn gần đây) cho người bán.
- **`UploadModule`**: Tiếp nhận và đẩy ảnh trực tiếp lên **Cloudinary Cloud Storage**.
- **`PrismaModule`**: Cung cấp kết nối prisma client chia sẻ dùng chung trong toàn bộ hệ thống.

---

## Biến môi trường bắt buộc (.env)

Tạo file `.env` bên trong thư mục `apps/api` (hoặc ở thư mục gốc của Monorepo) với các khóa sau:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/marketup"
JWT_SECRET="your-jwt-secret-key"
JWT_EXPIRES_IN="7d"

# Cấu hình Lưu trữ ảnh Cloudinary
CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"

# Cấu hình SMTP Email (Gmail App Password)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-16-char-app-password"
SMTP_FROM="MarketUp <your-email@gmail.com>"
FRONTEND_URL="http://localhost:3000"
```

> [!NOTE]
> **Dev-Safe Mode:** Nếu không cấu hình các biến `SMTP_*`, hệ thống sẽ tự động chuyển sang chế độ **Mock/Log mode**. Nội dung HTML của email sẽ được in trực tiếp ra terminal console thay vì gửi thực tế, giúp lập trình viên không bị lỗi ngắt quãng trong quá trình phát triển (development).

---

## Cài đặt và Chạy cục bộ

Di chuyển đến thư mục api hoặc chạy trực tiếp từ root monorepo:

### Khởi chạy chế độ Development (Watch mode)

```bash
pnpm run start:dev
```

### Build sản phẩm Production

```bash
pnpm run build
```

### Chạy Production Mode

```bash
pnpm run start:prod
```

---

## Lệnh Chạy Test

Hệ thống có sẵn các kịch bản kiểm thử:

```bash
# Chạy Unit Tests
pnpm run test

# Chạy End-to-End (E2E) Tests
pnpm run test:e2e

# Kiểm tra độ bao phủ kiểm thử (Test Coverage)
pnpm run test:cov
```
