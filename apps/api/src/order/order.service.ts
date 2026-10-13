import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { CancelOrderDto } from './dto/cancel-order.dto';
import {
  BUYER_CANCEL_REASONS,
  canBuyerCancel,
  SELLER_TRANSITIONS,
  sellerCancelReasons,
} from './order-status';
import {
  CancelActor,
  CancelReason,
  OrderItem,
  OrderStatus,
  Prisma,
} from '@prisma/client';
import { MailService } from '../mail/mail.service';
import { generateOrderNumber } from './order-number';
import { AccessTokenService } from '../auth/access-token.service';
import type { BuyerAccess } from '../auth/guards/buyer-access.guard';
import { buyerOrderWhere } from './buyer-order-access';
import { BUYER_REVIEW_SELECT } from '../review/review-select';
import { reviewDeadline } from '../review/review-rules';
import { pageArgs, toPage, toStatusCounts } from './order-list';
import {
  BuyerOrdersQueryDto,
  SellerOrdersQueryDto,
} from './dto/list-orders.dto';

// Những gì người mua được thấy: không có id nội bộ, thông tin chủ shop hay email/sđt
const PUBLIC_ORDER_SELECT = {
  orderNumber: true,
  status: true,
  createdAt: true,
  updatedAt: true,
  deliveredAt: true,
  cancelledAt: true,
  cancelledBy: true,
  cancelReason: true,
  cancelNote: true,
  buyerName: true,
  shippingAddress: true,
  shippingCity: true,
  shippingDistrict: true,
  shippingNote: true,
  subtotal: true,
  shippingFee: true,
  discount: true,
  totalAmount: true,
  items: {
    select: {
      id: true,
      productId: true,
      productName: true,
      productImage: true,
      variantLabel: true,
      quantity: true,
      priceAtPurchase: true,
      review: { select: BUYER_REVIEW_SELECT },
    },
  },
  shop: { select: { name: true, slug: true } },
} satisfies Prisma.OrderSelect;

// Hạn viết/sửa đánh giá do API tính (FE chỉ hiển thị)
const withReviewDeadline = <T extends { deliveredAt: Date | null }>(
  order: T,
) => ({
  ...order,
  reviewableUntil: reviewDeadline(order.deliveredAt),
});

interface Cancellation {
  by: CancelActor;
  reason: CancelReason;
  note?: string;
}

@Injectable()
export class OrderService {
  private readonly logger = new Logger(OrderService.name);

  constructor(
    private prisma: PrismaService,
    private mailService: MailService,
    private tokens: AccessTokenService,
  ) {}

  async create(dto: CreateOrderDto) {
    const { items, ...orderData } = dto;

    const orderNumber = generateOrderNumber();

    // Cùng một biến thể xuất hiện nhiều dòng → gộp lại để kiểm tra tồn kho trên tổng số lượng
    const lines = new Map<string, { productId: string; quantity: number }>();
    for (const item of items) {
      const line = lines.get(item.variantId);
      if (line && line.productId !== item.productId) {
        throw new BadRequestException(`Variant ${item.variantId} not found`);
      }
      lines.set(item.variantId, {
        productId: item.productId,
        quantity: (line?.quantity ?? 0) + item.quantity,
      });
    }

    const order = await this.prisma.$transaction(async (tx) => {
      const shop = await tx.shop.findUnique({ where: { id: dto.shopId } });
      if (!shop || !shop.isActive) {
        throw new BadRequestException('Shop not found');
      }

      let subtotal = new Prisma.Decimal(0);
      const orderItemsData: Prisma.OrderItemCreateWithoutOrderInput[] = [];

      for (const [variantId, { productId, quantity }] of lines) {
        const variant = await tx.productVariant.findUnique({
          where: { id: variantId },
          include: { product: true },
        });

        // Sản phẩm ẩn hoặc thuộc shop khác coi như không tồn tại
        if (
          !variant ||
          variant.productId !== productId ||
          variant.product.shopId !== dto.shopId ||
          !variant.product.isVisible
        ) {
          throw new BadRequestException('Some items are no longer available');
        }

        // Trừ kho nguyên tử: chỉ trừ khi còn đủ hàng → hai đơn đặt cùng lúc không thể bán quá tồn kho
        const { count } = await tx.productVariant.updateMany({
          where: { id: variantId, stock: { gte: quantity } },
          data: { stock: { decrement: quantity } },
        });
        if (count === 0) {
          throw new BadRequestException(
            `Only ${variant.stock} left of ${variant.product.name} (${variant.label})`,
          );
        }

        subtotal = subtotal.add(variant.price.mul(quantity));

        // Chụp lại tên, ảnh, nhãn, giá tại thời điểm mua (snapshot)
        orderItemsData.push({
          product: { connect: { id: productId } },
          variant: { connect: { id: variantId } },
          quantity,
          priceAtPurchase: variant.price,
          productName: variant.product.name,
          productImage: variant.product.imageUrl,
          variantLabel: variant.label,
        });
      }

      // Tạo đơn hàng
      return tx.order.create({
        data: {
          ...orderData,
          orderNumber,
          subtotal,
          totalAmount: subtotal, // Hiện tại chưa có logic phí vận chuyển/giảm giá
          status: 'PENDING',
          items: {
            create: orderItemsData,
          },
        },
        // Email chỉ cần tên + slug shop; không trả thông tin chủ shop cho người mua
        include: {
          items: true,
          shop: { select: { name: true, slug: true } },
        },
      });
    });

    this.sendMail('order confirmation', order, (o) =>
      this.mailService.sendOrderPlacedEmail(o),
    );

    // Link xem đơn cho người vừa đặt (trang "đặt hàng thành công"), không cần đăng nhập
    return { ...order, accessToken: this.tokens.signOrder(order.id) };
  }

