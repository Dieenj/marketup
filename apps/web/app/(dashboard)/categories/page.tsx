'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Tag } from 'lucide-react';
import PageHeader from '@/components/dashboard/page-header';
import EmptyState from '@/components/empty-state';
import CategoryForm from '@/components/dashboard/categories/category-form';
import { useMyShop } from '@/hooks/use-my-shop';
import { useCategories, useCreateCategory, useDeleteCategory } from '@/hooks/use-categories';

export default function CategoriesPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { data: shop } = useMyShop();
  const { data: categories, isLoading } = useCategories(shop?.id);
  const createMutation = useCreateCategory(shop?.id, { onSuccess: () => setIsDialogOpen(false) });
  const deleteMutation = useDeleteCategory(shop?.id);

  const newCategoryButton = (
    <Button size="lg" onClick={() => setIsDialogOpen(true)}>
      <Plus />
      New Category
    </Button>
  );
  const header = (
    <PageHeader
      title="Categories"
      description="Organise your products into categories."
      actions={newCategoryButton}
    />
  );

  if (isLoading) {
    return (
      <div className="space-y-6" aria-busy="true">
        <span className="sr-only" role="status">
          Loading categories…
        </span>
        {header}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="flex items-center gap-3 rounded-xl bg-card p-4 ring-1 ring-foreground/10"
            >
              <Skeleton className="size-10 shrink-0 rounded-lg" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-4 w-16 rounded-full" />
              </div>
              <Skeleton className="size-8 shrink-0" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {header}

      {categories?.length === 0 ? (
        <EmptyState
          icon={Tag}
          title="No categories yet"
          description="Create your first category to organise your products."
          action={newCategoryButton}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories?.map((cat) => (
            <Card key={cat.id} className="transition-shadow hover:ring-primary/30">
              <CardContent className="flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Tag className="h-5 w-5 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold truncate">{cat.name}</p>
                    <Badge variant="outline" className="text-[11px] mt-0.5">
                      {cat.slug}
                    </Badge>
                  </div>
                </div>
                <Button
                  variant="ghost-destructive"
                  size="icon"
                  aria-label={`Delete category ${cat.name}`}
                  className="shrink-0"
                  onClick={() => {
                    if (confirm(`Delete category "${cat.name}"?`)) {
                      deleteMutation.mutate(cat.id);
                    }
                  }}
                  disabled={deleteMutation.isPending}
                >
                  <Trash2 />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Create Category</DialogTitle>
          </DialogHeader>
          <CategoryForm
            onSubmit={createMutation.mutateAsync}
            isPending={createMutation.isPending}
            onCancel={() => setIsDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
