'use client';

import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import CategoryForm from '@/components/dashboard/categories/category-form';
import { useCategories, useCreateCategory, useDeleteCategory } from '@/hooks/use-categories';

interface ManageCategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shopId: string;
  onDeleted?: (id: string) => void;
}

export default function ManageCategoryDialog({
  open,
  onOpenChange,
  shopId,
  onDeleted,
}: ManageCategoryDialogProps) {
  const { data: categories = [] } = useCategories(shopId);
  const createMutation = useCreateCategory(shopId, { onSuccess: () => onOpenChange(false) });
  const deleteMutation = useDeleteCategory(shopId, { onSuccess: onDeleted });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle>Manage Categories</DialogTitle>
        </DialogHeader>

        <div className="space-y-2.5 pt-2 max-h-[220px] overflow-y-auto pr-1">
          {categories.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">No categories yet.</p>
          ) : (
            categories.map((cat) => (
              <div
                key={cat.id}
                className="flex items-center justify-between rounded-lg border bg-muted/40 px-4 py-3 transition-colors hover:bg-muted"
              >
                <div>
                  <p className="text-sm font-semibold">{cat.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{cat.slug}</p>
                </div>
                <Button
                  variant="ghost-destructive"
                  size="icon"
                  aria-label={`Delete category ${cat.name}`}
                  onClick={() => {
                    if (confirm(`Delete category "${cat.name}"?`)) {
                      deleteMutation.mutate(cat.id);
                    }
                  }}
                  disabled={deleteMutation.isPending}
                >
                  <Trash2 />
                </Button>
              </div>
            ))
          )}
        </div>

        <div className="border-t pt-4 mt-1">
          <p className="text-sm font-semibold mb-3">New Category</p>
          <CategoryForm
            onSubmit={createMutation.mutateAsync}
            isPending={createMutation.isPending}
            submitLabel="Add Category"
            cancelLabel="Close"
            onCancel={() => onOpenChange(false)}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
