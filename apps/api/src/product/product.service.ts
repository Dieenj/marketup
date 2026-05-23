import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CloudinaryProvider } from '../upload/cloudinary.provider';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import {
  CreateVariantDto,
  CreateAttributeDto,
} from './dto/product-variant.dto';

@Injectable()
export class ProductService {
  constructor(
    private prisma: PrismaService,
    private cloudinary: CloudinaryProvider,
  ) {}

  async create(
    userId: string,
    shopId: string,
    dto: CreateProductDto,
    images?: Express.Multer.File[],
    attributesRaw?: string,
    variantsRaw?: string,
  ) {
    const shop = await this.prisma.shop.findUnique({ where: { id: shopId } });
    if (!shop || shop.ownerId !== userId) {
      throw new ForbiddenException('You do not own this shop');
    }

    // Upload multiple images
    let imageUrls: string[] = [];
    if (images && images.length > 0) {
      imageUrls = await Promise.all(
        images.map((img) => this.cloudinary.uploadImage(img)),
      );
    }

    const {
      attributes: _attrField,
      variants: _varField,
      images: _images,
      ...productData
    } = dto as any;
    const rawAttr = attributesRaw ?? _attrField;
    const rawVar = variantsRaw ?? _varField;

    let attributes: CreateAttributeDto[] = [];
    let variants: CreateVariantDto[] = [];

    try {
      attributes = rawAttr ? JSON.parse(rawAttr) : [];
    } catch (error) {
      throw new BadRequestException('Invalid attributes format');
    }

    try {
      variants = rawVar ? JSON.parse(rawVar) : [];
    } catch (error) {
      throw new BadRequestException('Invalid variants format');
    }

    // Validate: Product must have at least one variant
    if (!Array.isArray(variants) || variants.length === 0) {
      throw new BadRequestException('Product must have at least one variant');
    }

    const normalizedVariants = variants.map((v) => ({
      ...v,
      price:
        v.price !== undefined && v.price !== null ? Number(v.price) : undefined,
      stock: Number(v.stock ?? 0),
    }));

    if (
      normalizedVariants.some(
        (v) => v.price === undefined || Number.isNaN(v.price),
      )
    ) {
      throw new BadRequestException('Each variant must have a valid price');
    }

    if (normalizedVariants.some((v) => Number.isNaN(v.stock))) {
      throw new BadRequestException(
        'Each variant must have a valid stock quantity',
      );
    }

    const product = await this.prisma.product.create({
      data: {
        ...productData,
        shopId,
        imageUrl: imageUrls[0] || null, // First image as main
        images: imageUrls,
        attributes:
          attributes.length > 0
            ? {
                create: attributes.map((a) => ({
                  name: a.name,
                  options: a.options,
                })),
              }
            : undefined,
        variants:
          normalizedVariants.length > 0
            ? {
                create: normalizedVariants.map((v) => ({
                  label: v.label,
                  options: v.options,
                  price: v.price as number,
                  stock: v.stock,
                  sku: v.sku ?? null,
                })),
              }
            : undefined,
      },
      include: { attributes: true, variants: true, category: true },
    });

    return this.addTotalStock(product);
  }

  async findAllByShop(shopId: string) {
    const products = await this.prisma.product.findMany({
      where: { shopId, isVisible: true },
      include: { category: true, attributes: true, variants: true },
      orderBy: { createdAt: 'desc' },
    });
    return products.map((p) => this.addTotalStock(p));
  }

  async findAllByShopOwner(userId: string, shopId: string) {
    const shop = await this.prisma.shop.findUnique({ where: { id: shopId } });
    if (!shop || shop.ownerId !== userId) {
      throw new ForbiddenException('Access denied');
    }
    const products = await this.prisma.product.findMany({
      where: { shopId },
      include: { category: true, attributes: true, variants: true },
      orderBy: { createdAt: 'desc' },
    });
    return products.map((p) => this.addTotalStock(p));
  }

  async findOne(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: { category: true, attributes: true, variants: true },
    });
    if (!product) throw new NotFoundException('Product not found');
    return this.addTotalStock(product);
  }

  async update(
    userId: string,
    id: string,
    dto: UpdateProductDto,
    images?: Express.Multer.File[],
    attributesRaw?: string,
    variantsRaw?: string,
  ) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: { shop: true },
    });
    if (!product || product.shop.ownerId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    // Upload new images if provided
    let imageUrls = product.images;
    let imageUrl = product.imageUrl;
    if (images && images.length > 0) {
      imageUrls = await Promise.all(
        images.map((img) => this.cloudinary.uploadImage(img)),
      );
      imageUrl = imageUrls[0] || null;
    }

    const {
      attributes: _attrField,
      variants: _varField,
      images: _images,
      ...productData
    } = dto as any;
    const rawAttr = attributesRaw ?? _attrField;
    const rawVar = variantsRaw ?? _varField;

    // Replace attributes & variants if provided
    if (rawAttr !== undefined) {
      const attributes: CreateAttributeDto[] = JSON.parse(rawAttr);
      await this.prisma.productAttribute.deleteMany({
        where: { productId: id },
      });
      if (attributes.length > 0) {
        await this.prisma.productAttribute.createMany({
          data: attributes.map((a) => ({
            name: a.name,
            options: a.options,
            productId: id,
          })),
        });
      }
    }

    if (rawVar !== undefined) {
      const variants: CreateVariantDto[] = JSON.parse(rawVar);

      // Validate: Product must have at least one variant
      if (variants.length === 0) {
        throw new BadRequestException('Product must have at least one variant');
      }

      await this.prisma.productVariant.deleteMany({ where: { productId: id } });
      if (variants.length > 0) {
        await this.prisma.productVariant.createMany({
          data: variants.map((v) => {
            const price =
              v.price !== undefined && v.price !== null
                ? Number(v.price)
                : undefined;
            if (price === undefined || Number.isNaN(price)) {
              throw new BadRequestException(
                'Each variant must have a valid price',
              );
            }
            return {
              label: v.label,
              options: v.options,
              price: price,
              stock: Number(v.stock ?? 0),
              sku: v.sku ?? null,
              productId: id,
            };
          }),
        });
      }
    }

    return this.prisma.product
      .update({
        where: { id },
        data: { ...productData, imageUrl, images: imageUrls },
        include: { attributes: true, variants: true, category: true },
      })
      .then((p) => this.addTotalStock(p));
  }

  async remove(userId: string, id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: { shop: true },
    });
    if (!product || product.shop.ownerId !== userId) {
      throw new ForbiddenException('Access denied');
    }
    return this.prisma.product.delete({ where: { id } });
  }

  private addTotalStock(product: any) {
    const totalStock =
      product.variants?.reduce(
        (sum: number, v: any) => sum + (v.stock || 0),
        0,
      ) || 0;
    return { ...product, totalStock };
  }
}
