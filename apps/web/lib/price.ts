import { formatCurrency } from '@/lib/format';

interface PricedVariant {
  price?: number | string | null;
}

export interface PriceRange {
  min: number;
  max: number;
}

// Khoảng giá từ các biến thể; null nếu không có biến thể nào có giá
export function getPriceRange(variants: PricedVariant[] | null | undefined): PriceRange | null {
  const prices = (variants ?? []).filter((v) => v.price != null).map((v) => Number(v.price));
  if (prices.length === 0) return null;
  return { min: Math.min(...prices), max: Math.max(...prices) };
}

// Giá thấp nhất, dùng để sắp xếp (sản phẩm chưa có giá tính là 0)
export function getMinPrice(variants: PricedVariant[] | null | undefined) {
  return getPriceRange(variants)?.min ?? 0;
}

export function formatPriceRange(range: PriceRange | null) {
  if (!range) return null;
  return range.min === range.max
    ? formatCurrency(range.min)
    : `${formatCurrency(range.min)} – ${formatCurrency(range.max)}`;
}
