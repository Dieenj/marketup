import { Throttle } from '@nestjs/throttler';

const MINUTE = 60_000;

// Giới hạn theo IP cho các thao tác dễ bị lạm dụng (dò mật khẩu/mã đăng nhập, spam email, đơn, review).
// Đủ rộng cho nhiều người dùng chung một IP (NAT văn phòng, mạng di động).
export const RateLimit = {
  login: () => Throttle({ default: { limit: 10, ttl: MINUTE } }),
  register: () => Throttle({ default: { limit: 5, ttl: MINUTE } }),
  // Mỗi email còn bị giới hạn riêng (60 giây/lần, 5 mã/giờ) trong BuyerAuthService
  requestLoginCode: () => Throttle({ default: { limit: 5, ttl: MINUTE } }),
  verifyLoginCode: () => Throttle({ default: { limit: 10, ttl: MINUTE } }),
  placeOrder: () => Throttle({ default: { limit: 20, ttl: MINUTE } }),
  writeReview: () => Throttle({ default: { limit: 10, ttl: MINUTE } }),
};

// Giới hạn chung cho mọi request ghi (POST/PATCH/DELETE) không có giới hạn riêng
export const DEFAULT_RATE_LIMIT = { ttl: MINUTE, limit: 300 };
