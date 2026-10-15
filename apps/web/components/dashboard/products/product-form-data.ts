import * as z from 'zod';
import type { VariantDef } from './variants-editor';
import { UserFacingError } from '@/lib/api-client';

// Trường cơ bản của sản phẩm — dialog tạo dùng trực tiếp, dialog sửa mở rộng thêm isVisible
export const productSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Product name is required (min 2 characters)')
    .max(200, 'Product name must be at most 200 characters'),
  description: z.string().max(5000, 'Description must be at most 5000 characters').optional(),
  categoryId: z.string().optional(),
});

export type ProductBasicValues = z.infer<typeof productSchema>;

// Chuẩn hoá biến thể trước khi gửi. API yêu cầu mọi biến thể có giá hợp lệ ở cả tạo lẫn sửa,
// nên kiểm tra ngay ở client để báo lỗi sớm thay vì chờ 400 từ server.
function serializeVariants(variants: VariantDef[]) {
  if (variants.length === 0) throw new UserFacingError('Product must have at least one variant');

  const normalized = variants.map((v) => ({
    ...(v.id && { id: v.id }),
    // Nhãn và thuộc tính do API suy ra từ options
    options: v.options,
    stock: Number(v.stock) || 0,
    price: v.price ? Number(v.price) : undefined,
    sku: v.sku || undefined,
  }));

  if (normalized.some((v) => v.price === undefined || Number.isNaN(v.price))) {
    throw new UserFacingError('Each variant must have a valid price');
  }
  return normalized;
}

// FormData (multipart, kèm ảnh) cho POST /products/:shopId và PATCH /products/:id
export function buildProductFormData(
  values: ProductBasicValues & { isVisible?: boolean },
  { variants, images }: { variants: VariantDef[]; images: File[] },
) {
  const variantsPayload = serializeVariants(variants);

  const formData = new FormData();
  formData.append('name', values.name);
  // Luôn gửi mô tả để khi sửa có thể xoá trắng mô tả cũ
  formData.append('description', values.description ?? '');
  // Luôn gửi danh mục: chuỗi rỗng = không có danh mục (khi sửa: bỏ danh mục cũ)
  formData.append('categoryId', values.categoryId ?? '');
  if (values.isVisible !== undefined) formData.append('isVisible', String(values.isVisible));
  images.forEach((img) => formData.append('images', img));
  formData.append('variants', JSON.stringify(variantsPayload));
  return formData;
}
