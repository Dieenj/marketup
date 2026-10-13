import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useHydrated } from '@/hooks/use-hydrated';

// Mỗi shop một giỏ riêng (như mỗi cửa hàng Shopify là một website): người mua luôn ở trong một shop.
// Tên, ảnh, giá chỉ để hiển thị nhanh; checkout luôn dùng giá và tồn kho hiện tại từ API.
export interface CartLine {
  productId: string;
  variantId: string;
  quantity: number;
  name: string;
  imageUrl?: string;
  variantLabel?: string;
  price: number; // giá lúc thêm vào giỏ
}

interface CartState {
  carts: Record<string, CartLine[]>;
  addItem: (shopId: string, line: CartLine) => void;
  setQuantity: (shopId: string, variantId: string, quantity: number) => void;
  removeItem: (shopId: string, variantId: string) => void;
  clearCart: (shopId: string) => void;
}

// Giỏ phiên bản 0: một danh sách chung cho mọi shop
interface LegacyCartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  imageUrl?: string;
  shopId: string;
  variantId?: string;
  variantLabel?: string;
}

function groupLegacyItems(items: LegacyCartItem[] = []) {
  const carts: Record<string, CartLine[]> = {};
  for (const item of items) {
    // Đơn hàng bắt buộc có biến thể; món thiếu shop hoặc biến thể không đặt được
    if (!item.shopId || !item.variantId) continue;
    const lines = (carts[item.shopId] ??= []);
    const existing = lines.find((l) => l.variantId === item.variantId);
    if (existing) existing.quantity += item.quantity;
    else
      lines.push({
        productId: item.id,
        variantId: item.variantId,
        quantity: item.quantity,
        name: item.name,
        imageUrl: item.imageUrl,
        variantLabel: item.variantLabel,
        price: item.price,
      });
  }
  return carts;
}

const updateLines = (
  carts: Record<string, CartLine[]>,
  shopId: string,
  update: (lines: CartLine[]) => CartLine[],
) => {
  const lines = update(carts[shopId] ?? []);
  const next = { ...carts };
  if (lines.length > 0) next[shopId] = lines;
  else delete next[shopId];
  return { carts: next };
};

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      carts: {},
      addItem: (shopId, line) =>
        set(({ carts }) =>
          updateLines(carts, shopId, (lines) =>
            lines.some((l) => l.variantId === line.variantId)
              ? lines.map((l) =>
                  l.variantId === line.variantId
                    ? { ...line, quantity: l.quantity + line.quantity }
                    : l,
                )
              : [...lines, line],
          ),
        ),
      setQuantity: (shopId, variantId, quantity) =>
        set(({ carts }) =>
          updateLines(carts, shopId, (lines) =>
            lines.map((l) =>
              l.variantId === variantId ? { ...l, quantity: Math.max(1, quantity) } : l,
            ),
          ),
        ),
      removeItem: (shopId, variantId) =>
        set(({ carts }) =>
          updateLines(carts, shopId, (lines) => lines.filter((l) => l.variantId !== variantId)),
        ),
      clearCart: (shopId) => set(({ carts }) => updateLines(carts, shopId, () => [])),
    }),
    {
      name: 'cart-storage',
      version: 1,
      migrate: (persisted, version) => {
        if (version === 0) {
          return { carts: groupLegacyItems((persisted as { items?: LegacyCartItem[] }).items) };
        }
        return persisted as Pick<CartState, 'carts'>;
      },
    },
  ),
);

const EMPTY: CartLine[] = [];

// Giỏ của một shop. Server không có localStorage nên trả giỏ rỗng tới khi hydrate xong → không lệch hydration
export function useShopCart(shopId: string | undefined) {
  const hydrated = useHydrated();
  const lines = useCartStore((state) => (shopId && state.carts[shopId]) || EMPTY);
  return hydrated ? lines : EMPTY;
}
