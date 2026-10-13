'use client';

import { Control } from 'react-hook-form';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import type { Category } from '@/hooks/use-categories';
import CategorySelectField from '../category-select-field';
import type { ProductBasicValues } from '../product-form-data';

interface CreateProductStep1Props {
  control: Control<ProductBasicValues>;
  categories?: Category[];
}

export default function BasicStep({ control, categories }: CreateProductStep1Props) {
  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-200">
      <FormField
        control={control}
        name="name"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-sm font-medium">
              Product Name <span className="text-destructive">*</span>
            </FormLabel>
            <FormControl>
              <Input placeholder="e.g. Classic Linen Shirt" className="h-10" autoFocus {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <CategorySelectField control={control} name="categoryId" categories={categories} />

      <FormField
        control={control}
        name="description"
        render={({ field }) => (
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
