'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { useDeleteCategory, type Category } from '@/hooks/use-categories';

interface DeleteCategoryDialogProps {
  shopId: string | undefined;
  category: Category;
  onClose: () => void;
  onDeleted?: (id: string) => void;
}

// Xác nhận xoá danh mục (chip ở trang Products và dialog Manage Categories).
// API đặt categoryId của sản phẩm về null nên sản phẩm vẫn còn, chỉ mất danh mục.
export default function DeleteCategoryDialog({
  shopId,
  category,
  onClose,
  onDeleted,
}: DeleteCategoryDialogProps) {
  const deleteMutation = useDeleteCategory(shopId, {
    onSuccess: (id) => {
      onDeleted?.(id);
      onClose();
    },
  });

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Delete &ldquo;{category.name}&rdquo;?</DialogTitle>
          <DialogDescription>
            Products in this category stay in your shop, just without a category.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Keep category
          </Button>
          <Button
            type="button"
            variant="destructive"
            disabled={deleteMutation.isPending}
            onClick={() => deleteMutation.mutate(category.id)}
          >
            {deleteMutation.isPending && <Spinner />}
            Delete category
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
