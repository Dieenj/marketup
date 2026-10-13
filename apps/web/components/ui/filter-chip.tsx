import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

// Nút lọc dạng pill (bật/tắt) dùng cho bộ lọc danh mục, trạng thái, số sao
const filterChipVariants = cva(
  'inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-full border font-medium whitespace-nowrap transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50',
  {
    variants: {
      active: {
        true: 'border-primary bg-primary text-primary-foreground',
        false: 'bg-card text-muted-foreground hover:bg-muted hover:text-foreground',
      },
      size: {
        default: 'h-8 px-3 text-sm',
        sm: 'h-7 px-2.5 text-xs',
      },
    },
    defaultVariants: {
      active: false,
      size: 'default',
    },
  },
);

function FilterChip({
  className,
  active = false,
  size,
  ...props
}: React.ComponentProps<'button'> & VariantProps<typeof filterChipVariants>) {
  return (
    <button
      type="button"
      aria-pressed={!!active}
      className={cn(filterChipVariants({ active, size }), className)}
      {...props}
    />
  );
}

export { FilterChip, filterChipVariants };
