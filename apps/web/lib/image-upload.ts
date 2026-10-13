import { toast } from 'sonner';

// Cùng quy tắc với API (apps/api/src/common/image-upload.ts) — kiểm tra ngay khi chọn ảnh
// để người dùng không phải điền xong cả form rồi mới bị từ chối
export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
export const ACCEPTED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp'];
export const MAX_PRODUCT_IMAGES = 10;

export function imageFileError(file: File) {
  if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) return 'Please choose PNG, JPG or WebP images.';
  if (file.size > MAX_IMAGE_BYTES) return 'Images must be 10MB or smaller.';
  return null;
}

// Giữ ảnh hợp lệ (tối đa `limit` ảnh), báo một lần cho những ảnh bị bỏ qua
export function pickImageFiles(files: File[], limit = MAX_PRODUCT_IMAGES) {
  const valid: File[] = [];
  let firstError: string | null = null;
  for (const file of files) {
    const error = imageFileError(file);
    if (error) firstError ??= error;
    else valid.push(file);
  }
  if (valid.length > limit) firstError ??= `You can add up to ${limit} images.`;
  if (firstError) toast.error(firstError);
  return valid.slice(0, limit);
}
