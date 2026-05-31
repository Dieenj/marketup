export { PrismaClient } from '@prisma/client';
export type {
  User,
  Shop,
  Category,
  Product,
  Order,
  OrderItem,
  Role,
  OrderStatus,
} from '@prisma/client';

import { PrismaClient } from '@prisma/client';

// Áp dụng mô hình Singleton để tránh tạo nhiều kết nối trong môi trường phát triển (development)
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
