'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import api from '@/lib/api-client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

// Shared Subcomponent & Types
import VariantsEditor, { AttributeDef, VariantDef } from './variants-editor';

const productSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  description: z.string().optional(),
  categoryId: z.string().optional(),
  isVisible: z.boolean().default(true),
});

type ProductFormValues = z.input<typeof productSchema>;

interface ProductVariant {
  id: string;
  label: string;
  options: Record<string, string>;
  price?: number | string | null;
  stock: number;
  sku?: string | null;
}
interface ProductAttribute {
  id: string;
  name: string;
  options: string[];
}

interface Product {
  id: string;
  name: string;
  description?: string;
  stock: number;
  isVisible: boolean;
  imageUrl?: string;
  images?: string[];
  categoryId?: string;
  category?: { id: string; name: string };
  attributes?: ProductAttribute[];
  variants?: ProductVariant[];
}

interface EditProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: Product | null;
  shopId: string;
}

export default function EditProductDialog({
  open,
  onOpenChange,
  product,
  shopId,
}: EditProductDialogProps) {
  const queryClient = useQueryClient();
  const [images, setImages] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [attributes, setAttributes] = useState<AttributeDef[]>([]);
  const [variants, setVariants] = useState<VariantDef[]>([]);

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: { name: '', description: '', categoryId: '', isVisible: true },
  });

  useEffect(() => {
    if (product && open) {
      form.reset({
        name: product.name,
        description: product.description || '',
        categoryId: product.categoryId || product.category?.id || '',
        isVisible: product.isVisible,
      });
      setPreviewUrls(
        product.images?.length
          ? product.images
          : product.imageUrl
          ? [product.imageUrl]
          : []
      );
      setImages([]);
      setAttributes(
        product.attributes?.map((a) => ({ name: a.name, options: a.options })) || []
      );
      setVariants(
        product.variants?.map((v) => ({
          id: v.id,
          label: v.label,
          options: v.options as Record<string, string>,
          price: v.price ? String(v.price) : '',
          stock: String(v.stock),
          sku: v.sku || '',
        })) || []
      );
    }
  }, [product, open, form]);

  const { data: categories } = useQuery({
    queryKey: ['categories', shopId],
    queryFn: async () => {
      const { data } = await api.get(`/categories/shop/${shopId}`);
      return data;
    },
    enabled: !!shopId && open,
  });

  // ─── Logic lưu sản phẩm (Submit) ───────────────────────────────────────────────────────────────
  const mutation = useMutation({
    mutationFn: async (values: ProductFormValues) => {
      if (variants.length === 0) throw new Error('Product must have at least one variant');

      const formData = new FormData();
      formData.append('name', values.name);
      if (values.description) formData.append('description', values.description);
      if (values.categoryId) formData.append('categoryId', values.categoryId);
      formData.append('isVisible', String(values.isVisible));
      images.forEach((img) => formData.append('images', img));
      formData.append('attributes', JSON.stringify(attributes));
      formData.append(
        'variants',
        JSON.stringify(
          variants.map((v) => ({
            id: v.id,
            label: v.label,
            options: v.options,
            stock: Number(v.stock) || 0,
            price: v.price ? Number(v.price) : undefined,
            sku: v.sku || undefined,
          }))
        )
      );
      return api.patch(`/products/${product!.id}`, formData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products', shopId] });
      toast.success('Product updated successfully');
      onOpenChange(false);
    },
    onError: (error: { response?: { data?: { message?: string } } }) => {
      toast.error(error.response?.data?.message || 'Failed to update product');
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Product</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit((v) => mutation.mutate(v))}
            className="space-y-4 py-2"
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }: { field: any }) => (
                <FormItem>
                  <FormLabel>Product Name</FormLabel>
                  <FormControl>
                    <Input placeholder="E.g. Wireless Mouse" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }: { field: any }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Tell customers about your product..."
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="categoryId"
              render={({ field }: { field: any }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    key={categories ? field.value : 'loading'}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category">
                          {categories?.find(
                            (c: { id: string; name: string }) => c.id === field.value
                          )?.name || 'Select a category'}
                        </SelectValue>
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {categories?.map((cat: { id: string; name: string }) => (
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
              control={form.control}
              name="isVisible"
              render={({ field }: { field: any }) => (
                <FormItem className="flex items-center gap-2 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      id="isVisible"
                    />
                  </FormControl>
                  <Label htmlFor="isVisible" className="cursor-pointer">
                    Visible to customers
                  </Label>
                </FormItem>
              )}
            />

            {/* ─── Logic xây dựng các biến thể sản phẩm ─── */}
            <VariantsEditor
              attributes={attributes}
              setAttributes={setAttributes}
              variants={variants}
              setVariants={setVariants}
            />

            {/* ─── Hình ảnh sản phẩm ─── */}
            <div className="space-y-2">
              <Label>Product Images</Label>
              {previewUrls.length > 0 && (
                <div className="grid grid-cols-3 gap-2 mb-2">
                  {previewUrls.map((url, idx) => (
                    <div
                      key={idx}
                      className="relative aspect-square rounded-lg overflow-hidden border"
                    >
                      <img
                        src={url}
                        alt={`Product ${idx + 1}`}
                        className="object-cover w-full h-full"
                      />
                    </div>
                  ))}
                </div>
              )}
              {images.length > 0 && (
                <div className="space-y-1">
                  <p className="text-xs font-medium">New images to upload:</p>
                  <div className="grid grid-cols-3 gap-2">
                    {images.map((img, idx) => (
                      <div
                        key={idx}
                        className="relative aspect-square rounded border overflow-hidden"
                      >
                        <img
                          src={URL.createObjectURL(img)}
                          alt={`New ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                multiple
                className="h-10 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm text-foreground transition-colors outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                onChange={(e) => {
                  const files = Array.from(e.target.files || []);
                  setImages(files);
                }}
              />
              <p className="text-xs text-muted-foreground">
                Select new images to replace existing ones
              </p>
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={mutation.isPending || variants.length === 0}
                className="gap-2"
              >
                {mutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

