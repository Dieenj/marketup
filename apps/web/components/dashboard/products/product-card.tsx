'use client';

import { Pencil, Eye, EyeOff, MoreVertical, ImageIcon, Tag } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

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
  const prices = (product.variants || [])
    .filter((v) => v.price != null)
    .map((v) => Number(v.price));
  const minPrice = prices.length > 0 ? Math.min(...prices) : null;
  const maxPrice = prices.length > 0 ? Math.max(...prices) : null;
  const priceDisplay =
    minPrice === null || maxPrice === null
      ? null
      : minPrice === maxPrice
      ? `$${minPrice.toFixed(2)}`
      : `$${minPrice.toFixed(2)} – $${maxPrice.toFixed(2)}`;

  return (
    <div className="group relative bg-white border border-border/40 rounded-2xl overflow-hidden shadow-sm hover:shadow-lg hover:border-border/80 transition-all duration-300 flex flex-col hover:-translate-y-1">
      {/* Hình ảnh sản phẩm */}
      <div className="relative aspect-4/3 bg-muted overflow-hidden">
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="h-full w-full flex flex-col items-center justify-center gap-2 bg-linear-to-br from-zinc-50 to-zinc-100/70 text-muted-foreground/35">
            <div className="p-3 bg-white rounded-2xl shadow-sm border border-border/20">
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
            <DropdownMenuTrigger className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/95 backdrop-blur-md shadow-sm text-foreground hover:bg-white hover:scale-105 border border-border/20 transition-all cursor-pointer outline-none">
              <MoreVertical className="h-3.5 w-3.5" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="rounded-xl border-border/60">
              <DropdownMenuItem
                className="gap-2 cursor-pointer focus:bg-zinc-50 py-2 rounded-lg"
                onClick={() => onEdit(product)}
              >
                <Pencil className="h-4 w-4" /> Edit Product
              </DropdownMenuItem>
              <DropdownMenuItem
                className="gap-2 cursor-pointer focus:bg-zinc-50 py-2 rounded-lg"
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
          <span className="inline-flex items-center gap-1.5 text-[11px] text-zinc-500 font-semibold px-2 py-0.5 bg-zinc-100 rounded-md w-fit border border-zinc-200/40">
            <Tag className="h-3 w-3 text-zinc-400" /> {product.category.name}
          </span>
        )}

        {/* Tên sản phẩm */}
        <p className="font-bold text-sm leading-snug line-clamp-2 text-zinc-800 group-hover:text-black transition-colors min-h-[40px]">
          {product.name}
        </p>

        {/* Giá bán và tồn kho */}
        <div className="flex items-center justify-between mt-auto pt-3 border-t border-border/40">
          <span className="text-[15px] font-extrabold text-zinc-900">
            {priceDisplay || <span className="text-muted-foreground text-xs italic font-normal">No price</span>}
          </span>
          <span
            className={cn(
              'text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 border',
              product.totalStock === 0
                ? 'bg-red-50 text-red-600 border-red-100'
                : product.totalStock <= 10
                ? 'bg-amber-50 text-amber-700 border-amber-100'
                : 'bg-zinc-50 text-zinc-600 border-zinc-100'
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
