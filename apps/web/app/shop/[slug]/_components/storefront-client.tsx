'use client';

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ImageIcon, ShoppingBag, Search, ArrowRight, Filter } from 'lucide-react';
import Link from 'next/link';
import WriteReviewDialog from '@/components/shop/write-review-dialog';
import { getContrastColor, normalizeHexColor } from '@/lib/color-utils';
import { storefrontQueries, type StorefrontCategory } from '@/lib/storefront-queries';
import { getMinPrice, getPriceRange } from '@/lib/price';
import { formatCurrency, formatDate } from '@/lib/format';
import RemoteImage from '@/components/remote-image';
import StarRating from '@/components/star-rating';
import { getErrorStatus } from '@/lib/api-client';
import StorefrontUnavailable from './storefront-unavailable';
import ShopHero from './shop-hero';
import { StorefrontSkeleton } from './skeletons';
import ShopNotFoundView from '@/components/shop/shop-not-found';

type Category = StorefrontCategory;

interface ShopStats {
  averageShopRating: number;
  averageProductRating: number;
  totalCount: number;
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

interface Review {
  id: string;
  buyerName: string;
  rating: number;
  comment?: string;
  createdAt: string;
  product?: { name: string };
}

const SORT_OPTIONS = [
  { value: 'default', label: 'Default' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
];

const q = storefrontQueries();

export default function StorefrontClient() {
  const params = useParams();
  const slug = params.slug as string;
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState('default');
  const [isReviewOpen, setIsReviewOpen] = useState(false);

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
    ...q.shopStats<ShopStats>(shopId),
    enabled: !!shop?.id,
  });

  const { data: reviews } = useQuery({
    ...q.shopReviews<Review>(shopId),
    enabled: !!shop?.id,
  });

  const primaryColor = normalizeHexColor(shop?.primaryColor);
  const primaryFg = getContrastColor(primaryColor);

  const categories: Category[] = shop?.categories || [];

  const filteredProducts = useMemo(() => {
    if (!products) return [];
    let list = products.filter((p: Product) => {
      const matchesSearch =
        !searchQuery ||
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesCategory = !selectedCategory || p.category?.id === selectedCategory;
      return matchesSearch && matchesCategory;
    });

    if (sortBy === 'price-asc') {
      list = [...list].sort(
        (a: Product, b: Product) => getMinPrice(a.variants) - getMinPrice(b.variants),
      );
    } else if (sortBy === 'price-desc') {
      list = [...list].sort(
        (a: Product, b: Product) => getMinPrice(b.variants) - getMinPrice(a.variants),
      );
    }

    return list;
  }, [products, searchQuery, selectedCategory, sortBy]);

  const reviewCount = stats?.totalCount ?? 0;
  const overallRating = stats
    ? stats.averageShopRating > 0
      ? stats.averageShopRating
      : stats.averageProductRating
    : 0;

  if (shopLoading || productsLoading) return <StorefrontSkeleton shop={shop} />;

  if (!shop) {
    // Thường layout đã trả 404 từ server; tới đây nghĩa là server không gọi được API lúc render
    // mà client mới nhận 404 → hiện thẳng giao diện "Shop Not Found" (boundary cùng cấp chỉ dành cho sản phẩm)
    if (getErrorStatus(shopError) === 404) return <ShopNotFoundView />;
    return <StorefrontUnavailable onRetry={() => refetchShop()} isRetrying={isRefetchingShop} />;
  }

