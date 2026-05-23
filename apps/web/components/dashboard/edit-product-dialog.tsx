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
import { Badge } from '@/components/ui/badge';
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
import { Loader2, Plus, Trash2, X, Sparkles, DollarSign } from 'lucide-react';
import { toast } from 'sonner';
import { AttributeDef, VariantDef } from './create-product-dialog';

const productSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  description: z.string().optional(),
  categoryId: z.string().optional(),
  isVisible: z.boolean().default(true),
});

type ProductFormValues = z.input<typeof productSchema>;

interface ProductVariant { id: string; label: string; options: Record<string, string>; price?: number | string | null; stock: number; sku?: string | null; }
interface ProductAttribute { id: string; name: string; options: string[]; }

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

function cartesian(arrays: string[][]): string[][] {
  return arrays.reduce<string[][]>(
    (acc, arr) => acc.flatMap((combo) => arr.map((item) => [...combo, item])),
    [[]]
  );
}

export default function EditProductDialog({ open, onOpenChange, product, shopId }: EditProductDialogProps) {
  const queryClient = useQueryClient();
  const [images, setImages] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [attributes, setAttributes] = useState<AttributeDef[]>([]);
  const [variants, setVariants] = useState<VariantDef[]>([]);
  const [newAttrName, setNewAttrName] = useState('');
  const [optionInputs, setOptionInputs] = useState<Record<number, string>>({});

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
      setAttributes(product.attributes?.map((a) => ({ name: a.name, options: a.options })) || []);
      setVariants(product.variants?.map((v) => ({
        label: v.label,
        options: v.options as Record<string, string>,
        price: v.price ? String(v.price) : '',
        stock: String(v.stock),
        sku: v.sku || '',
      })) || []);
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

  // ─── Variant Builder ──────────────────────────────────────────────────────
  const addAttribute = () => {
    if (!newAttrName.trim()) return;
    setAttributes([...attributes, { name: newAttrName.trim(), options: [] }]);
    setNewAttrName('');
  };

  const removeAttribute = (i: number) => {
    setAttributes(attributes.filter((_, idx) => idx !== i));
  };

  const addOption = (attrIdx: number) => {
    const val = (optionInputs[attrIdx] || '').trim();
    if (!val) return;
    const updated = attributes.map((a, i) =>
      i === attrIdx ? { ...a, options: [...a.options, val] } : a
    );
    setOptionInputs((prev) => ({ ...prev, [attrIdx]: '' }));
    setAttributes(updated);
  };

  const removeOption = (attrIdx: number, optIdx: number) => {
    const updated = attributes.map((a, i) =>
      i === attrIdx ? { ...a, options: a.options.filter((_, j) => j !== optIdx) } : a
    );
    setAttributes(updated);
  };

  const generateVariants = () => {
    if (attributes.length === 0 || attributes.some((a) => a.options.length === 0)) return;
    const combos = cartesian(attributes.map((a) => a.options));
    const newVariants: VariantDef[] = combos.map((combo) => {
      const options: Record<string, string> = {};
      attributes.forEach((a, i) => { options[a.name] = combo[i]; });
      const label = attributes.map((a, i) => `${a.name}: ${combo[i]}`).join(' / ');
      const existing = variants.find((v) => v.label === label);
      return existing || { label, options, price: '', stock: '0', sku: '' };
    });
    setVariants(newVariants);
  };

  const updateVariant = (i: number, field: keyof VariantDef, value: string) => {
    setVariants(variants.map((v, idx) => (idx === i ? { ...v, [field]: value } : v)));
  };

  const canGenerate = attributes.length > 0 && attributes.every((a) => a.options.length > 0);
  const totalStock = variants.reduce((sum, v) => sum + (Number(v.stock) || 0), 0);

  // ─── Submit ───────────────────────────────────────────────────────────────
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
      formData.append('variants', JSON.stringify(
        variants.map((v) => ({
          label: v.label,
          options: v.options,
          stock: Number(v.stock) || 0,
          price: v.price ? Number(v.price) : undefined,
          sku: v.sku || undefined,
        }))
      ));
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
          <form onSubmit={form.handleSubmit((v) => mutation.mutate(v))} className="space-y-4 py-2">
            <FormField control={form.control} name="name" render={({ field }) => (
              <FormItem>
                <FormLabel>Product Name</FormLabel>
                <FormControl><Input placeholder="E.g. Wireless Mouse" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="description" render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl><Textarea placeholder="Tell customers about your product..." rows={3} {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="categoryId" render={({ field }) => (
              <FormItem>
                <FormLabel>Category</FormLabel>
                <Select onValueChange={field.onChange} value={field.value} key={categories ? field.value : 'loading'}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category">
                        {categories?.find((c: { id: string; name: string }) => c.id === field.value)?.name || 'Select a category'}
                      </SelectValue>
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {categories?.map((cat: { id: string; name: string }) => (
                      <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="isVisible" render={({ field }) => (
              <FormItem className="flex items-center gap-2 space-y-0">
                <FormControl>
                  <Checkbox checked={field.value} onCheckedChange={field.onChange} id="isVisible" />
                </FormControl>
                <Label htmlFor="isVisible" className="cursor-pointer">Visible to customers</Label>
              </FormItem>
            )} />

            {/* ─── Variant Builder ─── */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <FormLabel className="flex items-center gap-1">Variants <span className="text-destructive">*</span></FormLabel>
                </div>
                {variants.length > 0 && (
                  <span className="text-xs bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 rounded-full px-2.5 py-1 font-medium">
                    {variants.length} variants · {totalStock} units
                  </span>
                )}
              </div>

              {attributes.map((attr, i) => (
                <div key={i} className="rounded-xl border border-border bg-muted/30 p-3 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-semibold bg-primary text-primary-foreground rounded-md px-1.5 py-0.5 uppercase tracking-wider">{attr.name}</span>
                      <span className="text-xs text-muted-foreground">{attr.options.length} option{attr.options.length !== 1 ? 's' : ''}</span>
                    </div>
                    <button type="button" onClick={() => removeAttribute(i)} className="h-6 w-6 flex items-center justify-center rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {attr.options.map((opt, j) => (
                      <span key={j} className="inline-flex items-center gap-1 text-xs bg-background border border-border rounded-full px-2.5 py-0.5 font-medium">
                        {opt}
                        <button type="button" onClick={() => removeOption(i, j)} className="text-muted-foreground hover:text-destructive transition-colors">
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Add option..."
                      className="h-7 text-xs"
                      value={optionInputs[i] || ''}
                      onChange={(e) => setOptionInputs((p) => ({ ...p, [i]: e.target.value }))}
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addOption(i); } }}
                    />
                    <Button type="button" size="sm" variant="outline" className="h-7 px-3 text-xs shrink-0" onClick={() => addOption(i)}>Add</Button>
                  </div>
                </div>
              ))}

              <div className="flex gap-2">
                <Input
                  placeholder="Attribute name (e.g. Color, Size)"
                  className="h-9 text-sm"
                  value={newAttrName}
                  onChange={(e) => setNewAttrName(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addAttribute(); } }}
                />
                <Button type="button" size="sm" variant="outline" className="h-9 px-3 shrink-0 gap-1.5" onClick={addAttribute}>
                  <Plus className="h-3.5 w-3.5" /> Add
                </Button>
              </div>

              {canGenerate && (
                <Button type="button" variant="secondary" className="w-full gap-2 h-9" onClick={generateVariants}>
                  <Sparkles className="h-3.5 w-3.5" />
                  {variants.length > 0 ? 'Regenerate Variants' : 'Generate Variants'}
                </Button>
              )}

              {variants.length > 0 && (
                <div className="space-y-2">
                  <div className="grid grid-cols-[1fr_90px_90px] gap-2 px-1">
                    <span className="text-xs font-medium text-muted-foreground">Variant</span>
                    <span className="text-xs font-medium text-muted-foreground text-center flex items-center justify-center gap-1"><DollarSign className="h-3 w-3" />Price</span>
                    <span className="text-xs font-medium text-muted-foreground text-center">Stock</span>
                  </div>
                  <div className="space-y-1.5">
                    {variants.map((v, i) => (
                      <div key={i} className="grid grid-cols-[1fr_90px_90px] gap-2 items-center rounded-lg border border-border bg-muted/20 px-3 py-2">
                        <span className="text-xs font-medium truncate" title={v.label}>{v.label}</span>
                        <Input type="number" placeholder="0.00" className="h-7 text-xs text-center px-2" value={v.price} onChange={(e) => updateVariant(i, 'price', e.target.value)} min="0" step="0.01" required />
                        <Input type="number" placeholder="0" className="h-7 text-xs text-center px-2" value={v.stock} onChange={(e) => updateVariant(i, 'stock', e.target.value)} min="0" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {variants.length === 0 && (
                <p className="text-xs text-muted-foreground">At least one variant is required</p>
              )}
            </div>

            {/* ─── Images ─── */}
            <div className="space-y-2">
              <Label>Product Images</Label>
              {previewUrls.length > 0 && (
                <div className="grid grid-cols-3 gap-2 mb-2">
                  {previewUrls.map((url, idx) => (
                    <div key={idx} className="relative aspect-square rounded-lg overflow-hidden border">
                      <img src={url} alt={`Product ${idx + 1}`} className="object-cover w-full h-full" />
                    </div>
                  ))}
                </div>
              )}
              {images.length > 0 && (
                <div className="space-y-1">
                  <p className="text-xs font-medium">New images to upload:</p>
                  <div className="grid grid-cols-3 gap-2">
                    {images.map((img, idx) => (
                      <div key={idx} className="relative aspect-square rounded border overflow-hidden">
                        <img src={URL.createObjectURL(img)} alt={`New ${idx + 1}`} className="w-full h-full object-cover" />
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
                onChange={(e) => { const files = Array.from(e.target.files || []); setImages(files); }}
              />
              <p className="text-xs text-muted-foreground">Select new images to replace existing ones</p>
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={mutation.isPending || variants.length === 0} className="gap-2" onClick={(e) => e.stopPropagation()}>
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
