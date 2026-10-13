# Phát triển local

## 1. Yêu cầu

- Node.js 20+
- pnpm 9 (phiên bản cố định trong trường `packageManager`; có thể chạy qua `corepack pnpm`)
- Docker, để chạy PostgreSQL local (hoặc tự cài PostgreSQL 16)

## 2. Cài đặt

```bash
pnpm install                 # postinstall tự chạy prisma generate
cp .env.example .env         # rồi điền giá trị, xem mục 3
docker compose up -d         # PostgreSQL :5432 + Adminer :8080
pnpm run db:migrate          # áp dụng migrations vào DB local
pnpm --filter @marketup/database db:seed   # dữ liệu mẫu (xoá sạch dữ liệu cũ!)
pnpm dev                     # web :3000 + api :3001
```

- Web: http://localhost:3000
- API: http://localhost:3001/api
- Adminer (xem DB): http://localhost:8080, server `postgres`, user `postgres`, mật khẩu `password`

Chạy riêng từng app: `pnpm dev:web`, `pnpm dev:api`.

## 3. Biến môi trường

Mọi biến nằm trong một file `.env` ở thư mục gốc. API và các script Prisma đọc file này; web không cần biến nào khi chạy local.

### API

| Biến                                                                   | Bắt buộc      | Ý nghĩa                                                                                                                                     |
| ---------------------------------------------------------------------- | ------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `DATABASE_URL`                                                         | Có            | Chuỗi kết nối PostgreSQL mà API dùng                                                                                                        |
| `DIRECT_URL`                                                           | Có            | Kết nối trực tiếp cho Prisma migrate; ở local đặt giống `DATABASE_URL`                                                                      |
| `JWT_SECRET`                                                           | Có            | ≥ 32 ký tự ngẫu nhiên, nếu không API không khởi động. Tạo: `node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"` |
| `JWT_EXPIRES_IN`                                                       |               | Hạn token người bán, mặc định `7d`                                                                                                          |
| `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | Để upload ảnh | Tài khoản Cloudinary. `CLOUDINARY_CLOUD_NAME` cũng quyết định URL logo/banner nào hợp lệ                                                    |
| `CLOUDINARY_FOLDER`                                                    |               | Thư mục lưu ảnh, mặc định `marketup`; nên đặt khác cho dev, ví dụ `marketup-dev`                                                            |
| `BREVO_API_KEY`                                                        | Để gửi mail   | Gửi qua API HTTPS của Brevo (dùng trên production). Được ưu tiên hơn SMTP                                                                   |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`                     | Để gửi mail   | Gửi qua SMTP khi không có `BREVO_API_KEY`. Không có cả hai thì API chạy chế độ mock (in email ra log)                                       |
| `SMTP_FROM`                                                            |               | Người gửi, dùng cho cả Brevo và SMTP                                                                                                        |
| `FRONTEND_URL`                                                         |               | Origin của web: dùng cho link trong email và CORS. Mặc định `http://localhost:3000`                                                         |
| `NEXT_PUBLIC_APP_URL`                                                  |               | Origin thứ hai được phép CORS (web cũng dùng làm URL gốc cho metadata)                                                                      |
| `API_PORT` / `PORT`                                                    |               | Cổng API, mặc định 3001 (`PORT` do Render cấp, được ưu tiên)                                                                                |
| `TRUST_PROXY_HOPS`                                                     |               | Số proxy đứng trước API; local để `0`                                                                                                       |
| `RATE_LIMIT_DISABLED`                                                  |               | `true` tắt giới hạn tần suất, **chỉ** khi chạy test tự động ở local                                                                         |

### Web

| Biến                  | Ý nghĩa                                                                                                                 |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_API_URL` | URL của API, có hoặc không có hậu tố `/api`. Mặc định `http://localhost:3001/api`. Được nhúng lúc build và dùng cho CSP |
| `NEXT_PUBLIC_APP_URL` | URL gốc cho metadata/Open Graph. Trên Vercel tự lấy từ `VERCEL_PROJECT_PRODUCTION_URL` nếu không đặt                    |

Các biến `STRIPE_*` trong `.env.example` chưa được code dùng đến.

