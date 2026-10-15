# API

- Base URL: `http://localhost:3001/api` khi chạy local; production là `https://<api-host>/api`.
- Body dạng JSON, riêng tạo/sửa sản phẩm và upload ảnh dùng `multipart/form-data`.
- Xác thực bằng header `Authorization: Bearer <token>`. Các loại token xem ở [Kiến trúc § Token](architecture.md#42-token-và-phân-quyền).

Ký hiệu cột **Quyền**:

- `—`: công khai
- `seller`: token người bán; API còn kiểm tra shop/đơn/sản phẩm có thuộc người gọi hay không
- `buyer`: phiên người mua (đăng nhập bằng mã email)
- `buyer|order`: phiên người mua, hoặc link token của đúng đơn đó

## Hệ thống

| Method | Path                | Quyền | Mô tả                                                           |
| ------ | ------------------- | ----- | --------------------------------------------------------------- |
| GET    | `/`                 | —     | Kiểm tra API còn sống                                           |
| GET    | `/health/client-ip` | —     | IP mà API nhận ra cho người gọi; dùng để đặt `TRUST_PROXY_HOPS` |

## Người bán: tài khoản

| Method | Path             | Quyền  | Mô tả                                                  |
| ------ | ---------------- | ------ | ------------------------------------------------------ |
| POST   | `/auth/register` | —      | `{ email, password, name }` → `{ user, token }`        |
| POST   | `/auth/login`    | —      | `{ email, password }` → `{ user, token }`; sai thì 401 |
| GET    | `/auth/me`       | seller | Thông tin người bán đang đăng nhập                     |

## Shop

| Method | Path             | Quyền  | Mô tả                                                                            |
| ------ | ---------------- | ------ | -------------------------------------------------------------------------------- |
| POST   | `/shops`         | seller | Tạo shop; đã có shop hoặc slug trùng thì 409                                     |
| GET    | `/shops/my-shop` | seller | Shop của người gọi                                                               |
| GET    | `/shops/:slug`   | —      | Storefront công khai (kèm danh mục); shop ngừng hoạt động thì 404                |
| PATCH  | `/shops/:id`     | seller | Sửa shop; không sửa được `slug`; logo/banner phải là ảnh Cloudinary của MarketUp |

## Danh mục

| Method | Path                       | Quyền  | Mô tả                         |
| ------ | -------------------------- | ------ | ----------------------------- |
| POST   | `/categories/:shopId`      | seller | `{ name, slug }`              |
| GET    | `/categories/shop/:shopId` | —      | Danh mục của shop             |
| DELETE | `/categories/:id`          | seller | Sản phẩm thành không danh mục |

## Sản phẩm

| Method | Path                            | Quyền  | Mô tả                                                                                                                                           |
| ------ | ------------------------------- | ------ | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| POST   | `/products/:shopId`             | seller | Multipart: các trường sản phẩm, `images[]` (≤ 10), `variants` (chuỗi JSON). Thuộc tính và nhãn biến thể do API suy ra từ `options` của biến thể |
| GET    | `/products/shop/:shopId`        | —      | Sản phẩm đang hiển thị                                                                                                                          |
| GET    | `/products/shop/:shopId/manage` | seller | Mọi sản phẩm, kể cả đang ẩn                                                                                                                     |
| GET    | `/products/:id`                 | —      | Chi tiết; sản phẩm ẩn hoặc shop ngừng hoạt động thì 404                                                                                         |
| PATCH  | `/products/:id`                 | seller | Multipart, giống POST                                                                                                                           |
| DELETE | `/products/:id`                 | seller | Đã có đơn thì chỉ ẩn, chưa có thì xoá hẳn                                                                                                       |

## Upload

| Method | Path            | Quyền  | Mô tả                                                                 |
| ------ | --------------- | ------ | --------------------------------------------------------------------- |
| POST   | `/upload/image` | seller | Multipart `file` (PNG/JPEG/WebP, ≤ 10 MB) → `{ url }` trên Cloudinary |

## Đơn hàng: phía người bán

| Method | Path                   | Quyền  | Mô tả                                                                                      |
| ------ | ---------------------- | ------ | ------------------------------------------------------------------------------------------ |
| POST   | `/orders`              | —      | Đặt hàng (xem bên dưới) → đơn + `accessToken` (link token của đơn)                         |
| GET    | `/orders/shop/:shopId` | seller | Đơn của shop theo trang: `?status=&q=&cursor=` (xem bên dưới)                              |
| GET    | `/orders/:id`          | seller | Chi tiết đơn                                                                               |
| PATCH  | `/orders/:id/status`   | seller | `{ status, cancelReason?, cancelNote? }`; `cancelReason` bắt buộc khi `status = CANCELLED` |

Body của `POST /orders`:

```json
{
  "shopId": "…",
  "buyerName": "Minh Tú",
  "buyerEmail": "tu@example.com",
  "buyerPhone": "0901234567",
  "shippingAddress": "12 Lê Lợi",
  "shippingCity": "Hồ Chí Minh",
  "shippingDistrict": "Quận 1",
  "shippingNote": "Gọi trước khi giao",
  "items": [{ "productId": "…", "variantId": "…", "quantity": 2 }]
}
```

Giá luôn do server tính từ DB, client không gửi giá. Luật kiểm tra xem ở [Đặc tả § Đặt hàng](product-spec.md#32-giỏ-hàng-và-đặt-hàng).

## Người mua: đăng nhập và đơn hàng

| Method | Path                                | Quyền        | Mô tả                                                                                |
| ------ | ----------------------------------- | ------------ | ------------------------------------------------------------------------------------ |
| POST   | `/buyer/auth/request-code`          | —            | `{ email, shopSlug? }` → `{ resendInSeconds }`; trả cùng kiểu phản hồi với mọi email |
| POST   | `/buyer/auth/verify`                | —            | `{ email, code }` → `{ email, token }` (phiên 30 ngày)                               |
| GET    | `/buyer/orders?shop=<slug>`         | buyer        | Đơn của email đó tại shop theo trang: `&status=&cursor=` (xem bên dưới)              |
| GET    | `/buyer/orders/:orderNumber`        | buyer\|order | Chi tiết đơn, kèm `reviewableUntil` và đánh giá của từng món                         |
| POST   | `/buyer/orders/:orderNumber/cancel` | buyer\|order | `{ reason, note? }`; chỉ khi `PENDING`                                               |

Dữ liệu đơn trả cho người mua không có id nội bộ của đơn, thông tin chủ shop, email hay số điện thoại.

### Danh sách đơn (phân trang)

`GET /orders/shop/:shopId` và `GET /buyer/orders` trả từng trang 20 đơn, **mới nhất trước** (`apps/api/src/order/order-list.ts`, cách phân trang dùng chung ở `apps/api/src/common/cursor-page.ts`):

```json
{
  "items": [ … ],
  "nextCursor": "…",
  "counts": { "ALL": 62, "PENDING": 51, "CONFIRMED": 1, "PROCESSING": 1, "SHIPPING": 1, "DELIVERED": 7, "CANCELLED": 1 }
}
```

- Trang sau: gửi lại `cursor=<nextCursor>`; `nextCursor = null` là hết. Con trỏ là id đơn (người bán) hoặc mã đơn (người mua).
- `status=<OrderStatus>` lọc theo tab; `counts` là số đơn mỗi tab trên toàn bộ đơn (không theo từ khoá tìm).
- Người bán: `q=` tìm theo mã đơn, tên, email, số điện thoại (chứa chuỗi, không phân biệt hoa thường). Người mua: `shop=<slug>` bắt buộc.

## Đánh giá

| Method | Path                                              | Quyền        | Mô tả                                                             |
| ------ | ------------------------------------------------- | ------------ | ----------------------------------------------------------------- |
| GET    | `/reviews/product/:productId?limit=`              | —            | Đánh giá mới nhất của sản phẩm (`limit` ≤ 50)                     |
| GET    | `/reviews/product/:productId/rating`              | —            | `{ averageRating, count }`                                        |
| GET    | `/reviews/shop/:shopId?rating=&cursor=`           | —            | Đánh giá của shop, từng trang 10, mới nhất trước (xem dưới)       |
| GET    | `/reviews/shop/:shopId/stats`                     | —            | Điểm shop `{ averageRating, count, ratingCounts }`                |
| POST   | `/buyer/orders/:orderNumber/items/:itemId/review` | buyer\|order | `{ rating, comment? }`; đơn đã giao, trong 30 ngày; trùng thì 409 |
| PATCH  | `/buyer/orders/:orderNumber/items/:itemId/review` | buyer\|order | Sửa một lần, trong 30 ngày                                        |
| GET    | `/reviews/manage/:shopId?rating=&unreplied=true`  | seller       | Đánh giá của shop (tối đa 200), lọc theo sao / chưa trả lời       |
| GET    | `/reviews/manage/:shopId/stats`                   | seller       | `{ averageRating, count, unrepliedCount }`                        |
| PATCH  | `/reviews/:id/reply`                              | seller       | `{ replyText }` (≤ 1000 ký tự)                                    |

Tab Reviews của storefront (`apps/api/src/review/review-list.ts`):

- `GET /reviews/shop/:shopId` trả `{ items, nextCursor }` giống danh sách đơn: trang sau gửi `cursor=<nextCursor>`, con trỏ là id đánh giá. `rating=1..5` lọc theo số sao; giá trị khác → 400.
- `ratingCounts` trong `/stats` là số đánh giá mỗi mức sao, ví dụ `{ "1": 0, "2": 1, "3": 1, "4": 2, "5": 3 }` (mức chưa có đánh giá = 0), dùng cho nút lọc.
- Đánh giá của sản phẩm đang ẩn không được tính và không hiện.

Đánh giá công khai chỉ chứa tên đã che, không có email; đánh giá của sản phẩm đang ẩn bị loại khỏi danh sách và điểm.

## Dashboard

| Method | Path                       | Quyền  | Mô tả                                                                                                               |
| ------ | -------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------- |
| GET    | `/dashboard/stats/:shopId` | seller | `totalOrders`, `totalRevenue`, `totalProducts`, `pendingOrders`, `recentOrders` (5), `revenueTrend` (7 ngày giờ VN) |

## Mã lỗi

Lỗi trả theo định dạng mặc định của NestJS: `{ statusCode, message, error }`. `message` có thể là chuỗi hoặc mảng (lỗi validate).

| Mã  | Khi nào                                                                                               |
| --- | ----------------------------------------------------------------------------------------------------- |
| 400 | Dữ liệu không hợp lệ, trường lạ, vi phạm luật nghiệp vụ (hết hàng, sai trạng thái, quá hạn đánh giá…) |
| 401 | Thiếu token, token sai/hết hạn, sai loại token, sai mật khẩu                                          |
| 403 | Token hợp lệ nhưng tài nguyên không thuộc người gọi                                                   |
| 404 | Không tìm thấy; đơn của người khác cũng trả 404                                                       |
| 409 | Trùng (slug, email, đánh giá) hoặc đơn vừa bị người khác cập nhật                                     |
| 413 | Ảnh lớn hơn 10 MB                                                                                     |
| 429 | Vượt giới hạn tần suất ("Too many requests…") hoặc quá 5 mã đăng nhập/giờ cho một email               |

Giới hạn tần suất của từng endpoint: [Kiến trúc § Giới hạn tần suất](architecture.md#45-giới-hạn-tần-suất).
