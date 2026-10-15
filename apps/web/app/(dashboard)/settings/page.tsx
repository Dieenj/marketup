'use client';

import { useForm, useWatch } from 'react-hook-form';
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
import StorefrontPreview, { type BannerFocus } from '@/components/shop/storefront-preview';
import { BANNER_ZOOM_MAX, BANNER_ZOOM_MIN } from '@/components/shop/banner-style';
import { Slider } from '@/components/ui/slider';
import { useMyShop, MY_SHOP_QUERY_KEY } from '@/hooks/use-my-shop';
import { DEFAULT_SHOP_COLOR } from '@/lib/color-utils';
import PageHeader from '@/components/dashboard/page-header';

const shopSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Shop name is required')
    .max(100, 'Shop name must be at most 100 characters'),
  description: z.string().max(1000, 'Description must be at most 1000 characters').optional(),
  bannerUrl: z.string().optional(),
  bannerFocusX: z.number().int().min(0).max(100),
  bannerFocusY: z.number().int().min(0).max(100),
  bannerZoom: z.number().int().min(BANNER_ZOOM_MIN).max(BANNER_ZOOM_MAX),
  primaryColor: z.string(),
  contactEmail: z.string().email('Invalid email').optional().or(z.literal('')),
  contactPhone: z.string().optional(),
  address: z.string().max(255, 'Address must be at most 255 characters').optional(),
});

type ShopForm = z.infer<typeof shopSchema>;

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border bg-card p-6 shadow-xs sm:p-8">
      <h2 className="text-base font-semibold">{title}</h2>
      <p className="mt-1 mb-6 text-sm text-muted-foreground">{description}</p>
      {children}
    </section>
  );
}

export default function SettingsPage() {
  const queryClient = useQueryClient();

  // Layout dashboard chỉ render trang khi đã tải xong shop → dữ liệu luôn có sẵn ở đây
  const { data: shop } = useMyShop();

  const form = useForm<ShopForm>({
    resolver: zodResolver(shopSchema),
    defaultValues: {
      name: '',
      description: '',
      bannerUrl: '',
      bannerFocusX: 50,
      bannerFocusY: 50,
      bannerZoom: BANNER_ZOOM_MIN,
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
        bannerFocusX: shop.bannerFocusX ?? 50,
        bannerFocusY: shop.bannerFocusY ?? 50,
        bannerZoom: shop.bannerZoom ?? BANNER_ZOOM_MIN,
        primaryColor: shop.primaryColor || DEFAULT_SHOP_COLOR,
        contactEmail: shop.contactEmail || '',
        contactPhone: shop.contactPhone || '',
        address: shop.address || '',
      });
    }
  }, [shop, form]);

  // Xem trước theo giá trị đang nhập (chưa lưu)
  const draft = useWatch({ control: form.control });
  const setBannerFocus = ({ x, y }: BannerFocus) => {
    form.setValue('bannerFocusX', x, { shouldDirty: true });
    form.setValue('bannerFocusY', y, { shouldDirty: true });
  };
  const setBannerZoom = (zoom: number) => form.setValue('bannerZoom', zoom, { shouldDirty: true });
  // Về giữa ảnh, không phóng to
  const resetBanner = () => {
    setBannerFocus({ x: 50, y: 50 });
    setBannerZoom(BANNER_ZOOM_MIN);
  };
  const bannerAdjusted =
    draft.bannerFocusX !== 50 || draft.bannerFocusY !== 50 || draft.bannerZoom !== BANNER_ZOOM_MIN;

  const mutation = useMutation({
    mutationFn: async (values: ShopForm) => {
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

  function onSubmit(values: ShopForm) {
    mutation.mutate(values);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Shop Settings"
        description="Update the public information for your online storefront."
      />

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Section title="Shop details" description="Shown on your storefront and order pages.">
            <div className="space-y-6">
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
                      <Textarea
                        placeholder="Welcome to our store! We sell..."
                        rows={4}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
            </div>
          </Section>

          <Section
            title="Storefront appearance"
            description="Your brand colour and banner. The preview updates as you change them; save to publish."
          >
            <div className="space-y-8">
              <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
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
                        Background behind your shop name and details, and the colour of buttons, the
                        selected category and the cart icon. Text switches between black and white
                        so it stays readable.
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
                        <BannerImageInput
                          value={field.value ?? ''}
                          onChange={(url) => {
                            field.onChange(url);
                            // Ảnh mới: bắt đầu lại từ giữa ảnh, không phóng to
                            resetBanner();
                          }}
                        />
                      </FormControl>
                      <FormDescription>
                        Shown beside your shop details at the top of your storefront (above them on
                        a phone). Drag it in the preview to choose which part shows; zoom in to move
                        it in any direction. Without a banner, your brand colour fills the whole
                        area.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium">Preview</p>
                  {draft.bannerUrl && bannerAdjusted && (
                    <Button type="button" variant="ghost" size="sm" onClick={resetBanner}>
                      Reset position
                    </Button>
                  )}
                </div>
                {draft.bannerUrl && (
                  <div className="flex max-w-sm items-center gap-3 pb-1">
                    <span className="text-sm text-muted-foreground">Zoom</span>
                    <Slider
                      thumbLabel="Banner zoom"
                      min={BANNER_ZOOM_MIN}
                      max={BANNER_ZOOM_MAX}
                      step={5}
                      // Mảng một giá trị = một núm kéo (số đơn lẻ thì Slider vẽ thành chọn khoảng 2 núm)
                      value={[draft.bannerZoom ?? BANNER_ZOOM_MIN]}
                      onValueChange={(value) =>
                        setBannerZoom(Array.isArray(value) ? value[0] : value)
                      }
                    />
                    <span className="w-11 text-right text-sm tabular-nums">
                      {draft.bannerZoom ?? BANNER_ZOOM_MIN}%
                    </span>
                  </div>
                )}
                {shop && (
                  <StorefrontPreview
                    shop={{
                      ...shop,
                      name: draft.name || shop.name,
                      description: draft.description,
                      address: draft.address,
                      contactPhone: draft.contactPhone,
                      bannerUrl: draft.bannerUrl,
                      bannerFocusX: draft.bannerFocusX,
                      bannerFocusY: draft.bannerFocusY,
                      bannerZoom: draft.bannerZoom,
                      primaryColor: draft.primaryColor,
                    }}
                    onBannerFocusChange={setBannerFocus}
                  />
                )}
              </div>
            </div>
          </Section>

          <div className="flex justify-end">
            <Button type="submit" size="xl" disabled={mutation.isPending}>
              {mutation.isPending && <Spinner />}
              {mutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