Không bao giờ commit `.env` (đã có trong `.gitignore`).

## 4. Dữ liệu mẫu

`pnpm --filter @marketup/database db:seed` **xoá toàn bộ dữ liệu** rồi tạo lại. Trước khi chạy, kiểm tra `DATABASE_URL` trong `.env` đang trỏ tới DB local.

Seed tạo:

| Tài khoản (mật khẩu `password123`) | Shop                                     |
| ---------------------------------- | ---------------------------------------- |
| `alice@lumiere.store`              | Lumière (thời trang): `/shop/lumiere`    |
| `ben@volttech.shop`                | Volt Tech (đồ điện tử): `/shop/volttech` |

Cùng với danh mục, sản phẩm có biến thể (ảnh từ Unsplash), đơn hàng ở mọi trạng thái (gồm một đơn bị huỷ có lý do), và đánh giá. Mỗi đánh giá gắn với một đơn đã giao; một số đánh giá đã có shop trả lời.

## 5. Thử luồng người mua ở local

- Chưa cấu hình cách gửi (`BREVO_API_KEY` hoặc SMTP) thì email được in ra log của API. Khi có cấu hình, lúc khởi động API ghi `Email transport ready: …` hoặc lỗi cụ thể (key sai, cổng SMTP bị chặn…).
- Mã đăng nhập người mua được in thành dòng `[DEV] Login code for <email>: 123456`, chỉ khi `NODE_ENV` khác `production`.
- Link xem đơn (`?t=…`) có trong nội dung email được in ra log, hoặc lấy từ trang "đặt hàng thành công" ngay sau khi đặt.

## 6. Kiểm tra code

| Lệnh                                                             | Việc                                     |
| ---------------------------------------------------------------- | ---------------------------------------- |
| `pnpm lint`                                                      | ESLint cho cả hai app                    |
| `pnpm type-check`                                                | TypeScript (web chạy kèm `next typegen`) |
| `pnpm test`                                                      | Unit test Jest của API (`*.spec.ts`)     |
| `pnpm build`                                                     | Build toàn bộ                            |
| `pnpm exec prettier --check "**/*.{ts,tsx,js,jsx,json,md,yaml}"` | Kiểm tra format giống CI                 |

CI chạy đúng các bước này, nên chạy chúng trước khi push. Unit test tập trung vào phần luật nghiệp vụ thuần: chuyển trạng thái đơn, hạn đánh giá, che tên, mã đơn, mã đăng nhập, doanh thu theo ngày VN, URL Cloudinary, kiểm tra env.

## 7. Lỗi hay gặp

| Triệu chứng                                                                            | Nguyên nhân và cách xử lý                                                                                              |
| -------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| API dừng ngay với `Invalid environment configuration`                                  | `JWT_SECRET` thiếu, ngắn hơn 32 ký tự hoặc là chuỗi mẫu; hoặc thiếu `DATABASE_URL`                                     |
| Windows: mỗi truy vấn chậm ~2 giây, transaction lỗi `P2028`                            | `localhost` thử IPv6 trước trong khi Docker Postgres chỉ nghe IPv4. Dùng `127.0.0.1` trong `DATABASE_URL`/`DIRECT_URL` |
| `prisma generate` lỗi `EPERM`                                                          | API đang chạy và giữ file engine của Prisma. Dừng API rồi chạy lại                                                     |
| Windows: Prettier báo gần như mọi file sai format                                      | Git checkout file với CRLF. Thêm `--end-of-line auto` khi chạy ở local; đừng `--write` khi thiếu cờ này                |
| Cổng 5432 đã bị chiếm                                                                  | Đổi cổng bên trái trong `docker-compose.yml` (ví dụ `"5433:5432"`) và sửa `.env` theo                                  |
| Sau khi đổi `JWT_SECRET`, người bán bị đăng xuất / trang đơn báo link không còn hợp lệ | Mọi token cũ (người bán, người mua, link đơn) hết hiệu lực khi đổi secret. Đây là hành vi đúng                         |
| Bị 429 khi chạy script test bắn nhiều request                                          | Chạy API với `RATE_LIMIT_DISABLED=true` (chỉ ở local)                                                                  |
