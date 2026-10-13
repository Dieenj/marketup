'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { notFound, useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, ChevronLeft, ChevronRight, ImageIcon, ShoppingCart, Star, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';

import { storefrontQueries } from '@/lib/storefront-queries';
import { formatPriceRange, getPriceRange } from '@/lib/price';
import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useCartStore } from '@/hooks/use-cart';
import WriteReviewDialog from '@/components/shop/write-review-dialog';
import { formatCurrency, formatDate } from '@/lib/format';
import RemoteImage from '@/components/remote-image';
import StarRating from '@/components/star-rating';
import { getErrorStatus } from '@/lib/api-client';
import StorefrontUnavailable from './storefront-unavailable';
import { ProductDetailSkeleton } from './skeletons';

interface ProductReview {
  id: string;
  buyerName: string;
  rating: number;
  comment?: string | null;
  isVerified: boolean;
  sellerReply?: string | null;
  createdAt: string;
}

interface ProductDetail {
  id: string;
  shopId?: string;
  name: string;
  description?: string;
  imageUrl?: string;
  images?: string[];
  category?: { id: string; name: string } | null;
  attributes?: Attribute[];
  variants?: Variant[];
}

interface Attribute {
  id: string;
  name: string;
  options: string[];
}

interface Variant {
  id: string;
  label: string;
  options: Record<string, string>;
  price?: number | string | null;
  comparePrice?: number | string | null;
  stock: number;
}

const q = storefrontQueries();

