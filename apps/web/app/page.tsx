import Link from 'next/link';
import {
  ArrowRight,
  ClipboardList,
  Link2,
  Mail,
  Palette,
  Star,
  Store,
  type LucideIcon,
} from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import DownloadAppButton from '@/components/download-app-button';

// Chỉ nói những gì MarketUp làm được (xem docs/product-spec.md)
const STEPS = [
  {
    title: 'Create your shop',
    text: 'Pick a name, a brand colour and a banner. Your storefront is ready right away.',
  },
  {
    title: 'Add your products',
    text: 'Photos, prices, sizes and colours, with stock tracked for every option.',
  },
  {
    title: 'Share your link',
    text: 'Post it on Facebook, Instagram or Zalo. Customers order straight from your page.',
  },
];

const FEATURES: { icon: LucideIcon; title: string; text: string }[] = [
  {
    icon: Palette,
    title: 'Your brand, not ours',
    text: 'Each shop has its own page in its own colours. No marketplace, no competitors next to your products.',
  },
  {
    icon: ClipboardList,
    title: 'Orders in one place',
    text: 'Confirm, pack, ship and mark delivered. Customers get an email at every step.',
  },
  {
    icon: Mail,
    title: 'No accounts for buyers',
    text: 'Customers pay cash on delivery and check their orders with a code sent to their email.',
  },
  {
    icon: Star,
    title: 'Honest reviews',
    text: 'Only customers whose order was delivered can review, and you can reply to every one.',
  },
];

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="border-b">
        <div className="container mx-auto flex h-16 items-center gap-4 px-4">
          <Link href="/" className="flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Store className="size-4" aria-hidden />
            </span>
            <span className="text-lg font-bold tracking-tight">MarketUp</span>
          </Link>
          <nav className="ml-auto flex items-center gap-2">
            <Link href="/login" className={buttonVariants({ variant: 'ghost' })}>
              Log in
            </Link>
            <Link href="/register" className={buttonVariants()}>
              Create a shop
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <section className="container mx-auto px-4 py-20 sm:py-28">
          <div className="max-w-2xl">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
              An online shop for your small business
            </h1>
            <p className="mt-5 text-lg leading-relaxed text-muted-foreground">
              MarketUp gives you a storefront in your own colours, a link to share with your
              customers, and a simple place to handle their orders. No website builder, no coding.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/register" className={buttonVariants({ size: 'xl' })}>
                Create your shop
                <ArrowRight data-icon="inline-end" aria-hidden />
              </Link>
              <DownloadAppButton />
            </div>
          </div>
        </section>

        <section className="border-y bg-card">
          <div className="container mx-auto px-4 py-16">
            <h2 className="text-2xl font-bold tracking-tight">How it works</h2>
            <ol className="mt-8 grid gap-8 sm:grid-cols-3">
              {STEPS.map((step, i) => (
                <li key={step.title} className="space-y-2">
                  <span className="flex size-8 items-center justify-center rounded-full border text-sm font-semibold">
                    {i + 1}
                  </span>
                  <h3 className="font-semibold">{step.title}</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">{step.text}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="container mx-auto px-4 py-16">
          <h2 className="text-2xl font-bold tracking-tight">What you get</h2>
          <div className="mt-8 grid gap-x-10 gap-y-8 sm:grid-cols-2">
            {FEATURES.map(({ icon: Icon, title, text }) => (
              <div key={title} className="flex gap-4">
                <Icon className="mt-0.5 size-5 shrink-0 text-muted-foreground" aria-hidden />
                <div className="space-y-1">
                  <h3 className="font-semibold">{title}</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">{text}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="container mx-auto px-4 pb-20">
          <div className="flex flex-col items-start gap-4 rounded-xl border bg-card p-8 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <Link2 className="mt-0.5 size-5 shrink-0 text-muted-foreground" aria-hidden />
              <p className="font-medium">
                Ready to sell? Set up your shop now and share the link today.
              </p>
            </div>
            <Link href="/register" className={buttonVariants({ size: 'lg' })}>
              Create your shop
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t">
        <p className="container mx-auto px-4 py-6 text-xs text-muted-foreground">
          © {new Date().getFullYear()} MarketUp
        </p>
      </footer>
    </div>
  );
}