  // Dashboard: từng trang đơn theo tab trạng thái, tìm theo mã đơn / tên / email / số điện thoại.
  // Số đơn mỗi tab tính trên toàn shop (không theo từ khoá tìm), giống Shopee.
  async findForSeller(
    userId: string,
    shopId: string,
    { status, q, cursor }: SellerOrdersQueryDto,
  ) {
    const shop = await this.prisma.shop.findUnique({
      where: { id: shopId },
      select: { ownerId: true },
    });
    if (!shop || shop.ownerId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    const contains = (value: string) => ({
      contains: value,
      mode: 'insensitive' as const,
    });
    const [rows, groups] = await Promise.all([
      this.prisma.order.findMany({
        where: {
          shopId,
          ...(status && { status }),
          ...(q && {
            OR: [
              { orderNumber: contains(q) },
              { buyerName: contains(q) },
              { buyerEmail: contains(q) },
              { buyerPhone: contains(q) },
            ],
          }),
        },
        include: { items: true },
        ...pageArgs(cursor ? { id: cursor } : undefined),
      }),
      this.prisma.order.groupBy({
        by: ['status'],
        where: { shopId },
        _count: { _all: true },
      }),
    ]);

    return {
      ...toPage(rows, (order) => order.id),
      counts: toStatusCounts(groups),
    };
  }

  async updateStatus(
    userId: string,
    orderId: string,
    { status, cancelReason, cancelNote }: UpdateOrderStatusDto,
  ) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { shop: true, items: true },
    });

    if (!order || order.shop.ownerId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    if (order.status === status) {
      return order;
    }

    if (!SELLER_TRANSITIONS[order.status].includes(status)) {
      throw new BadRequestException(
        `Cannot transition order status from ${order.status} to ${status}`,
      );
    }

    let cancellation: Cancellation | undefined;
    if (status === 'CANCELLED') {
      if (
        !cancelReason ||
        !sellerCancelReasons(order.status).includes(cancelReason)
      ) {
        throw new BadRequestException(
          order.status === 'SHIPPING'
            ? 'An order on its way can only be cancelled as "delivery failed"'
            : 'Choose a reason for cancelling this order',
        );
      }
      cancellation = { by: 'SELLER', reason: cancelReason, note: cancelNote };
    } else if (cancelReason || cancelNote) {
      throw new BadRequestException(
        'A cancellation reason is only needed when cancelling an order',
      );
    }

    const updatedOrder = await this.changeStatus(order, status, cancellation);

    // Kích hoạt gửi email bất đồng bộ
    if (status === 'SHIPPING') {
      this.sendMail('order shipped', updatedOrder, (o) =>
        this.mailService.sendOrderShippedEmail(o),
      );
    } else if (status === 'DELIVERED') {
      this.sendMail('order delivered', updatedOrder, (o) =>
        this.mailService.sendOrderDeliveredEmail(o),
      );
    } else if (status === 'CANCELLED') {
      this.sendMail('order cancelled', updatedOrder, (o) =>
        this.mailService.sendOrderCancelledEmail(o),
      );
    }

    return updatedOrder;
  }

  // Người mua tự huỷ khi shop chưa xác nhận (bằng phiên đăng nhập hoặc link của đơn)
  async cancelForBuyer(
    orderNumber: string,
    access: BuyerAccess,
    { reason, note }: CancelOrderDto,
  ) {
    const order = await this.prisma.order.findFirst({
      where: buyerOrderWhere(orderNumber, access),
      select: { id: true, status: true, items: true },
    });
    if (!order) throw new NotFoundException('Order not found');

    if (!canBuyerCancel(order.status)) {
      throw new BadRequestException(
        order.status === 'CANCELLED'
          ? 'This order has already been cancelled'
          : 'The shop has already confirmed this order. Contact the shop if you need to cancel it.',
      );
    }
    if (!BUYER_CANCEL_REASONS.includes(reason)) {
      throw new BadRequestException('Choose one of the reasons offered');
    }

    const cancelled = await this.changeStatus(order, 'CANCELLED', {
      by: 'BUYER',
      reason,
      note,
    });
    this.sendMail('order cancelled', cancelled, (o) =>
      this.mailService.sendOrderCancelledEmail(o),
    );
    return this.findOneForBuyer(orderNumber, access);
  }

  // Chỉ đổi khi đơn vẫn đúng trạng thái vừa đọc: người mua huỷ đúng lúc shop xác nhận
  // thì chỉ một bên thành công, và kho không bị hoàn hai lần
  private async changeStatus(
    order: { id: string; status: OrderStatus; items: OrderItem[] },
    status: OrderStatus,
    cancellation?: Cancellation,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const { count } = await tx.order.updateMany({
        where: { id: order.id, status: order.status },
        data: {
          status,
          ...(status === 'DELIVERED' ? { deliveredAt: new Date() } : {}),
          ...(cancellation
            ? {
                cancelledAt: new Date(),
                cancelledBy: cancellation.by,
                cancelReason: cancellation.reason,
                cancelNote: cancellation.note || null,
              }
            : {}),
        },
      });
      if (count === 0) {
        throw new ConflictException(
          'This order was just updated. Refresh to see its latest status.',
        );
      }

      // Huỷ đơn → hoàn lại kho
      if (status === 'CANCELLED') {
        for (const item of order.items) {
          if (item.variantId) {
            await tx.productVariant.update({
              where: { id: item.variantId },
              data: { stock: { increment: item.quantity } },
            });
          }
        }
      }

      return tx.order.findUniqueOrThrow({
        where: { id: order.id },
        include: { items: true, shop: { select: { name: true, slug: true } } },
      });
    });
  }

  // Email gửi nền: lỗi SMTP không làm hỏng thao tác của người dùng
  private sendMail<T extends { orderNumber: string }>(
    label: string,
    order: T,
    send: (order: T) => Promise<unknown>,
  ) {
    send(order).catch((err) => {
      this.logger.error(
        `Failed to send ${label} email for ${order.orderNumber}:`,
        err,
      );
    });
  }

  async findOne(userId: string, id: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: { items: true, shop: true },
    });

    if (!order || order.shop.ownerId !== userId) {
      throw new NotFoundException('Order not found');
    }
    return order;
  }

  // Người mua đã đăng nhập: đơn của email này tại shop đang xem, từng trang theo tab trạng thái
  async findForBuyer(
    email: string,
    { shop, status, cursor }: BuyerOrdersQueryDto,
  ) {
    const where = { buyerEmail: email, shop: { slug: shop } };
    const [rows, groups] = await Promise.all([
      this.prisma.order.findMany({
        where: { ...where, ...(status && { status }) },
        select: PUBLIC_ORDER_SELECT,
        ...pageArgs(cursor ? { orderNumber: cursor } : undefined),
      }),
      this.prisma.order.groupBy({
        by: ['status'],
        where,
        _count: { _all: true },
      }),
    ]);

    const page = toPage(rows, (order) => order.orderNumber);
    return {
      ...page,
      items: page.items.map(withReviewDeadline),
      counts: toStatusCounts(groups),
    };
  }

  async findOneForBuyer(orderNumber: string, access: BuyerAccess) {
    const order = await this.prisma.order.findFirst({
      where: buyerOrderWhere(orderNumber, access),
      select: PUBLIC_ORDER_SELECT,
    });

    // Không có, hay đơn của người khác đều trả cùng một lỗi → không dò được đơn nào tồn tại
    if (!order) throw new NotFoundException('Order not found');
    return withReviewDeadline(order);
  }
}
