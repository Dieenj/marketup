'use client';

import { useRef, useState } from 'react';
import { Check } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  getContrastColor,
  hexToHsv,
  hsvToHex,
  normalizeHexColor,
  type Hsv,
} from '@/lib/color-utils';

const PRESET_COLORS = [
  { label: 'Đen', value: '#111111' },
  { label: 'Xanh dương', value: '#2563eb' },
  { label: 'Cam', value: '#ea580c' },
  { label: 'Đỏ', value: '#dc2626' },
  { label: 'Tím', value: '#7c3aed' },
  { label: 'Hồng', value: '#db2777' },
  { label: 'Xanh lá', value: '#16a34a' },
  { label: 'Teal', value: '#0d9488' },
  { label: 'Nâu', value: '#92400e' },
  { label: 'Indigo', value: '#4338ca' },
];

// Kích thước bảng màu (px): vòng sắc màu bên ngoài, ô độ đậm/sáng nằm gọn bên trong vòng
const SIZE = 184;
const RING = 20;
const SQUARE = Math.floor((SIZE / 2 - RING - 6) * Math.SQRT2);
const HUE_STEP = 5;
const SV_STEP = 0.02;

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));

interface ColorPickerProps {
  value: string;
  onChange: (hex: string) => void;
}

// Bảng màu: vòng ngoài chọn sắc màu, ô vuông giữa chọn độ đậm (ngang) và độ sáng (dọc);
// thêm ô nhập mã hex và vài màu gợi ý. Dùng được bằng chuột, cảm ứng và phím mũi tên.
export function ColorPicker({ value, onChange }: ColorPickerProps) {
  const hex = normalizeHexColor(value);
  // Giữ HSV riêng để không mất sắc màu khi kéo về trắng/đen (hex khi đó không còn sắc màu)
  const [hsv, setHsv] = useState(() => hexToHsv(hex));
  const [syncedHex, setSyncedHex] = useState(hex);
  const [hexText, setHexText] = useState(hex);
  if (hex !== syncedHex) {
    // Màu đổi từ bên ngoài (màu gợi ý, ô hex, form reset)
    setSyncedHex(hex);
    setHexText(hex);
    if (hsvToHex(hsv) !== hex) setHsv(hexToHsv(hex));
  }

  const update = (next: Hsv) => {
    setHsv(next);
    onChange(hsvToHex(next));
  };

  return (
    <div className="flex flex-wrap items-center gap-6">
      <div className="relative shrink-0" style={{ width: SIZE, height: SIZE }}>
        <HueRing hsv={hsv} onChange={update} />
        <SaturationSquare hsv={hsv} onChange={update} />
      </div>

      {/* Màn hình hẹp: xuống dưới vòng màu thay vì bị bóp */}
      <div className="min-w-48 flex-1 space-y-4">
        <div className="flex items-center gap-2">
          <span
            className="size-9 shrink-0 rounded-lg border"
            style={{ backgroundColor: hex }}
            aria-hidden
          />
          <Input
            aria-label="Hex colour code"
            value={hexText}
            maxLength={7}
            spellCheck={false}
            className="max-w-32 font-mono uppercase"
            onChange={(e) => {
              setHexText(e.target.value);
              const clean = e.target.value.trim().replace(/^#/, '');
              if (/^[0-9a-f]{6}$/i.test(clean)) onChange(`#${clean.toLowerCase()}`);
            }}
            onBlur={() => setHexText(hex)}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {PRESET_COLORS.map((color) => {
            const isActive = hex === color.value;
            return (
              <button
                key={color.value}
                type="button"
                title={color.label}
                onClick={() => onChange(color.value)}
                className="flex size-7 items-center justify-center rounded-full transition-all hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                style={{
                  backgroundColor: color.value,
                  boxShadow: isActive ? `0 0 0 2px white, 0 0 0 4px ${color.value}` : undefined,
                }}
                aria-pressed={isActive}
              >
                {isActive && (
                  <Check
                    className="size-3.5"
                    style={{ color: getContrastColor(color.value) }}
                    strokeWidth={3}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// Kéo chuột/ngón tay trên một vùng: gọi `onMove` với toạ độ trong vùng, kể cả khi kéo ra ngoài.
// `accepts`: chỉ bắt đầu kéo khi bấm vào đúng phần này của vùng.
function useDrag(
  onMove: (x: number, y: number, rect: DOMRect) => void,
  accepts?: (x: number, y: number) => boolean,
) {
  const dragging = useRef(false);
  const move = (e: React.PointerEvent<HTMLElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    onMove(e.clientX - rect.left, e.clientY - rect.top, rect);
  };
  return {
    onPointerDown: (e: React.PointerEvent<HTMLElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      if (accepts && !accepts(e.clientX - rect.left, e.clientY - rect.top)) return;
      dragging.current = true;
      e.currentTarget.setPointerCapture(e.pointerId);
      move(e);
    },
    onPointerMove: (e: React.PointerEvent<HTMLElement>) => {
      if (dragging.current) move(e);
    },
    onPointerUp: () => {
      dragging.current = false;
    },
    onPointerCancel: () => {
      dragging.current = false;
    },
  };
}

function HueRing({ hsv, onChange }: { hsv: Hsv; onChange: (hsv: Hsv) => void }) {
  const drag = useDrag(
    (x, y) => {
      // Góc tính từ đỉnh vòng, theo chiều kim đồng hồ (giống conic-gradient)
      const angle = (Math.atan2(x - SIZE / 2, SIZE / 2 - y) * 180) / Math.PI;
      onChange({ ...hsv, h: (angle + 360) % 360 });
    },
    // Chỉ phần vòng màu, không tính khoảng trống bên trong
    (x, y) => Math.hypot(x - SIZE / 2, y - SIZE / 2) >= SIZE / 2 - RING - 4,
  );
  const radius = SIZE / 2 - RING / 2;
  const rad = (hsv.h * Math.PI) / 180;

  return (
    <div
      role="slider"
      tabIndex={0}
      aria-label="Hue"
      aria-valuemin={0}
      aria-valuemax={359}
      aria-valuenow={Math.round(hsv.h)}
      className="absolute inset-0 touch-none rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      {...drag}
      onKeyDown={(e) => {
        const delta = {
          ArrowRight: HUE_STEP,
          ArrowUp: HUE_STEP,
          ArrowLeft: -HUE_STEP,
          ArrowDown: -HUE_STEP,
        }[e.key];
        if (delta === undefined) return;
        e.preventDefault();
        onChange({ ...hsv, h: (hsv.h + delta + 360) % 360 });
      }}
    >
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background: 'conic-gradient(red, yellow, lime, aqua, blue, magenta, red)',
          mask: `radial-gradient(farthest-side, transparent calc(100% - ${RING}px), #000 calc(100% - ${RING}px + 1px))`,
        }}
      />
      <span
        className="pointer-events-none absolute size-6 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-white shadow-md"
        style={{
          left: SIZE / 2 + radius * Math.sin(rad),
          top: SIZE / 2 - radius * Math.cos(rad),
          backgroundColor: `hsl(${hsv.h} 100% 50%)`,
        }}
      />
    </div>
  );
}

function SaturationSquare({ hsv, onChange }: { hsv: Hsv; onChange: (hsv: Hsv) => void }) {
  const drag = useDrag((x, y, rect) =>
    onChange({ ...hsv, s: clamp01(x / rect.width), v: clamp01(1 - y / rect.height) }),
  );

  return (
    <div
      role="slider"
      tabIndex={0}
      aria-label="Saturation and brightness"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(hsv.s * 100)}
      aria-valuetext={`Saturation ${Math.round(hsv.s * 100)}%, brightness ${Math.round(hsv.v * 100)}%`}
      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 touch-none rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      style={{
        width: SQUARE,
        height: SQUARE,
        backgroundColor: `hsl(${hsv.h} 100% 50%)`,
        backgroundImage:
          'linear-gradient(to top, #000, transparent), linear-gradient(to right, #fff, transparent)',
      }}
      {...drag}
      onKeyDown={(e) => {
        const step: Record<string, [number, number]> = {
          ArrowRight: [SV_STEP, 0],
          ArrowLeft: [-SV_STEP, 0],
          ArrowUp: [0, SV_STEP],
          ArrowDown: [0, -SV_STEP],
        };
        const delta = step[e.key];
        if (!delta) return;
        e.preventDefault();
        onChange({ ...hsv, s: clamp01(hsv.s + delta[0]), v: clamp01(hsv.v + delta[1]) });
      }}
    >
      <span
        className="pointer-events-none absolute size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-md"
        style={{
          left: `${hsv.s * 100}%`,
          top: `${(1 - hsv.v) * 100}%`,
          backgroundColor: hsvToHex(hsv),
        }}
      />
    </div>
  );
}
