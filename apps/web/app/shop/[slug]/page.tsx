'use client';

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api-client';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ImageIcon, ShoppingBag, Search, ArrowRight, Star } from 'lucide-react';
import Link from 'next/link';
import WriteReviewDialog from '@/components/shop/write-review-dialog';

interface Category {
  id: string;
  name: string;
}

interface Product {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  stock?: number;
  variants?: Array<{ 
    id: string; 
    stock: number;
    price: number | string;
    comparePrice?: number | string | null;
  }>;
  category?: { id: string; name: string };
}

export default function StorefrontPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isReviewOpen, setIsReviewOpen] = useState(false);

  const { data: shop, isLoading: shopLoading } = useQuery({
    queryKey: ['shop', slug],
    queryFn: async () => {
      const { data } = await api.get(`/shops/${slug}`);
      return data;
    },
  });

  const { data: products, isLoading: productsLoading } = useQuery({
    queryKey: ['products', shop?.id],
    queryFn: async () => {
      const { data } = await api.get(`/products/shop/${shop.id}`);
      return data;
    },
    enabled: !!shop?.id,
  });

  const { data: stats } = useQuery({
    queryKey: ['shop-stats', shop?.id],
    queryFn: async () => {
      const { data } = await api.get(`/reviews/shop/${shop.id}/stats`);
      return data;
    },
    enabled: !!shop?.id,
  });

  const categories: Category[] = shop?.categories || [];

  const filteredProducts = useMemo(() => {
    if (!products) return [];
    return products.filter((p: Product) => {
      const matchesSearch =
        !searchQuery ||
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesCategory =
        !selectedCategory || p.category?.id === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [products, searchQuery, selectedCategory]);

  if (shopLoading || productsLoading) {
    return (
      <div className="container mx-auto px-4 py-20 flex justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  if (!shop) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-4xl font-bold mb-4">Shop Not Found</h1>
        <p className="text-muted-foreground">The store you are looking for does not exist.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Phần ảnh bìa Hero Section */}
      <section className="bg-[#111111] text-white px-4 py-20 text-center">
        <div className="container mx-auto max-w-2xl space-y-4">
          <h1 className="text-5xl font-extrabold tracking-tight">{shop.name}</h1>
          <p className="text-white/60 text-lg max-w-xl mx-auto leading-relaxed">
            {shop.description || 'Welcome to our store! Browse our collection of amazing products.'}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2.5 pt-2">
            <div className="inline-flex items-center gap-1.5 bg-white/10 text-white/80 text-xs font-medium px-3 py-1.5 rounded-full border border-white/10">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              {products?.length || 0} products available
            </div>
            {stats?.totalCount > 0 && (
              <div className="inline-flex items-center gap-1.5 bg-white/10 text-white/80 text-xs font-medium px-3 py-1.5 rounded-full border border-white/10">
                <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                <span>
                  {stats.averageShopRating > 0 ? stats.averageShopRating : stats.averageProductRating} Rating ({stats.totalCount} reviews)
                </span>
              </div>
            )}
            <button
              onClick={() => setIsReviewOpen(true)}
              className="inline-flex items-center gap-1 bg-white/10 hover:bg-white/20 text-white/80 hover:text-white text-xs font-semibold px-3 py-1.5 rounded-full border border-white/10 transition-colors"
            >
              <Star className="h-3 w-3 fill-current" />
              Write Shop Review
            </button>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-10 space-y-8">
        {/* Phần tìm kiếm và bộ lọc sản phẩm */}
        <section className="space-y-4">
          <div className="relative max-w-md mx-auto">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search products..."
              className="pl-10 h-11 bg-white rounded-xl border-border/70 focus-visible:ring-1 focus-visible:ring-foreground"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {categories.length > 0 && (
            <div className="flex flex-wrap gap-2 justify-center">
              <button
                onClick={() => setSelectedCategory(null)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all border ${
                  selectedCategory === null
                    ? 'bg-[#111111] text-white border-[#111111]'
                    : 'bg-white text-muted-foreground border-border hover:border-foreground/30 hover:text-foreground'
                }`}
              >
                All
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all border ${
                    selectedCategory === cat.id
                      ? 'bg-[#111111] text-white border-[#111111]'
                      : 'bg-white text-muted-foreground border-border hover:border-foreground/30 hover:text-foreground'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          )}
        </section>

        {/* Lưới hiển thị danh sách sản phẩm */}
        <section>
          {filteredProducts.length === 0 ? (
            <div className="py-24 text-center">
              <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-muted mb-4">
                <ShoppingBag className="h-7 w-7 text-muted-foreground" />
              </div>
              <p className="font-semibold text-foreground">No products found</p>
              <p className="text-muted-foreground text-sm mt-1">
                {searchQuery || selectedCategory ? 'Try adjusting your filters.' : 'Check back soon!'}
              </p>
              {(searchQuery || selectedCategory) && (
                <Button
                  variant="outline"
                  className="mt-4 rounded-xl"
                  onClick={() => { setSearchQuery(''); setSelectedCategory(null); }}
                >
                  Clear filters
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {filteredProducts.map((product: Product) => {
                const hasVariants = Boolean(product.variants?.length);
                const variantStock = product.variants?.reduce((total, variant) => total + Math.max(variant.stock, 0), 0) || 0;
                const availableStock = hasVariants ? variantStock : Number(product.stock || 0);
                const isOutOfStock = availableStock <= 0;
                
                // Tính toán khoảng giá từ các biến thể (variants)
                const prices = (product.variants || [])
                  .filter(v => v.price != null)
                  .map(v => Number(v.price));
                const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
                const maxPrice = prices.length > 0 ? Math.max(...prices) : 0;
                
                // Tính toán giá so sánh để hiển thị nhãn giảm giá (discount badge)
                const comparePrices = (product.variants || [])
                  .filter(v => v.comparePrice != null && Number(v.comparePrice) > 0)
                  .map(v => Number(v.comparePrice));
                const maxComparePrice = comparePrices.length > 0 ? Math.max(...comparePrices) : 0;
                const hasDiscount = maxComparePrice > minPrice;
                const discountPct = hasDiscount
                  ? Math.round((1 - minPrice / maxComparePrice) * 100)
                  : 0;
                  
                return (
                  <div
                    key={product.id}
                    className="group bg-white rounded-2xl overflow-hidden flex flex-col border border-border/60 hover:border-foreground/10 hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] hover:-translate-y-0.5 transition-all duration-300"
                  >
                    {/* Hình ảnh sản phẩm */}
                    <Link href={`/shop/${slug}/products/${product.id}`} className="block relative">
                      <div className="aspect-4/3 relative bg-[#f5f5f5] overflow-hidden">
                        {product.imageUrl ? (
                          <img
                            src={product.imageUrl}
                            alt={product.name}
                            className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full">
                            <ImageIcon className="h-10 w-10 text-muted-foreground/20" />
                          </div>
                        )}
                        {/* Nhãn giảm giá / hết hàng */}
                        <div className="absolute top-2.5 left-2.5 flex gap-1.5">
                          {product.category && (
                            <span className="text-[10px] font-semibold uppercase tracking-wide bg-black/60 text-white backdrop-blur-sm px-2.5 py-0.5 rounded-full">
                              {product.category.name}
                            </span>
                          )}
                          {hasDiscount && (
                            <span className="text-[10px] font-bold bg-red-500 text-white px-2.5 py-0.5 rounded-full">
                              -{discountPct}%
                            </span>
                          )}
                        </div>
                        {isOutOfStock && (
                          <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
                            <span className="text-xs font-semibold text-muted-foreground bg-white border border-border px-3 py-1 rounded-full">
                              Out of stock
                            </span>
                          </div>
                        )}
                      </div>
                    </Link>

                    {/* Thông tin sản phẩm */}
                    <div className="flex flex-col flex-1 p-4 gap-3">
                      <Link href={`/shop/${slug}/products/${product.id}`}>
                        <h3 className="font-semibold text-sm line-clamp-2 hover:text-foreground/70 transition-colors">
                          {product.name}
                        </h3>
                      </Link>

                      {/* Giá bán hiển thị */}
                      <div className="flex items-baseline gap-1.5 mt-auto">
                        {minPrice === maxPrice ? (
                          <>
                            <span className="font-bold text-base">${minPrice.toFixed(2)}</span>
                            {hasDiscount && maxComparePrice > 0 && (
                              <span className="text-xs text-muted-foreground line-through">
                                ${maxComparePrice.toFixed(2)}
                              </span>
                            )}
                          </>
                        ) : (
                          <span className="font-bold text-base">
                            ${minPrice.toFixed(2)} – ${maxPrice.toFixed(2)}
                          </span>
                        )}
                      </div>

                      <Link href={`/shop/${slug}/products/${product.id}`} className="mt-auto block">
                        <button className="w-full h-9.5 rounded-xl bg-neutral-900 text-white text-xs font-semibold hover:bg-black transition-all flex items-center justify-center gap-2 group/btn shadow-sm hover:shadow">
                          View details
                          <ArrowRight className="h-3.5 w-3.5 group-hover/btn:translate-x-1 transition-transform" />
                        </button>
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>

      <WriteReviewDialog
        open={isReviewOpen}
        onOpenChange={setIsReviewOpen}
        shopId={shop.id}
      />
    </div>
  );
}
