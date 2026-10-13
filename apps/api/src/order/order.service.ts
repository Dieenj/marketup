import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderStatus, Prisma } from '@prisma/client';
import { MailService } from '../mail/mail.service';
import { generateOrderNumber } from './order-number';
import { AccessTokenService } from '../auth/access-token.service';
import type { BuyerAccess } from '../auth/guards/buyer-access.guard';

// Những gì người mua được thấy: không có id nội bộ, thông tin chủ shop hay email/sđt
const PUBLIC_ORDER_SELECT = {
  orderNumber: true,
  status: true,
  createdAt: true,
  updatedAt: true,
  deliveredAt: true,
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
    },
  },
  shop: { select: { name: true, slug: true } },
} satisfies Prisma.OrderSelect;

// Trang "My orders" chưa phân trang; đủ cho người mua lẻ của một shop
const MAX_BUYER_ORDERS = 100;

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

    // Gửi email xác nhận đặt hàng bất đồng bộ
    this.mailService.sendOrderPlacedEmail(order).catch((err) => {
      this.logger.error(
        `Failed to send order confirmation email for ${order.orderNumber}:`,
        err,
      );
    });

    // Link xem đơn cho người vừa đặt (trang "đặt hàng thành công"), không cần đăng nhập
    return { ...order, accessToken: this.tokens.signOrder(order.id) };
  }

  async findAllByShop(userId: string, shopId: string) {
    const shop = await this.prisma.shop.findUnique({
      where: { id: shopId },
    });

    if (!shop || shop.ownerId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    return this.prisma.order.findMany({
      where: { shopId },
      include: { items: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateStatus(userId: string, orderId: string, status: OrderStatus) {
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

    // Kiểm tra máy trạng thái đơn hàng (State machine check)
    const validTransitions: Record<OrderStatus, OrderStatus[]> = {
      PENDING: ['CONFIRMED', 'CANCELLED'],
      CONFIRMED: ['PROCESSING', 'CANCELLED'],
      PROCESSING: ['SHIPPING', 'CANCELLED'],
      SHIPPING: ['DELIVERED', 'CANCELLED'],
      DELIVERED: [], // trạng thái kết thúc (terminal state)
      CANCELLED: [], // trạng thái kết thúc (terminal state)
    };

    const allowed = validTransitions[order.status];
    if (!allowed || !allowed.includes(status)) {
      throw new BadRequestException(
        `Cannot transition order status from ${order.status} to ${status}`,
      );
    }

    // Chạy cập nhật trong transaction để xử lý hoàn trả kho hàng nếu đơn hàng bị hủy
    const updatedOrder = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.order.update({
        where: { id: orderId },
        data: {
          status,
          ...(status === 'DELIVERED' ? { deliveredAt: new Date() } : {}),
        },
        include: { items: true, shop: true },
      });

      // Hoàn trả kho hàng nếu đơn hàng bị hủy
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

      return updated;
    });

    // Kích hoạt gửi email bất đồng bộ
    if (status === 'SHIPPING') {
      this.mailService.sendOrderShippedEmail(updatedOrder).catch((err) => {
        this.logger.error(
          `Failed to send order shipped email for ${updatedOrder.orderNumber}:`,
          err,
        );
      });
    } else if (status === 'DELIVERED') {
      this.mailService.sendOrderDeliveredEmail(updatedOrder).catch((err) => {
        this.logger.error(
          `Failed to send order delivered email for ${updatedOrder.orderNumber}:`,
          err,
        );
      });
    }

    return updatedOrder;
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

  // Người mua đã đăng nhập: mọi đơn của email này tại shop đang xem
  async findForBuyer(email: string, shopSlug: string) {
    return this.prisma.order.findMany({
      where: { buyerEmail: email, shop: { slug: shopSlug } },
      select: PUBLIC_ORDER_SELECT,
      orderBy: { createdAt: 'desc' },
      take: MAX_BUYER_ORDERS,
    });
  }

  async findOneForBuyer(orderNumber: string, access: BuyerAccess) {
    const order = await this.prisma.order.findFirst({
      where: {
        orderNumber,
        ...(access.kind === 'buyer'
          ? { buyerEmail: access.email }
          : { id: access.orderId }),
      },
      select: PUBLIC_ORDER_SELECT,
    });

    // Không có, hay đơn của người khác đều trả cùng một lỗi → không dò được đơn nào tồn tại
    if (!order) throw new NotFoundException('Order not found');
    return order;
  }
}
