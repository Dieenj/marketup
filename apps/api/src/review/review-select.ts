import type { Prisma } from '@prisma/client';

// Đánh giá công khai (storefront): tên đã che, không có email hay thông tin đơn
export const PUBLIC_REVIEW_SELECT = {
  id: true,
  rating: true,
  comment: true,
  buyerName: true,
  editedAt: true,
  sellerReply: true,
  sellerRepliedAt: true,
  createdAt: true,
  product: { select: { id: true, name: true } },
} satisfies Prisma.ReviewSelect;

// Đánh giá của chính người mua, hiển thị cạnh sản phẩm trong trang đơn
export const BUYER_REVIEW_SELECT = {
  id: true,
  rating: true,
  comment: true,
  editedAt: true,
  sellerReply: true,
  createdAt: true,
} satisfies Prisma.ReviewSelect;
