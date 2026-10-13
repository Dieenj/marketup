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

export type PriceSortDirection = 'asc' | 'desc';

// Sắp xếp theo giá cho sản phẩm có khoảng giá (nhiều biến thể khác giá):
// thấp → cao theo giá thấp nhất, cao → thấp theo giá cao nhất — mỗi chiều khớp với đầu khoảng giá
// người mua đang nhìn. Bằng nhau thì so tiếp đầu còn lại. Sản phẩm chưa có giá tính là 0.
export function compareByPrice(
  a: PricedVariant[] | null | undefined,
  b: PricedVariant[] | null | undefined,
  direction: PriceSortDirection,
) {
  const ra = getPriceRange(a) ?? { min: 0, max: 0 };
  const rb = getPriceRange(b) ?? { min: 0, max: 0 };
  return direction === 'asc'
    ? ra.min - rb.min || ra.max - rb.max
    : rb.max - ra.max || rb.min - ra.min;
}

export function formatPriceRange(range: PriceRange | null) {
  if (!range) return null;
  return range.min === range.max
    ? formatCurrency(range.min)
    : `${formatCurrency(range.min)} – ${formatCurrency(range.max)}`;
}
