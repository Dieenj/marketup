'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DialogFooter } from '@/components/ui/dialog';
import { Spinner } from '@/components/ui/spinner';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { slugify } from '@/lib/slugify';
import type { CategoryInput } from '@/hooks/use-categories';

const categorySchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name must be at most 50 characters'),
  slug: z
    .string()
    .min(2, 'Slug is required')
    .max(60, 'Slug must be at most 60 characters')
    .regex(/^[a-z0-9-]+$/, 'Slug must be lowercase letters, numbers and hyphens only'),
});

// Form tạo danh mục (tên + slug tự sinh) — dùng trong trang Categories và dialog Manage Categories
export default function CategoryForm({
  onSubmit,
  isPending,
  submitLabel = 'Create',
  cancelLabel = 'Cancel',
  onCancel,
}: {
  onSubmit: (values: CategoryInput) => Promise<unknown>;
  isPending: boolean;
  submitLabel?: string;
  cancelLabel?: string;
  onCancel: () => void;
}) {
  const form = useForm<CategoryInput>({
    resolver: zodResolver(categorySchema),
    defaultValues: { name: '', slug: '' },
  });

  const handleSubmit = form.handleSubmit(async (values) => {
    try {
      await onSubmit(values);
      form.reset();
    } catch {
      // Lỗi đã được hook mutation hiển thị bằng toast; giữ nguyên giá trị để người dùng sửa
    }
  });

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input
                  placeholder="E.g. Electronics"
                  {...field}
                  onChange={(e) => {
                    field.onChange(e);
                    form.setValue('slug', slugify(e.target.value), {
                      shouldValidate: form.formState.isSubmitted,
                    });
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
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
        <DialogFooter className="pt-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending && <Spinner />}
            {submitLabel}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}
