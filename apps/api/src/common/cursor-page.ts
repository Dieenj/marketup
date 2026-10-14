// Phân trang bằng con trỏ, mới nhất trước (danh sách đơn, đánh giá): cuộn tới đâu tải tới đó.
// Thứ tự cố định (createdAt, rồi id) để con trỏ luôn chỉ đúng vị trí, kể cả khi trùng createdAt.
// Con trỏ = dòng cuối của trang trước; lấy dư một dòng để biết còn trang sau không.
export function cursorPageArgs<C>(pageSize: number, cursor?: C) {
  return {
    orderBy: [{ createdAt: 'desc' as const }, { id: 'desc' as const }],
    take: pageSize + 1,
    ...(cursor && { cursor, skip: 1 }),
  };
}

export function toCursorPage<T>(
  pageSize: number,
  rows: T[],
  cursorOf: (row: T) => string,
) {
  const items = rows.slice(0, pageSize);
  return {
    items,
    nextCursor:
      rows.length > pageSize ? cursorOf(items[items.length - 1]) : null,
  };
}
