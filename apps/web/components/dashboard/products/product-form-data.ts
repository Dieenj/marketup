import * as z from 'zod';
import { toVariantPayload, type VariantMatrix } from './variant-matrix';

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

// FormData (multipart, kèm ảnh) cho POST /products/:shopId và PATCH /products/:id
export function buildProductFormData(
  values: ProductBasicValues & { isVisible?: boolean },
  { variants, images }: { variants: VariantMatrix; images: File[] },
) {
  // Kiểm tra ở client (UserFacingError) trước khi gửi; nhãn và thuộc tính do API suy ra
  const variantsPayload = toVariantPayload(variants);

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
