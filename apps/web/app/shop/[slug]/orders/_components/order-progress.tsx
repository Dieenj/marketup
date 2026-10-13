import { Check, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDate } from '@/lib/format';
import type { BuyerOrder } from '@/lib/order-lookup';

// Các bước người mua thấy (lời lẽ cho người mua, khác nhãn trạng thái ở dashboard người bán)
const STEPS = [
  { status: 'PENDING', label: 'Placed' },
  { status: 'CONFIRMED', label: 'Confirmed' },
  { status: 'PROCESSING', label: 'Preparing' },
  { status: 'SHIPPING', label: 'On the way' },
  { status: 'DELIVERED', label: 'Delivered' },
] as const;

function statusMessage(order: BuyerOrder) {
  switch (order.status) {
    case 'PENDING':
      return 'Waiting for the shop to confirm your order.';
    case 'CONFIRMED':
      return 'The shop has confirmed your order.';
    case 'PROCESSING':
      return 'The shop is preparing your order.';
    case 'SHIPPING':
      return 'Your order is on its way. Have the cash ready for the courier.';
    case 'DELIVERED':
      return order.deliveredAt ? `Delivered on ${formatDate(order.deliveredAt)}.` : 'Your order has been delivered.';
    default:
      return '';
  }
}

export default function OrderProgress({ order }: { order: BuyerOrder }) {
  if (order.status === 'CANCELLED') {
    return (
      <div className="flex items-start gap-3 rounded-2xl border border-destructive/20 bg-destructive/5 p-5">
        <XCircle className="mt-0.5 size-5 shrink-0 text-destructive" aria-hidden />
        <div>
          <p className="font-semibold text-destructive">This order was cancelled</p>
          <p className="mt-1 text-sm text-muted-foreground">
            You won&apos;t be charged. Contact the shop if you have any questions.
          </p>
        </div>
      </div>
    );
  }

  const current = Math.max(
    0,
    STEPS.findIndex((step) => step.status === order.status),
  );

  return (
    <div className="rounded-2xl border bg-card p-5 sm:p-6">
      <p className="mb-5 text-sm font-medium">{statusMessage(order)}</p>
      <ol aria-label="Order progress" className="grid gap-3 sm:grid-cols-5 sm:gap-0">
        {STEPS.map((step, i) => {
          const reached = i <= current;
          return (
            <li
              key={step.status}
              aria-current={i === current ? 'step' : undefined}
              className="relative flex items-center gap-3 sm:flex-col sm:gap-2 sm:text-center"
            >
              {/* Đoạn nối từ bước trước tới bước này */}
              {i > 0 && (
                <span
                  aria-hidden
                  className={cn(
                    'absolute top-4 right-1/2 hidden h-0.5 w-full -translate-y-1/2 sm:block',
                    reached ? 'bg-(--shop-primary)' : 'bg-border',
                  )}
                />
              )}
              <span
                aria-hidden
                className={cn(
                  'relative z-10 flex size-8 shrink-0 items-center justify-center rounded-full border-2 text-xs font-semibold',
                  reached
                    ? 'border-(--shop-primary) bg-(--shop-primary) text-(--shop-primary-fg)'
                    : 'border-border bg-card text-muted-foreground',
                )}
              >
                {i < current ? <Check className="size-4" /> : i + 1}
              </span>
              <span className={cn('text-sm', reached ? 'font-medium' : 'text-muted-foreground')}>
                {step.label}
                <span className="sr-only">{i < current ? ' (done)' : i === current ? ' (current)' : ''}</span>
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
