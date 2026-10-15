'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ChevronLeft, Mail, Phone } from 'lucide-react';
import OrderStatusBadge from '@/components/order-status-badge';
import { Button, buttonVariants } from '@/components/ui/button';
import CancelOrderDialog from '@/components/cancel-order-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency, formatDate } from '@/lib/format';
import { getErrorMessage, getErrorStatus } from '@/lib/api-client';
import { BUYER_CANCEL_REASONS } from '@/lib/order-status';
import {
  buyerOrderQuery,
  cancelOrder,
  isAccessDenied,
  saveReview,
  type BuyerOrder,
  type BuyerOrderItem,
  type WriteReviewInput,
} from '@/lib/buyer-api';
import StarRating from '@/components/star-rating';
import ReviewItemDialog from './review-item-dialog';
import { storefrontQueries } from '@/lib/storefront-queries';
import { useHydrated } from '@/hooks/use-hydrated';
import { useBuyerSession } from '@/hooks/use-buyer-session';
import { cn } from '@/lib/utils';
import StorefrontUnavailable from '../../_components/storefront-unavailable';
import { SignInPanel } from './buyer-sign-in';
import OrderItemThumb from './order-item-thumb';
import OrderProgress, { OrderProgressSkeleton } from './order-progress';

const q = storefrontQueries();

export default function OrderDetailClient({
  slug,
  orderNumber,
  linkToken,
}: {
  slug: string;
  orderNumber: string;
  /** Token trong link email / trang đặt hàng thành công (?t=) — mở đúng đơn này, không cần đăng nhập */
  linkToken?: string;
}) {
  const hydrated = useHydrated();
  const sessionToken = useBuyerSession((s) => s.token);
  const sessionEmail = useBuyerSession((s) => s.email);
  const signOut = useBuyerSession((s) => s.signOut);
  const router = useRouter();

  // Ưu tiên link (?t=); link hết hạn/không hợp lệ → dùng phiên đăng nhập nếu có
  const linkQuery = useQuery({
    ...buyerOrderQuery(orderNumber, linkToken ?? ''),
    enabled: hydrated && !!linkToken,
  });
  const linkFailed = !!linkToken && isAccessDenied(linkQuery.error);
  const usingLink = !!linkToken && !linkFailed;
  const sessionQuery = useQuery({
    ...buyerOrderQuery(orderNumber, sessionToken ?? ''),
    enabled: hydrated && !!sessionToken && !usingLink,
  });
  const query = usingLink ? linkQuery : sessionQuery;
  const token = usingLink ? linkToken : sessionToken;
  const status = query.isError ? getErrorStatus(query.error) : undefined;
  const denied = isAccessDenied(query.error);

  // Phiên hết hạn (30 ngày) → xoá để hiện màn đăng nhập
  useEffect(() => {
    if (!usingLink && status === 401) signOut();
  }, [usingLink, status, signOut]);

  // Phiên người mua dùng chung mọi shop → đơn của shop khác mở dưới slug này thì chuyển về đúng shop
  const orderSlug = query.data?.shop.slug;
  const wrongShop = !!orderSlug && orderSlug !== slug;
  useEffect(() => {
    if (!wrongShop) return;
    const search = usingLink ? `?t=${encodeURIComponent(linkToken!)}` : '';
    router.replace(`/shop/${orderSlug}/orders/${encodeURIComponent(orderNumber)}${search}`);
  }, [wrongShop, orderSlug, orderNumber, usingLink, linkToken, router]);

  // Phiên lưu trong localStorage → chỉ biết sau khi hydrate
  if (!hydrated || (token && query.isPending) || wrongShop) {
    return <OrderDetailSkeleton slug={slug} />;
  }

  if (!token || denied) {
    return (
      <SignInPanel
        slug={slug}
        back={<BackLink slug={slug} />}
        title="View your order"
        description={
          <>
            {sessionEmail && status === 404
              ? `This order isn't one of the orders placed with ${sessionEmail}. `
              : linkFailed
                ? 'This order link is no longer valid. '
                : null}
            Sign in with the email you used to place order{' '}
            <span className="font-mono font-medium text-foreground">{orderNumber}</span>.
          </>
        }
      />
    );
  }

  if (query.isError) {
    return <StorefrontUnavailable onRetry={() => query.refetch()} isRetrying={query.isFetching} />;
  }

  return <OrderDetail slug={slug} order={query.data!} token={token!} signedIn={!!sessionToken} />;
}

function BackLink({ slug }: { slug: string }) {
  return (
    <Link
      href={`/shop/${slug}/orders`}
      className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
    >
      <ChevronLeft className="size-4" aria-hidden />
      My orders
    </Link>
  );
}

