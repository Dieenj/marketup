'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api, { getErrorMessage } from '@/lib/api-client';
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
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { toast } from 'sonner';
import { ACCEPTED_IMAGE_TYPES, pickImageFiles } from '@/lib/image-upload';

// Shared Subcomponent & Types
import VariantsEditor, { AttributeDef, VariantDef } from './variants-editor';
import FilePreviewImage from '@/components/file-preview-image';
import RemoteImage from '@/components/remote-image';
import CategorySelectField from './category-select-field';
import { buildProductFormData, productSchema } from './product-form-data';
import { useCategories } from '@/hooks/use-categories';

const editProductSchema = productSchema.extend({
  isVisible: z.boolean().default(true),
});

type ProductFormValues = z.input<typeof editProductSchema>;

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
    resolver: zodResolver(editProductSchema),
    defaultValues: { name: '', description: '', categoryId: '', isVisible: true },
  });

  // Nạp lại state cục bộ mỗi khi dialog mở cho một sản phẩm (điều chỉnh state theo prop ngay khi render)
  const activeProduct = open ? product : null;
  const [loadedProduct, setLoadedProduct] = useState<Product | null>(null);
  if (activeProduct !== loadedProduct) {
    setLoadedProduct(activeProduct);
    if (activeProduct) {
      const product = activeProduct;
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
  }

  // form.reset gọi vào store của react-hook-form (hệ thống ngoài), nên vẫn đặt trong effect
  useEffect(() => {
    if (product && open) {
      form.reset({
        name: product.name,
        description: product.description || '',
        categoryId: product.categoryId || product.category?.id || '',
        isVisible: product.isVisible,
      });
    }
  }, [product, open, form]);

  const { data: categories } = useCategories(shopId, { enabled: open });

  // ─── Logic lưu sản phẩm (Submit) ───────────────────────────────────────────────────────────────
  const mutation = useMutation({
    mutationFn: async (values: ProductFormValues) => {
      const formData = buildProductFormData(values, { attributes, variants, images });
      return api.patch(`/products/${product!.id}`, formData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products', shopId] });
      toast.success('Product updated successfully');
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, 'Failed to update product'));
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
              render={({ field }) => (
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
              render={({ field }) => (
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
            <CategorySelectField
              control={form.control}
              name="categoryId"
              categories={categories}
              placeholder="Select a category"
            />
            <FormField
              control={form.control}
              name="isVisible"
              render={({ field }) => (
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
                      <RemoteImage
                        src={url}
                        alt={`Product ${idx + 1}`}
                        fill
                        sizes="120px"
                        className="object-cover"
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
                        <FilePreviewImage
                          file={img}
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
                accept={ACCEPTED_IMAGE_TYPES.join(',')}
                multiple
                className="h-10 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm text-foreground transition-colors outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                onChange={(e) => {
                  const files = pickImageFiles(Array.from(e.target.files || []));
                  setImages(files);
                  if (files.length === 0) e.target.value = '';
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
                {mutation.isPending && <Spinner />}
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

