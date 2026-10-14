import Link from 'next/link';
import { ArrowLeft, Store } from 'lucide-react';

// Khung chung của trang đăng nhập / đăng ký: panel thương hiệu bên trái (ẩn trên mobile) + vùng form bên phải.
// Nội dung (tiêu đề, form, link chuyển trang) do từng trang tự truyền vào.
export default function AuthShell({
  aside,
  title,
  subtitle,
  footer,
  children,
}: {
  aside: React.ReactNode;
  title: string;
  subtitle: string;
  footer: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex">
      {/* Panel thương hiệu tối, cùng màu với sidebar của dashboard */}
      <div className="hidden flex-col bg-sidebar p-12 text-sidebar-foreground lg:flex lg:w-[480px] xl:w-[560px]">
        <div className="flex h-full flex-col">
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
              <Store className="size-5" aria-hidden />
            </div>
            <span className="font-bold text-xl tracking-tight">MarketUp</span>
          </div>
          <div className="flex-1 flex flex-col justify-center">{aside}</div>
          <p className="text-sm text-sidebar-foreground/40">
            © {new Date().getFullYear()} MarketUp
          </p>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 bg-muted/40 relative">
        <Link
          href="/"
          className="absolute top-6 left-6 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Link>
        <div className="w-full max-w-[400px]">
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <Store className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-bold text-lg">MarketUp</span>
          </div>
          <h1 className="mb-1 text-2xl font-bold tracking-tight">{title}</h1>
          <p className="text-muted-foreground mb-8 text-sm">{subtitle}</p>
          {children}
          <p className="mt-6 text-center text-sm text-muted-foreground">{footer}</p>
        </div>
      </div>
    </div>
  );
}
