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
import { Check } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

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
      toast.error(getErrorMessage(error, 'Registration failed.'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      aside={
        <>
          <h2 className="text-4xl font-bold leading-snug text-white">
            Start selling
            <br />
            in minutes.
          </h2>
          <p className="mt-4 text-white/50 text-lg leading-relaxed max-w-sm">
            Create your free account and launch your personalized online storefront today.
          </p>
          <ul className="mt-10 space-y-3">
            {['No credit card required', 'Your own storefront URL', 'Unlimited products'].map(
              (f) => (
                <li key={f} className="flex items-center gap-3">
                  <span className="h-5 w-5 rounded-full bg-white/10 flex items-center justify-center">
                    <Check className="h-3 w-3 text-white" aria-hidden />
                  </span>
                  <span className="text-white/60 text-sm">{f}</span>
                </li>
              ),
            )}
          </ul>
        </>
      }
      title="Create account"
      subtitle="Sign up and start building your shop"
      footer={
        <>
          Already have an account?{' '}
          <Link
            href="/login"
            className="text-foreground font-semibold hover:underline underline-offset-4"
          >
            Sign in
          </Link>
        </>
      }
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium">Full Name</FormLabel>
                <FormControl>
                  <Input placeholder="John Doe" className="h-11 bg-card" {...field} />
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
            {loading ? 'Creating account...' : 'Create account'}
          </Button>
        </form>
      </Form>
    </AuthShell>
  );
}
