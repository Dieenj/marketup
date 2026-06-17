'use client';

import { Check } from 'lucide-react';
import { getContrastColor } from '@/lib/color-utils';

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

interface ColorPickerProps {
  value: string;
  onChange: (hex: string) => void;
}

export function ColorPicker({ value, onChange }: ColorPickerProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {PRESET_COLORS.map((color) => {
        const isActive = value === color.value;
        const fg = getContrastColor(color.value);
        return (
          <button
            key={color.value}
            type="button"
            title={color.label}
            onClick={() => onChange(color.value)}
            className="h-8 w-8 rounded-full flex items-center justify-center transition-all ring-offset-2 hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{
              backgroundColor: color.value,
              boxShadow: isActive ? `0 0 0 2px white, 0 0 0 4px ${color.value}` : undefined,
            }}
            aria-pressed={isActive}
          >
            {isActive && <Check className="h-4 w-4" style={{ color: fg }} strokeWidth={3} />}
          </button>
        );
      })}
    </div>
  );
}
