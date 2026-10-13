import {
  Injectable,
  ConflictException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateShopDto } from './dto/create-shop.dto';
import { UpdateShopDto } from './dto/update-shop.dto';
import { Prisma } from '@prisma/client';

// Thông tin shop công khai trên storefront (không có ownerId, trạng thái nội bộ)
const PUBLIC_SHOP_SELECT = {
  id: true,
  name: true,
  slug: true,
  description: true,
  logoUrl: true,
  bannerUrl: true,
  primaryColor: true,
  contactEmail: true,
  contactPhone: true,
  address: true,
  categories: { select: { id: true, name: true, slug: true } },
} satisfies Prisma.ShopSelect;

@Injectable()
export class ShopService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreateShopDto) {
    const existingShop = await this.prisma.shop.findFirst({
      where: {
        OR: [{ ownerId: userId }, { slug: dto.slug }],
      },
    });

    if (existingShop) {
      if (existingShop.ownerId === userId) {
        throw new ConflictException('You already own a shop');
      }
      throw new ConflictException('Slug already taken');
    }

    return this.prisma.shop.create({
      data: {
        ...dto,
        ownerId: userId,
      },
    });
  }

  async findBySlug(slug: string) {
    const shop = await this.prisma.shop.findUnique({
      where: { slug, isActive: true },
      select: PUBLIC_SHOP_SELECT,
    });

    if (!shop) {
      throw new NotFoundException('Shop not found');
    }

    return shop;
  }

  async findByOwner(userId: string) {
    const shop = await this.prisma.shop.findUnique({
      where: { ownerId: userId },
    });

    if (!shop) {
      throw new NotFoundException('Shop not found');
    }

    return shop;
  }

  async update(userId: string, shopId: string, dto: UpdateShopDto) {
    const shop = await this.prisma.shop.findUnique({
      where: { id: shopId },
    });

    if (!shop) {
      throw new NotFoundException('Shop not found');
    }

    if (shop.ownerId !== userId) {
      throw new ForbiddenException('Only the owner can update the shop');
    }

    return this.prisma.shop.update({
      where: { id: shopId },
      data: dto,
    });
  }
}
