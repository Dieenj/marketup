const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
});

// Định dạng số tiền thống nhất cho toàn bộ dashboard
export function formatCurrency(value: number | string | null | undefined) {
  return currencyFormatter.format(Number(value ?? 0));
}

// Cố định múi giờ: storefront render trên server (Vercel chạy UTC) rồi hydrate ở trình duyệt (+7).
// Không cố định thì review tạo lúc 17:00–24:00 UTC hiện khác ngày ở hai nơi → lỗi hydration.
const APP_TIME_ZONE = 'Asia/Ho_Chi_Minh';

const dateFormatter = new Intl.DateTimeFormat('en-US', {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
  timeZone: APP_TIME_ZONE,
});

// Ngày dạng "Oct 13, 2026" cho review
export function formatDate(value: string | number | Date) {
  return dateFormatter.format(new Date(value));
}
