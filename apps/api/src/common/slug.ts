// Chuẩn hoá slug từ client: bỏ dấu tiếng Việt, chữ thường, gộp/bỏ dấu gạch ngang thừa.
// VD: "Áo Thun & Quần" → "ao-thun-quan". Dùng với @Transform trước khi kiểm tra SLUG_PATTERN.
export function normalizeSlug(value: unknown) {
  if (typeof value !== 'string') return value;
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[đĐ]/g, 'd')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
