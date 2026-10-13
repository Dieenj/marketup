'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight, Package } from 'lucide-react';
import EmptyState from '@/components/empty-state';
import OrderStatusBadge from '@/components/order-status-badge';
import { Button, buttonVariants } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency, formatDate } from '@/lib/format';
import { getErrorStatus } from '@/lib/api-client';
import { myOrdersQuery, type BuyerOrder } from '@/lib/buyer-api';
import { useHydrated } from '@/hooks/use-hydrated';
import { useBuyerSession } from '@/hooks/use-buyer-session';
import StorefrontUnavailable from '../../_components/storefront-unavailable';
import { SignInPanel } from './buyer-sign-in';
import OrderItemThumb from './order-item-thumb';

export default function OrdersClient({ slug }: { slug: string }) {
  const hydrated = useHydrated();
  const token = useBuyerSession((s) => s.token);
  const email = useBuyerSession((s) => s.email);

  // Phiên lưu trong localStorage → chỉ biết sau khi hydrate
  if (!hydrated) {
    return (
      <OrdersShell slug={slug}>
        <OrderRowsSkeleton count={2} />
      </OrdersShell>
    );
  }

  if (!token || !email) {
    return (
      <SignInPanel
        slug={slug}
        back={<BackToShop slug={slug} />}
        title="My orders"
        description="Enter the email you used at checkout. We'll send you a code to see all your orders on any device."
      />
    );
  }

  return <SignedInOrders slug={slug} token={token} email={email} />;
}

function SignedInOrders({ slug, token, email }: { slug: string; token: string; email: string }) {
  const signOut = useBuyerSession((s) => s.signOut);
  const query = useQuery(myOrdersQuery(slug, token));
  const expired = query.isError && getErrorStatus(query.error) === 401;

  // Phiên hết hạn (30 ngày) → quay về màn đăng nhập
  useEffect(() => {
    if (expired) signOut();
  }, [expired, signOut]);

  if (query.isError && !expired) {
    return <StorefrontUnavailable onRetry={() => query.refetch()} isRetrying={query.isFetching} />;
  }

  return (
    <OrdersShell
      slug={slug}
      account={
        <p className="text-sm text-muted-foreground">
          Signed in as <span className="font-medium text-foreground">{email}</span>
          <span aria-hidden> · </span>
          <Button variant="link" className="h-auto px-0" onClick={signOut}>
            Sign out
          </Button>
        </p>
      }
    >
      {!query.isSuccess ? (
        <OrderRowsSkeleton count={2} />
      ) : query.data.length === 0 ? (
        <EmptyState
          icon={Package}
          title="No orders yet"
          description={`Orders you place with ${email} will show up here.`}
          action={
            <Link href={`/shop/${slug}`} className={buttonVariants({ variant: 'outline' })}>
              Start shopping
            </Link>
          }
          className="py-16"
        />
      ) : (
        <ul className="space-y-3">
          {query.data.map((order) => (
            <li key={order.orderNumber}>
              <OrderRow slug={slug} order={order} />
            </li>
          ))}
        </ul>
      )}
    </OrdersShell>
  );
}

function OrdersShell({
  slug,
  account,
  children,
}: {
  slug: string;
  account?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="container mx-auto max-w-3xl px-4 py-8">
      <BackToShop slug={slug} />
      <div className="mb-8 flex flex-wrap items-end justify-between gap-2">
        <h1 className="text-3xl font-bold tracking-tight">My orders</h1>
        {account}
      </div>
      <section aria-label="Your orders">{children}</section>
    </div>
  );
}

function BackToShop({ slug }: { slug: string }) {
  return (
    <Link
      href={`/shop/${slug}`}
      className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
    >
      <ChevronLeft className="size-4" aria-hidden />
      Back to shop
    </Link>
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
