# MarketUp Frontend — Next.js 15 Client & Storefront

Ứng dụng Frontend của **MarketUp** được phát triển bằng **Next.js 15**, sử dụng **Tailwind CSS 4** cho kiểu dáng thiết kế hiện đại và **shadcn/ui** làm hệ thống component. 

Dự án này tích hợp hai phân hệ chính trong cùng một hệ thống định tuyến (Routing):
1. **Dashboard quản lý của người bán** (Các đường dẫn bảo mật bắt buộc đăng nhập JWT).
2. **Storefront mua sắm công khai của từng cửa hàng** (Định tuyến động dựa trên Slug của Shop, ví dụ `/shop/lumiere`).

---

## Các Trang & Tuyến Đường (Routing)

### 1. Phân hệ Storefront (Công khai cho Khách hàng)
*   **`/shop/[slug]`**: Trang chủ cửa hàng công khai. Hiển thị banner, danh sách sản phẩm, bộ lọc danh mục và phần **Đánh giá chất lượng dịch vụ chung của shop**.
*   **`/shop/[slug]/products/[productId]`**: Trang chi tiết sản phẩm. Hiển thị thư viện ảnh, giá bán, chọn biến thể (Size/Màu), mô tả chi tiết, **bảng phân tích biểu đồ sao đánh giá** và danh sách phản hồi từ người mua thực tế (hiển thị nhãn kiểm chứng `Verified Purchase`).
*   **`/shop/[slug]/checkout`**: Giỏ hàng và trang đặt hàng nhanh sử dụng phương thức nhận hàng thanh toán COD.

### 2. Phân hệ Dashboard (Quản lý dành cho Người bán)
*   **`/login` & `/register`**: Đăng nhập, đăng ký tài khoản Seller.
*   **`/setup`**: Trang thiết lập thông tin ban đầu (Tên, Slug, mô tả) khi mới đăng ký shop.
*   **`/dashboard`**: Bảng điều khiển trung tâm hiển thị doanh thu, tổng đơn hàng, sản phẩm thịnh hành nhất và biểu đồ tăng trưởng doanh số.
*   **`/products`**: Quản lý kho hàng, CRUD sản phẩm kèm thiết lập các biến thể và thuộc tính tùy chọn.
*   **`/categories`**: Quản lý phân nhóm danh mục sản phẩm của shop.
*   **`/orders`**: Danh sách đơn đặt hàng từ khách, cập nhật trạng thái đơn hàng (sẽ tự động kích hoạt gửi thông báo email cho khách).
*   **`/reviews`**: Khu vực quản lý phản hồi của khách hàng. Chủ shop có thể duyệt đánh giá đang chờ, xem điểm xếp hạng, phản hồi câu trả lời trực tiếp hoặc xóa đánh giá rác.
*   **`/settings`**: Cấu hình thông tin tài khoản và thông tin liên hệ của shop.

---

## Thư viện & Công nghệ Nổi bật

*   **shadcn/ui**: Thiết kế UI nhất quán, hỗ trợ đầy đủ các hiệu ứng tương tác đẹp mắt (Star Hover, Dialogs, Aggregates Breakdown).
*   **TanStack Query v5**: Quản lý Server State, tự động cache, sync và re-validate dữ liệu mượt mà.
*   **Zustand**: Quản lý Client State gọn nhẹ (ví dụ: trạng thái Giỏ hàng và Drawer).
*   **Lucide React**: Thư viện Icon hiện đại, đồng bộ.
*   **Recharts**: Vẽ biểu đồ phân tích doanh thu sắc nét.

---

## Hướng dẫn Chạy Cục bộ

### Chạy development server:
```bash
pnpm dev
# hoặc chạy độc lập từ apps/web
pnpm run dev
```

Mở [http://localhost:3000](http://localhost:3000) trên trình duyệt của bạn để xem kết quả storefront và bảng quản trị.

### Build sản phẩm để Deploy:
```bash
pnpm run build
```
Lệnh này sẽ biên dịch mã nguồn Next.js và tối ưu hóa hiệu năng tải trang cho môi trường Production.
