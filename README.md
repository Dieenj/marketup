# MarketUp

**MarketUp** giúp bất kỳ ai mở một cửa hàng trực tuyến riêng trong vài phút. Người bán quản lý sản phẩm, đơn hàng và đánh giá trên dashboard; người mua đặt hàng tại storefront `/shop/<slug>` của shop mà không cần tạo tài khoản, thanh toán khi nhận hàng (COD).

MarketUp hướng tới mô hình **Shopify cho người bán nhỏ**: mỗi shop là một cửa hàng độc lập mang thương hiệu riêng, không phải một sàn gom nhiều shop ([định hướng sản phẩm](docs/product-spec.md#định-hướng-sản-phẩm)).

**Demo:** https://marketup-dien.vercel.app. Đăng nhập người bán bằng `alice@lumiere.store` / `password123`, hoặc xem storefront mẫu tại [/shop/lumiere](https://marketup-dien.vercel.app/shop/lumiere).

## Tính năng

**Người bán**

- Tạo shop với slug, logo, banner, màu chủ đạo, thông tin liên hệ
- Sản phẩm có thuộc tính, biến thể (giá, giá gạch, tồn kho, SKU), nhiều ảnh, danh mục, ẩn/hiện
- Xử lý đơn theo từng bước: xác nhận → xử lý → giao → đã giao; huỷ đơn kèm lý do
- Xem và trả lời đánh giá, lọc theo sao hoặc "cần trả lời"
- Dashboard: doanh thu, số đơn, đơn chờ xác nhận, biểu đồ doanh thu 7 ngày

**Người mua**

- Storefront render phía server, có ảnh xem trước khi chia sẻ link
- Giỏ hàng, checkout COD, email xác nhận kèm link xem đơn
- Đăng nhập không mật khẩu bằng mã 6 số gửi qua email để xem mọi đơn trên mọi thiết bị
- Tự huỷ đơn khi shop chưa xác nhận
- Đánh giá sản phẩm đã nhận trong 30 ngày (sửa được một lần), tên hiển thị được che

**Hệ thống**

- Trừ kho nguyên tử, cập nhật trạng thái đơn có điều kiện để chống bán quá tồn kho và xung đột
- Token tách loại (người bán / người mua / link đơn), giới hạn tần suất theo IP, kiểm tra env khi khởi động
- Email tự động khi đặt hàng, giao hàng, đã giao, huỷ đơn
- App Android/iOS qua Capacitor (WebView của bản web)

## Công nghệ

| Lớp      | Công nghệ                                                                |
| -------- | ------------------------------------------------------------------------ |
| Frontend | Next.js 16, React 19, Tailwind CSS 4, shadcn/ui, TanStack Query, Zustand |
| Backend  | NestJS 11, Prisma 6, Passport JWT, class-validator, Nodemailer           |
| Dữ liệu  | PostgreSQL, Cloudinary (ảnh)                                             |
| Hạ tầng  | Vercel (web), Render (API), Supabase (DB), GitHub Actions (CI)           |
| Monorepo | pnpm workspaces, Turborepo                                               |

## Cấu trúc

```
marketup/
├── apps/
│   ├── web/          # Next.js: dashboard + storefront + trang đơn người mua
│   └── api/          # NestJS REST API
├── packages/
│   └── database/     # Prisma schema, migrations, seed
└── docs/             # Tài liệu chi tiết
```

## Chạy nhanh

Cần Node.js 20+, pnpm 9 và Docker.

```bash
pnpm install
cp .env.example .env        # điền JWT_SECRET (≥ 32 ký tự) và các biến cần thiết
docker compose up -d        # PostgreSQL local
pnpm run db:migrate
pnpm --filter @marketup/database db:seed   # dữ liệu mẫu, xoá dữ liệu cũ
pnpm dev                    # web http://localhost:3000, API http://localhost:3001/api
```

Hướng dẫn đầy đủ, ý nghĩa từng biến môi trường và các lỗi hay gặp: [docs/development.md](docs/development.md).

## Tài liệu

| Tài liệu                                | Nội dung                                                                                      |
| --------------------------------------- | --------------------------------------------------------------------------------------------- |
| [Đặc tả sản phẩm](docs/product-spec.md) | Vai trò, tính năng, luật nghiệp vụ: đặt hàng, tồn kho, huỷ đơn, đánh giá, đăng nhập người mua |
| [Kiến trúc](docs/architecture.md)       | Frontend (SSR, state, ảnh, Capacitor), backend (module, token, bảo mật, chạy đồng thời)       |
| [Mô hình dữ liệu](docs/data-model.md)   | Bảng, enum, quan hệ, cách thay đổi schema                                                     |
| [API](docs/api-reference.md)            | Endpoint, quyền truy cập, mã lỗi                                                              |
| [Phát triển local](docs/development.md) | Cài đặt, biến môi trường, seed, kiểm tra code, lỗi hay gặp                                    |
| [Triển khai](docs/deployment.md)        | Vercel, Render, Supabase, migration production, CI, Docker                                    |

Khi đổi luật nghiệp vụ, endpoint hoặc schema, cập nhật tài liệu tương ứng trong cùng commit.

## Lệnh thường dùng

| Lệnh                            | Mô tả                            |
| ------------------------------- | -------------------------------- |
| `pnpm dev`                      | Chạy web + API (hot reload)      |
| `pnpm build`                    | Build toàn bộ                    |
| `pnpm lint` / `pnpm type-check` | ESLint / TypeScript              |
| `pnpm test`                     | Unit test của API                |
| `pnpm run db:migrate`           | Tạo và áp dụng migration ở local |
| `pnpm run db:studio`            | Mở Prisma Studio                 |
