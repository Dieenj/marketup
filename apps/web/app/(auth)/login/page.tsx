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
import { useState } from 'react';
import { toast } from 'sonner';

const loginSchema = z.object({
  email: z.string().email('Email invalid'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export default function LoginPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const [loading, setLoading] = useState(false);

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
      toast.success('Login successful!');
      router.push('/dashboard');
    } catch (error) {
      toast.error(getErrorMessage(error, 'Login failed. Please check your credentials.'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      aside={
        <>
          <h2 className="text-4xl font-bold leading-snug text-white">
            Welcome back to<br />your storefront.
          </h2>
          <p className="mt-4 text-white/50 text-lg leading-relaxed max-w-sm">
            Manage your products, track orders, and grow your business — all in one place.
          </p>
        </>
      }
      title="Sign in"
      subtitle="Enter your credentials to continue"
      footer={
        <>
          Don&apos;t have an account?{' '}
          <Link href="/register" className="text-foreground font-semibold hover:underline underline-offset-4">
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
                  <Input
                    placeholder="you@example.com"
                    className="h-11 bg-card"
                    {...field}
                  />
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
