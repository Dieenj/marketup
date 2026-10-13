'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, Mail, Phone } from 'lucide-react';
import OrderStatusBadge from '@/components/order-status-badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency, formatDate } from '@/lib/format';
import { getErrorStatus } from '@/lib/api-client';
import { orderLookupQuery, type BuyerOrder } from '@/lib/order-lookup';
import { storefrontQueries } from '@/lib/storefront-queries';
import { useHydrated } from '@/hooks/use-hydrated';
import { useRecentOrdersStore } from '@/hooks/use-recent-orders';
import StorefrontUnavailable from '../../_components/storefront-unavailable';
import FindOrderForm from './find-order-form';
import OrderItemThumb from './order-item-thumb';
import OrderProgress from './order-progress';

const q = storefrontQueries();

export default function OrderDetailClient({
  slug,
  orderNumber,
}: {
  slug: string;
  orderNumber: string;
}) {
  const hydrated = useHydrated();
  const saved = useRecentOrdersStore((s) =>
    s.orders.find((o) => o.shopSlug === slug && o.orderNumber === orderNumber),
  );
  const input = { shopSlug: slug, orderNumber, email: saved?.email ?? '' };
  const query = useQuery({ ...orderLookupQuery(input), enabled: !!saved });

  // Email lưu trên máy chỉ đọc được sau khi hydrate
  if (!hydrated || (saved && query.isPending)) return <OrderDetailSkeleton />;

  // Thiết bị chưa biết đơn này (mở từ email) hoặc email đã lưu không còn khớp → hỏi email
  const notFound = query.isError && getErrorStatus(query.error) === 404;
  if (!saved || notFound) {
    return (
      <div className="container mx-auto max-w-md px-4 py-12 sm:py-20">
        <BackLink slug={slug} />
        <div className="rounded-2xl border bg-card p-6 sm:p-8">
          <h1 className="text-2xl font-bold tracking-tight">View your order</h1>
          <p className="mt-2 mb-6 text-sm text-muted-foreground">
            {notFound
              ? "We couldn't find this order with the email saved on this device. "
              : 'To protect your details, '}
            enter the email you used to place order{' '}
            <span className="font-mono font-medium text-foreground">{orderNumber}</span>.
          </p>
          <FindOrderForm slug={slug} orderNumber={orderNumber} onFound={() => {}} />
        </div>
      </div>
    );
  }

  if (query.isError) {
    return <StorefrontUnavailable onRetry={() => query.refetch()} isRetrying={query.isFetching} />;
  }

  return <OrderDetail slug={slug} order={query.data!} />;
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

function OrderDetail({ slug, order }: { slug: string; order: BuyerOrder }) {
  const router = useRouter();
  const forget = useRecentOrdersStore((s) => s.forget);
  const { data: shop } = useQuery(q.shop(slug));
  const itemCount = order.items.reduce((sum, item) => sum + item.quantity, 0);
  const shippingFee = Number(order.shippingFee);
  const discount = Number(order.discount);

  const removeFromDevice = () => {
    forget(slug, order.orderNumber);
    router.push(`/shop/${slug}/orders`);
  };

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

          <Button
            variant="ghost"
            size="sm"
            className="w-full text-muted-foreground"
            onClick={removeFromDevice}
          >
            Remove from this device
          </Button>
        </div>
      </div>
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
