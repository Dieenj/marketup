import type { CSSProperties } from 'react';
import { getContrastColor, normalizeHexColor } from '@/lib/color-utils';

// Màu thương hiệu của shop thành màu chính của theme (--primary) cho mọi thứ bên trong phần tử:
// nút, nút lọc, tab, viền... tự theo màu shop (class bg-primary, text-primary-foreground…),
// không phải truyền màu xuống từng component. Chữ trên nền màu tự đen/trắng cho dễ đọc.
// Màu đã chuẩn hoá về #rrggbb và gắn qua style của React (không chèn vào <style>).
export function brandThemeStyle(color: string | null | undefined): CSSProperties {
  const primary = normalizeHexColor(color);
  return {
    '--primary': primary,
    '--primary-foreground': getContrastColor(primary),
    '--ring': primary,
  } as CSSProperties;
}
