'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api, { getErrorMessage } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { useEffect } from 'react';
import { ColorPicker } from '@/components/shop/color-picker';
import { BannerImageInput } from '@/components/shop/banner-image-input';
import { useMyShop, MY_SHOP_QUERY_KEY } from '@/hooks/use-my-shop';
import { DEFAULT_SHOP_COLOR } from '@/lib/color-utils';
import PageHeader from '@/components/dashboard/page-header';

const shopSchema = z.object({
  name: z.string().min(2, 'Shop name is required'),
  description: z.string().optional(),
  bannerUrl: z.string().optional(),
  primaryColor: z.string(),
  contactEmail: z.string().email('Invalid email').optional().or(z.literal('')),
  contactPhone: z.string().optional(),
  address: z.string().optional(),
});

export default function SettingsPage() {
  const queryClient = useQueryClient();

  // Layout dashboard chỉ render trang khi đã tải xong shop → dữ liệu luôn có sẵn ở đây
  const { data: shop } = useMyShop();

  const form = useForm<z.infer<typeof shopSchema>>({
    resolver: zodResolver(shopSchema),
    defaultValues: {
      name: '',
      description: '',
      bannerUrl: '',
      primaryColor: DEFAULT_SHOP_COLOR,
      contactEmail: '',
      contactPhone: '',
      address: '',
    },
  });

  useEffect(() => {
    if (shop) {
      form.reset({
        name: shop.name,
        description: shop.description || '',
        bannerUrl: shop.bannerUrl || '',
        primaryColor: shop.primaryColor || DEFAULT_SHOP_COLOR,
        contactEmail: shop.contactEmail || '',
        contactPhone: shop.contactPhone || '',
        address: shop.address || '',
      });
    }
  }, [shop, form]);

  const mutation = useMutation({
    mutationFn: async (values: z.infer<typeof shopSchema>) => {
      return api.patch(`/shops/${shop!.id}`, values);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MY_SHOP_QUERY_KEY });
      toast.success('Shop settings updated successfully');
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, 'Failed to update shop settings'));
    },
  });

  function onSubmit(values: z.infer<typeof shopSchema>) {
    mutation.mutate(values);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Shop Settings"
        description="Update the public information for your online storefront."
      />

      <div className="rounded-xl border bg-card p-6 shadow-xs sm:p-8">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Shop Name</FormLabel>
                    <FormControl>
                      <Input placeholder="E.g. My Cool Shop" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormItem>
                <FormLabel>Shop URL (Slug)</FormLabel>
                <FormControl>
                  <Input value={shop?.slug} disabled className="bg-muted" />
                </FormControl>
                <FormDescription>Public URL: marketup.com/shop/{shop?.slug}</FormDescription>
              </FormItem>
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Store Description</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Welcome to our store! We sell..." rows={4} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="primaryColor"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Brand Color</FormLabel>
                  <FormControl>
                    <ColorPicker value={field.value} onChange={field.onChange} />
                  </FormControl>
                  <FormDescription>
                    Main color used on your storefront — hero, buttons, accents.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="bannerUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Banner Image{' '}
                    <span className="text-muted-foreground font-normal">(optional)</span>
                  </FormLabel>
                  <FormControl>
                    <BannerImageInput value={field.value ?? ''} onChange={field.onChange} />
                  </FormControl>
                  <FormDescription>
                    Background image for your storefront hero section.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t">
              <FormField
                control={form.control}
                name="contactEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contact Email</FormLabel>
                    <FormControl>
                      <Input placeholder="contact@shop.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="contactPhone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contact Phone</FormLabel>
                    <FormControl>
                      <Input placeholder="+84 987 654 321" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Store Address</FormLabel>
                  <FormControl>
                    <Input placeholder="123 Main St, City, Country" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end pt-4">
              <Button type="submit" size="xl" disabled={mutation.isPending}>
                {mutation.isPending && <Spinner />}
                {mutation.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}
