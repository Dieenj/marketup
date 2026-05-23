'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api-client';
import { Button } from '@/components/ui/button';
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
import { useAuthStore } from '@/hooks/use-auth';
import { useEffect } from 'react';

const shopSchema = z.object({
  name: z.string().min(2, 'Shop name is required'),
  description: z.string().optional(),
  contactEmail: z.string().email('Invalid email').optional().or(z.literal('')),
  contactPhone: z.string().optional(),
  address: z.string().optional(),
});

export default function SettingsPage() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  const { data: shop, isLoading } = useQuery({
    queryKey: ['my-shop'],
    queryFn: async () => {
      const { data } = await api.get('/shops/my-shop');
      return data;
    },
    enabled: !!user,
  });

  const form = useForm<z.infer<typeof shopSchema>>({
    resolver: zodResolver(shopSchema),
    defaultValues: {
      name: '',
      description: '',
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
        contactEmail: shop.contactEmail || '',
        contactPhone: shop.contactPhone || '',
        address: shop.address || '',
      });
    }
  }, [shop, form]);

  const mutation = useMutation({
    mutationFn: async (values: z.infer<typeof shopSchema>) => {
      return api.patch(`/shops/${shop.id}`, values);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-shop'] });
      toast.success('Shop settings updated successfully');
    },
    onError: () => {
      toast.error('Failed to update shop settings');
    },
  });

  function onSubmit(values: z.infer<typeof shopSchema>) {
    mutation.mutate(values);
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="h-8 w-8 rounded-full border-2 border-[#111111] border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Shop Settings</h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          Update the public information for your online storefront.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-border/60 p-8 shadow-sm">
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
                  <FormDescription>
                    Public URL: marketup.com/shop/{shop?.slug}
                  </FormDescription>
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
                <Button
                  type="submit"
                  className="bg-[#111111] text-white hover:bg-[#222222] rounded-xl h-10 px-6"
                  disabled={mutation.isPending}
                >
                  {mutation.isPending ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </form>
          </Form>
      </div>
    </div>
  );
}
