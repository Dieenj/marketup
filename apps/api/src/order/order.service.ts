import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderStatus } from '@prisma/client';
import { MailService } from '../mail/mail.service';

@Injectable()
export class OrderService {
  private readonly logger = new Logger(OrderService.name);

  constructor(
    private prisma: PrismaService,
    private mailService: MailService,
  ) {}

  async create(dto: CreateOrderDto) {
    const { items, ...orderData } = dto;

    const orderNumber = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const order = await this.prisma.$transaction(async (tx) => {
      let subtotal = 0;
      const orderItemsData: any[] = [];

      for (const item of items) {
        const product = await tx.product.findUnique({
          where: { id: item.productId },
          include: { variants: true },
        });

        if (!product || product.shopId !== dto.shopId) {
          throw new BadRequestException(
            `Product ${item.productId} not found in this shop`,
          );
        }

        if (!item.variantId) {
          throw new BadRequestException(
            `Variant selection required for ${product.name}`,
          );
        }

        // Lấy biến thể sản phẩm bên trong transaction để nhận trạng thái tồn kho mới nhất đã được khóa
        const variant = await tx.productVariant.findUnique({
          where: { id: item.variantId },
        });

        if (!variant || variant.productId !== item.productId) {
          throw new BadRequestException(`Variant ${item.variantId} not found`);
        }

        if (variant.stock < item.quantity) {
          throw new BadRequestException(
            `Insufficient stock for variant ${variant.label}. Available: ${variant.stock}, Requested: ${item.quantity}`,
          );
        }

        const price = Number(variant.price);
        subtotal += price * item.quantity;

        orderItemsData.push({
          productId: item.productId,
          quantity: item.quantity,
          priceAtPurchase: price,
          productName: product.name,
          productImage: product.imageUrl,
          variantId: item.variantId,
          variantLabel: variant.label, // Chụp lại thông tin trực tiếp từ cơ sở dữ liệu (Snapshot)!
        });

        // Giảm số lượng tồn kho của biến thể bên trong transaction
        await tx.productVariant.update({
          where: { id: item.variantId },
          data: { stock: { decrement: item.quantity } },
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
        include: {
          items: true,
          shop: true,
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

    return order;
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

  async findOne(id: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: { items: true, shop: true },
    });

    if (!order) throw new NotFoundException('Order not found');
    return order;
  }
}
