# MarketUp — Nền tảng Cửa hàng Cá nhân (SaaS)

**MarketUp** là một nền tảng monorepo cho phép bất kỳ ai tạo cửa hàng trực tuyến của riêng mình chỉ trong vài phút. Người bán có dashboard quản lý sản phẩm, danh mục, đơn hàng và đánh giá khách hàng; khách hàng có thể duyệt, đặt hàng và để lại phản hồi (review) qua trang storefront công khai theo slug riêng của mỗi shop.

---

## Công nghệ sử dụng

| Lớp | Công nghệ |
|---|---|
| Monorepo | Turborepo + pnpm |
| Frontend | Next.js 15, Tailwind CSS 4, shadcn/ui |
| State Management | TanStack Query (server state), Zustand (client state) |
| Backend | NestJS, Prisma ORM, Passport.js (JWT) |
| Cơ sở dữ liệu | PostgreSQL |
| Lưu trữ ảnh | Cloudinary |
| Biểu đồ | Recharts |
| SMTP Mail | Nodemailer |

---

## Cấu trúc dự án

```
marketup/
├── apps/
│   ├── web/          # Frontend Next.js (Dashboard + Storefront)
│   └── api/          # Backend NestJS REST API
└── packages/
    └── database/     # Prisma client & schema dùng chung
```

### Các module API chính

- **auth** — Đăng ký, đăng nhập, JWT
- **shop** — Tạo và quản lý shop
- **product** — CRUD sản phẩm, quản lý biến thể (variants), upload ảnh Cloudinary
- **category** — Danh mục sản phẩm
- **order** — Đặt hàng, cập nhật trạng thái đơn (COD, Stripe)
- **review** — Đánh giá cửa hàng và sản phẩm (tích hợp check mua hàng thật `Verified Purchase`)
- **mail** — Hệ thống email tự động gửi hóa đơn COD khi đặt hàng, thông báo khi vận chuyển và giao hàng (CTA Đánh giá)
- **dashboard** — Thống kê doanh thu, đơn hàng
- **upload** — Xử lý upload file qua Cloudinary

### Các trang Frontend chính

| Đường dẫn | Mô tả |
|---|---|
| `/register`, `/login` | Xác thực người dùng |
| `/setup` | Tạo shop lần đầu |
| `/dashboard` | Tổng quan doanh thu, đơn hàng gần đây |
| `/products` | Quản lý sản phẩm & biến thể |
| `/categories` | Quản lý danh mục |
| `/orders` | Quản lý & cập nhật trạng thái đơn hàng |
| `/reviews` | Quản lý & duyệt đánh giá sản phẩm / dịch vụ shop |
| `/settings` | Cài đặt tài khoản |
| `/shop/[slug]` | Storefront công khai của shop (kèm Đánh giá chung dịch vụ) |
| `/shop/[slug]/products/[id]` | Chi tiết sản phẩm & xem danh sách đánh giá từ khách hàng |
| `/shop/[slug]/checkout` | Giỏ hàng và Thanh toán COD |

---

## Bắt đầu

### Yêu cầu

- Node.js 20+
- pnpm 9+
- Docker (tuỳ chọn, để chạy PostgreSQL local)

### Cài đặt môi trường

1. **Clone và cài dependencies:**
   ```bash
   git clone <repo-url>
   cd marketup
   pnpm install
   ```

2. **Tạo file biến môi trường** tại thư mục gốc `.env`:
   ```env
   # ---- Database ----
   DATABASE_URL="postgresql://postgres:2203@localhost:5432/marketup"

   # ---- JWT ----
   JWT_SECRET="your-super-secret-jwt-key"
   JWT_EXPIRES_IN="7d"

   # ---- Cloudinary ----
   CLOUDINARY_CLOUD_NAME="your-cloudinary-name"
   CLOUDINARY_API_KEY="your-api-key"
   CLOUDINARY_API_SECRET="your-api-secret"

   # ---- SMTP Mail Configuration (Gmail App Password) ----
   SMTP_HOST="smtp.gmail.com"
   SMTP_PORT=587
   SMTP_USER="your-email@gmail.com"
   SMTP_PASS="your-gmail-app-password"
   SMTP_FROM="MarketUp <your-email@gmail.com>"
   FRONTEND_URL="http://localhost:3000"
   ```

3. **Khởi động PostgreSQL (Docker):**
   ```bash
   docker-compose up -d
   ```

4. **Tạo Prisma client và chạy migration:**
   ```bash
   pnpm run db:generate
   pnpm run db:migrate
   ```

5. **Chạy toàn bộ dự án ở chế độ development:**
   ```bash
   pnpm run dev
   ```
   - Storefront & Dashboard: `http://localhost:3000`
   - Backend API: `http://localhost:3001/api`

---

## Luồng sử dụng chính

1. **Người bán đăng ký** → Tạo tài khoản tại `/register`
2. **Tạo shop** → Điền tên, slug, mô tả tại `/setup`
3. **Quản lý sản phẩm** → Thêm sản phẩm kèm ảnh, giá, biến thể và tồn kho tại `/products`
4. **Chia sẻ storefront** → Gửi link `/shop/[slug]` cho khách hàng mua sắm
5. **Khách hàng đặt hàng** → Duyệt sản phẩm, thêm vào giỏ, checkout và nhận **Email Xác Nhận Hóa Đơn (COD)**
6. **Người bán xử lý** → Nhận thông tin, đổi trạng thái sang "Shipping" (**Khách nhận Email đang giao hàng**)
7. **Giao hàng thành công** → Đổi sang "Delivered" (**Khách nhận Email chúc mừng kèm link viết đánh giá**)
8. **Viết Đánh Gia** → Khách hàng phản hồi chất lượng. Người bán quản lý và trả lời đánh giá tại `/reviews`

---

## Các script chính hữu ích

| Lệnh | Mô tả |
|---|---|
| `pnpm dev` | Chạy đồng thời cả Frontend và Backend (Hot-reload) |
| `pnpm build` | Biên dịch toàn bộ các ứng dụng trong monorepo |
| `pnpm run db:generate` | Tạo lại Prisma client từ schema chung |
| `pnpm run db:migrate` | Chạy migration đẩy cấu trúc schema lên database |
| `pnpm run db:studio` | Mở giao diện Prisma Studio để quản lý bản ghi database trực quan |
