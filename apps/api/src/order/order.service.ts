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

    // Calculate totals and verify products
    let subtotal = 0;
    const orderItemsData: any[] = [];

    for (const item of items) {
      const product = await this.prisma.product.findUnique({
        where: { id: item.productId },
        include: { variants: true },
      });

      if (!product || product.shopId !== dto.shopId) {
        throw new BadRequestException(
          `Product ${item.productId} not found in this shop`,
        );
      }

      let price = 0;

      // Use variant stock if variantId provided
      if (item.variantId) {
        const variant = product.variants.find((v) => v.id === item.variantId);
        if (!variant) {
          throw new BadRequestException(`Variant ${item.variantId} not found`);
        }
        if (variant.stock < item.quantity) {
          throw new BadRequestException(
            `Insufficient stock for variant ${variant.label}`,
          );
        }
        price = Number(variant.price);
      } else {
        throw new BadRequestException(
          `Variant selection required for ${product.name}`,
        );
      }

      subtotal += price * item.quantity;

      orderItemsData.push({
        productId: item.productId,
        quantity: item.quantity,
        priceAtPurchase: price,
        productName: product.name,
        productImage: product.imageUrl,
        ...(item.variantId ? { variantId: item.variantId } : {}),
        ...(item.variantLabel ? { variantLabel: item.variantLabel } : {}),
      });
    }

    const orderNumber = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const order = await this.prisma.$transaction(async (tx) => {
      // 1. Create order
      const orderDataResult = await tx.order.create({
        data: {
          ...orderData,
          orderNumber,
          subtotal,
          totalAmount: subtotal, // For now, no shipping fee/discount logic
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

      // 2. Update variant stock
      for (const item of items) {
        if (item.variantId) {
          await tx.productVariant.update({
            where: { id: item.variantId },
            data: { stock: { decrement: item.quantity } },
          });
        }
        // Note: Products without variants cannot be ordered (all stock is variant-based)
      }

      return orderDataResult;
    });

    // Send order confirmation email asynchronously
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
      include: { shop: true },
    });

    if (!order || order.shop.ownerId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    const updatedOrder = await this.prisma.order.update({
      where: { id: orderId },
      data: { status },
      include: { items: true, shop: true },
    });

    // Trigger emails asynchronously
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
