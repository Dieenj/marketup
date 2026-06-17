'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMutation } from '@tanstack/react-query';
import api from '@/lib/api-client';
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
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Store, Loader2, ArrowRight, Link2, ShoppingBag } from 'lucide-react';
import { toast } from 'sonner';
import { useAuthStore } from '@/hooks/use-auth';
import Link from 'next/link';
import { ColorPicker } from '@/components/shop/color-picker';
import { getContrastColor } from '@/lib/color-utils';

const setupSchema = z.object({
  name: z.string().min(2, 'Shop name must be at least 2 characters'),
  slug: z
    .string()
    .min(3, 'URL must be at least 3 characters')
    .max(30, 'URL must be at most 30 characters')
    .regex(/^[a-z0-9-]+$/, 'Only lowercase letters, numbers, and hyphens allowed'),
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
      primaryColor: '#111111',
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
    onError: (error: { response?: { data?: { message?: string } } }) => {
      toast.error(error.response?.data?.message || 'Failed to create shop');
    },
  });

  const handleNameChange = (name: string) => {
    form.setValue('name', name);
    const slug = name
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
      .slice(0, 30);
    form.setValue('slug', slug);
  };

  const watchedName = form.watch('name');
  const watchedSlug = form.watch('slug');
  const watchedDescription = form.watch('description');
  const watchedColor = form.watch('primaryColor') || '#111111';
  const fg = getContrastColor(watchedColor);

  return (
    <div className="min-h-screen bg-[#fafafa] flex flex-col">
      <header className="h-16 flex items-center px-6 border-b bg-white">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="h-8 w-8 rounded-lg bg-[#111111] flex items-center justify-center group-hover:scale-105 transition-transform">
            <Store className="h-4 w-4 text-white" />
          </div>
          <span className="font-bold text-lg tracking-tight">MarketUp</span>
        </Link>
      </header>

      <main className="flex-1 flex items-start justify-center p-6 pt-10">
        <div className="w-full max-w-4xl space-y-8">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight">Set up your shop</h1>
            <p className="text-muted-foreground">
              Welcome, <span className="font-medium text-foreground">{user?.name}</span>! Let&apos;s get your storefront live.
            </p>
          </div>

          <div className="grid lg:grid-cols-[1fr_300px] gap-6 items-start">
            {/* Form */}
            <div className="bg-white rounded-2xl border border-border/60 p-8 shadow-sm">
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit((v) => mutation.mutate(v))}
                  className="space-y-5"
                >
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium">Shop Name</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="E.g. My Awesome Store"
                            className="h-11 bg-[#fafafa] border-border/80 focus-visible:ring-1 focus-visible:ring-foreground focus-visible:border-foreground"
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
                        <FormControl>
                          <div className="flex items-center border border-border/80 rounded-lg overflow-hidden focus-within:ring-1 focus-within:ring-foreground focus-within:border-foreground h-11">
                            <span className="bg-[#f5f5f5] px-3 text-sm text-muted-foreground border-r h-full flex items-center whitespace-nowrap">
                              /shop/
                            </span>
                            <Input
                              className="border-0 rounded-none h-full focus-visible:ring-0 focus-visible:ring-offset-0 bg-[#fafafa]"
                              placeholder="my-awesome-store"
                              {...field}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium">Description <span className="text-muted-foreground font-normal">(optional)</span></FormLabel>
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
                        <FormLabel className="text-sm font-medium">Contact Email <span className="text-muted-foreground font-normal">(optional)</span></FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="shop@example.com"
                            className="h-11 bg-[#fafafa] border-border/80 focus-visible:ring-1 focus-visible:ring-foreground focus-visible:border-foreground"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button
                    type="submit"
                    className="w-full h-11 bg-[#111111] text-white hover:bg-[#222222] transition-colors font-medium gap-2"
                    disabled={mutation.isPending}
                  >
                    {mutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        Launch My Shop
                        <ArrowRight className="h-4 w-4" />
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
              <div className="bg-white rounded-2xl border border-border/60 shadow-sm overflow-hidden">
                {/* Mini header */}
                <div
                  className="h-10 flex items-center gap-2 px-3 transition-colors duration-300"
                  style={{ backgroundColor: watchedColor }}
                >
                  <div className="h-5 w-5 rounded-md flex items-center justify-center bg-white/20">
                    <Store className="h-3 w-3" style={{ color: fg }} />
                  </div>
                  <span className="text-xs font-bold truncate" style={{ color: fg }}>
                    {watchedName || 'Shop Name'}
                  </span>
                </div>

                {/* Mini hero */}
                <div
                  className="h-16 flex items-end px-3 pb-2.5 transition-colors duration-300"
                  style={{ backgroundColor: watchedColor + '22' }}
                >
                  <div>
                    <p className="text-xs font-bold text-foreground leading-tight">
                      {watchedName || 'Shop Name'}
                    </p>
                    <p className="text-[10px] text-muted-foreground line-clamp-1 mt-0.5">
                      {watchedDescription || 'Your description will appear here.'}
                    </p>
                  </div>
                </div>

                {/* Body */}
                <div className="p-3 space-y-2.5">
                  {/* URL pill */}
                  <div className="flex items-center gap-1.5 bg-muted rounded-lg px-2.5 py-1.5">
                    <Link2 className="h-3 w-3 text-muted-foreground shrink-0" />
                    <span className="text-[11px] text-muted-foreground truncate">
                      marketup.com/shop/<span className="font-medium text-foreground">{watchedSlug || '...'}</span>
                    </span>
                  </div>

                  {/* Mock product cards */}
                  <div className="grid grid-cols-2 gap-1.5">
                    {[1, 2].map((i) => (
                      <div key={i} className="bg-muted rounded-lg overflow-hidden">
                        <div className="h-14 bg-muted-foreground/10 flex items-center justify-center">
                          <ShoppingBag className="h-4 w-4 text-muted-foreground/30" />
                        </div>
                        <div className="p-1.5">
                          <div className="h-2 bg-muted-foreground/15 rounded w-3/4 mb-1" />
                          <div className="h-2 bg-muted-foreground/10 rounded w-1/2" />
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* CTA button */}
                  <button
                    className="w-full rounded-xl py-2 text-xs font-semibold transition-colors duration-300 flex items-center justify-center gap-1.5"
                    style={{ backgroundColor: watchedColor, color: fg }}
                    tabIndex={-1}
                    type="button"
                  >
                    View Store
                    <ArrowRight className="h-3 w-3" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
