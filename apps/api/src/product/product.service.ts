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
import { CreateVariantDto, MAX_VARIANTS } from './dto/product-variant.dto';
import { parseJsonArray } from './product-payload';
import { deriveProductOptions } from './product-options';

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
  ) {
    const shop = await this.prisma.shop.findUnique({ where: { id: shopId } });
    if (!shop || shop.ownerId !== userId) {
      throw new ForbiddenException('You do not own this shop');
    }

    const { variants: variantsRaw, ...productData } = dto;
    const variants = parseJsonArray(
      variantsRaw,
      CreateVariantDto,
      'variants',
      MAX_VARIANTS,
    );
    // Sản phẩm phải có ít nhất một biến thể (variant)
    if (!variants) {
      throw new BadRequestException('Product must have at least one variant');
    }
    const derived = deriveProductOptions(variants);
    await this.assertCategoryInShop(productData.categoryId, shopId);

    // Chỉ upload sau khi dữ liệu hợp lệ → không để lại ảnh mồ côi trên Cloudinary
    const imageUrls = await this.uploadImages(images);

    const product = await this.prisma.product.create({
      data: {
        ...productData,
        categoryId: productData.categoryId || null,
        shopId,
        imageUrl: imageUrls[0] || null, // Lấy ảnh đầu tiên làm ảnh đại diện chính
        images: imageUrls,
        attributes: { create: derived.attributes },
        variants: {
          create: variants.map((v, i) => ({
            ...derived.variants[i],
            price: v.price,
            stock: v.stock,
            sku: v.sku ?? null,
          })),
        },
      },
      include: { attributes: true, variants: true, category: true },
    });

    return this.addTotalStock(product);
  }

  // Storefront: như findOne, shop ngừng hoạt động thì không liệt kê sản phẩm
  async findAllByShop(shopId: string) {
    const products = await this.prisma.product.findMany({
      where: { shopId, isVisible: true, shop: { isActive: true } },
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

  // Trang sản phẩm công khai: sản phẩm ẩn hoặc shop ngừng hoạt động coi như không tồn tại
  async findOne(id: string) {
    const product = await this.prisma.product.findFirst({
      where: { id, isVisible: true, shop: { isActive: true } },
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
  ) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: { shop: true, variants: { select: { id: true } } },
    });
    if (!product || product.shop.ownerId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    const { variants: variantsRaw, ...productData } = dto;
    // Không gửi variants (vd. chỉ bật/tắt hiển thị) → giữ nguyên biến thể và thuộc tính
    const variants = parseJsonArray(
      variantsRaw,
      CreateVariantDto,
      'variants',
      MAX_VARIANTS,
    );
    const derived = variants && deriveProductOptions(variants);

    // Chỉ được sửa biến thể của chính sản phẩm này — id do client gửi lên, trước đây không kiểm tra
    // nên người bán này sửa được giá/tồn kho biến thể của shop khác
    const existingIds = new Set(product.variants.map((v) => v.id));
    if (variants?.some((v) => v.id && !existingIds.has(v.id))) {
      throw new BadRequestException('Variant does not belong to this product');
    }
    await this.assertCategoryInShop(productData.categoryId, product.shopId);

    // Ảnh mới (nếu có) thay toàn bộ ảnh cũ; upload sau khi dữ liệu hợp lệ
    const newImageUrls = await this.uploadImages(images);
    const imageData =
      newImageUrls.length > 0
        ? { images: newImageUrls, imageUrl: newImageUrls[0] }
        : {};

    // Một transaction: lỗi giữa chừng không để lại sản phẩm nửa cũ nửa mới
    const updated = await this.prisma.$transaction(async (tx) => {
      if (variants && derived) {
        // Thuộc tính luôn dựng lại từ biến thể
        await tx.productAttribute.deleteMany({ where: { productId: id } });
        if (derived.attributes.length > 0) {
          await tx.productAttribute.createMany({
            data: derived.attributes.map((a) => ({ ...a, productId: id })),
          });
        }

        // Biến thể có trong DB nhưng không còn trong danh sách gửi lên → xoá
        // (OrderItem giữ snapshot nhãn/giá; variantId tự về null)
        const keptIds = variants
          .map((v) => v.id)
          .filter((v): v is string => !!v);
        await tx.productVariant.deleteMany({
          where: { productId: id, id: { notIn: keptIds } },
        });
        for (const [i, v] of variants.entries()) {
          const data = {
            ...derived.variants[i],
            price: v.price,
            stock: v.stock,
            sku: v.sku ?? null,
          };
          if (v.id) {
            await tx.productVariant.update({ where: { id: v.id }, data });
          } else {
            await tx.productVariant.create({
              data: { ...data, productId: id },
            });
          }
        }
      }

      return tx.product.update({
        where: { id },
        data: {
          ...productData,
          ...(productData.categoryId !== undefined && {
            categoryId: productData.categoryId || null,
          }),
          ...imageData,
        },
        include: { attributes: true, variants: true, category: true },
      });
    });

    return this.addTotalStock(updated);
  }

  async remove(userId: string, id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: { shop: true },
    });
    if (!product || product.shop.ownerId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    // Kiểm tra xem product đã từng có đơn hàng chưa
    const orderItemCount = await this.prisma.orderItem.count({
      where: { productId: id },
    });

    if (orderItemCount > 0) {
      // Soft delete: Ẩn sản phẩm để bảo toàn lịch sử đơn hàng
      return this.prisma.product.update({
        where: { id },
        data: { isVisible: false },
      });
    }

    // Hard delete: Sản phẩm chưa có đơn hàng nào, xóa thẳng
    return this.prisma.product.delete({ where: { id } });
  }

  // categoryId rỗng = không có danh mục; có giá trị thì phải là danh mục của chính shop này
  private async assertCategoryInShop(
    categoryId: string | undefined,
    shopId: string,
  ) {
    if (!categoryId) return;
    const category = await this.prisma.category.findFirst({
      where: { id: categoryId, shopId },
      select: { id: true },
    });
    if (!category)
      throw new BadRequestException('Category not found in this shop');
  }

  private async uploadImages(images?: Express.Multer.File[]) {
    if (!images?.length) return [];
    return Promise.all(images.map((img) => this.cloudinary.uploadImage(img)));
  }

  private addTotalStock<T extends { variants: { stock: number }[] }>(
    product: T,
  ) {
    const totalStock = product.variants.reduce((sum, v) => sum + v.stock, 0);
    return { ...product, totalStock };
  }
}
