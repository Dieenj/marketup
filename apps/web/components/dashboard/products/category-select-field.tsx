'use client';

import type { Control, FieldPath, FieldValues } from 'react-hook-form';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Category } from '@/hooks/use-categories';

// Ô chọn danh mục trong form sản phẩm (dialog tạo và dialog sửa)
export default function CategorySelectField<T extends FieldValues>({
  control,
  name,
  categories,
  placeholder = 'Choose a category (optional)',
}: {
  control: Control<T>;
  name: FieldPath<T>;
  categories?: Category[];
  placeholder?: string;
}) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>Category</FormLabel>
          <Select onValueChange={field.onChange} value={field.value || null}>
            <FormControl>
              <SelectTrigger className="h-10 w-full">
                <SelectValue placeholder={placeholder}>
                  {categories?.find((c) => c.id === field.value)?.name || placeholder}
                </SelectValue>
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {categories?.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
