'use client';

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams, usePathname, useSearchParams } from 'next/navigation';
import { Button, buttonVariants } from '@/components/ui/button';
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';
import SearchInput from '@/components/search-input';
import { ImageIcon, ShoppingBag, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { FilterChip } from '@/components/ui/filter-chip';
import { storefrontQueries, type StorefrontCategory } from '@/lib/storefront-queries';
import { compareByPrice, getPriceRange } from '@/lib/price';
import { matchesSearch } from '@/lib/search';
import { formatCurrency } from '@/lib/format';
import RemoteImage from '@/components/remote-image';
import { getErrorStatus } from '@/lib/api-client';
import StorefrontUnavailable from './storefront-unavailable';
import ShopHero from '@/components/shop/shop-hero';
import { StorefrontSkeleton } from './skeletons';
import ShopNotFoundView from '@/components/shop/shop-not-found';
import EmptyState from '@/components/empty-state';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ShopReviews from './shop-reviews';

type Category = StorefrontCategory;

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

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
];

const q = storefrontQueries();

type StorefrontTab = 'products' | 'reviews';
// Cao bằng thanh tab; vạch dưới tab đang chọn nằm đè lên đường viền của thanh
const TAB_CLASS = 'h-full flex-none px-0 text-base group-data-horizontal/tabs:after:-bottom-px';

