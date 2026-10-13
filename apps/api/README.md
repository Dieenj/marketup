# MarketUp API

REST API của MarketUp, viết bằng NestJS 11 và Prisma, phục vụ dashboard người bán, storefront và trang đơn của người mua.

```bash
pnpm dev          # watch mode, http://localhost:3001/api
pnpm build        # biên dịch ra dist/
pnpm start:prod   # chạy bản build
pnpm test         # unit test (*.spec.ts)
```

API đọc biến môi trường từ file `.env` ở thư mục gốc của monorepo và dừng ngay nếu `JWT_SECRET` thiếu hoặc ngắn hơn 32 ký tự.

Tài liệu chi tiết:

- [Kiến trúc backend](../../docs/architecture.md#4-backend-appsapi): module, token, phân quyền, giới hạn tần suất
- [Danh sách endpoint](../../docs/api-reference.md)
- [Biến môi trường](../../docs/development.md#3-biến-môi-trường)
