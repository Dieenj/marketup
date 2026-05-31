import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Store, ShoppingBag, BarChart3, Globe, ArrowRight, CheckCircle2 } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Thanh điều hướng */}
      <header className="px-4 lg:px-6 h-16 flex items-center border-b">
        <Link className="flex items-center justify-center gap-2" href="#">
          <Store className="h-6 w-6 text-primary" />
          <span className="font-bold text-xl tracking-tight">MarketUp</span>
        </Link>
        <nav className="ml-auto flex gap-4 sm:gap-6">
          <Link className="text-sm font-medium hover:underline underline-offset-4" href="/login">
            Login
          </Link>
          <Link className="text-sm font-medium hover:underline underline-offset-4" href="/register">
            Get Started
          </Link>
        </nav>
      </header>

      <main className="flex-1">
        {/* Phần Hero giới thiệu */}
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48 bg-linear-to-br from-white via-primary/5 to-white">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="flex flex-col items-center space-y-4 text-center">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl/none max-w-3xl mx-auto">
                  Start Your Online Store in <span className="text-primary italic">Minutes</span>
                </h1>
                <p className="mx-auto max-w-[700px] text-gray-500 md:text-xl dark:text-gray-400">
                  MarketUp is the simplest way for individuals and small businesses to create a premium storefront. 
                  No coding required. Just add products and start selling.
                </p>
              </div>
              <div className="space-x-4 pt-4">
                <Link href="/register">
                  <Button size="lg" className="px-8 font-bold text-lg h-14 translate-y-0 hover:-translate-y-1 transition-transform">
                    Build Your Shop Now
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Phần tính năng nổi bật */}
        <section className="w-full py-12 md:py-24 lg:py-32 bg-white">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
              <div className="flex flex-col items-center space-y-4 text-center p-6 rounded-2xl border bg-gray-50/50">
                <div className="p-3 bg-primary/10 rounded-full">
                  <Globe className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold">Custom URL</h3>
                <p className="text-sm text-gray-500">
                  Get a dedicated link for your shop that you can share on social media. 
                  marketup.com/shop/your-brand
                </p>
              </div>
              <div className="flex flex-col items-center space-y-4 text-center p-6 rounded-2xl border bg-gray-50/50">
                <div className="p-3 bg-primary/10 rounded-full">
                  <ShoppingBag className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold">Easy Inventory</h3>
                <p className="text-sm text-gray-500">
                  Manage products, categories, and stock with our intuitive interface. 
                  Upload photos and set prices instantly.
                </p>
              </div>
              <div className="flex flex-col items-center space-y-4 text-center p-6 rounded-2xl border bg-gray-50/50">
                <div className="p-3 bg-primary/10 rounded-full">
                  <BarChart3 className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold">Sales Insights</h3>
                <p className="text-sm text-gray-500">
                  Track your revenue and orders with built-in analytics. 
                  Know exactly how your business is performing at a glance.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Phần cam kết tin cậy */}
        <section className="w-full py-12 md:py-24 bg-gray-50">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <h2 className="text-3xl font-bold">Everything you need to sell online</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left max-w-2xl">
                {[
                  "Mobile-responsive storefronts",
                  "Secure customer checkout",
                  "Order management dashboard",
                  "Cloud image storage",
                  "SEO optimized pages",
                  "Zero setup fee"
                ].map((text) => (
                  <div key={text} className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
                    <span className="text-gray-700 font-medium">{text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="w-full py-6 px-4 border-t flex flex-col sm:flex-row justify-between items-center gap-4 bg-white">
        <p className="text-xs text-gray-500">© 2026 MarketUp Inc. All rights reserved.</p>
        <nav className="flex gap-4 sm:gap-6">
          <Link className="text-xs hover:underline underline-offset-4" href="#">
            Terms of Service
          </Link>
          <Link className="text-xs hover:underline underline-offset-4" href="#">
            Privacy
          </Link>
        </nav>
      </footer>
    </div>
  );
}
