'use client';

import { Control } from 'react-hook-form';
import * as z from 'zod';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export const productSchema = z.object({
  name: z.string().min(2, 'Product name is required (min 2 characters)'),
  description: z.string().optional(),
  categoryId: z.string().optional(),
});

interface Category {
  id: string;
  name: string;
}

interface CreateProductStep1Props {
  control: Control<z.infer<typeof productSchema>>;
  categories?: Category[];
}

export default function BasicStep({
  control,
  categories,
}: CreateProductStep1Props) {
  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-200">
      <FormField
        control={control}
        name="name"
        render={({ field }: { field: any }) => (
          <FormItem>
            <FormLabel className="text-sm font-medium">
              Product Name <span className="text-destructive">*</span>
            </FormLabel>
            <FormControl>
              <Input
                placeholder="e.g. Classic Linen Shirt"
                className="h-10"
                autoFocus
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="categoryId"
        render={({ field }: { field: any }) => (
          <FormItem>
            <FormLabel className="text-sm font-medium">Category</FormLabel>
            <Select onValueChange={field.onChange} value={field.value || undefined}>
              <FormControl>
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Choose a category (optional)">
                    {categories?.find((c) => c.id === field.value)?.name ||
                      'Choose a category (optional)'}
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

      <FormField
        control={control}
        name="description"
        render={({ field }: { field: any }) => (
          <FormItem>
            <FormLabel className="text-sm font-medium">Description</FormLabel>
            <FormControl>
              <Textarea
                placeholder="Describe your product — materials, sizing, care instructions..."
                rows={5}
                className="resize-none"
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
