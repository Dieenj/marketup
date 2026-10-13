// Tạo slug URL từ tên (danh mục, shop): bỏ dấu tiếng Việt, chữ thường, số và dấu gạch ngang.
// VD: "Áo Thun & Quần" → "ao-thun-quan". Cùng quy tắc với API (apps/api/src/common/slug.ts).
export function slugify(text: string, maxLength?: number) {
  const slug = text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[đĐ]/g, 'd')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return maxLength ? slug.slice(0, maxLength).replace(/-+$/, '') : slug;
}
