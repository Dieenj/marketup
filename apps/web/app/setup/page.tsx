'use client';

import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMutation } from '@tanstack/react-query';
import api, { getErrorMessage } from '@/lib/api-client';
import { useRouter } from 'next/navigation';
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
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from '@/components/ui/input-group';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { Store, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { useAuthStore } from '@/hooks/use-auth';
import Link from 'next/link';
import { ColorPicker } from '@/components/shop/color-picker';
import { DEFAULT_SHOP_COLOR } from '@/lib/color-utils';
import StorefrontPreview from '@/components/shop/storefront-preview';
import { slugify } from '@/lib/slugify';

const setupSchema = z.object({
  name: z.string().min(2, 'Shop name must be at least 2 characters'),
  slug: z
    .string()
    .min(3, 'URL must be at least 3 characters')
    .max(30, 'URL must be at most 30 characters')
    // Cùng quy tắc với API: chữ thường/số, nối bằng một dấu gạch ngang
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      'Use lowercase letters and numbers, separated by single hyphens',
    ),
  description: z.string().optional(),
  contactEmail: z.string().email('Invalid email').optional().or(z.literal('')),
  primaryColor: z.string(),
});

export default function SetupPage() {
  const router = useRouter();
  const { user } = useAuthStore();

  const form = useForm<z.infer<typeof setupSchema>>({
    resolver: zodResolver(setupSchema),
    defaultValues: {
      name: '',
      slug: '',
      description: '',
      contactEmail: user?.email || '',
      primaryColor: DEFAULT_SHOP_COLOR,
    },
  });

  const mutation = useMutation({
    mutationFn: async (values: z.infer<typeof setupSchema>) => {
      const { data } = await api.post('/shops', values);
      return data;
    },
    onSuccess: () => {
      toast.success('Your shop is ready!');
      router.push('/dashboard');
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, 'Failed to create shop'));
    },
  });

  const handleNameChange = (name: string) => {
    form.setValue('name', name);
    form.setValue('slug', slugify(name, 30));
  };

  const [watchedName, watchedSlug, watchedDescription, watchedPrimaryColor] = useWatch({
    control: form.control,
    name: ['name', 'slug', 'description', 'primaryColor'],
  });

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="flex h-16 items-center border-b bg-card px-6">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground transition-transform group-hover:scale-105">
            <Store className="size-4" aria-hidden />
          </div>
          <span className="font-bold text-lg tracking-tight">MarketUp</span>
        </Link>
      </header>

      <main className="flex-1 flex items-start justify-center p-6 pt-10">
        <div className="w-full max-w-4xl space-y-8">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight">Set up your shop</h1>
            <p className="text-muted-foreground">
              Welcome, <span className="font-medium text-foreground">{user?.name}</span>! Let&apos;s
              get your storefront live.
            </p>
          </div>

          <div className="grid lg:grid-cols-[1fr_300px] gap-6 items-start">
            {/* Form */}
            <div className="rounded-xl border bg-card p-8 shadow-xs">
              <Form {...form}>
                <form onSubmit={form.handleSubmit((v) => mutation.mutate(v))} className="space-y-5">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium">Shop Name</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="E.g. My Awesome Store"
                            className="h-11"
                            {...field}
                            onChange={(e) => handleNameChange(e.target.value)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="slug"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium">Shop URL</FormLabel>
                        {/* FormControl bọc trực tiếp ô nhập để label/aria-invalid/thông báo lỗi gắn đúng vào input */}
                        <InputGroup className="h-11">
                          <InputGroupAddon>
                            <InputGroupText>/shop/</InputGroupText>
                          </InputGroupAddon>
                          <FormControl>
                            <InputGroupInput placeholder="my-awesome-store" {...field} />
                          </FormControl>
                        </InputGroup>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium">
                          Description{' '}
                          <span className="text-muted-foreground font-normal">(optional)</span>
                        </FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Tell customers what you sell..."
                            rows={3}
                            className="bg-[#fafafa] border-border/80 focus-visible:ring-1 focus-visible:ring-foreground focus-visible:border-foreground resize-none"
                            {...field}
                          />
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
                        <FormLabel className="text-sm font-medium">Brand Color</FormLabel>
                        <FormControl>
                          <ColorPicker value={field.value} onChange={field.onChange} />
                        </FormControl>
                        <FormDescription className="text-xs">
                          Main color used on your storefront — hero, buttons, accents.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="contactEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium">
                          Contact Email{' '}
                          <span className="text-muted-foreground font-normal">(optional)</span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="shop@example.com"
                            className="h-11"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button type="submit" size="xl" className="w-full" disabled={mutation.isPending}>
                    {mutation.isPending ? (
                      <Spinner />
                    ) : (
                      <>
                        Launch My Shop
                        <ArrowRight data-icon="inline-end" />
                      </>
                    )}
                  </Button>
                </form>
              </Form>
            </div>

            {/* Live preview card */}
            <div className="sticky top-24 space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-1">
                Live Preview
              </p>
              <StorefrontPreview
                shop={{
                  id: '',
                  slug: watchedSlug,
                  name: watchedName || 'Shop Name',
                  description: watchedDescription,
                  primaryColor: watchedPrimaryColor,
                }}
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
