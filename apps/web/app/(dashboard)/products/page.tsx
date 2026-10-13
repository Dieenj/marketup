'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api, { getErrorMessage } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import {
  Plus,
  PackageOpen,
  Tag,
  Settings2,
  X,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import CreateProductDialog from '@/components/dashboard/products/create-dialog';
import EditProductDialog from '@/components/dashboard/products/edit-product-dialog';
import PageHeader from '@/components/dashboard/page-header';
import { getMinPrice } from '@/lib/price';

// Subcomponents
import ProductStats from '@/components/dashboard/products/product-stats';
import ProductToolbar from '@/components/dashboard/products/product-toolbar';
import ProductCard, { Product } from '@/components/dashboard/products/product-card';
import ManageCategoryDialog, { Category } from '@/components/dashboard/products/manage-category-dialog';
import { useMyShop } from '@/hooks/use-my-shop';

export default function ProductsPage() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);

  // State phục vụ cho Tìm kiếm, Bộ lọc và Sắp xếp
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('name-asc');
  const [stockFilter, setStockFilter] = useState('all');

  const queryClient = useQueryClient();

  const { data: shop } = useMyShop();

  const { data: products, isLoading } = useQuery({
    queryKey: ['products', shop?.id],
    queryFn: async () => {
      const { data } = await api.get(`/products/shop/${shop!.id}/manage`);
      return data as Product[];
    },
    enabled: !!shop?.id,
  });

  const { data: categories } = useQuery({
    queryKey: ['categories', shop?.id],
    queryFn: async () => {
      const { data } = await api.get(`/categories/shop/${shop!.id}`);
      return data as Category[];
    },
    enabled: !!shop?.id,
  });

  const toggleVisibilityMutation = useMutation({
    mutationFn: async ({ id, isVisible }: { id: string; isVisible: boolean }) => {
      const formData = new FormData();
      formData.append('isVisible', String(isVisible));
      const { data } = await api.patch(`/products/${id}`, formData);
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['products', shop?.id] });
      toast.success(data.isVisible ? 'Product is now visible' : 'Product is now hidden');
    },
    onError: () => {
      toast.error('Failed to update product visibility');
    },
  });

  const createCategoryMutation = useMutation({
    mutationFn: async (values: { name: string; slug: string }) => {
      return api.post(`/categories/${shop!.id}`, values);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories', shop?.id] });
      toast.success('Category created');
      setIsCategoryDialogOpen(false);
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, 'Failed to create category'));
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

  const handleCreateCategory = async (values: { name: string; slug: string }) => {
    await createCategoryMutation.mutateAsync(values);
  };

  // Tính toán số liệu thống kê chung (Stat Cards)
  const totalProductsCount = products?.length ?? 0;
  const visibleProductsCount = products?.filter((p: Product) => p.isVisible).length ?? 0;
  const lowStockCount = products?.filter((p: Product) => p.totalStock > 0 && p.totalStock <= 10).length ?? 0;
  const outOfStockCount = products?.filter((p: Product) => p.totalStock === 0).length ?? 0;
  const stockAlertsCount = lowStockCount + outOfStockCount;

  // Lọc và Sắp xếp sản phẩm liên kết chặt chẽ
  const filteredProducts = products
    ? products
        .filter((product: Product) => {
          // Lọc theo danh mục được chọn
          if (selectedCategoryId && product.categoryId !== selectedCategoryId) {
            return false;
          }
          // Lọc theo từ khóa tìm kiếm
          if (
            searchQuery &&
            !product.name.toLowerCase().includes(searchQuery.toLowerCase())
          ) {
            return false;
          }
          // Lọc theo trạng thái kho hàng
          if (stockFilter === 'instock' && product.totalStock === 0) {
            return false;
          }
          if (stockFilter === 'lowstock' && (product.totalStock === 0 || product.totalStock > 10)) {
            return false;
          }
          if (stockFilter === 'outofstock' && product.totalStock > 0) {
            return false;
          }
          return true;
        })
        .sort((a: Product, b: Product) => {
          if (sortBy === 'name-asc') {
            return a.name.localeCompare(b.name);
          }
          if (sortBy === 'name-desc') {
            return b.name.localeCompare(a.name);
          }

          if (sortBy === 'price-asc') {
            return getMinPrice(a.variants) - getMinPrice(b.variants);
          }
          if (sortBy === 'price-desc') {
            return getMinPrice(b.variants) - getMinPrice(a.variants);
          }
          if (sortBy === 'stock-asc') {
            return a.totalStock - b.totalStock;
          }
          if (sortBy === 'stock-desc') {
            return b.totalStock - a.totalStock;
          }
          return 0;
        })
    : [];

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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-12 w-full rounded-2xl" />
        <div className="border rounded-2xl overflow-hidden">
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
      {/* Tiêu đề trang */}
      <PageHeader
        title="Products"
        description="Manage your store inventory, details, and visibility status."
        actions={
          <Button size="lg" onClick={() => setIsCreateOpen(true)}>
            <Plus />
            Add product
          </Button>
        }
      />

      {/* Thống kê nhanh dạng thẻ cao cấp */}
      <ProductStats
        totalCount={totalProductsCount}
        visibleCount={visibleProductsCount}
        stockAlertsCount={stockAlertsCount}
        outOfStockCount={outOfStockCount}
      />

      {/* Thanh bộ lọc tìm kiếm, trạng thái kho & sắp xếp */}
      <ProductToolbar
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        stockFilter={stockFilter}
        setStockFilter={setStockFilter}
        sortBy={sortBy}
        setSortBy={setSortBy}
      />

      {/* Các tab lọc theo danh mục sản phẩm */}
      <div className="flex items-center gap-2 flex-wrap pb-1">
        <button
          onClick={() => setSelectedCategoryId(null)}
          aria-pressed={selectedCategoryId === null}
          className={cn(
            'h-8 px-3 rounded-full text-sm font-medium transition-colors border cursor-pointer',
            selectedCategoryId === null
              ? 'bg-primary text-primary-foreground border-primary'
              : 'bg-card text-muted-foreground hover:text-foreground hover:bg-muted',
          )}
        >
          All Products
          <span className="ml-1.5 text-xs font-normal">({products?.length ?? 0})</span>
        </button>

        {categories?.map((cat: Category) => {
          const count = products?.filter((p: Product) => p.categoryId === cat.id).length ?? 0;
          const isActive = selectedCategoryId === cat.id;
          return (
            // Hai nút anh em (chọn / xoá) trong cùng một pill — không lồng button trong button
            <div
              key={cat.id}
              className={cn(
                'flex items-center h-8 rounded-full text-sm font-medium transition-colors border',
                isActive
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-card text-muted-foreground hover:text-foreground hover:bg-muted',
              )}
            >
              <button
                type="button"
                onClick={() => setSelectedCategoryId(cat.id)}
                aria-pressed={isActive}
                className={cn(
                  'flex h-full items-center gap-1.5 rounded-full pl-3 cursor-pointer outline-none focus-visible:ring-3 focus-visible:ring-ring/50',
                  isActive ? 'pr-1' : 'pr-3',
                )}
              >
                <Tag className="h-3.5 w-3.5 opacity-70" />
                {cat.name}
                <span className="text-xs font-normal">({count})</span>
              </button>
              {isActive && (
                <button
                  type="button"
                  aria-label={`Delete category ${cat.name}`}
                  disabled={deleteCategoryMutation.isPending}
                  className="mr-1.5 flex items-center justify-center rounded-full bg-primary-foreground/20 p-0.5 transition-colors hover:bg-primary-foreground/35 cursor-pointer outline-none focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50"
                  onClick={() => {
                    if (confirm(`Delete category "${cat.name}"?`)) {
                      deleteCategoryMutation.mutate(cat.id);
                    }
                  }}
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          );
        })}

        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5 text-muted-foreground"
          onClick={() => setIsCategoryDialogOpen(true)}
        >
          <Settings2 className="h-3.5 w-3.5" />
          Manage Categories
        </Button>
      </div>

      {/* Lưới hiển thị danh sách sản phẩm hoặc trạng thái trống */}
      {filteredProducts.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed bg-card py-20 text-center px-4">
          <div className="p-3 bg-muted rounded-xl mb-4">
            <PackageOpen className="h-8 w-8 text-muted-foreground" />
          </div>
          <p className="font-semibold text-foreground">No products found</p>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm">
            {searchQuery || stockFilter !== 'all' || selectedCategoryId
              ? 'Try modifying your search query, clearing filters, or choosing a different category.'
              : 'Start by adding your first product to display it in your inventory.'}
          </p>
          {(searchQuery || stockFilter !== 'all' || selectedCategoryId) ? (
            <Button
              variant="outline"
              className="mt-5"
              onClick={() => {
                setSearchQuery('');
                setStockFilter('all');
                setSelectedCategoryId(null);
              }}
            >
              Reset Filters
            </Button>
          ) : (
            <Button className="mt-5" size="lg" onClick={() => setIsCreateOpen(true)}>
              <Plus /> Add product
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredProducts.map((product: Product) => (
            <ProductCard
              key={product.id}
              product={product}
              onEdit={setEditProduct}
              onToggleVisibility={(id, isVisible) => toggleVisibilityMutation.mutate({ id, isVisible })}
              isTogglePending={toggleVisibilityMutation.isPending}
            />
          ))}
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
      <ManageCategoryDialog
        open={isCategoryDialogOpen}
        onOpenChange={setIsCategoryDialogOpen}
        categories={categories || []}
        onCreateCategory={handleCreateCategory}
        onDeleteCategory={(id) => deleteCategoryMutation.mutate(id)}
        isCreatePending={createCategoryMutation.isPending}
        isDeletePending={deleteCategoryMutation.isPending}
      />
    </div>
  );
}



