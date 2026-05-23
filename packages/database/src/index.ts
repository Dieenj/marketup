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
  PaymentStatus,
  PaymentMethod,
} from '@prisma/client';

import { PrismaClient } from '@prisma/client';

// Singleton pattern to avoid multiple connections in development
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
