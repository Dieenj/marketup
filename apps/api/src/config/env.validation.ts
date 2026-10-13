// Kiểm tra biến môi trường khi khởi động: thiếu cấu hình quan trọng thì dừng ngay với thông báo rõ ràng,
// thay vì chạy với giá trị mặc định nguy hiểm (trước đây JWT_SECRET rơi về một chuỗi công khai trong code).
const MIN_JWT_SECRET_LENGTH = 32;
// Chuỗi mẫu từng nằm trong repo (.env.example, docker-compose) — ai cũng biết nên không bao giờ được dùng
const KNOWN_PLACEHOLDER = /your-super-secret|change-in-production|changeme/i;

export function validateEnv(config: Record<string, unknown>) {
  const errors: string[] = [];

  if (!config.DATABASE_URL) errors.push('DATABASE_URL is required');

  const jwtSecret =
    typeof config.JWT_SECRET === 'string' ? config.JWT_SECRET : '';
  if (
    jwtSecret.length < MIN_JWT_SECRET_LENGTH ||
    KNOWN_PLACEHOLDER.test(jwtSecret)
  ) {
    errors.push(
      `JWT_SECRET must be a random secret of at least ${MIN_JWT_SECRET_LENGTH} characters, not a placeholder ` +
        `(generate one with: node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))")`,
    );
  }

  const hops = config.TRUST_PROXY_HOPS;
  if (hops !== undefined && hops !== '' && !/^\d+$/.test(String(hops))) {
    errors.push(
      'TRUST_PROXY_HOPS must be a whole number (proxies in front of the API)',
    );
  }

  if (errors.length > 0) {
    throw new Error(
      `Invalid environment configuration:\n- ${errors.join('\n- ')}`,
    );
  }
  return config;
}
