import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';

@Injectable()
export class CategoryService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, shopId: string, dto: CreateCategoryDto) {
    const shop = await this.prisma.shop.findUnique({
      where: { id: shopId },
    });

    if (!shop || shop.ownerId !== userId) {
      throw new ForbiddenException('You do not own this shop');
    }

    return this.prisma.category.create({
      data: {
        ...dto,
        shopId,
      },
    });
  }

  async findAllByShop(shopId: string) {
    return this.prisma.category.findMany({
      where: { shopId },
    });
  }

  async remove(userId: string, id: string) {
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: { shop: true },
    });

    if (!category || category.shop.ownerId !== userId) {
      throw new ForbiddenException('You do not own this category');
    }

    return this.prisma.category.delete({
      where: { id },
    });
  }
}
