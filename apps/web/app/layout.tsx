import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import QueryProvider from '@/components/providers/query-provider';
import { Toaster } from '@/components/ui/sonner';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  // Gốc để Next tạo URL tuyệt đối cho Open Graph (link chia sẻ storefront)
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ||
      (process.env.VERCEL_PROJECT_PRODUCTION_URL &&
        `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`) ||
      'http://localhost:3000',
  ),
  title: 'MarketUp | Your Personal Storefront SaaS',
  description: 'Create and manage your online shop in minutes with MarketUp.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // data-scroll-behavior: globals.css đặt scroll-behavior: smooth cho anchor trong trang; Next 16 chỉ
    // tạm tắt smooth khi chuyển trang nếu có thuộc tính này → chuyển trang thì cuộn lên đầu ngay, không trôi
    <html lang="en" data-scroll-behavior="smooth">
      <body className={inter.className}>
        <QueryProvider>
          {children}
          <Toaster position="top-center" richColors />
        </QueryProvider>
      </body>
    </html>
  );
}
