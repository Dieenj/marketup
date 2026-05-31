'use client';

import { useAuthStore } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import api from '@/lib/api-client';
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
import { useState } from 'react';
import { toast } from 'sonner';
import { Store } from 'lucide-react';

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Email invalid'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export default function RegisterPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const [loading, setLoading] = useState(false);

  const form = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
    },
  });

  async function onSubmit(values: z.infer<typeof registerSchema>) {
    setLoading(true);
    try {
      const { data } = await api.post('/auth/register', values);
      setAuth(data.user, data.token);
      toast.success('Registration successful! Set up your shop now.');
      router.push('/setup');
    } catch (error) {
      toast.error((error as { response?: { data?: { message?: string } } }).response?.data?.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Panel thương hiệu bên trái */}
      <div className="hidden lg:flex lg:w-[480px] xl:w-[560px] flex-col bg-[#111111] text-white p-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(255,255,255,0.06)_0%,transparent_60%)]" />
        <div className="relative z-10 flex flex-col h-full">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-white flex items-center justify-center">
              <Store className="h-5 w-5 text-[#111111]" />
            </div>
            <span className="font-bold text-xl tracking-tight">MarketUp</span>
          </div>
          <div className="flex-1 flex flex-col justify-center">
            <h2 className="text-4xl font-bold leading-snug text-white">
              Start selling<br />in minutes.
            </h2>
            <p className="mt-4 text-white/50 text-lg leading-relaxed max-w-sm">
              Create your free account and launch your personalized online storefront today.
            </p>
            <div className="mt-10 space-y-3">
              {['No credit card required', 'Your own storefront URL', 'Unlimited products'].map((f) => (
                <div key={f} className="flex items-center gap-3">
                  <div className="h-5 w-5 rounded-full bg-white/10 flex items-center justify-center">
                    <svg className="h-2.5 w-2.5 text-white" fill="currentColor" viewBox="0 0 12 12">
                      <path d="M10.28 2.28L3.989 8.575 1.695 6.28A1 1 0 00.28 7.695l3 3a1 1 0 001.414 0l7-7A1 1 0 0010.28 2.28z" />
                    </svg>
                  </div>
                  <span className="text-white/60 text-sm">{f}</span>
                </div>
              ))}
            </div>
          </div>
          <p className="text-white/20 text-sm">© {new Date().getFullYear()} MarketUp</p>
        </div>
      </div>

      {/* Panel form đăng ký bên phải */}
      <div className="flex-1 flex items-center justify-center p-6 bg-[#fafafa]">
        <div className="w-full max-w-[400px]">
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="h-8 w-8 rounded-lg bg-[#111111] flex items-center justify-center">
              <Store className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold text-lg">MarketUp</span>
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-1">Create account</h1>
          <p className="text-muted-foreground mb-8 text-sm">Sign up and start building your shop</p>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">Full Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="John Doe"
                        className="h-11 bg-white border-border/80 focus-visible:ring-1 focus-visible:ring-foreground focus-visible:border-foreground"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">Email</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="you@example.com"
                        className="h-11 bg-white border-border/80 focus-visible:ring-1 focus-visible:ring-foreground focus-visible:border-foreground"
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
                        className="h-11 bg-white border-border/80 focus-visible:ring-1 focus-visible:ring-foreground focus-visible:border-foreground"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                type="submit"
                className="w-full h-11 bg-[#111111] text-white hover:bg-[#222222] transition-colors font-medium mt-2"
                disabled={loading}
              >
                {loading ? 'Creating account...' : 'Create account'}
              </Button>
            </form>
          </Form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link href="/login" className="text-foreground font-semibold hover:underline underline-offset-4">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
