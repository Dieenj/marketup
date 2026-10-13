'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
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
import { buyerOrderQuery, cancelOrder, isAccessDenied, type BuyerOrder } from '@/lib/buyer-api';
import { storefrontQueries } from '@/lib/storefront-queries';
import { useHydrated } from '@/hooks/use-hydrated';
import { useBuyerSession } from '@/hooks/use-buyer-session';
import { cn } from '@/lib/utils';
import StorefrontUnavailable from '../../_components/storefront-unavailable';
import { SignInPanel } from './buyer-sign-in';
import OrderItemThumb from './order-item-thumb';
import OrderProgress from './order-progress';

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

  // Phiên lưu trong localStorage → chỉ biết sau khi hydrate
  if (!hydrated || (token && query.isPending)) {
    return <OrderDetailSkeleton />;
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
        <section aria-labelledby="order-items" className="rounded-2xl border bg-card lg:col-span-2">
          <h2 id="order-items" className="border-b px-5 py-4 font-semibold">
            Items <span className="font-normal text-muted-foreground">({itemCount})</span>
          </h2>
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
                </div>
                <p className="font-semibold tabular-nums">
                  {formatCurrency(Number(item.priceAtPurchase) * item.quantity)}
                </p>
              </li>
            ))}
          </ul>
        </section>

        <div className="space-y-6">
          <section aria-labelledby="order-summary" className="rounded-2xl border bg-card p-5">
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
            className="rounded-2xl border bg-card p-5 text-sm"
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
            <section
              aria-labelledby="order-help"
              className="rounded-2xl border bg-card p-5 text-sm"
            >
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

function OrderDetailSkeleton() {
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
      <Skeleton className="h-36 rounded-2xl sm:h-32" />
      <div className="mt-6 grid items-start gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border bg-card lg:col-span-2">
          <div className="border-b px-5 py-4">
            <Skeleton className="h-5 w-24" />
          </div>
          {[0, 1].map((i) => (
            <div key={i} className="flex gap-4 px-5 py-4">
              <Skeleton className="size-16 rounded-lg" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-4 w-24" />
              </div>
              <Skeleton className="h-5 w-16" />
            </div>
          ))}
        </div>
        <div className="space-y-6">
          <Skeleton className="h-52 rounded-2xl" />
          <Skeleton className="h-32 rounded-2xl" />
        </div>
      </div>
    </div>
  );
}
