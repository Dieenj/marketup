'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Plus, PackageOpen, Tag, Settings2, X } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { FilterChip, filterChipVariants } from '@/components/ui/filter-chip';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import CreateProductDialog from '@/components/dashboard/products/create-dialog';
import EditProductDialog from '@/components/dashboard/products/edit-product-dialog';
import PageHeader from '@/components/dashboard/page-header';
import { StatCardSkeleton } from '@/components/dashboard/stat-card';
import EmptyState from '@/components/empty-state';
import { getMinPrice } from '@/lib/price';

// Subcomponents
import ProductStats from '@/components/dashboard/products/product-stats';
import ProductToolbar from '@/components/dashboard/products/product-toolbar';
import ProductCard, {
  Product,
  ProductCardSkeleton,
} from '@/components/dashboard/products/product-card';
import ManageCategoryDialog from '@/components/dashboard/products/manage-category-dialog';
import { useMyShop } from '@/hooks/use-my-shop';
import { useCategories, useDeleteCategory } from '@/hooks/use-categories';

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

  const { data: categories } = useCategories(shop?.id);

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

  // Bỏ chọn bộ lọc nếu danh mục đang chọn vừa bị xoá
  const clearDeletedSelection = (id: string) =>
    setSelectedCategoryId((current) => (current === id ? null : current));
  const deleteCategoryMutation = useDeleteCategory(shop?.id, { onSuccess: clearDeletedSelection });

  // Tính toán số liệu thống kê chung (Stat Cards)
  const totalProductsCount = products?.length ?? 0;
  const visibleProductsCount = products?.filter((p: Product) => p.isVisible).length ?? 0;
  const lowStockCount =
    products?.filter((p: Product) => p.totalStock > 0 && p.totalStock <= 10).length ?? 0;
  const outOfStockCount = products?.filter((p: Product) => p.totalStock === 0).length ?? 0;
  const stockAlertsCount = lowStockCount + outOfStockCount;

  const hasActiveFilters = !!searchQuery || stockFilter !== 'all' || !!selectedCategoryId;

  // Lọc và Sắp xếp sản phẩm liên kết chặt chẽ
  const filteredProducts = products
    ? products
        .filter((product: Product) => {
          // Lọc theo danh mục được chọn
          if (selectedCategoryId && product.categoryId !== selectedCategoryId) {
            return false;
          }
          // Lọc theo từ khóa tìm kiếm
          if (searchQuery && !product.name.toLowerCase().includes(searchQuery.toLowerCase())) {
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

  // Tiêu đề và thanh công cụ không phụ thuộc dữ liệu → hiện thật cả khi đang tải
  const header = (
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
  );
  const toolbar = (
    <ProductToolbar
      searchQuery={searchQuery}
      setSearchQuery={setSearchQuery}
      stockFilter={stockFilter}
      setStockFilter={setStockFilter}
      sortBy={sortBy}
      setSortBy={setSortBy}
    />
  );

  if (isLoading) {
    return (
      <div className="space-y-6" aria-busy="true">
        <span className="sr-only" role="status">
          Loading products…
        </span>
        {header}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[0, 1, 2].map((i) => (
            <StatCardSkeleton key={i} />
          ))}
        </div>
        {toolbar}
        <div className="flex flex-wrap gap-2">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-8 w-28 rounded-full" />
          ))}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {header}

      {/* Thống kê nhanh dạng thẻ cao cấp */}
      <ProductStats
        totalCount={totalProductsCount}
        visibleCount={visibleProductsCount}
        stockAlertsCount={stockAlertsCount}
        outOfStockCount={outOfStockCount}
      />

      {/* Thanh bộ lọc tìm kiếm, trạng thái kho & sắp xếp */}
      {toolbar}

      {/* Các tab lọc theo danh mục sản phẩm */}
      <div className="flex items-center gap-2 flex-wrap pb-1">
        <FilterChip
          active={selectedCategoryId === null}
          onClick={() => setSelectedCategoryId(null)}
        >
          All Products
          <span className="text-xs font-normal">({products?.length ?? 0})</span>
        </FilterChip>

        {categories?.map((cat) => {
          const count = products?.filter((p: Product) => p.categoryId === cat.id).length ?? 0;
          const isActive = selectedCategoryId === cat.id;
          return (
            // Hai nút anh em (chọn / xoá) trong cùng một pill — không lồng button trong button
            <div
              key={cat.id}
              className={cn(filterChipVariants({ active: isActive }), 'cursor-default gap-0 px-0')}
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
        <EmptyState
          icon={PackageOpen}
          title="No products found"
          description={
            hasActiveFilters
              ? 'Try modifying your search query, clearing filters, or choosing a different category.'
              : 'Start by adding your first product to display it in your inventory.'
          }
          action={
            hasActiveFilters ? (
              <Button
                variant="outline"
                onClick={() => {
                  setSearchQuery('');
                  setStockFilter('all');
                  setSelectedCategoryId(null);
                }}
              >
                Reset Filters
              </Button>
            ) : (
              <Button size="lg" onClick={() => setIsCreateOpen(true)}>
                <Plus /> Add product
              </Button>
            )
          }
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredProducts.map((product: Product) => (
            <ProductCard
              key={product.id}
              product={product}
              onEdit={setEditProduct}
              onToggleVisibility={(id, isVisible) =>
                toggleVisibilityMutation.mutate({ id, isVisible })
              }
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
          <ManageCategoryDialog
            open={isCategoryDialogOpen}
            onOpenChange={setIsCategoryDialogOpen}
            shopId={shop.id}
            onDeleted={clearDeletedSelection}
          />
        </>
      )}
    </div>
  );
}
