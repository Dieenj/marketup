'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQueries } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight, Package } from 'lucide-react';
import EmptyState from '@/components/empty-state';
import OrderStatusBadge from '@/components/order-status-badge';
import { Button, buttonVariants } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency, formatDate } from '@/lib/format';
import { getErrorStatus } from '@/lib/api-client';
import { orderLookupQuery, type BuyerOrder } from '@/lib/order-lookup';
import { useHydrated } from '@/hooks/use-hydrated';
import { useRecentOrdersStore, type RecentOrder } from '@/hooks/use-recent-orders';
import FindOrderForm from './find-order-form';
import OrderItemThumb from './order-item-thumb';

export default function OrdersClient({ slug }: { slug: string }) {
  const router = useRouter();
  const hydrated = useHydrated();
  const allOrders = useRecentOrdersStore((s) => s.orders);
  const orders = allOrders.filter((o) => o.shopSlug === slug);
  const results = useQueries({ queries: orders.map((o) => orderLookupQuery(o)) });

  return (
    <div className="container mx-auto max-w-5xl px-4 py-8">
      <Link
        href={`/shop/${slug}`}
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ChevronLeft className="size-4" aria-hidden />
        Back to shop
      </Link>

      <h1 className="text-3xl font-bold tracking-tight">My orders</h1>
      <p className="mt-1 mb-8 text-muted-foreground">Orders you placed on this device.</p>

      <div className="grid items-start gap-8 lg:grid-cols-[1fr_360px]">
        <section aria-label="Orders on this device">
          {!hydrated ? (
            // Danh sách nằm trong localStorage → chỉ biết sau khi hydrate
            <OrderRowsSkeleton count={2} />
          ) : orders.length === 0 ? (
            <EmptyState
              icon={Package}
              title="No orders on this device yet"
              description="Ordered on another device? Find it with the order number from your confirmation email."
              action={
                <Link href={`/shop/${slug}`} className={buttonVariants({ variant: 'outline' })}>
                  Start shopping
                </Link>
              }
              className="py-16"
            />
          ) : (
            <ul className="space-y-3">
              {orders.map((saved, i) => {
                const result = results[i];
                return (
                  <li key={saved.orderNumber}>
                    {result.isPending ? (
                      <OrderRowsSkeleton count={1} />
                    ) : result.isError ? (
                      <OrderRowError
                        saved={saved}
                        isNotFound={getErrorStatus(result.error) === 404}
                        onRetry={() => result.refetch()}
                        isRetrying={result.isFetching}
                      />
                    ) : (
                      <OrderRow slug={slug} order={result.data} />
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <aside aria-labelledby="find-order" className="rounded-2xl border bg-card p-6">
          <h2 id="find-order" className="font-semibold">
            Find an order
          </h2>
          <p className="mt-1 mb-5 text-sm text-muted-foreground">
            Use the order number from your confirmation email and the email you ordered with.
          </p>
          <FindOrderForm
            slug={slug}
            onFound={(order) => router.push(`/shop/${slug}/orders/${encodeURIComponent(order.orderNumber)}`)}
          />
        </aside>
      </div>
    </div>
  );
}

function OrderRow({ slug, order }: { slug: string; order: BuyerOrder }) {
  const itemCount = order.items.reduce((sum, item) => sum + item.quantity, 0);
  return (
    <Link
      href={`/shop/${slug}/orders/${encodeURIComponent(order.orderNumber)}`}
      className="flex items-center gap-4 rounded-2xl border bg-card p-4 transition-colors hover:border-foreground/20 hover:bg-muted/30"
    >
      <OrderItemThumb src={order.items[0]?.productImage} className="size-14" />
      <div className="min-w-0 flex-1">
        <p className="truncate font-mono text-sm font-semibold">{order.orderNumber}</p>
        <p className="text-sm text-muted-foreground">
          {formatDate(order.createdAt)} · {itemCount} {itemCount === 1 ? 'item' : 'items'}
        </p>
      </div>
      <div className="flex flex-col items-end gap-1">
        <OrderStatusBadge status={order.status} />
        <p className="font-semibold tabular-nums">{formatCurrency(order.totalAmount)}</p>
      </div>
      <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden />
    </Link>
  );
}

function OrderRowError({
  saved,
  isNotFound,
  onRetry,
  isRetrying,
}: {
  saved: RecentOrder;
  isNotFound: boolean;
  onRetry: () => void;
  isRetrying: boolean;
}) {
  const forget = useRecentOrdersStore((s) => s.forget);
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-dashed bg-card p-4">
      <div className="min-w-0 flex-1">
        <p className="truncate font-mono text-sm font-semibold">{saved.orderNumber}</p>
        <p className="text-sm text-muted-foreground">
          {isNotFound ? 'This order is no longer available.' : "Couldn't load this order."}
        </p>
      </div>
      {isNotFound ? (
        <Button variant="ghost" size="sm" onClick={() => forget(saved.shopSlug, saved.orderNumber)}>
          Remove
        </Button>
      ) : (
        <Button variant="outline" size="sm" onClick={onRetry} disabled={isRetrying}>
          {isRetrying ? 'Retrying…' : 'Try again'}
        </Button>
      )}
    </div>
  );
}

function OrderRowsSkeleton({ count }: { count: number }) {
  return (
    <div className="space-y-3" aria-busy="true">
      <span className="sr-only" role="status">
        Loading orders…
      </span>
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="flex items-center gap-4 rounded-2xl border bg-card p-4">
          <Skeleton className="size-14 rounded-lg" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-4 w-28" />
          </div>
          <div className="flex flex-col items-end gap-1">
            <Skeleton className="h-6 w-20 rounded-full" />
            <Skeleton className="h-5 w-16" />
          </div>
        </div>
      ))}
    </div>
  );
}