function OrderDetail({
  slug,
  order,
  token,
  signedIn,
}: {
  slug: string;
  order: BuyerOrder;
  /** Token đang dùng để xem đơn (link hoặc phiên) — dùng luôn để huỷ */
  token: string;
  signedIn: boolean;
}) {
  const queryClient = useQueryClient();
  const { data: shop } = useQuery(q.shop(slug));
  const [cancelOpen, setCancelOpen] = useState(false);
  const [reviewing, setReviewing] = useState<BuyerOrderItem | null>(null);
  // Hạn đánh giá do API tính; so với thời điểm mở trang
  const [openedAt] = useState(() => Date.now());
  const canReview =
    order.status === 'DELIVERED' &&
    !!order.reviewableUntil &&
    openedAt < Date.parse(order.reviewableUntil);
  const orderKey = buyerOrderQuery(order.orderNumber, token).queryKey;

  const review = useMutation({
    mutationFn: ({ item, input }: { item: BuyerOrderItem; input: WriteReviewInput }) =>
      saveReview(order.orderNumber, item.id, token, input, !!item.review),
    onSuccess: (saved, { item }) => {
      queryClient.setQueryData(
        orderKey,
        (current) =>
          current && {
            ...current,
            items: current.items.map((i) => (i.id === item.id ? { ...i, review: saved } : i)),
          },
      );
      queryClient.invalidateQueries({ queryKey: ['product-reviews', item.productId] });
      queryClient.invalidateQueries({ queryKey: ['product-rating', item.productId] });
      queryClient.invalidateQueries({ queryKey: ['shop-reviews'] });
      queryClient.invalidateQueries({ queryKey: ['shop-stats'] });
      setReviewing(null);
      toast.success(item.review ? 'Your review has been updated' : 'Thanks for your review!');
    },
    onError: (error) => {
      queryClient.invalidateQueries({ queryKey: orderKey });
      setReviewing(null);
      toast.error(getErrorMessage(error, "Couldn't save your review. Please try again."));
    },
  });
  const cancel = useMutation({
    mutationFn: (input: Parameters<typeof cancelOrder>[2]) =>
      cancelOrder(order.orderNumber, token, input),
    onSuccess: (updated) => {
      queryClient.setQueryData(buyerOrderQuery(order.orderNumber, token).queryKey, updated);
      queryClient.invalidateQueries({ queryKey: ['buyer-orders', slug] });
      setCancelOpen(false);
      toast.success('Your order has been cancelled');
    },
    onError: (error) => {
      // vd. shop vừa xác nhận đơn → tải lại để thấy trạng thái mới
      queryClient.invalidateQueries({
        queryKey: buyerOrderQuery(order.orderNumber, token).queryKey,
      });
      setCancelOpen(false);
      toast.error(getErrorMessage(error, "Couldn't cancel this order. Please try again."));
    },
  });
  const itemCount = order.items.reduce((sum, item) => sum + item.quantity, 0);
  const shippingFee = Number(order.shippingFee);
  const discount = Number(order.discount);

  return (
    <div className="container mx-auto max-w-5xl px-4 py-8">
      <BackLink slug={slug} />

      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-mono text-2xl font-bold tracking-tight sm:text-3xl">
            {order.orderNumber}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Placed on {formatDate(order.createdAt)}
          </p>
        </div>
        <OrderStatusBadge status={order.status} className="h-7 px-3 text-sm" />
      </div>

      <OrderProgress order={order} />

      <div className="mt-6 grid items-start gap-6 lg:grid-cols-3">
        <section aria-labelledby="order-items" className="rounded-xl border bg-card lg:col-span-2">
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b px-5 py-4">
            <h2 id="order-items" className="font-semibold">
              Items <span className="font-normal text-muted-foreground">({itemCount})</span>
            </h2>
            {canReview && order.items.some((item) => !item.review) && (
              <p className="text-sm text-muted-foreground">
                Rate your items by {formatDate(order.reviewableUntil!)}
              </p>
            )}
          </div>
          <ul className="divide-y">
            {order.items.map((item) => (
              <li key={item.id} className="flex gap-4 px-5 py-4">
                <OrderItemThumb src={item.productImage} className="size-16" />
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/shop/${slug}/products/${item.productId}`}
                    prefetch={false}
                    className="line-clamp-2 font-medium hover:underline underline-offset-2"
                  >
                    {item.productName}
                  </Link>
                  {item.variantLabel && (
                    <p className="text-sm text-muted-foreground">{item.variantLabel}</p>
                  )}
                  <p className="mt-1 text-sm text-muted-foreground tabular-nums">
                    {item.quantity} × {formatCurrency(item.priceAtPurchase)}
                  </p>
                  <ItemReview
                    item={item}
                    canReview={canReview}
                    onWrite={() => setReviewing(item)}
                  />
                </div>
                <p className="font-semibold tabular-nums">
                  {formatCurrency(Number(item.priceAtPurchase) * item.quantity)}
                </p>
              </li>
            ))}
          </ul>
        </section>

        <div className="space-y-6">
          <section aria-labelledby="order-summary" className="rounded-xl border bg-card p-5">
            <h2 id="order-summary" className="mb-4 font-semibold">
              Summary
            </h2>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Subtotal</dt>
                <dd className="tabular-nums">{formatCurrency(order.subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Shipping</dt>
                <dd className="tabular-nums">
                  {shippingFee > 0 ? formatCurrency(shippingFee) : 'Free'}
                </dd>
              </div>
              {discount > 0 && (
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Discount</dt>
                  <dd className="tabular-nums">−{formatCurrency(discount)}</dd>
                </div>
              )}
              <div className="flex justify-between border-t pt-3 text-base font-bold">
                <dt>Total</dt>
                <dd className="tabular-nums">{formatCurrency(order.totalAmount)}</dd>
              </div>
            </dl>
            <p className="mt-4 rounded-lg bg-muted/60 px-3 py-2 text-xs text-muted-foreground">
              Cash on delivery — pay when your order arrives.
            </p>
          </section>

          <section
            aria-labelledby="order-delivery"
            className="rounded-xl border bg-card p-5 text-sm"
          >
            <h2 id="order-delivery" className="mb-3 font-semibold">
              Delivery
            </h2>
            <p className="font-medium">{order.buyerName}</p>
            <p className="text-muted-foreground">{order.shippingAddress}</p>
            <p className="text-muted-foreground">
              {[order.shippingDistrict, order.shippingCity].filter(Boolean).join(', ')}
            </p>
            {order.shippingNote && (
              <p className="mt-2 italic text-muted-foreground">Note: {order.shippingNote}</p>
            )}
          </section>

          {(shop?.contactEmail || shop?.contactPhone) && (
            <section aria-labelledby="order-help" className="rounded-xl border bg-card p-5 text-sm">
              <h2 id="order-help" className="mb-3 font-semibold">
                Need help?
              </h2>
              <p className="mb-3 text-muted-foreground">Contact {shop.name} about this order.</p>
              <div className="space-y-2">
                {shop.contactPhone && (
                  <a
                    href={`tel:${shop.contactPhone}`}
                    className="flex items-center gap-2 hover:underline underline-offset-2"
                  >
                    <Phone className="size-4 text-muted-foreground" aria-hidden />
                    {shop.contactPhone}
                  </a>
                )}
                {shop.contactEmail && (
                  <a
                    href={`mailto:${shop.contactEmail}?subject=${encodeURIComponent(`Order ${order.orderNumber}`)}`}
                    className="flex items-center gap-2 break-all hover:underline underline-offset-2"
                  >
                    <Mail className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                    {shop.contactEmail}
                  </a>
                )}
              </div>
            </section>
          )}

          {/* Giống Shopee: tự huỷ được khi shop chưa xác nhận; sau đó liên hệ shop */}
          {order.status === 'PENDING' && (
            <Button variant="outline" className="w-full" onClick={() => setCancelOpen(true)}>
              Cancel order
            </Button>
          )}

          {/* Mở bằng link của một đơn → gợi ý đăng nhập để xem mọi đơn */}
          {!signedIn && (
            <Link
              href={`/shop/${slug}/orders`}
              className={cn(
                buttonVariants({ variant: 'ghost', size: 'sm' }),
                'w-full text-muted-foreground',
              )}
            >
              See all your orders
            </Link>
          )}
        </div>
      </div>

      <ReviewItemDialog
        open={!!reviewing}
        onOpenChange={(open) => !open && setReviewing(null)}
        productName={reviewing?.productName ?? ''}
        existing={reviewing?.review}
        onSubmit={(input) => reviewing && review.mutate({ item: reviewing, input })}
        isPending={review.isPending}
      />

      <CancelOrderDialog
        open={cancelOpen}
        onOpenChange={setCancelOpen}
        orderNumber={order.orderNumber}
        reasons={BUYER_CANCEL_REASONS}
        description="The shop hasn't confirmed your order yet, so you can cancel it now. This cannot be undone."
        onConfirm={(input) => cancel.mutate(input)}
        isPending={cancel.isPending}
      />
    </div>
  );
}

// Đánh giá của người mua cho một sản phẩm: đã viết (sửa được một lần trong hạn) hoặc nút "Rate"
function ItemReview({
  item,
  canReview,
  onWrite,
}: {
  item: BuyerOrderItem;
  canReview: boolean;
  onWrite: () => void;
}) {
  const { review } = item;
  if (!review) {
    return canReview ? (
      <Button size="sm" variant="outline" className="mt-3" onClick={onWrite}>
        Rate this item
      </Button>
    ) : null;
  }
  return (
    <div className="mt-3 space-y-1.5 rounded-lg bg-muted/40 p-3 text-sm">
      <div className="flex flex-wrap items-center gap-2">
        <StarRating value={review.rating} starClassName="size-3.5" />
        <span className="text-xs text-muted-foreground">
          Your review{review.editedAt && ' · Edited'}
        </span>
        {canReview && !review.editedAt && (
          <Button size="xs" variant="link" className="h-auto px-0" onClick={onWrite}>
            Edit
          </Button>
        )}
      </div>
      {review.comment && <p className="whitespace-pre-wrap">{review.comment}</p>}
      {review.sellerReply && (
        <p className="border-l-2 pl-2 text-muted-foreground">
          <span className="font-medium text-foreground">Shop reply:</span> {review.sellerReply}
        </p>
      )}
    </div>
  );
}

// Cùng bố cục với trang đơn: tiêu đề, tiến trình, danh sách món | tóm tắt, giao hàng, liên hệ shop
function OrderDetailSkeleton({ slug }: { slug: string }) {
  const { data: shop } = useQuery(q.shop(slug));
  const contactLines = [shop?.contactPhone, shop?.contactEmail].filter(Boolean).length;
  const line = (width: string) => (
    <div className="flex h-5 items-center">
      <Skeleton className={cn('h-3.5', width)} />
    </div>
  );
  return (
    <div className="container mx-auto max-w-5xl px-4 py-8" aria-busy="true">
      <span className="sr-only" role="status">
        Loading order…
      </span>
      <Skeleton className="mb-6 h-5 w-24" />
      <div className="mb-6 flex items-start justify-between gap-3">
        <div className="space-y-2">
          <Skeleton className="h-8 w-56 sm:h-9" />
          <Skeleton className="h-4 w-36" />
        </div>
        <Skeleton className="h-7 w-24 rounded-full" />
      </div>
      <OrderProgressSkeleton />
      <div className="mt-6 grid items-start gap-6 lg:grid-cols-3">
        <div className="rounded-xl border bg-card lg:col-span-2">
          <div className="flex h-[57px] items-center border-b px-5">
            <Skeleton className="h-4 w-24" />
          </div>
          <div className="divide-y">
            {[0, 1].map((i) => (
              <div key={i} className="flex gap-4 px-5 py-4">
                <Skeleton className="size-16 shrink-0 rounded-lg" />
                <div className="flex-1">
                  <div className="flex h-6 items-center">
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                  {line('w-24')}
                  <div className="mt-1">{line('w-20')}</div>
                </div>
                <div className="flex h-6 items-center">
                  <Skeleton className="h-4 w-16" />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="space-y-6">
          <div className="rounded-xl border bg-card p-5">
            <div className="mb-4 flex h-6 items-center">
              <Skeleton className="h-4 w-20" />
            </div>
            <div className="space-y-2">
              {[0, 1].map((i) => (
                <div key={i} className="flex h-5 items-center justify-between">
                  <Skeleton className="h-3.5 w-16" />
                  <Skeleton className="h-3.5 w-14" />
                </div>
              ))}
              <div className="flex h-[37px] items-end justify-between border-t">
                <Skeleton className="mb-1 h-4 w-12" />
                <Skeleton className="mb-1 h-4 w-16" />
              </div>
            </div>
            {/* Ghi chú thanh toán: cột hẹp (lg) xuống 2 dòng */}
            <Skeleton className="mt-4 h-8 rounded-lg lg:h-12" />
          </div>
          <div className="rounded-xl border bg-card p-5">
            <div className="mb-3">{line('w-20')}</div>
            {line('w-32')}
            {line('w-40')}
            {line('w-28')}
          </div>
          {contactLines > 0 && (
            <div className="space-y-3 rounded-xl border bg-card p-5">
              {line('w-24')}
              {line('w-48')}
              <div className="space-y-2">
                {Array.from({ length: contactLines }, (_, i) => (
                  <div key={i}>{line('w-36')}</div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
