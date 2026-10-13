'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Package } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';

// Sản phẩm không tồn tại / không thuộc shop này (notFound() ở trang sản phẩm).
// Shop không tồn tại do app/shop/not-found.tsx xử lý vì notFound() của shop gọi ở layout.
export default function ProductNotFound() {
  const { slug } = useParams<{ slug: string }>();

  return (
    <div className="container mx-auto px-4 py-20 text-center">
      <Package className="mx-auto mb-4 h-16 w-16 text-muted-foreground" aria-hidden />
      <h1 className="mb-4 text-3xl font-bold">Product Not Found</h1>
      <Link href={`/shop/${slug}`} className={buttonVariants()}>
        Back to Shop
      </Link>
    </div>
  );
}
