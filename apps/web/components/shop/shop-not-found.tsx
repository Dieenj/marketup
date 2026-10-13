import Link from 'next/link';
import { Store } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';

// Giao diện "Shop Not Found" — dùng cho boundary app/shop/not-found.tsx và cho trường hợp
// client mới biết shop không tồn tại (server không gọi được API lúc render)
export default function ShopNotFoundView() {
  return (
    <div className="container mx-auto px-4 py-20 text-center">
      <Store className="mx-auto mb-4 h-16 w-16 text-muted-foreground" aria-hidden />
      <h1 className="text-4xl font-bold mb-4">Shop Not Found</h1>
      <p className="text-muted-foreground mb-8">The store you are looking for does not exist.</p>
      <Link href="/" className={buttonVariants({ size: 'lg' })}>
        Go to MarketUp
      </Link>
    </div>
  );
}
