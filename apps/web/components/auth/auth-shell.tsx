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
      {/* Panel thương hiệu luôn tối, không phụ thuộc theme */}
      <div className="hidden lg:flex lg:w-[480px] xl:w-[560px] flex-col bg-neutral-950 text-white p-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.06)_0%,transparent_60%)]" />
        <div className="relative z-10 flex flex-col h-full">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-white flex items-center justify-center">
              <Store className="h-5 w-5 text-neutral-950" />
            </div>
            <span className="font-bold text-xl tracking-tight">MarketUp</span>
          </div>
          <div className="flex-1 flex flex-col justify-center">{aside}</div>
          <p className="text-white/20 text-sm">© {new Date().getFullYear()} MarketUp</p>
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
          <h1 className="text-2xl font-bold text-foreground mb-1">{title}</h1>
          <p className="text-muted-foreground mb-8 text-sm">{subtitle}</p>
          {children}
          <p className="mt-6 text-center text-sm text-muted-foreground">{footer}</p>
        </div>
      </div>
    </div>
  );
}
