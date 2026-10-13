'use client';

import Link from 'next/link';
import { useParams, usePathname } from 'next/navigation';
import { Package } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Dùng chung cho shop và sản phẩm không tồn tại (notFound() ở page của cả hai route đều rơi về boundary này)
export default function StorefrontNotFound() {
  const { slug } = useParams<{ slug: string }>();
  const pathname = usePathname();

  if (pathname?.includes('/products/')) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <Package className="mx-auto mb-4 h-16 w-16 text-muted-foreground" />
        <h1 className="mb-4 text-3xl font-bold">Product Not Found</h1>
        <Link href={`/shop/${slug}`}>
          <Button>Back to Shop</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-20 text-center">
      <h1 className="text-4xl font-bold mb-4">Shop Not Found</h1>
      <p className="text-muted-foreground">The store you are looking for does not exist.</p>
    </div>
  );
}
