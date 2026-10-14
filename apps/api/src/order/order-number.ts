import { randomInt } from 'node:crypto';

// Bỏ các ký tự dễ nhầm (0/O, 1/I/L) vì người mua có thể phải đọc hoặc gõ lại mã đơn
const ORDER_CODE_ALPHABET = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';

// VD: ORD-251013-7K3QX9 — ngày đặt (giờ VN) + 6 ký tự ngẫu nhiên (~887 triệu tổ hợp mỗi ngày):
// không trùng khi nhiều đơn đặt cùng lúc và không đoán được từ thời điểm đặt
export function generateOrderNumber() {
  const date = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: '2-digit',
    month: '2-digit',
    day: '2-digit',
  })
    .format(new Date())
    .replaceAll('-', '');
  const code = Array.from(
    { length: 6 },
    () => ORDER_CODE_ALPHABET[randomInt(ORDER_CODE_ALPHABET.length)],
  ).join('');
  return `ORD-${date}-${code}`;
}