  return (
    <div className="min-h-screen">
      <ShopHero shop={shop} onWriteReview={() => setIsReviewOpen(true)} />

      {/* Stats bar */}
      <section className="bg-card border-b border-border">
        <div className="container mx-auto px-4 py-4 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
          <div>
            <div className="font-semibold text-lg text-foreground">{products?.length ?? 0}</div>
            <div className="text-muted-foreground text-xs">Products</div>
          </div>
          <div>
            <div className="font-semibold text-lg text-foreground">
              {overallRating > 0 ? `${overallRating}/5` : '–'}
            </div>
            <div className="text-muted-foreground text-xs">Avg. Rating</div>
          </div>
          <div>
            <div className="font-semibold text-lg text-foreground">
              {reviewCount > 0 ? reviewCount : '–'}
            </div>
            <div className="text-muted-foreground text-xs">Reviews</div>
          </div>
          <div>
            <div className="font-semibold text-lg text-foreground">Nationwide</div>
            <div className="text-muted-foreground text-xs">Delivery</div>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-10 space-y-14">
        {/* Reviews section */}
        {reviewCount > 0 && (
          <section>
            <div className="flex items-end justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-foreground">Customer Reviews</h2>
                <p className="text-muted-foreground text-sm mt-0.5">{reviewCount} reviews</p>
              </div>
              {overallRating > 0 && (
                <div className="flex items-center gap-2">
                  <StarRating value={overallRating} />
                  <span className="font-semibold text-foreground">{overallRating}</span>
                </div>
              )}
            </div>

            {reviews && reviews.length > 0 && (
              <div className="grid sm:grid-cols-3 gap-4">
                {reviews.map((review) => (
                  <div key={review.id} className="bg-card rounded-2xl border border-border p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="text-sm font-medium text-foreground">{review.buyerName}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(review.createdAt)}
                        </p>
                      </div>
                      <StarRating
                        value={review.rating}
                        className="shrink-0"
                        starClassName="size-3"
                      />
                    </div>
                    {review.comment && (
                      <p className="text-sm text-foreground/80 leading-relaxed mb-3 line-clamp-3">
                        {review.comment}
                      </p>
                    )}
                    {review.product?.name && (
                      <span className="text-xs bg-accent text-accent-foreground px-2 py-1 rounded-full">
                        {review.product.name}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* Products section */}
        <section className="space-y-5">
          <div className="flex items-end justify-between">
            <div>
              <h2 className="text-xl font-bold text-foreground">Our Products</h2>
              <p className="text-muted-foreground text-sm mt-0.5">
                {filteredProducts.length} products
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <select
                aria-label="Sort products"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="text-sm bg-secondary border border-border rounded-xl px-3 py-1.5 text-foreground outline-none cursor-pointer"
              >
                {SORT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Search */}
          <div className="relative max-w-md">
            <Search
              className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
              aria-hidden
            />
            <Input
              aria-label="Search products"
              placeholder="Search products..."
              className="pl-10 h-11 bg-white rounded-xl border-border/70"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Category chips */}
          {categories.length > 0 && (
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedCategory(null)}
                className="px-4 py-1.5 rounded-xl text-sm font-medium transition-all border"
                style={
                  selectedCategory === null
                    ? { backgroundColor: primaryColor, color: primaryFg, borderColor: primaryColor }
                    : {}
                }
              >
                All
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className="px-4 py-1.5 rounded-xl text-sm font-medium transition-all border bg-white text-muted-foreground border-border hover:border-foreground/30 hover:text-foreground"
                  style={
                    selectedCategory === cat.id
                      ? {
                          backgroundColor: primaryColor,
                          color: primaryFg,
                          borderColor: primaryColor,
                        }
                      : {}
                  }
                >
                  {cat.name}
                </button>
              ))}
            </div>
          )}

          {/* Product grid */}
          {filteredProducts.length === 0 ? (
            <div className="py-24 text-center">
              <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-muted mb-4">
                <ShoppingBag className="h-7 w-7 text-muted-foreground" />
              </div>
              <p className="font-semibold text-foreground">No products found</p>
              <p className="text-muted-foreground text-sm mt-1">
                {searchQuery || selectedCategory
                  ? 'Try adjusting your filters.'
                  : 'Check back soon!'}
              </p>
              {(searchQuery || selectedCategory) && (
                <Button
                  variant="outline"
                  className="mt-4 rounded-xl"
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory(null);
                  }}
                >
                  Clear filters
                </Button>
              )}
            </div>
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
                    className="group bg-card rounded-2xl overflow-hidden border border-border hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5"
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
                          <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
                            <span className="text-xs font-semibold text-muted-foreground bg-white border border-border px-3 py-1 rounded-full">
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
                            <span className="font-bold text-base">{formatCurrency(minPrice)}</span>
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
                        className="mt-auto w-full h-9 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-2 group/btn"
                        style={{ backgroundColor: primaryColor, color: primaryFg }}
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
      </div>

      <WriteReviewDialog open={isReviewOpen} onOpenChange={setIsReviewOpen} shopId={shop.id} />
    </div>
  );
}
