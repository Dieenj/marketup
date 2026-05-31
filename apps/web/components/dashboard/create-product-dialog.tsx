'use client';

import { useState, useCallback, useRef } from 'react';
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
import { toast } from 'sonner';
import {
  Package,
  Tag,
  ImagePlus,
  ChevronRight,
  ChevronLeft,
  Plus,
  X,
  Trash2,
  Upload,
  Sparkles,
  CheckCircle2,
  DollarSign,
  Layers,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ─── Các kiểu dữ liệu (Types) ────────────────────────────────────────────────────────────────────
export interface AttributeDef {
  name: string;
  options: string[];
}

export interface VariantDef {
  id?: string;
  label: string;
  options: Record<string, string>;
  price: string;
  stock: string;
  sku: string;
}

// ─── Schema kiểm thử dữ liệu ───────────────────────────────────────────────────────────────────
const productSchema = z.object({
  name: z.string().min(2, 'Product name is required (min 2 characters)'),
  description: z.string().optional(),
  categoryId: z.string().optional(),
});

interface CreateProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shopId: string;
}

// ─── Các hàm bổ trợ (Helpers) ──────────────────────────────────────────────────────────────────
function cartesian(arrays: string[][]): string[][] {
  return arrays.reduce<string[][]>(
    (acc, arr) => acc.flatMap((combo) => arr.map((item) => [...combo, item])),
    [[]]
  );
}

const STEPS = [
  { id: 1, label: 'Basic Info', icon: Package },
  { id: 2, label: 'Variants', icon: Layers },
  { id: 3, label: 'Images', icon: ImagePlus },
];

