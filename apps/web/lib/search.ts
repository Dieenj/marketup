// Bỏ dấu tiếng Việt và chuyển chữ thường: "Áo Đầm" → "ao dam".
// Dùng cho tìm kiếm không dấu và để tạo slug (lib/slugify.ts).
export function foldText(text: string) {
  return text.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[đĐ]/g, 'd').toLowerCase();
}

// Tìm không dấu, không phân biệt hoa thường: "ao" khớp "Áo khoác"; từ khoá rỗng khớp tất cả
export function matchesSearch(query: string, ...fields: (string | null | undefined)[]) {
  const needle = foldText(query.trim());
  return !needle || fields.some((field) => field && foldText(field).includes(needle));
}
