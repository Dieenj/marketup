import type { NextConfig } from 'next';

const apiOrigin = (() => {
  const envUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  try {
    return new URL(envUrl).origin;
  } catch {
    return 'http://localhost:3001';
  }
})();

// React cần eval() ở chế độ development để dựng lại call stack khi debug; production giữ CSP chặt
const isDev = process.env.NODE_ENV === 'development';

const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ''}`,
  "style-src 'self' 'unsafe-inline'",
  // blob: cho ảnh preview khi chọn file (URL.createObjectURL) ở dialog sản phẩm
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  `connect-src 'self' ${apiOrigin}`,
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "object-src 'none'",
].join('; ');

const nextConfig: NextConfig = {
  output: 'standalone',
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'Content-Security-Policy', value: csp },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
