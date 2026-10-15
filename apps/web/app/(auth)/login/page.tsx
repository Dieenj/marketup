'use client';

import { useAuthStore } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import api, { getErrorMessage } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import AuthShell from '@/components/auth/auth-shell';
import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { myShopQueryOptions } from '@/hooks/use-my-shop';
import { dashboardStatsQuery } from '@/lib/dashboard-stats';
import { toast } from 'sonner';

const loginSchema = z.object({
  email: z.string().email('Email invalid'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export default function LoginPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);

  // Tải sẵn code trang dashboard trong lúc người dùng gõ → bấm đăng nhập xong là chuyển trang ngay
  useEffect(() => {
    router.prefetch('/dashboard');
  }, [router]);

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  async function onSubmit(values: z.infer<typeof loginSchema>) {
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', values);
      setAuth(data.user, data.token);
      // Gọi luôn shop rồi số liệu Overview, song song với chuyển trang (không chờ) — dashboard dùng lại cache
      // (lỗi bỏ qua: layout dashboard tự xử lý 404 chưa có shop / 401)
      queryClient
        .fetchQuery(myShopQueryOptions)
        .then((shop) => queryClient.prefetchQuery(dashboardStatsQuery(shop.id)))
        .catch(() => {});
      toast.success('Login successful!');
      // Giữ nút ở trạng thái "Signing in..." tới khi rời trang
      router.push('/dashboard');
    } catch (error) {
      toast.error(getErrorMessage(error, 'Login failed. Please check your credentials.'));
      setLoading(false);
    }
  }

  return (
    <AuthShell
      aside={
        <>
          <h2 className="text-4xl font-bold leading-snug">
            Welcome back to
            <br />
            your storefront.
          </h2>
          <p className="mt-4 text-sidebar-foreground/60 text-lg leading-relaxed max-w-sm">
            Manage your products, track orders, and grow your business — all in one place.
          </p>
        </>
      }
      title="Sign in"
      subtitle="Enter your credentials to continue"
      footer={
        <>
          Don&apos;t have an account?{' '}
          <Link
            href="/register"
            className="text-foreground font-semibold hover:underline underline-offset-4"
          >
            Create one
          </Link>
        </>
      }
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium">Email</FormLabel>
                <FormControl>
                  <Input placeholder="you@example.com" className="h-11 bg-card" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium">Password</FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    className="h-11 bg-card"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" size="xl" className="mt-2 w-full" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign in'}
          </Button>
        </form>
      </Form>
    </AuthShell>
  );
}