// ─── Component chính ───────────────────────────────────────────────────────────
export default function CreateProductDialog({ open, onOpenChange, shopId }: CreateProductDialogProps) {
  const queryClient = useQueryClient();
  const [step, setStep] = useState(1);
  const [images, setImages] = useState<File[]>([]);
  const [attributes, setAttributes] = useState<AttributeDef[]>([]);
  const [variants, setVariants] = useState<VariantDef[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Quản lý trạng thái đầu vào của các thuộc tính
  const [newAttrName, setNewAttrName] = useState('');
  const [optionInputs, setOptionInputs] = useState<Record<number, string>>({});

  const form = useForm<z.infer<typeof productSchema>>({
    resolver: zodResolver(productSchema),
    defaultValues: { name: '', description: '', categoryId: '' },
  });

  const resetAll = () => {
    form.reset();
    setImages([]);
    setAttributes([]);
    setVariants([]);
    setStep(1);
    setNewAttrName('');
    setOptionInputs({});
  };

  const handleDialogOpenChange = (isOpen: boolean) => {
    if (!isOpen) resetAll();
    onOpenChange(isOpen);
  };

  // ─── Quản lý danh mục ─────────────────────────────────────────────────────────────
  const { data: categories } = useQuery({
    queryKey: ['categories', shopId],
    queryFn: async () => {
      const { data } = await api.get(`/categories/shop/${shopId}`);
      return data;
    },
    enabled: !!shopId && open,
  });

  // ─── Logic xây dựng các biến thể sản phẩm ───────────────────────────────────────────────────
  const addAttribute = () => {
    if (!newAttrName.trim()) return;
    const updated = [...attributes, { name: newAttrName.trim(), options: [] }];
    setNewAttrName('');
    setAttributes(updated);
    setVariants([]);
  };

  const removeAttribute = (i: number) => {
    setAttributes(attributes.filter((_, idx) => idx !== i));
    setVariants([]);
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

  // ─── Logic xử lý tải lên hình ảnh ────────────────────────────────────────────────────────────
  const handleFiles = (files: File[]) => {
    const imgFiles = files.filter((f) => f.type.startsWith('image/'));
    setImages((prev) => [...prev, ...imgFiles]);
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(Array.from(e.dataTransfer.files));
  }, []);

  const removeImage = (idx: number) => {
    setImages(images.filter((_, i) => i !== idx));
  };

  // ─── Logic lưu sản phẩm (Submit) ──────────────────────────────────────────────────────────────────
  const mutation = useMutation({
    mutationFn: async (values: z.infer<typeof productSchema>) => {
      if (variants.length === 0) throw new Error('Product must have at least one variant');

      const normalizedVariants = variants.map((v) => ({
        label: v.label,
        options: v.options,
        stock: Number(v.stock) || 0,
        price: v.price ? Number(v.price) : undefined,
        sku: v.sku || undefined,
      }));

      if (normalizedVariants.some((v) => v.price === undefined || Number.isNaN(v.price))) {
        throw new Error('Each variant must have a valid price');
      }

      const formData = new FormData();
      formData.append('name', values.name);
      if (values.description) formData.append('description', values.description);
      if (values.categoryId) formData.append('categoryId', values.categoryId);
      images.forEach((img) => formData.append('images', img));
      if (attributes.length > 0) formData.append('attributes', JSON.stringify(attributes));
      formData.append('variants', JSON.stringify(normalizedVariants));

      return api.post(`/products/${shopId}`, formData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products', shopId] });
      toast.success('Product created successfully!');
      resetAll();
      onOpenChange(false);
    },
    onError: (error: { message?: string; response?: { data?: { message?: string } } }) => {
      toast.error(error.response?.data?.message || error.message || 'Failed to create product');
    },
  });

  // ─── Logic điều hướng các bước ─────────────────────────────────────────────────────────
  const handleNext = async () => {
    if (step === 1) {
      const valid = await form.trigger(['name']);
      if (!valid) return;
    }
    if (step === 2 && variants.length === 0) {
      toast.error('Please generate at least one variant before continuing.');
      return;
    }
    setStep((s) => Math.min(s + 1, 3));
  };

  const handleBack = () => setStep((s) => Math.max(s - 1, 1));

  const handleSubmit = form.handleSubmit((values) => mutation.mutate(values));

  // ─── Logic kiểm tra trạng thái hoàn thành mỗi bước ───────────────────────────────────────────────────
  const step1Done = !!form.watch('name') && form.watch('name').length >= 2;
  const step2Done = variants.length > 0;
  const step3Done = images.length > 0;

  return (
    <Dialog open={open} onOpenChange={handleDialogOpenChange}>
      <DialogContent className="p-0 gap-0 max-w-2xl w-full overflow-hidden rounded-2xl border-border">
        {/* ── Phần đầu (Header) ── */}
        <DialogHeader className="px-6 pt-6 pb-0">
          <div className="flex items-center gap-3 mb-5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shrink-0">
              <Package className="h-4 w-4" />
            </div>
            <div>
              <DialogTitle className="text-base font-semibold leading-tight">New Product</DialogTitle>
              <p className="text-xs text-muted-foreground mt-0.5">Fill in the details to list a new product in your shop.</p>
            </div>
          </div>

          {/* Bộ chỉ số các bước thực hiện */}
          <div className="flex items-center gap-0">
            {STEPS.map((s, idx) => {
              const done = (s.id === 1 && step1Done) || (s.id === 2 && step2Done) || (s.id === 3 && step3Done);
              const active = step === s.id;
              const Icon = s.icon;
              return (
                <div key={s.id} className="flex items-center flex-1">
                  <button
                    type="button"
                    onClick={() => {
                      if (s.id < step) setStep(s.id);
                    }}
                    className={cn(
                      'flex items-center gap-2 py-2.5 text-xs font-medium transition-all duration-200 flex-1 justify-center rounded-none border-b-2',
                      active
                        ? 'border-foreground text-foreground'
                        : done
                        ? 'border-transparent text-muted-foreground hover:text-foreground cursor-pointer'
                        : 'border-transparent text-muted-foreground/50 cursor-default'
                    )}
                  >
                    {done && !active ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                    ) : (
                      <Icon className="h-3.5 w-3.5 shrink-0" />
                    )}
                    {s.label}
                  </button>
                  {idx < STEPS.length - 1 && (
                    <ChevronRight className="h-3.5 w-3.5 text-border shrink-0 -mx-1" />
                  )}
                </div>
              );
            })}
          </div>
        </DialogHeader>

        {/* ── Phần thân nội dung (Body) ── */}
        <Form {...form}>
          <form onSubmit={handleSubmit}>
            <div className="px-6 py-5 min-h-[380px] max-h-[55vh] overflow-y-auto">

              {/* ── Bước 1: Thông tin cơ bản ── */}
              {step === 1 && (
                <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-200">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium">Product Name <span className="text-destructive">*</span></FormLabel>
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
                    control={form.control}
                    name="categoryId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium">Category</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value} key={field.value}>
                          <FormControl>
                            <SelectTrigger className="h-10">
                              <SelectValue placeholder="Choose a category (optional)">
                                {categories?.find((c: { id: string; name: string }) => c.id === field.value)?.name || 'Choose a category (optional)'}
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
                    )}
                  />

                  <FormField
                    control={form.control}
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
              )}

              {/* ── Bước 2: Các biến thể sản phẩm ── */}
              {step === 2 && (
                <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-200">
                  {/* Thuộc tính sản phẩm */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">Attributes</p>
                        <p className="text-xs text-muted-foreground mt-0.5">Define option groups like Size, Color, Material.</p>
                      </div>
                      {variants.length > 0 && (
                        <span className="text-xs bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 rounded-full px-2.5 py-1 font-medium">
                          {variants.length} variants · {totalStock} units
                        </span>
                      )}
                    </div>

                    {/* Danh sách thuộc tính sản phẩm */}
                    {attributes.length > 0 && (
                      <div className="space-y-2">
                        {attributes.map((attr, i) => (
                          <div key={i} className="rounded-xl border border-border bg-muted/30 p-3 space-y-2.5">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-semibold bg-primary text-primary-foreground rounded-md px-1.5 py-0.5 uppercase tracking-wider">
                                  {attr.name}
                                </span>
                                <span className="text-xs text-muted-foreground">{attr.options.length} option{attr.options.length !== 1 ? 's' : ''}</span>
                              </div>
                              <button
                                type="button"
                                onClick={() => removeAttribute(i)}
                                className="h-6 w-6 flex items-center justify-center rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>

                            {/* Các nhãn tùy chọn (Option pills) */}
                            <div className="flex flex-wrap gap-1.5">
                              {attr.options.map((opt, j) => (
                                <span
                                  key={j}
                                  className="inline-flex items-center gap-1 text-xs bg-background border border-border rounded-full px-2.5 py-0.5 font-medium"
                                >
                                  {opt}
                                  <button
                                    type="button"
                                    onClick={() => removeOption(i, j)}
                                    className="text-muted-foreground hover:text-destructive transition-colors ml-0.5"
                                  >
                                    <X className="h-3 w-3" />
                                  </button>
                                </span>
                              ))}
                            </div>

                            {/* Thêm tùy chọn mới */}
                            <div className="flex gap-2">
                              <Input
                                placeholder={
                                  attr.name.toLowerCase().includes('color')
                                    ? 'e.g. Red, Blue, Black'
                                    : attr.name.toLowerCase().includes('size')
                                    ? 'e.g. S, M, L, XL'
                                    : 'Add option...'
                                }
                                className="h-7 text-xs"
                                value={optionInputs[i] || ''}
                                onChange={(e) => setOptionInputs((p) => ({ ...p, [i]: e.target.value }))}
                                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addOption(i); } }}
                              />
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                className="h-7 px-3 text-xs shrink-0"
                                onClick={() => addOption(i)}
                              >
                                Add
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Nhập thông tin thuộc tính mới */}
                    <div className="flex gap-2">
                      <Input
                        placeholder="Attribute name (e.g. Color, Size, Material)"
                        className="h-9 text-sm"
                        value={newAttrName}
                        onChange={(e) => setNewAttrName(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addAttribute(); } }}
                      />
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="h-9 px-3 shrink-0 gap-1.5"
                        onClick={addAttribute}
                      >
                        <Plus className="h-3.5 w-3.5" /> Add
                      </Button>
                    </div>
                  </div>

                  {/* Nút tự động tạo các biến thể sản phẩm */}
                  {canGenerate && (
                    <Button
                      type="button"
                      variant="secondary"
                      className="w-full gap-2 h-9"
                      onClick={generateVariants}
                    >
                      <Sparkles className="h-3.5 w-3.5" />
                      {variants.length > 0 ? 'Regenerate Variants' : 'Generate Variants'}
                    </Button>
                  )}

                  {/* Bảng quản lý kho và giá các biến thể sản phẩm */}
                  {variants.length > 0 && (
                    <div className="space-y-2">
                      <div className="grid grid-cols-[1fr_90px_90px] gap-2 px-1">
                        <span className="text-xs font-medium text-muted-foreground">Variant</span>
                        <span className="text-xs font-medium text-muted-foreground text-center flex items-center justify-center gap-1">
                          <DollarSign className="h-3 w-3" /> Price
                        </span>
                        <span className="text-xs font-medium text-muted-foreground text-center">Stock</span>
                      </div>
                      <div className="space-y-1.5">
                        {variants.map((v, i) => (
                          <div
                            key={i}
                            className="grid grid-cols-[1fr_90px_90px] gap-2 items-center rounded-lg border border-border bg-muted/20 px-3 py-2"
                          >
                            <span className="text-xs font-medium truncate" title={v.label}>{v.label}</span>
                            <Input
                              type="number"
                              placeholder="0.00"
                              className="h-7 text-xs text-center px-2 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                              value={v.price}
                              onChange={(e) => updateVariant(i, 'price', e.target.value)}
                              onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault(); }}
                              min="0"
                              step="0.01"
                              required
                            />
                            <Input
                              type="number"
                              placeholder="0"
                              className="h-7 text-xs text-center px-2 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                              value={v.stock}
                              onChange={(e) => updateVariant(i, 'stock', e.target.value)}
                              onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault(); }}
                              min="0"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {attributes.length === 0 && (
                    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-10 text-center">
                      <Layers className="h-8 w-8 text-muted-foreground/40 mb-3" />
                      <p className="text-sm font-medium text-muted-foreground">No attributes yet</p>
                      <p className="text-xs text-muted-foreground/70 mt-1">Add an attribute like "Color" or "Size" to generate variants.</p>
                    </div>
                  )}
                </div>
              )}

              {/* ── Bước 3: Hình ảnh sản phẩm ── */}
              {step === 3 && (
                <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-200">
                  <div>
                    <p className="text-sm font-medium">Product Images</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Upload photos to show your product. First image will be the cover.</p>
                  </div>

                  {/* Khu vực kéo thả hoặc click chọn hình ảnh */}
                  <div
                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={onDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={cn(
                      'relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed transition-all duration-200 cursor-pointer py-10 gap-3',
                      isDragging
                        ? 'border-primary bg-primary/5 scale-[1.01]'
                        : 'border-border hover:border-primary/50 hover:bg-muted/50'
                    )}
                  >
                    <div className={cn(
                      'flex h-12 w-12 items-center justify-center rounded-xl transition-colors duration-200',
                      isDragging ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                    )}>
                      <Upload className="h-5 w-5" />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium">
                        {isDragging ? 'Drop images here' : 'Drag & drop or click to upload'}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">PNG, JPG, WEBP up to 10MB each</p>
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      className="sr-only"
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => handleFiles(Array.from(e.target.files || []))}
                    />
                  </div>

                  {/* Xem trước các hình ảnh sản phẩm đã chọn */}
                  {images.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-muted-foreground font-medium">{images.length} image{images.length !== 1 ? 's' : ''} selected</p>
                        <button
                          type="button"
                          onClick={() => setImages([])}
                          className="text-xs text-muted-foreground hover:text-destructive transition-colors"
                        >
                          Clear all
                        </button>
                      </div>
                      <div className="grid grid-cols-4 gap-2">
                        {images.map((img, idx) => (
                          <div key={idx} className="group relative aspect-square overflow-hidden rounded-xl border border-border bg-muted">
                            <img
                              src={URL.createObjectURL(img)}
                              alt={`Preview ${idx + 1}`}
                              className="h-full w-full object-cover"
                            />
                            {idx === 0 && (
                              <span className="absolute bottom-1 left-1 text-[9px] font-semibold bg-black/70 text-white rounded px-1.5 py-0.5">
                                Cover
                              </span>
                            )}
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); removeImage(idx); }}
                              className="absolute top-1 right-1 h-5 w-5 flex items-center justify-center rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                        {/* Thêm nhiều ảnh khác */}
                        <div
                          onClick={() => fileInputRef.current?.click()}
                          className="aspect-square rounded-xl border-2 border-dashed border-border flex items-center justify-center cursor-pointer hover:border-primary/50 hover:bg-muted/50 transition-colors"
                        >
                          <Plus className="h-5 w-5 text-muted-foreground" />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* ── Phần chân trang hộp thoại (Footer) ── */}
            <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-border bg-muted/30">
              <Button
                type="button"
                variant="ghost"
                className="gap-1.5 text-sm"
                onClick={step === 1 ? () => handleDialogOpenChange(false) : handleBack}
              >
                {step === 1 ? (
                  'Cancel'
                ) : (
                  <><ChevronLeft className="h-4 w-4" /> Back</>
                )}
              </Button>

              <div className="flex items-center gap-2">
                {/* Dấu chấm các bước chỉ hiển thị trên di động */}
                <div className="flex gap-1.5 mr-2">
                  {STEPS.map((s) => (
                    <div
                      key={s.id}
                      className={cn(
                        'rounded-full transition-all duration-300',
                        step === s.id ? 'w-4 h-1.5 bg-foreground' : 'w-1.5 h-1.5 bg-border'
                      )}
                    />
                  ))}
                </div>

                {step < 3 ? (
                  <Button
                    type="button"
                    onClick={handleNext}
                    className="gap-1.5 text-sm px-5"
                  >
                    Next <ChevronRight className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    disabled={mutation.isPending || variants.length === 0}
                    className="gap-2 text-sm px-5"
                  >
                    {mutation.isPending ? (
                      <>
                        <span className="h-3.5 w-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Tag className="h-3.5 w-3.5" />
                        Create Product
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
