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

// HSV cho bảng màu: h 0–360, s và v 0–1
export interface Hsv {
  h: number;
  s: number;
  v: number;
}

export function hexToHsv(hex: string): Hsv {
  const clean = normalizeHexColor(hex).slice(1);
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(clean.substring(i, i + 2), 16) / 255);
  const max = Math.max(r, g, b);
  const d = max - Math.min(r, g, b);
  let h = 0;
  if (d > 0) {
    if (max === r) h = ((g - b) / d) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h = (h * 60 + 360) % 360;
  }
  return { h, s: max === 0 ? 0 : d / max, v: max };
}

export function hsvToHex({ h, s, v }: Hsv): string {
  const f = (n: number) => {
    const k = (n + h / 60) % 6;
    const c = v - v * s * Math.max(0, Math.min(k, 4 - k, 1));
    return Math.round(c * 255)
      .toString(16)
      .padStart(2, '0');
  };
  return `#${f(5)}${f(3)}${f(1)}`;
}