export default function StorefrontClient() {
  const params = useParams();
  const slug = params.slug as string;
  const pathname = usePathname();
  // Tab nằm trên URL (?tab=reviews) để tải lại / chia sẻ link vẫn đúng tab.
  // Đổi tab bằng history.replaceState: chỉ đổi URL, không gọi lại server (SPA)
  const tab: StorefrontTab = useSearchParams().get('tab') === 'reviews' ? 'reviews' : 'products';
  const setTab = (next: StorefrontTab) =>
    window.history.replaceState(
      null,
      '',
      next === 'reviews' ? `${pathname}?tab=reviews` : pathname,
    );
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState('newest');

  const {
    data: shop,
    isLoading: shopLoading,
    error: shopError,
    refetch: refetchShop,
    isRefetching: isRefetchingShop,
  } = useQuery(q.shop(slug));
  const shopId = shop?.id ?? '';

  const { data: products, isLoading: productsLoading } = useQuery({
    ...q.products<Product>(shopId),
    enabled: !!shop?.id,
  });

  const { data: stats } = useQuery({
    ...q.shopStats(shopId),
    enabled: !!shop?.id,
  });

  const categories: Category[] = shop?.categories || [];

  const filteredProducts = useMemo(() => {
    if (!products) return [];
    // API trả sản phẩm mới nhất trước ("Newest")
    const list = products.filter(
      (p: Product) =>
        matchesSearch(searchQuery, p.name, p.description) &&
        (!selectedCategory || p.category?.id === selectedCategory),
    );

    if (sortBy === 'price-asc' || sortBy === 'price-desc') {
      const direction = sortBy === 'price-asc' ? 'asc' : 'desc';
      return [...list].sort((a, b) => compareByPrice(a.variants, b.variants, direction));
    }
    return list;
  }, [products, searchQuery, selectedCategory, sortBy]);

  const overallRating = stats?.averageRating ?? 0;

  if (shopLoading || productsLoading) return <StorefrontSkeleton shop={shop} />;

  if (!shop) {
    // Thường layout đã trả 404 từ server; tới đây nghĩa là server không gọi được API lúc render
    // mà client mới nhận 404 → hiện thẳng giao diện "Shop Not Found" (boundary cùng cấp chỉ dành cho sản phẩm)
    if (getErrorStatus(shopError) === 404) return <ShopNotFoundView />;
    return <StorefrontUnavailable onRetry={() => refetchShop()} isRetrying={isRefetchingShop} />;
  }

  return (
    <div className="min-h-screen">
      <ShopHero shop={shop} rating={overallRating} />

      <Tabs value={tab} onValueChange={(value) => setTab(value as StorefrontTab)} className="gap-0">
        {/* Dính dưới header của shop khi cuộn */}
        <div className="sticky top-16 z-30 border-b border-border bg-background/95 backdrop-blur">
          <div className="container mx-auto px-4">
            <TabsList variant="line" className="gap-6 p-0 group-data-horizontal/tabs:h-12">
              <TabsTrigger value="products" className={TAB_CLASS}>
                Products
                <span className="text-sm tabular-nums text-muted-foreground">
                  {products?.length ?? 0}
                </span>
              </TabsTrigger>
              <TabsTrigger value="reviews" className={TAB_CLASS}>
                Reviews
                <span className="text-sm tabular-nums text-muted-foreground">
                  {stats?.count ?? 0}
                </span>
              </TabsTrigger>
            </TabsList>
          </div>
        </div>

        <TabsContent value="reviews" className="container mx-auto px-4 py-8">
          <ShopReviews shopId={shop.id} slug={slug} shopName={shop.name} stats={stats} />
        </TabsContent>

        <TabsContent value="products" className="container mx-auto px-4 py-8">
          <section className="space-y-5" aria-label="Products">
            {/* Tìm + sắp xếp trên một hàng (điện thoại: xuống dòng) */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <SearchInput
                label="Search products"
                placeholder="Search products..."
                value={searchQuery}
                onChange={setSearchQuery}
                className="h-11 w-full max-w-md"
              />
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground tabular-nums">
                  {filteredProducts.length} {filteredProducts.length === 1 ? 'product' : 'products'}
                </span>
                <NativeSelect
                  aria-label="Sort products"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  {SORT_OPTIONS.map((o) => (
                    <NativeSelectOption key={o.value} value={o.value}>
                      {o.label}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
              </div>
            </div>

            {/* Category chips */}
            {categories.length > 0 && (
              <div className="flex flex-wrap gap-2">
                <FilterChip
                  active={selectedCategory === null}
                  onClick={() => setSelectedCategory(null)}
                >
                  All
                </FilterChip>
                {categories.map((cat) => (
                  <FilterChip
                    key={cat.id}
                    active={selectedCategory === cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                  >
                    {cat.name}
                  </FilterChip>
                ))}
              </div>
            )}

            {/* Product grid */}
            {filteredProducts.length === 0 ? (
              <EmptyState
                icon={ShoppingBag}
                title="No products found"
                description={
                  searchQuery || selectedCategory
                    ? 'Try adjusting your filters.'
                    : 'Check back soon!'
                }
                action={
                  (searchQuery || selectedCategory) && (
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSearchQuery('');
                        setSelectedCategory(null);
                      }}
                    >
                      Clear filters
                    </Button>
                  )
                }
              />
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {filteredProducts.map((product: Product) => {
                  const hasVariants = Boolean(product.variants?.length);
                  const variantStock =
                    product.variants?.reduce(
                      (total, variant) => total + Math.max(variant.stock, 0),
                      0,
                    ) || 0;
                  const availableStock = hasVariants ? variantStock : Number(product.stock || 0);
                  const isOutOfStock = availableStock <= 0;

                  const { min: minPrice, max: maxPrice } = getPriceRange(product.variants) ?? {
                    min: 0,
                    max: 0,
                  };

                  const comparePrices = (product.variants || [])
                    .filter((v) => v.comparePrice != null && Number(v.comparePrice) > 0)
                    .map((v) => Number(v.comparePrice));
                  const maxComparePrice = comparePrices.length > 0 ? Math.max(...comparePrices) : 0;
                  const hasDiscount = maxComparePrice > minPrice;
                  const discountPct = hasDiscount
                    ? Math.round((1 - minPrice / maxComparePrice) * 100)
                    : 0;

                  // Không prefetch: trang sản phẩm là dữ liệu động, prefetch phải gọi API (shop + sản phẩm) cho
                  // mọi thẻ đang hiện mà không nhanh hơn — bấm vào là loading.tsx hiện skeleton ngay sau 1 lượt request
                  const productHref = `/shop/${slug}/products/${product.id}`;

                  return (
                    <div
                      key={product.id}
                      className="group bg-card rounded-xl overflow-hidden border border-border hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5"
                    >
                      <Link href={productHref} prefetch={false} className="block relative">
                        <div className="aspect-4/3 relative bg-secondary overflow-hidden">
                          {product.imageUrl ? (
                            <RemoteImage
                              src={product.imageUrl}
                              alt={product.name}
                              fill
                              sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
                              className="object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                          ) : (
                            <div className="flex items-center justify-center h-full">
                              <ImageIcon className="h-8 w-8 text-muted-foreground/20" />
                            </div>
                          )}
                          <div className="absolute top-2.5 left-2.5 flex gap-1.5">
                            {product.category && (
                              <span className="text-[10px] font-semibold uppercase tracking-wide bg-black/55 text-white backdrop-blur-sm px-2.5 py-0.5 rounded-full">
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
                            <div className="absolute inset-0 bg-background/70 flex items-center justify-center">
                              <span className="text-xs font-semibold text-muted-foreground bg-card border border-border px-3 py-1 rounded-full">
                                Out of stock
                              </span>
                            </div>
                          )}
                        </div>
                      </Link>

                      <div className="flex flex-col flex-1 p-4 gap-3">
                        <Link href={productHref} prefetch={false}>
                          <h3 className="font-semibold text-sm line-clamp-2 hover:text-foreground/70 transition-colors leading-snug">
                            {product.name}
                          </h3>
                        </Link>

                        <div className="flex items-baseline gap-1.5 mt-auto">
                          {minPrice === maxPrice ? (
                            <>
                              <span className="font-bold text-base">
                                {formatCurrency(minPrice)}
                              </span>
                              {hasDiscount && maxComparePrice > 0 && (
                                <span className="text-xs text-muted-foreground line-through">
                                  {formatCurrency(maxComparePrice)}
                                </span>
                              )}
                            </>
                          ) : (
                            <span className="font-bold text-base">
                              {formatCurrency(minPrice)} – {formatCurrency(maxPrice)}
                            </span>
                          )}
                        </div>

                        <Link
                          href={productHref}
                          prefetch={false}
                          className={buttonVariants({
                            className: 'group/btn mt-auto h-9 w-full gap-2 text-xs font-semibold',
                          })}
                        >
                          View details
                          <ArrowRight className="h-3.5 w-3.5 group-hover/btn:translate-x-0.5 transition-transform" />
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </TabsContent>
      </Tabs>
    </div>
  );
}
