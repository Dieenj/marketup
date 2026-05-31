'use client';

import { useCartStore } from '@/hooks/use-cart';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMutation } from '@tanstack/react-query';
import api from '@/lib/api-client';
import { useParams, useRouter } from 'next/navigation';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ShoppingBag, ChevronLeft, CreditCard, Trash2, Minus, Plus } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

const checkoutSchema = z.object({
  buyerName: z.string().min(2, 'Name is required'),
  buyerEmail: z.string().email('Invalid email'),
  buyerPhone: z.string().min(10, 'Invalid phone number'),
  shippingAddress: z.string().min(5, 'Address is required'),
  shippingCity: z.string().min(2, 'City is required'),
});

export default function CheckoutPage() {
  const params = useParams();
  const slug = params.slug as string;
  const router = useRouter();
  const { items, getTotal, clearCart, removeItem, updateQuantity } = useCartStore();
  
  const total = getTotal();

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
    mutationFn: async (values: z.infer<typeof checkoutSchema>) => {
      // 1. Lấy shopId từ slug trước (hoặc lấy từ cart items)
      const shopRes = await api.get(`/shops/${slug}`);
      const shopId = shopRes.data.id;

      // 2. Định dạng danh sách các chi tiết đơn hàng (order items)
      const orderItems = items.map(item => ({
        productId: item.id,
        quantity: item.quantity,
        ...(item.variantId ? { variantId: item.variantId } : {}),
        ...(item.variantLabel ? { variantLabel: item.variantLabel } : {}),
      }));

      // 3. Gọi API tạo đơn hàng mới
      return api.post('/orders', {
        ...values,
        shopId,
        items: orderItems,
      });
    },
    onSuccess: (res) => {
      toast.success('Order placed successfully!');
      clearCart();
      router.push(`/shop/${slug}/order-success?id=${res.data.id}`);
    },
    onError: (error: { response?: { data?: { message?: string } } }) => {
      toast.error(error.response?.data?.message || 'Failed to place order');
    },
  });

  function onSubmit(values: z.infer<typeof checkoutSchema>) {
    if (items.length === 0) {
      toast.error('Your cart is empty');
      return;
    }
    mutation.mutate(values);
  }

  if (items.length === 0 && !mutation.isSuccess) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <ShoppingBag className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
        <h1 className="text-3xl font-bold mb-4">Your Cart is Empty</h1>
        <p className="text-muted-foreground mb-8">Add some products before checking out.</p>
        <Link href={`/shop/${slug}`}>
          <Button>Back to Shop</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <Link href={`/shop/${slug}`} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-8 transition-colors">
        <ChevronLeft className="h-4 w-4" />
        Back to Products
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Phía bên trái: Form nhập thông tin mua hàng */}
        <div className="space-y-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Checkout</h1>
            <p className="text-muted-foreground">Please fill in your shipping details to complete the order.</p>
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
                  <p className="text-xs text-muted-foreground mt-1">Pay with cash upon receiving your order.</p>
                </CardContent>
              </Card>

              <Button type="submit" className="w-full text-lg py-6 font-bold" size="lg" disabled={mutation.isPending}>
                {mutation.isPending ? 'Processing...' : `Place Order • $${total.toFixed(2)}`}
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
                 {items.map((item) => (
                   <div key={`${item.id}-${item.variantId ?? 'base'}`} className="flex gap-3 p-3 rounded-xl bg-[#fafafa] border border-border/40">
                     <div className="h-14 w-14 bg-muted rounded-lg overflow-hidden shrink-0">
                       {item.imageUrl ? <img src={item.imageUrl} alt={item.name} className="h-full w-full object-cover" /> : <div className="h-full w-full" />}
                     </div>
                     <div className="flex-1 min-w-0">
                       <p className="font-medium text-sm truncate">{item.name}</p>
                       {item.variantLabel && <p className="text-xs text-muted-foreground">{item.variantLabel}</p>}
                       <p className="text-sm font-semibold mt-0.5">${(item.price * item.quantity).toFixed(2)}</p>
                       <div className="flex items-center gap-2 mt-1.5">
                         <button
                           type="button"
                           onClick={() => updateQuantity(item.id, item.quantity - 1, item.variantId)}
                           className="h-6 w-6 rounded-md border bg-white flex items-center justify-center hover:bg-muted transition-colors"
                         >
                           <Minus className="h-3 w-3" />
                         </button>
                         <span className="text-sm font-medium w-5 text-center">{item.quantity}</span>
                         <button
                           type="button"
                           onClick={() => updateQuantity(item.id, item.quantity + 1, item.variantId)}
                           className="h-6 w-6 rounded-md border bg-white flex items-center justify-center hover:bg-muted transition-colors"
                         >
                           <Plus className="h-3 w-3" />
                         </button>
                       </div>
                     </div>
                     <button
                       type="button"
                       onClick={() => removeItem(item.id, item.variantId)}
                       className="text-muted-foreground hover:text-red-500 transition-colors self-start mt-0.5 p-1"
                     >
                       <Trash2 className="h-4 w-4" />
                     </button>
                   </div>
                 ))}
               </div>
               
               <Separator />
               
               <div className="space-y-1.5">
                 <div className="flex justify-between text-sm">
                   <span className="text-muted-foreground">Subtotal</span>
                   <span>${total.toFixed(2)}</span>
                 </div>
                 <div className="flex justify-between text-sm">
                   <span className="text-muted-foreground">Shipping</span>
                   <span className="text-green-600 font-medium">Free</span>
                 </div>
                 <Separator className="my-2" />
                 <div className="flex justify-between text-lg font-bold">
                   <span>Total</span>
                   <span className="text-primary">${total.toFixed(2)}</span>
                 </div>
               </div>
             </CardContent>
           </Card>
        </div>
      </div>
    </div>
  );
}
