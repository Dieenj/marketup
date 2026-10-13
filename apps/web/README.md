# MarketUp Web

Frontend của MarketUp, viết bằng Next.js 16, gồm ba phần trong cùng một app:

- **Dashboard người bán**: `/dashboard`, `/products`, `/categories`, `/orders`, `/reviews`, `/settings`
- **Storefront**: `/shop/<slug>`, trang sản phẩm, checkout (render phía server)
- **Trang đơn của người mua**: `/shop/<slug>/orders`, đăng nhập bằng mã email hoặc mở bằng link trong email

```bash
pnpm dev     # http://localhost:3000
pnpm build
```

Mặc định web gọi API tại `http://localhost:3001/api`; đổi bằng `NEXT_PUBLIC_API_URL`.

Tài liệu chi tiết:

- [Kiến trúc frontend](../../docs/architecture.md#3-frontend-appsweb): nhóm route, SSR, state, ảnh, Capacitor
- [Đặc tả sản phẩm](../../docs/product-spec.md)
