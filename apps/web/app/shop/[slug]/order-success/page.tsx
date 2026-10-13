'use client';

import { useSearchParams } from 'next/navigation';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { CheckCircle2, Package, ShoppingBag } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

export default function OrderSuccessPage() {
  const params = useParams();
  const slug = params.slug as string;
  const searchParams = useSearchParams();
  const orderNumber = searchParams.get('order');

  return (
    <div className="container mx-auto px-4 py-20 text-center max-w-2xl">
      <div className="mb-8 flex justify-center">
        <div className="rounded-full bg-green-100 p-6 animate-bounce">
          <CheckCircle2 className="h-16 w-16 text-green-600" />
        </div>
      </div>
      
      <h1 className="text-4xl font-extrabold mb-4 tracking-tight">Order Received!</h1>
      <p className="text-xl text-muted-foreground mb-2">
        Thank you for shopping with us.
      </p>
      <p className="text-sm text-muted-foreground mb-10">
        {orderNumber ? (
          <>
            Your order number is <span className="font-mono font-medium text-foreground">{orderNumber}</span>.{' '}
          </>
        ) : null}
        We&apos;ve emailed you a confirmation.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-md mx-auto">
        <Link href={`/shop/${slug}`} className={cn(buttonVariants({ variant: 'outline' }), 'w-full gap-2 py-6')}>
          <ShoppingBag className="h-5 w-5" />
          Continue Shopping
        </Link>
        <Link
          href={orderNumber ? `/shop/${slug}/orders/${encodeURIComponent(orderNumber)}` : `/shop/${slug}/orders`}
          className={cn(buttonVariants(), 'w-full gap-2 py-6')}
        >
          <Package className="h-5 w-5" />
          Track your order
        </Link>
      </div>
    </div>
  );
}
