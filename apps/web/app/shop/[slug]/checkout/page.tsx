'use client';

import { useEffect, useMemo } from 'react';
import { useCartStore, useShopCart, type CartLine } from '@/hooks/use-cart';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import api, { getErrorMessage, getErrorStatus } from '@/lib/api-client';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button, buttonVariants } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ShoppingBag, ChevronLeft, CreditCard, Trash2, Minus, Plus } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/format';
import RemoteImage from '@/components/remote-image';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { useHydrated } from '@/hooks/use-hydrated';
import { storefrontQueries } from '@/lib/storefront-queries';
import { reconcileCart, type CatalogProduct } from '@/lib/cart-checkout';
import StorefrontUnavailable from '../_components/storefront-unavailable';

const checkoutSchema = z.object({
  buyerName: z.string().min(2, 'Name is required'),
  buyerEmail: z.string().email('Invalid email'),
  buyerPhone: z.string().min(10, 'Invalid phone number'),
  shippingAddress: z.string().min(5, 'Address is required'),
  shippingCity: z.string().min(2, 'City is required'),
});

const q = storefrontQueries();

export default function CheckoutPage() {
  const params = useParams();
  const slug = params.slug as string;
  const router = useRouter();
  const hydrated = useHydrated();
  const { setQuantity, removeItem, clearCart } = useCartStore();

  // Shop đã được prefetch ở layout; shopId là khoá của giỏ
  const { data: shop, error: shopError, refetch: refetchShop } = useQuery(q.shop(slug));
  const shopId = shop?.id;
  const lines = useShopCart(shopId);

  // Giá và tồn kho hiện tại (cùng query với storefront, thường có sẵn trong cache) — luôn tải lại khi vào checkout
  const {
    data: products,
    error: productsError,
    refetch: refetchProducts,
    isRefetching: isRefetchingProducts,
  } = useQuery({
    ...q.products<CatalogProduct>(shopId ?? ''),
    enabled: !!shopId && lines.length > 0,
    refetchOnMount: 'always',
  });

  const { available, unavailable, subtotal } = useMemo(
    () => reconcileCart(lines, products ?? []),
    [lines, products],
  );

  // Giỏ có nhiều hơn số shop còn → ghi số đã giảm vào giỏ để icon giỏ và checkout khớp nhau
  useEffect(() => {
    if (!shopId) return;
    for (const line of available) {
      if (line.quantityReduced) setQuantity(shopId, line.variantId, line.quantity);
    }
  }, [available, shopId, setQuantity]);

  const form = useForm<z.infer<typeof checkoutSchema>>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      buyerName: '',
      buyerEmail: '',
      buyerPhone: '',
      shippingAddress: '',
      shippingCity: '',
    },
  });

  const mutation = useMutation({
    // Chỉ đặt các món còn bán, với số lượng đã giới hạn theo tồn kho; giá do API tính
    mutationFn: (values: z.infer<typeof checkoutSchema>) =>
      api.post<{ orderNumber: string; accessToken: string }>('/orders', {
        ...values,
        shopId,
        items: available.map(({ productId, variantId, quantity }) => ({
          productId,
          variantId,
          quantity,
        })),
      }),
    onSuccess: (res) => {
      const { orderNumber, accessToken } = res.data;
      toast.success('Order placed successfully!');
      if (shopId) clearCart(shopId);
      // accessToken: link xem đơn vừa đặt mà không cần đăng nhập
      const query = new URLSearchParams({ order: orderNumber, t: accessToken });
      router.push(`/shop/${slug}/order-success?${query}`);
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, 'Failed to place order'));
      // Vd. người khác vừa mua hết hàng → tải lại giá/tồn kho để giỏ hiển thị đúng
      if (getErrorStatus(error) === 400) void refetchProducts();
    },
  });

  function onSubmit(values: z.infer<typeof checkoutSchema>) {
    if (available.length === 0) {
      toast.error('There is nothing in your cart that can be ordered');
      return;
    }
    mutation.mutate(values);
  }

  // Đã đặt xong, giỏ vừa được xoá: giữ khung trang tới khi chuyển sang trang đặt hàng thành công
  if (mutation.isSuccess) return <CheckoutSkeleton />;

  if (shopError && !shop) {
    return <StorefrontUnavailable onRetry={() => refetchShop()} />;
  }

  // Giỏ chỉ có ở trình duyệt; chờ hydrate và dữ liệu sản phẩm để không hiện giá/tồn kho cũ
  if (!hydrated || !shop || (lines.length > 0 && !products && !productsError)) {
    return <CheckoutSkeleton />;
  }

  if (lines.length > 0 && !products) {
    return (
      <StorefrontUnavailable onRetry={() => refetchProducts()} isRetrying={isRefetchingProducts} />
    );
  }

  if (lines.length === 0) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <ShoppingBag className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
        <h1 className="text-3xl font-bold mb-4">Your Cart is Empty</h1>
        <p className="text-muted-foreground mb-8">Add some products before checking out.</p>
        <Link href={`/shop/${slug}`} className={buttonVariants()}>
          Back to Shop
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <Link
        href={`/shop/${slug}`}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-8 transition-colors"
      >
        <ChevronLeft className="h-4 w-4" />
        Back to Products
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Phía bên trái: Form nhập thông tin mua hàng */}
        <div className="space-y-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Checkout</h1>
            <p className="text-muted-foreground">
              Please fill in your shipping details to complete the order.
            </p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <Card className="border-2">
                <CardHeader>
                  <CardTitle>Shipping Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="buyerName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name</FormLabel>
                        <FormControl>
                          <Input placeholder="John Doe" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="buyerEmail"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input placeholder="john@example.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="buyerPhone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone Number</FormLabel>
                          <FormControl>
                            <Input placeholder="+84 987..." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={form.control}
                    name="shippingAddress"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Home Address</FormLabel>
                        <FormControl>
                          <Input placeholder="123 Street Name..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="shippingCity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>City</FormLabel>
                        <FormControl>
                          <Input placeholder="Ho Chi Minh City" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              <Card className="border-2 border-primary/20 bg-primary/5">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Payment Method
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm font-medium">Cash on Delivery (COD)</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Pay with cash upon receiving your order.
                  </p>
                </CardContent>
              </Card>

              <Button
                type="submit"
                className="w-full text-lg py-6 font-bold"
                size="lg"
                disabled={mutation.isPending || available.length === 0}
              >
                {mutation.isPending ? 'Processing...' : `Place Order • ${formatCurrency(subtotal)}`}
              </Button>
            </form>
          </Form>
        </div>

        {/* Phía bên phải: Tóm tắt thông tin đơn hàng và tổng tiền */}
        <div className="space-y-8">
          <Card className="sticky top-24 border-2 shadow-lg">
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="max-h-[400px] overflow-y-auto space-y-3 pr-1">
                {available.map((line) => (
                  <div
                    key={line.variantId}
                    className="flex gap-3 p-3 rounded-xl bg-[#fafafa] border border-border/40"
                  >
                    <LineThumb line={line} />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{line.name}</p>
                      {line.variantLabel && (
                        <p className="text-xs text-muted-foreground">{line.variantLabel}</p>
                      )}
                      <p className="text-sm font-semibold mt-0.5">
                        {formatCurrency(line.price * line.quantity)}
                      </p>
                      {line.priceChanged && (
                        <p className="text-xs text-amber-700">
                          Price updated (was {formatCurrency(line.addedPrice)})
                        </p>
                      )}
                      {line.quantity >= line.stock && (
                        <p className="text-xs text-amber-700">Only {line.stock} left</p>
                      )}
                      <div className="flex items-center gap-2 mt-1.5">
                        <button
                          type="button"
                          onClick={() => setQuantity(shop.id, line.variantId, line.quantity - 1)}
                          disabled={line.quantity <= 1}
                          aria-label={`Decrease quantity of ${line.name}`}
                          className="h-6 w-6 rounded-md border bg-white flex items-center justify-center hover:bg-muted transition-colors disabled:opacity-40"
                        >
                          <Minus className="h-3 w-3" aria-hidden />
                        </button>
                        <span className="text-sm font-medium w-5 text-center">{line.quantity}</span>
                        <button
                          type="button"
                          onClick={() => setQuantity(shop.id, line.variantId, line.quantity + 1)}
                          disabled={line.quantity >= line.stock}
                          aria-label={`Increase quantity of ${line.name}`}
                          className="h-6 w-6 rounded-md border bg-white flex items-center justify-center hover:bg-muted transition-colors disabled:opacity-40"
                        >
                          <Plus className="h-3 w-3" aria-hidden />
                        </button>
                      </div>
                    </div>
                    <RemoveLineButton
                      name={line.name}
                      onRemove={() => removeItem(shop.id, line.variantId)}
                    />
                  </div>
                ))}
              </div>

              {unavailable.length > 0 && (
                <section aria-labelledby="unavailable-heading" className="space-y-2">
                  <h2
                    id="unavailable-heading"
                    className="text-sm font-medium text-muted-foreground"
                  >
                    No longer available
                  </h2>
                  {unavailable.map((line) => (
                    <div
                      key={line.variantId}
                      className="flex gap-3 p-3 rounded-xl border border-dashed border-border"
                    >
                      <LineThumb line={line} className="opacity-50" />
                      <div className="flex-1 min-w-0 opacity-60">
                        <p className="font-medium text-sm truncate">{line.name}</p>
                        {line.variantLabel && (
                          <p className="text-xs text-muted-foreground">{line.variantLabel}</p>
                        )}
                        <p className="text-xs mt-0.5">
                          Sold out or removed by the shop · not included
                        </p>
                      </div>
                      <RemoveLineButton
                        name={line.name}
                        onRemove={() => removeItem(shop.id, line.variantId)}
                      />
                    </div>
                  ))}
                </section>
              )}

              {available.length === 0 && (
                <p className="text-sm text-muted-foreground" role="status">
                  None of the items in your cart can be ordered right now.
                </p>
              )}

              <Separator />

              <div className="space-y-1.5">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Shipping</span>
                  <span className="text-green-600 font-medium">Free</span>
                </div>
                <Separator className="my-2" />
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span className="text-primary">{formatCurrency(subtotal)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function LineThumb({ line, className }: { line: CartLine; className?: string }) {
  return (
    <div className={cn('h-14 w-14 bg-muted rounded-lg overflow-hidden shrink-0', className)}>
      {line.imageUrl ? (
        <RemoteImage
          src={line.imageUrl}
          alt={line.name}
          width={56}
          height={56}
          className="h-full w-full object-cover"
        />
      ) : (
        <div className="h-full w-full" />
      )}
    </div>
  );
}

function RemoveLineButton({ name, onRemove }: { name: string; onRemove: () => void }) {
  return (
    <button
      type="button"
      onClick={onRemove}
      aria-label={`Remove ${name} from cart`}
      className="text-muted-foreground hover:text-red-500 transition-colors self-start mt-0.5 p-1"
    >
      <Trash2 className="h-4 w-4" aria-hidden />
    </button>
  );
}

function CheckoutSkeleton() {
  return (
    <div
      className="container mx-auto px-4 py-8 max-w-6xl"
      aria-busy="true"
      aria-label="Loading checkout"
    >
      <Skeleton className="h-4 w-36 mb-8" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        <div className="space-y-4">
          <Skeleton className="h-9 w-48" />
          <Skeleton className="h-80 w-full rounded-xl" />
        </div>
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    </div>
  );
}
