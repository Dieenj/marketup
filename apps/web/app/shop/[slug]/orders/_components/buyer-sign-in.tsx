'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMutation } from '@tanstack/react-query';
import { ArrowLeft, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { getErrorMessage } from '@/lib/api-client';
import { requestLoginCode, verifyLoginCode } from '@/lib/buyer-api';
import { useBuyerSession } from '@/hooks/use-buyer-session';

const emailSchema = z.object({
  email: z.string().trim().email('Enter the email you used at checkout'),
});

const codeSchema = z.object({
  code: z
    .string()
    .transform((v) => v.replace(/\s/g, ''))
    .pipe(z.string().regex(/^\d{6}$/, 'Enter the 6-digit code from your email')),
});

// Khung trang đăng nhập (trang "My orders" và trang đơn khi không có quyền xem)
export function SignInPanel({
  slug,
  back,
  title,
  description,
}: {
  slug: string;
  back: React.ReactNode;
  title: string;
  description: React.ReactNode;
}) {
  return (
    <div className="container mx-auto max-w-md px-4 py-12 sm:py-20">
      {back}
      <div className="rounded-xl border bg-card p-6 sm:p-8">
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        <p className="mt-2 mb-6 text-sm text-muted-foreground">{description}</p>
        <BuyerSignIn slug={slug} />
      </div>
    </div>
  );
}

// Người mua không có mật khẩu: nhập email → nhận mã 6 số qua email → đăng nhập (giống Shopify)
function BuyerSignIn({ slug }: { slug: string }) {
  const [email, setEmail] = useState<string | null>(null);
  const [resendAt, setResendAt] = useState(0);

  const sendCode = useMutation({
    mutationFn: (to: string) => requestLoginCode(to, slug),
    onSuccess: (res, to) => {
      setEmail(to);
      setResendAt(Date.now() + res.resendInSeconds * 1000);
    },
  });

  return email ? (
    <CodeStep
      email={email}
      resendAt={resendAt}
      onResend={() => sendCode.mutate(email)}
      isResending={sendCode.isPending}
      resendError={sendCode.error}
      onChangeEmail={() => {
        sendCode.reset();
        setEmail(null);
      }}
    />
  ) : (
    <EmailStep onSubmit={(to) => sendCode.mutate(to)} mutation={sendCode} />
  );
}

function EmailStep({
  onSubmit,
  mutation,
}: {
  onSubmit: (email: string) => void;
  mutation: { isPending: boolean; error: unknown };
}) {
  const form = useForm<z.infer<typeof emailSchema>>({
    resolver: zodResolver(emailSchema),
    defaultValues: { email: '' },
  });

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit((values) => onSubmit(values.email.toLowerCase()))}
        className="space-y-4"
        noValidate
      >
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  placeholder="you@example.com"
                  autoComplete="email"
                  className="h-11 bg-card"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {mutation.error != null && (
          <p role="alert" className="text-sm text-destructive">
            {getErrorMessage(mutation.error, 'Could not send the code. Please try again.')}
          </p>
        )}
        <Button type="submit" size="xl" className="w-full" disabled={mutation.isPending}>
          {mutation.isPending ? <Spinner /> : <Mail aria-hidden />}
          Email me a code
        </Button>
      </form>
    </Form>
  );
}

function CodeStep({
  email,
  resendAt,
  onResend,
  isResending,
  resendError,
  onChangeEmail,
}: {
  email: string;
  resendAt: number;
  onResend: () => void;
  isResending: boolean;
  resendError: unknown;
  onChangeEmail: () => void;
}) {
  const signIn = useBuyerSession((s) => s.signIn);
  const secondsLeft = useSecondsUntil(resendAt);

  const form = useForm<z.input<typeof codeSchema>, unknown, z.output<typeof codeSchema>>({
    resolver: zodResolver(codeSchema),
    defaultValues: { code: '' },
  });

  const verify = useMutation({
    mutationFn: (code: string) => verifyLoginCode(email, code),
    onSuccess: (res) => signIn(res.email, res.token),
    onError: (error) => {
      form.setError('code', {
        message: getErrorMessage(error, 'Something went wrong. Please try again.'),
      });
    },
  });

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit((values) => verify.mutate(values.code))}
        className="space-y-4"
        noValidate
      >
        <p className="text-sm text-muted-foreground">
          We sent a 6-digit code to <span className="font-medium text-foreground">{email}</span>. It
          expires in 10 minutes.
        </p>
        <FormField
          control={form.control}
          name="code"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Code</FormLabel>
              <FormControl>
                <Input
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  placeholder="123456"
                  maxLength={7}
                  autoFocus
                  className="h-11 bg-card font-mono text-lg tracking-[0.3em]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" size="xl" className="w-full" disabled={verify.isPending}>
          {verify.isPending && <Spinner />}
          Sign in
        </Button>
        {resendError != null && (
          <p role="alert" className="text-sm text-destructive">
            {getErrorMessage(resendError, 'Could not send a new code. Please try again.')}
          </p>
        )}
        <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
          <Button type="button" variant="link" className="h-auto px-0" onClick={onChangeEmail}>
            <ArrowLeft aria-hidden />
            Use another email
          </Button>
          <Button
            type="button"
            variant="link"
            className="h-auto px-0"
            onClick={onResend}
            disabled={secondsLeft > 0 || isResending}
          >
            {secondsLeft > 0 ? `Resend code in ${secondsLeft}s` : 'Resend code'}
          </Button>
        </div>
      </form>
    </Form>
  );
}

// Số giây còn lại tới mốc thời gian, cập nhật mỗi giây
function useSecondsUntil(target: number) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (target <= Date.now()) return;
    const id = setInterval(() => {
      setNow(Date.now());
      if (Date.now() >= target) clearInterval(id);
    }, 1000);
    return () => clearInterval(id);
  }, [target]);
  return Math.max(0, Math.ceil((target - now) / 1000));
}
