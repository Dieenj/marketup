'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { getErrorMessage, getErrorStatus } from '@/lib/api-client';
import { lookupOrder, orderLookupQuery, type BuyerOrder } from '@/lib/order-lookup';
import { useRecentOrdersStore } from '@/hooks/use-recent-orders';

const findOrderSchema = z.object({
  orderNumber: z.string().trim().min(1, 'Enter your order number'),
  email: z.string().trim().email('Enter the email you used at checkout'),
});

type FindOrderValues = z.infer<typeof findOrderSchema>;

// Tra cứu đơn bằng mã đơn + email. Tìm thấy → thiết bị nhớ đơn này và đưa sẵn dữ liệu vào cache
// để trang chi tiết hiện ngay, không phải gọi API lần nữa.
export default function FindOrderForm({
  slug,
  orderNumber,
  onFound,
}: {
  slug: string;
  /** Đã biết mã đơn (trang chi tiết mở trên thiết bị khác) → chỉ hỏi email */
  orderNumber?: string;
  onFound: (order: BuyerOrder) => void;
}) {
  const queryClient = useQueryClient();
  const remember = useRecentOrdersStore((s) => s.remember);

  const form = useForm<FindOrderValues>({
    resolver: zodResolver(findOrderSchema),
    defaultValues: { orderNumber: orderNumber ?? '', email: '' },
  });

  const mutation = useMutation({
    mutationFn: (values: FindOrderValues) =>
      lookupOrder({
        shopSlug: slug,
        orderNumber: values.orderNumber.toUpperCase(),
        email: values.email,
      }),
    onSuccess: (order, values) => {
      const input = { shopSlug: slug, orderNumber: order.orderNumber, email: values.email };
      queryClient.setQueryData(orderLookupQuery(input).queryKey, order);
      remember(input);
      onFound(order);
    },
    onError: (error) => {
      form.setError('root', {
        message:
          getErrorStatus(error) === 404
            ? "We couldn't find an order with that number and email. Check your order confirmation email."
            : getErrorMessage(error, 'Something went wrong. Please try again.'),
      });
    },
  });

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
        className="space-y-4"
        noValidate
      >
        {!orderNumber && (
          <FormField
            control={form.control}
            name="orderNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Order number</FormLabel>
                <FormControl>
                  <Input
                    placeholder="ORD-…"
                    autoComplete="off"
                    className="h-11 bg-card"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  placeholder="you@example.com"
                  autoComplete="email"
                  className="h-11 bg-card"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {form.formState.errors.root && (
          <p role="alert" className="text-sm text-destructive">
            {form.formState.errors.root.message}
          </p>
        )}
        <Button type="submit" size="xl" className="w-full" disabled={mutation.isPending}>
          {mutation.isPending ? <Spinner /> : <Search aria-hidden />}
          {orderNumber ? 'View order' : 'Find order'}
        </Button>
      </form>
    </Form>
  );
}
