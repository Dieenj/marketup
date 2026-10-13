import { createHmac, randomInt, timingSafeEqual } from 'node:crypto';

export const LOGIN_CODE_LENGTH = 6;

export function generateLoginCode() {
  return randomInt(0, 10 ** LOGIN_CODE_LENGTH)
    .toString()
    .padStart(LOGIN_CODE_LENGTH, '0');
}

// Chỉ lưu HMAC (khoá = JWT_SECRET) gắn với email: lộ DB cũng không đọc được mã,
// và mã của email này không dùng được cho email khác
export function hashLoginCode(secret: string, email: string, code: string) {
  return createHmac('sha256', secret).update(`${email}:${code}`).digest('hex');
}

export function matchesLoginCode(
  hash: string,
  secret: string,
  email: string,
  code: string,
) {
  const expected = Buffer.from(hash, 'hex');
  const actual = Buffer.from(hashLoginCode(secret, email, code), 'hex');
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}
