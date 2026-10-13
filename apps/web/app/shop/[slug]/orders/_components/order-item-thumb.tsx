import { Package } from 'lucide-react';
import RemoteImage from '@/components/remote-image';
import { cn } from '@/lib/utils';

// Ảnh sản phẩm trong đơn (ảnh chụp lúc đặt hàng, có thể không có)
export default function OrderItemThumb({ src, className }: { src?: string | null; className?: string }) {
  return (
    <div className={cn('flex shrink-0 items-center justify-center overflow-hidden rounded-lg bg-muted', className)}>
      {src ? (
        <RemoteImage src={src} alt="" width={64} height={64} className="size-full object-cover" />
      ) : (
        <Package className="size-1/3 text-muted-foreground" aria-hidden />
      )}
    </div>
  );
}
