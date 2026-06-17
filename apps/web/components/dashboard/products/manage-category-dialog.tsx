'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Trash2, Loader2 } from 'lucide-react';
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

const categorySchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  slug: z
    .string()
    .min(2, 'Slug is required')
    .regex(/^[a-z0-9-]+$/, 'Slug must be lowercase letters, numbers and hyphens only'),
});

export interface Category {
  id: string;
  name: string;
  slug: string;
}

interface ManageCategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: Category[];
  onCreateCategory: (values: z.infer<typeof categorySchema>) => Promise<void>;
  onDeleteCategory: (id: string) => void;
  isCreatePending: boolean;
  isDeletePending: boolean;
}

export default function ManageCategoryDialog({
  open,
  onOpenChange,
  categories,
  onCreateCategory,
  onDeleteCategory,
  isCreatePending,
  isDeletePending,
}: ManageCategoryDialogProps) {
  const form = useForm<z.infer<typeof categorySchema>>({
    resolver: zodResolver(categorySchema),
    defaultValues: { name: '', slug: '' },
  });

  const handleCategoryNameChange = (name: string) => {
    form.setValue('name', name);
    const slug = name
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '');
    form.setValue('slug', slug);
  };

  const onSubmit = async (values: z.infer<typeof categorySchema>) => {
    try {
      await onCreateCategory(values);
      form.reset();
    } catch (error) {
      // Error handled by parent or toast
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[440px] rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">Manage Categories</DialogTitle>
        </DialogHeader>

        <div className="space-y-2.5 pt-2 max-h-[220px] overflow-y-auto pr-1">
          {categories.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">No categories yet.</p>
          ) : (
            categories.map((cat) => (
              <div
                key={cat.id}
                className="flex items-center justify-between rounded-xl border border-border/50 px-4 py-3 bg-zinc-50/50 hover:bg-zinc-50 transition-colors"
              >
                <div>
                  <p className="font-semibold text-sm text-zinc-800">{cat.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{cat.slug}</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50 rounded-lg cursor-pointer"
                  onClick={() => {
                    if (confirm(`Delete category "${cat.name}"?`)) {
                      onDeleteCategory(cat.id);
                    }
                  }}
                  disabled={isDeletePending}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))
          )}
        </div>

        <div className="border-t border-border/60 pt-4 mt-1">
          <p className="text-sm font-bold mb-3 text-zinc-800">New Category</p>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }: { field: any }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-semibold text-zinc-500">Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="E.g. Electronics, Clothing"
                        {...field}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleCategoryNameChange(e.target.value)}
                        className="h-10 rounded-xl border-border/60 focus-visible:ring-1 focus-visible:ring-zinc-400"
                      />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="slug"
                render={({ field }: { field: any }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-semibold text-zinc-500">Slug</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="electronics"
                        {...field}
                        className="h-10 rounded-xl border-border/60 focus-visible:ring-1 focus-visible:ring-zinc-400"
                      />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />
              <DialogFooter className="pt-2 gap-2 md:gap-0">
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-xl cursor-pointer"
                  onClick={() => onOpenChange(false)}
                >
                  Close
                </Button>
                <Button
                  type="submit"
                  disabled={isCreatePending}
                  className="gap-2 bg-[#111111] hover:bg-[#222222] text-white rounded-xl cursor-pointer"
                >
                  {isCreatePending && <Loader2 className="h-4 w-4 animate-spin" />}
                  Add Category
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
