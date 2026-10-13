'use client';

import { Pencil, Eye, EyeOff, MoreVertical, ImageIcon, Tag } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { formatPriceRange, getPriceRange } from '@/lib/price';
import RemoteImage from '@/components/remote-image';

export interface Product {
  id: string;
  name: string;
  totalStock: number;
  isVisible: boolean;
  imageUrl?: string;
  categoryId?: string;
  category?: { id: string; name: string };
  variants?: Array<{ price: number | string; comparePrice?: number | string | null }>;
}

interface ProductCardProps {
  product: Product;
  onEdit: (product: Product) => void;
  onToggleVisibility: (id: string, isVisible: boolean) => void;
  isTogglePending: boolean;
}

export default function ProductCard({
  product,
  onEdit,
  onToggleVisibility,
  isTogglePending,
}: ProductCardProps) {
  const priceDisplay = formatPriceRange(getPriceRange(product.variants));

  return (
    <div className="group relative bg-card border rounded-xl overflow-hidden shadow-xs hover:shadow-md transition-shadow duration-200 flex flex-col">
      {/* Hình ảnh sản phẩm */}
      <div className="relative aspect-4/3 bg-muted overflow-hidden">
        {product.imageUrl ? (
          <RemoteImage
            src={product.imageUrl}
            alt={product.name}
            fill
            sizes="(min-width: 1280px) 25vw, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="h-full w-full flex flex-col items-center justify-center gap-2 bg-muted text-muted-foreground/60">
            <div className="p-3 bg-card rounded-xl shadow-xs border">
              <ImageIcon className="h-8 w-8 text-muted-foreground/30" />
            </div>
            <span className="text-xs font-semibold tracking-wide uppercase">No image uploaded</span>
          </div>
        )}

        {/* Nhãn hiển thị/ẩn sản phẩm - Glassmorphism */}
        <div className="absolute top-3 left-3 z-10">
          <span
            className={cn(
              'text-[10px] font-bold px-2.5 py-1 rounded-lg backdrop-blur-md border flex items-center gap-1.5 shadow-sm',
              product.isVisible
                ? 'bg-emerald-500/15 text-emerald-700 border-emerald-500/30'
                : 'bg-zinc-800/80 text-zinc-200 border-zinc-700/50'
            )}
          >
            <span
              className={cn(
                'h-1.5 w-1.5 rounded-full',
                product.isVisible ? 'bg-emerald-500 animate-pulse' : 'bg-zinc-400'
              )}
            />
            {product.isVisible ? 'Visible' : 'Hidden'}
          </span>
        </div>

        {/* Menu thả xuống chứa các hành động */}
        <div className="absolute top-3 right-3 z-10 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity duration-200">
          <DropdownMenu>
            <DropdownMenuTrigger aria-label="Product actions" className="flex h-7 w-7 items-center justify-center rounded-lg bg-background/95 backdrop-blur-md shadow-sm text-foreground hover:bg-background border transition-all cursor-pointer outline-none">
              <MoreVertical className="h-3.5 w-3.5" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="rounded-xl border-border/60">
              <DropdownMenuItem
                className="gap-2 cursor-pointer py-2"
                onClick={() => onEdit(product)}
              >
                <Pencil className="h-4 w-4" /> Edit Product
              </DropdownMenuItem>
              <DropdownMenuItem
                className="gap-2 cursor-pointer py-2"
                onClick={() => onToggleVisibility(product.id, !product.isVisible)}
                disabled={isTogglePending}
              >
                {product.isVisible ? (
                  <>
                    <EyeOff className="h-4 w-4 text-muted-foreground" /> Hide Product
                  </>
                ) : (
                  <>
                    <Eye className="h-4 w-4 text-emerald-600" /> Show Product
                  </>
                )}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Thông tin sản phẩm */}
      <div className="flex flex-col flex-1 p-5 gap-3.5">
        {/* Danh mục sản phẩm */}
        {product.category?.name && (
          <span className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground font-medium px-2 py-0.5 bg-muted rounded-md w-fit">
            <Tag className="h-3 w-3" /> {product.category.name}
          </span>
        )}

        {/* Tên sản phẩm */}
        <p className="font-medium text-sm leading-snug line-clamp-2 min-h-[40px]">
          {product.name}
        </p>

        {/* Giá bán và tồn kho */}
        <div className="flex items-center justify-between mt-auto pt-3 border-t border-border/40">
          <span className="text-[15px] font-semibold tabular-nums">
            {priceDisplay || <span className="text-muted-foreground text-xs italic font-normal">No price</span>}
          </span>
          <span
            className={cn(
              'text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 border',
              product.totalStock === 0
                ? 'bg-red-500/10 text-red-700 border-transparent dark:text-red-400'
                : product.totalStock <= 10
                ? 'bg-amber-500/10 text-amber-700 border-transparent dark:text-amber-400'
                : 'bg-muted text-muted-foreground border-transparent'
            )}
          >
            <span
              className={cn(
                'h-1.5 w-1.5 rounded-full',
                product.totalStock === 0
                  ? 'bg-red-500'
                  : product.totalStock <= 10
                  ? 'bg-amber-500'
                  : 'bg-zinc-400'
              )}
            />
            {product.totalStock === 0 ? 'Out of stock' : `${product.totalStock} in stock`}
          </span>
        </div>
      </div>
    </div>
  );
}
