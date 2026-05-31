'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import api from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Plus,
  Pencil,
  Trash2,
  MoreVertical,
  ImageIcon,
  PackageOpen,
  Tag,
  Loader2,
  Settings2,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import CreateProductDialog from '@/components/dashboard/create-product-dialog';
import EditProductDialog from '@/components/dashboard/edit-product-dialog';
import { useAuthStore } from '@/hooks/use-auth';

const categorySchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  slug: z
    .string()
    .min(2, 'Slug is required')
    .regex(/^[a-z0-9-]+$/, 'Slug must be lowercase letters, numbers and hyphens only'),
});

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface Product {
  id: string;
  name: string;
  totalStock: number; // Tổng số lượng tồn kho của tất cả các biến thể
  isVisible: boolean;
  imageUrl?: string;
  categoryId?: string;
  category?: { id: string; name: string };
  variants?: Array<{ price: number | string; comparePrice?: number | string | null }>;
}

export default function ProductsPage() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  const categoryForm = useForm<z.infer<typeof categorySchema>>({
    resolver: zodResolver(categorySchema),
    defaultValues: { name: '', slug: '' },
  });

  const { data: shop } = useQuery({
    queryKey: ['my-shop'],
    queryFn: async () => {
      const { data } = await api.get('/shops/my-shop');
      return data;
    },
    enabled: !!user,
  });

  const { data: products, isLoading } = useQuery({
    queryKey: ['products', shop?.id],
    queryFn: async () => {
      const { data } = await api.get(`/products/shop/${shop.id}/manage`);
      return data;
    },
    enabled: !!shop?.id,
  });

  const { data: categories } = useQuery({
    queryKey: ['categories', shop?.id],
    queryFn: async () => {
      const { data } = await api.get(`/categories/shop/${shop.id}`);
      return data as Category[];
    },
    enabled: !!shop?.id,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/products/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products', shop?.id] });
      toast.success('Product deleted successfully');
    },
    onError: () => {
      toast.error('Failed to delete product');
    },
  });

  const createCategoryMutation = useMutation({
    mutationFn: async (values: z.infer<typeof categorySchema>) => {
      return api.post(`/categories/${shop.id}`, values);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories', shop?.id] });
      toast.success('Category created');
      setIsCategoryDialogOpen(false);
      categoryForm.reset();
    },
    onError: (error: { response?: { data?: { message?: string } } }) => {
      toast.error(error.response?.data?.message || 'Failed to create category');
    },
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: async (id: string) => {
      return api.delete(`/categories/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories', shop?.id] });
      if (selectedCategoryId) setSelectedCategoryId(null);
      toast.success('Category deleted');
    },
    onError: () => {
      toast.error('Failed to delete category');
    },
  });

  const handleCategoryNameChange = (name: string) => {
    categoryForm.setValue('name', name);
    const slug = name
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '');
    categoryForm.setValue('slug', slug);
  };

  const filteredProducts = selectedCategoryId
    ? products?.filter((p: Product) => p.categoryId === selectedCategoryId)
    : products;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-9 w-32 mb-2" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="border rounded-lg overflow-hidden">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex items-center gap-4 p-4 border-b">
              <Skeleton className="h-10 w-10 rounded" />
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-4 w-20 ml-auto" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Products</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Manage your store inventory and product details.
          </p>
        </div>
        <Button
          onClick={() => setIsCreateOpen(true)}
          className="gap-2 bg-[#111111] text-white hover:bg-[#222222] rounded-xl h-10"
        >
          <Plus className="h-4 w-4" />
          Add Product
        </Button>
      </div>

      {/* Các tab lọc theo danh mục sản phẩm */}
      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={() => setSelectedCategoryId(null)}
          className={cn(
            'px-3 py-1.5 rounded-full text-sm font-medium transition-colors border',
            selectedCategoryId === null
              ? 'bg-[#111111] text-white border-[#111111]'
              : 'bg-white text-muted-foreground border-border hover:border-foreground/30 hover:text-foreground',
          )}
        >
          All
          <span className="ml-1.5 text-xs opacity-70">({products?.length ?? 0})</span>
        </button>

        {categories?.map((cat: Category) => {
          const count = products?.filter((p: Product) => p.categoryId === cat.id).length ?? 0;
          const isActive = selectedCategoryId === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategoryId(cat.id)}
              className={cn(
                'group flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors border',
                isActive
                  ? 'bg-[#111111] text-white border-[#111111]'
                  : 'bg-white text-muted-foreground border-border hover:border-foreground/30 hover:text-foreground',
              )}
            >
              <Tag className="h-3 w-3" />
              {cat.name}
              <span className="text-xs opacity-70">({count})</span>
              {isActive && (
                <span
                  role="button"
                  className="ml-0.5 opacity-60 hover:opacity-100"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm(`Delete category "${cat.name}"?`)) {
                      deleteCategoryMutation.mutate(cat.id);
                    }
                  }}
                >
                  ×
                </span>
              )}
            </button>
          );
        })}

        <Button
          variant="ghost"
          size="sm"
          className="h-8 gap-1.5 text-muted-foreground px-2"
          onClick={() => setIsCategoryDialogOpen(true)}
        >
          <Settings2 className="h-3.5 w-3.5" />
          Manage
        </Button>
      </div>

      {/* Lưới hiển thị danh sách sản phẩm */}
      {filteredProducts?.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-muted/20 py-20 text-center">
          <PackageOpen className="h-12 w-12 text-muted-foreground/40 mb-4" />
          <p className="font-semibold text-muted-foreground">No products yet</p>
          <p className="text-sm text-muted-foreground/70 mt-1">
            {selectedCategoryId ? 'No products in this category.' : 'Start by adding your first product.'}
          </p>
          {!selectedCategoryId && (
            <Button className="mt-5 gap-2" onClick={() => setIsCreateOpen(true)}>
              <Plus className="h-4 w-4" /> Add Product
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredProducts?.map((product: Product) => {
            const prices = (product.variants || [])
              .filter(v => v.price != null)
              .map(v => Number(v.price));
            const minPrice = prices.length > 0 ? Math.min(...prices) : null;
            const maxPrice = prices.length > 0 ? Math.max(...prices) : null;
            const priceDisplay = minPrice === null
              ? null
              : minPrice === maxPrice
              ? `$${minPrice!.toFixed(2)}`
              : `$${minPrice!.toFixed(2)} – $${maxPrice!.toFixed(2)}`;

            return (
              <div
                key={product.id}
                className="group relative bg-white border border-border/60 rounded-2xl overflow-hidden shadow-sm hover:shadow-md hover:border-border transition-all duration-200 flex flex-col"
              >
                {/* Hình ảnh sản phẩm */}
                <div className="relative aspect-4/3 bg-muted overflow-hidden">
                  {product.imageUrl ? (
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="h-full w-full flex flex-col items-center justify-center gap-2 text-muted-foreground/40">
                      <ImageIcon className="h-10 w-10" />
                      <span className="text-xs">No image</span>
                    </div>
                  )}

                  {/* Nhãn hiển thị/ẩn sản phẩm */}
                  <div className="absolute top-2.5 left-2.5">
                    <span className={cn(
                      'text-[10px] font-semibold px-2 py-0.5 rounded-full',
                      product.isVisible
                        ? 'bg-emerald-500 text-white'
                        : 'bg-muted-foreground/60 text-white'
                    )}>
                      {product.isVisible ? 'Visible' : 'Hidden'}
                    </span>
                  </div>

                  {/* Menu thả xuống chứa các hành động */}
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <DropdownMenu>
                      <DropdownMenuTrigger className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/90 backdrop-blur-sm shadow-sm text-foreground hover:bg-white transition-colors">
                        <MoreVertical className="h-3.5 w-3.5" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          className="gap-2 cursor-pointer"
                          onClick={() => setEditProduct(product)}
                        >
                          <Pencil className="h-4 w-4" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="gap-2 text-red-600 cursor-pointer"
                          onClick={() => {
                            if (confirm('Are you sure you want to delete this product?')) {
                              deleteMutation.mutate(product.id);
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                {/* Thông tin sản phẩm */}
                <div className="flex flex-col flex-1 p-4 gap-3">
                  {/* Danh mục sản phẩm */}
                  {product.category?.name && (
                    <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground font-medium w-fit">
                      <Tag className="h-3 w-3" /> {product.category.name}
                    </span>
                  )}

                  {/* Tên sản phẩm */}
                  <p className="font-semibold text-sm leading-snug line-clamp-2">
                    {product.name}
                  </p>

                  {/* Giá bán và tồn kho */}
                  <div className="flex items-center justify-between mt-auto pt-2 border-t border-border/50">
                    <span className="text-sm font-bold">
                      {priceDisplay || <span className="text-muted-foreground text-xs italic">No price</span>}
                    </span>
                    <span className={cn(
                      'text-xs font-medium px-2 py-0.5 rounded-full',
                      product.totalStock === 0
                        ? 'bg-red-50 text-red-600'
                        : product.totalStock <= 10
                        ? 'bg-amber-50 text-amber-600'
                        : 'bg-muted text-muted-foreground'
                    )}>
                      {product.totalStock === 0 ? 'Out of stock' : `${product.totalStock} in stock`}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}


      {shop && (
        <>
          <CreateProductDialog
            open={isCreateOpen}
            onOpenChange={setIsCreateOpen}
            shopId={shop.id}
          />
          <EditProductDialog
            open={!!editProduct}
            onOpenChange={(open) => !open && setEditProduct(null)}
            product={editProduct as Parameters<typeof EditProductDialog>[0]['product']}
            shopId={shop.id}
          />
        </>
      )}

      {/* Hộp thoại quản lý các danh mục */}
      <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>
        <DialogContent className="sm:max-w-[440px]">
          <DialogHeader>
            <DialogTitle>Manage Categories</DialogTitle>
          </DialogHeader>

          <div className="space-y-3 pt-1">
            {categories?.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No categories yet.</p>
            ) : (
              categories?.map((cat: Category) => (
                <div key={cat.id} className="flex items-center justify-between rounded-lg border px-4 py-2.5">
                  <div>
                    <p className="font-medium text-sm">{cat.name}</p>
                    <p className="text-xs text-muted-foreground">{cat.slug}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-red-500 hover:text-red-600 hover:bg-red-50"
                    onClick={() => {
                      if (confirm(`Delete category "${cat.name}"?`)) {
                        deleteCategoryMutation.mutate(cat.id);
                      }
                    }}
                    disabled={deleteCategoryMutation.isPending}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))
            )}
          </div>

          <div className="border-t pt-4">
            <p className="text-sm font-medium mb-3">New Category</p>
            <Form {...categoryForm}>
              <form
                onSubmit={categoryForm.handleSubmit((v) => createCategoryMutation.mutate(v))}
                className="space-y-3"
              >
                <FormField
                  control={categoryForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="E.g. Electronics"
                          {...field}
                          onChange={(e) => handleCategoryNameChange(e.target.value)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={categoryForm.control}
                  name="slug"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Slug</FormLabel>
                      <FormControl>
                        <Input placeholder="electronics" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter className="pt-1">
                  <Button type="button" variant="outline" onClick={() => setIsCategoryDialogOpen(false)}>
                    Close
                  </Button>
                  <Button type="submit" disabled={createCategoryMutation.isPending} className="gap-2">
                    {createCategoryMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                    Add Category
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

