export const DEFAULT_SHOP_COLOR = '#111111';

// Chuẩn hoá màu hex do người bán nhập về dạng `#rrggbb`.
// API chấp nhận cả `#fff` và `fff` (IsHexColor); giá trị không hợp lệ quay về màu mặc định.
// Giá trị này được chèn vào <style> nên chỉ cho phép đúng ký tự hex.
export function normalizeHexColor(value: string | null | undefined, fallback = DEFAULT_SHOP_COLOR) {
  const hex = value?.trim().replace(/^#/, '') ?? '';
  if (/^[0-9a-f]{6}$/i.test(hex)) return `#${hex.toLowerCase()}`;
  if (/^[0-9a-f]{3}$/i.test(hex)) {
    return `#${hex
      .split('')
      .map((c) => c + c)
      .join('')
      .toLowerCase()}`;
  }
  return fallback;
}

export function getContrastColor(hex: string): '#ffffff' | '#000000' {
  const clean = normalizeHexColor(hex).slice(1);
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  // Relative luminance per WCAG 2.1
  const toLinear = (c: number) => {
    const s = c / 255;
    return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  const L = 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
  return L > 0.179 ? '#000000' : '#ffffff';
}
