// Tạo slug URL từ tên (danh mục, shop): chữ thường, số và dấu gạch ngang
export function slugify(text: string, maxLength?: number) {
  const slug = text
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
  return maxLength ? slug.slice(0, maxLength) : slug;
}
