import type { Prisma } from '@prisma/client';
import type { BuyerAccess } from '../auth/guards/buyer-access.guard';

// Đơn mà người mua được xem/thao tác: phiên đăng nhập → đơn của email đó; link → đúng đơn trong link
export function buyerOrderWhere(
  orderNumber: string,
  access: BuyerAccess,
): Prisma.OrderWhereInput {
  return access.kind === 'buyer'
    ? { orderNumber, buyerEmail: access.email }
    : { orderNumber, id: access.orderId };
}
