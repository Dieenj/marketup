import type { CartLine } from '@/hooks/use-cart';

// Sản phẩm đang bán của shop (GET /products/shop/:shopId — chỉ sản phẩm đang hiển thị)
export interface CatalogProduct {
  id: string;
  name: string;
  imageUrl?: string | null;
  variants?: { id: string; label: string; price: number | string; stock: number }[];
}

interface CheckoutLine extends CartLine {
  stock: number;
  addedPrice: number; // giá lúc thêm vào giỏ
  priceChanged: boolean;
  quantityReduced: boolean; // giỏ có nhiều hơn số shop còn → đã giảm về tồn kho
}

// Đối chiếu giỏ với dữ liệu hiện tại của shop: giá và tồn kho luôn theo API.
// Món bị ẩn/xoá/hết hàng tách riêng và không được đặt (giống Shopee). API vẫn kiểm tra lại khi tạo đơn.
export function reconcileCart(lines: CartLine[], products: CatalogProduct[]) {
  const variants = new Map(
    products.flatMap((product) =>
      (product.variants ?? []).map((variant) => [variant.id, { product, variant }] as const),
    ),
  );

  const available: CheckoutLine[] = [];
  const unavailable: CartLine[] = [];

  for (const line of lines) {
    const entry = variants.get(line.variantId);
    if (!entry || entry.product.id !== line.productId || entry.variant.stock <= 0) {
      unavailable.push(line);
      continue;
    }
    const { product, variant } = entry;
    const price = Number(variant.price);
    const quantity = Math.min(line.quantity, variant.stock);
    available.push({
      ...line,
      name: product.name,
      imageUrl: product.imageUrl ?? undefined,
      variantLabel: variant.label === 'Default' ? undefined : variant.label,
      price,
      quantity,
      stock: variant.stock,
      addedPrice: line.price,
      priceChanged: price !== line.price,
      quantityReduced: quantity < line.quantity,
    });
  }

  const subtotal = available.reduce((sum, line) => sum + line.price * line.quantity, 0);
  return { available, unavailable, subtotal };
}
