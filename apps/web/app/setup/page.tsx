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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Store, Loader2, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { useAuthStore } from '@/hooks/use-auth';
import Link from 'next/link';

const setupSchema = z.object({
  name: z.string().min(2, 'Shop name must be at least 2 characters'),
  slug: z
    .string()
    .min(3, 'URL must be at least 3 characters')
    .max(30, 'URL must be at most 30 characters')
    .regex(/^[a-z0-9-]+$/, 'Only lowercase letters, numbers, and hyphens allowed'),
  description: z.string().optional(),
  contactEmail: z.string().email('Invalid email').optional().or(z.literal('')),
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

      <main className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-lg space-y-8">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight">Set up your shop</h1>
            <p className="text-muted-foreground">
              Welcome, <span className="font-medium text-foreground">{user?.name}</span>! Let&apos;s get your storefront live.
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-border/60 p-8 shadow-sm space-y-6">
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
                        <FormDescription className="text-xs">
                          Your store: <span className="font-medium text-foreground">/shop/{form.watch('slug') || '...'}</span>
                        </FormDescription>
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
        </div>
      </main>
    </div>
  );
}