export default function ProductClient() {
  const params = useParams();
  const slug = params.slug as string;
  const productId = params.productId as string;
  const addItem = useCartStore((state) => state.addItem);
  const [quantity, setQuantity] = useState(1);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isReviewOpen, setIsReviewOpen] = useState(false);

  const { data: shop } = useQuery(q.shop(slug));

  const {
    data: product,
    isLoading,
    error: productError,
    refetch: refetchProduct,
    isRefetching: isRefetchingProduct,
  } = useQuery(q.product<ProductDetail>(productId));

  const { data: reviews } = useQuery({
    ...q.productReviews<ProductReview>(productId),
    enabled: !!productId,
  });

  const { data: ratingInfo } = useQuery({
    ...q.productRating<{ averageRating: number; count: number }>(productId),
    enabled: !!productId,
  });

  const attributes: Attribute[] = useMemo(() => product?.attributes ?? [], [product?.attributes]);
  const variants: Variant[] = useMemo(() => product?.variants ?? [], [product?.variants]);
  const hasVariants = variants.length > 0 && attributes.length > 0;

  // Lấy tất cả các hình ảnh sản phẩm
  const allImages = useMemo(() => {
    if (!product) return [];
    const images: string[] = [];
    if (product.imageUrl) images.push(product.imageUrl);
    if (product.images && Array.isArray(product.images)) {
      images.push(...product.images.filter((img: string) => img && img !== product.imageUrl));
    }
    return images;
  }, [product]);

  const handleNextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % allImages.length);
  };

  const handlePrevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + allImages.length) % allImages.length);
  };

  const selectedVariant = useMemo(() => {
    if (!hasVariants || Object.keys(selectedOptions).length !== attributes.length) {
      return null;
    }

    return (
      variants.find((variant) =>
        attributes.every(
          (attribute) =>
            variant.options[attribute.name] === selectedOptions[attribute.name],
        ),
      ) || null
    );
  }, [attributes, hasVariants, selectedOptions, variants]);

  const totalVariantStock = useMemo(
    () => variants.reduce((total, variant) => total + Math.max(variant.stock, 0), 0),
    [variants],
  );

  // Lấy khoảng giá từ các biến thể (variants)
  const priceRange = useMemo(() => getPriceRange(variants) ?? { min: 0, max: 0 }, [variants]);

  const allOptionsSelected = !hasVariants || attributes.every((attribute) => Boolean(selectedOptions[attribute.name]));
  const effectiveStock = hasVariants
    ? selectedVariant?.stock ?? totalVariantStock
    : (variants[0]?.stock ?? 0);
  const effectivePrice = selectedVariant?.price != null
    ? Number(selectedVariant.price)
    : priceRange.min; // Sử dụng giá nhỏ nhất từ khoảng giá
  const isSelectedVariantOutOfStock = allOptionsSelected && effectiveStock <= 0;
  const hasAnyStock = totalVariantStock > 0;
  const nextAttribute = hasVariants
    ? attributes.find((attribute) => !selectedOptions[attribute.name])
    : null;
  const normalizedQuantity = effectiveStock > 0 ? Math.min(quantity, effectiveStock) : 1;
  const actualVariant = hasVariants ? selectedVariant : variants[0];

  const canSelectOption = (attributeIndex: number, option: string) => {
    if (!hasVariants) {
      return true;
    }

    if (attributeIndex > 0) {
      const previousAttribute = attributes[attributeIndex - 1];
      if (!selectedOptions[previousAttribute.name]) {
        return false;
      }
    }

    return variants.some((variant) => {
      if (variant.stock <= 0) {
        return false;
      }

      return attributes.every((attribute, currentIndex) => {
        if (currentIndex > attributeIndex) {
          return true;
        }

        const expectedValue = currentIndex === attributeIndex
          ? option
          : selectedOptions[attribute.name];

        return expectedValue ? variant.options[attribute.name] === expectedValue : true;
      });
    });
  };

  const handleOptionSelect = (attributeIndex: number, option: string) => {
    setSelectedOptions((currentOptions) => {
      const nextOptions: Record<string, string> = {};

      for (let index = 0; index < attributeIndex; index += 1) {
        const attributeName = attributes[index].name;
        if (currentOptions[attributeName]) {
          nextOptions[attributeName] = currentOptions[attributeName];
        }
      }

      nextOptions[attributes[attributeIndex].name] = option;
      return nextOptions;
    });
    setQuantity(1);
  };

  if (isLoading) return <ProductDetailSkeleton />;

  if (!product) {
    // 404 dùng chung boundary not-found.tsx; lỗi khác (API chưa sẵn sàng) cho phép thử lại
    if (getErrorStatus(productError) === 404) notFound();
    return <StorefrontUnavailable onRetry={() => refetchProduct()} isRetrying={isRefetchingProduct} />;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Link
        href={`/shop/${slug}`}
        className="mb-8 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-primary"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to all products
      </Link>

      <div className="grid grid-cols-1 gap-12 md:grid-cols-2">
        {/* Trình chiếu hình ảnh (Image Carousel) */}
        <div className="space-y-4">
          <div className="relative aspect-square overflow-hidden rounded-2xl bg-muted group">
            {allImages.length > 0 ? (
              <>
                <RemoteImage
                  src={allImages[currentImageIndex]}
                  alt={product.name}
                  fill
                  preload
                  loading="eager"
                  fetchPriority="high"
                  sizes="(min-width: 768px) 50vw, 100vw"
                  className="object-cover"
                />
                
                {/* Nút điều hướng - chỉ hiển thị nếu có nhiều hình ảnh */}
                {allImages.length > 1 && (
                  <>
                    <button
                      onClick={handlePrevImage}
                      className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/80 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      aria-label="Previous image"
                    >
                      <ChevronLeft className="h-6 w-6" />
                    </button>
                    <button
                      onClick={handleNextImage}
                      className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/80 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      aria-label="Next image"
                    >
                      <ChevronRight className="h-6 w-6" />
                    </button>

                    {/* Bộ đếm số thứ tự hình ảnh đang hiển thị */}
                    <div className="absolute bottom-4 right-4 bg-black/60 text-white text-xs px-3 py-1.5 rounded-full font-medium">
                      {currentImageIndex + 1} / {allImages.length}
                    </div>
                  </>
                )}
              </>
            ) : (
              <div className="flex h-full items-center justify-center">
                <ImageIcon className="h-24 w-24 text-muted-foreground/30" />
              </div>
            )}
            {!hasAnyStock && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                <Badge variant="destructive" className="px-4 py-2 text-base">
                  Out of Stock
                </Badge>
              </div>
            )}
          </div>

          {/* Bộ sưu tập ảnh thu nhỏ - chỉ hiển thị nếu có nhiều hình ảnh */}
          {allImages.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-2">
              {allImages.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentImageIndex(index)}
                  className={`shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                    currentImageIndex === index
                      ? 'border-primary ring-2 ring-primary/20'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <RemoteImage
                    src={image}
                    alt={`${product.name} - ${index + 1}`}
                    width={80}
                    height={80}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col space-y-6">
          <div>
            {product.category && (
              <Badge variant="outline" className="mb-3">
                {product.category.name}
              </Badge>
            )}
            <h1 className="text-4xl font-extrabold tracking-tight">{product.name}</h1>
            <div className="flex items-center gap-2 mt-2">
              <StarRating value={ratingInfo?.averageRating || 0} starClassName="size-4.5" />
              <span className="text-xs font-semibold text-muted-foreground">
                {ratingInfo && ratingInfo.averageRating > 0
                  ? `${ratingInfo.averageRating} (${ratingInfo.count} reviews)`
                  : 'No reviews yet'}
              </span>
            </div>
            <div className="mt-3 flex items-baseline gap-3">
              {allOptionsSelected ? (
                <>
                  <span className="text-3xl font-bold text-primary">
                    {formatCurrency(effectivePrice)}
                  </span>
                  {actualVariant?.comparePrice && Number(actualVariant.comparePrice) > effectivePrice && (
                    <span className="text-lg text-muted-foreground line-through">
                      {formatCurrency(actualVariant.comparePrice)}
                    </span>
                  )}
                </>
              ) : (
                <span className="text-3xl font-bold text-primary">
                  {formatPriceRange(priceRange)}
                </span>
              )}
            </div>
          </div>

          {product.description && (
            <div>
              <h2 className="mb-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Description
              </h2>
              <p className="text-base leading-relaxed text-gray-700">
                {product.description}
              </p>
            </div>
          )}

          {hasVariants && attributes.map((attribute, attributeIndex) => {
            const previousAttribute = attributeIndex > 0 ? attributes[attributeIndex - 1] : null;
            const isLocked = previousAttribute ? !selectedOptions[previousAttribute.name] : false;

            return (
              <div key={attribute.id} className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <h2 id={`attribute-${attribute.id}`} className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                    {attribute.name}
                  </h2>
                  {selectedOptions[attribute.name] && (
                    <span className="text-sm font-medium text-foreground">
                      {selectedOptions[attribute.name]}
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap gap-2" role="group" aria-labelledby={`attribute-${attribute.id}`}>
                  {attribute.options.map((option) => {
                    const isSelected = selectedOptions[attribute.name] === option;
                    const isAvailable = canSelectOption(attributeIndex, option);
                    const isDisabled = isLocked || !isAvailable;

                    return (
                      <button
                        key={option}
                        type="button"
                        onClick={() => handleOptionSelect(attributeIndex, option)}
                        aria-pressed={isSelected}
                        className={`rounded-lg border-2 px-4 py-2 text-sm font-medium transition-all ${
                          isSelected
                            ? 'border-primary bg-primary text-primary-foreground'
                            : 'border-border hover:border-primary/50'
                        } ${
                          isDisabled
                            ? 'cursor-not-allowed opacity-40 line-through'
                            : 'cursor-pointer'
                        }`}
                        disabled={isDisabled}
                      >
                        {option}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {hasVariants && nextAttribute && (
            <p className="text-sm text-muted-foreground">
              Select {nextAttribute.name.toLowerCase()} to continue.
            </p>
          )}

          {(allOptionsSelected || !hasVariants) && (
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Availability:</span>
              {isSelectedVariantOutOfStock || !hasAnyStock ? (
                <Badge variant="destructive">Out of Stock</Badge>
              ) : (
                <Badge variant="outline" className="border-green-300 bg-green-50 text-green-700">
                  In Stock ({effectiveStock} left)
                </Badge>
              )}
            </div>
          )}

          {!isSelectedVariantOutOfStock && allOptionsSelected && hasAnyStock && (
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium">Quantity:</span>
              <div className="flex items-center overflow-hidden rounded-lg border">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 rounded-none"
                  onClick={() => setQuantity(Math.max(1, normalizedQuantity - 1))}
                >
                  −
                </Button>
                <span className="min-w-10 px-4 py-1 text-center font-semibold">
                  {normalizedQuantity}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 rounded-none"
                  onClick={() => setQuantity(Math.min(effectiveStock, normalizedQuantity + 1))}
                >
                  +
                </Button>
              </div>
            </div>
          )}

          <Button
            size="lg"
            className="h-14 gap-2 text-base font-bold"
            disabled={!allOptionsSelected || isSelectedVariantOutOfStock || !hasAnyStock}
            onClick={() => {
              if (hasVariants && !selectedVariant) {
                return;
              }

              const variantLabel = actualVariant?.label;
              for (let index = 0; index < normalizedQuantity; index += 1) {
                addItem({
                  id: product.id,
                  name: product.name,
                  price: effectivePrice,
                  quantity: 1,
                  imageUrl: product.imageUrl,
                  shopId: shop?.id || '',
                  variantId: actualVariant?.id,
                  variantLabel: variantLabel === 'Default' ? undefined : variantLabel,
                });
              }
              toast.success(
                `Added ${normalizedQuantity}x "${product.name}"${variantLabel && variantLabel !== 'Default' ? ` (${variantLabel})` : ''} to cart`,
              );
            }}
          >
            <ShoppingCart className="h-5 w-5" />
            {!allOptionsSelected
              ? nextAttribute
                ? `Select ${nextAttribute.name}`
                : 'Select Options'
              : isSelectedVariantOutOfStock || !hasAnyStock
                ? 'Out of Stock'
                : 'Add to Cart'}
          </Button>

          <Link
            href={`/shop/${slug}/checkout`}
            className={cn(buttonVariants({ variant: 'outline', size: 'lg' }), 'h-12 w-full font-semibold')}
          >
            View Cart & Checkout
          </Link>
        </div>
      </div>

      {/* Phần đánh giá và nhận xét của khách hàng */}
      <div className="mt-16 border-t border-border/60 pt-12">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-8 mb-10">
          <div className="space-y-3">
            <h2 className="text-2xl font-bold tracking-tight">Customer Reviews</h2>
            <div className="flex items-center gap-3">
              <span className="text-5xl font-extrabold text-foreground">
                {ratingInfo?.averageRating || '0.0'}
              </span>
              <div>
                <StarRating value={ratingInfo?.averageRating || 0} starClassName="size-5" />
                <p className="text-xs text-muted-foreground mt-0.5 font-medium">
                  Based on {ratingInfo?.count || 0} customer reviews
                </p>
              </div>
            </div>
          </div>

          <div className="shrink-0 pt-2">
            <Button
              onClick={() => setIsReviewOpen(true)}
              className="gap-2 rounded-xl font-bold h-11 px-5"
            >
              <Star className="h-4 w-4 fill-current" />
              Write a Product Review
            </Button>
          </div>
        </div>

        {/* Danh sách các đánh giá của sản phẩm */}
        {!reviews || reviews.length === 0 ? (
          <div className="text-center py-12 bg-muted/20 border border-dashed rounded-2xl">
            <MessageSquare className="h-9 w-9 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm font-semibold text-muted-foreground">No reviews approved yet</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Be the first to share your thoughts on this product!
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {reviews.map((rev: ProductReview) => (
              <div
                key={rev.id}
                className="bg-white border border-border/50 rounded-2xl p-5 shadow-sm space-y-3 transition-shadow hover:shadow-md"
              >
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-foreground">{rev.buyerName}</span>
                      {rev.isVerified && (
                        <Badge variant="success">Verified Purchase</Badge>
                      )}
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {formatDate(rev.createdAt)}
                    </p>
                  </div>

                  <StarRating value={rev.rating} starClassName="size-3.5" />
                </div>

                {rev.comment && (
                  <p className="text-sm leading-relaxed text-gray-700 whitespace-pre-wrap">
                    {rev.comment}
                  </p>
                )}

                {rev.sellerReply && (
                  <div className="ml-6 bg-primary/5 border-l-2 border-primary rounded-r-xl p-4 mt-2.5 space-y-1">
                    <p className="text-xs font-bold text-primary flex items-center gap-1.5">
                      <span>Shop Owner Response</span>
                    </p>
                    <p className="text-xs leading-relaxed text-muted-foreground whitespace-pre-wrap">
                      {rev.sellerReply}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <WriteReviewDialog
        open={isReviewOpen}
        onOpenChange={setIsReviewOpen}
        shopId={shop?.id || ''}
        productId={product.id}
        productName={product.name}
      />
    </div>
  );
}
