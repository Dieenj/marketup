'use client';

import { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api, { getErrorMessage } from '@/lib/api-client';
import { dashboardStatsQuery } from '@/lib/dashboard-stats';
import { useCategories } from '@/hooks/use-categories';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { toast } from 'sonner';
import {
  Package,
  ChevronRight,
  ChevronLeft,
  Tag,
  CheckCircle2,
  ImagePlus,
  Layers,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Step Subcomponents & Types
import BasicStep from './basic-step';
import { buildProductFormData, productSchema, type ProductBasicValues } from '../product-form-data';
import VariantsEditor, { AttributeDef, VariantDef } from '../variants-editor';
import ImagesStep from './images-step';

interface CreateProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shopId: string;
}

const STEPS = [
  { id: 1, label: 'Basic Info', icon: Package },
  { id: 2, label: 'Variants', icon: Layers },
  { id: 3, label: 'Images', icon: ImagePlus },
];

export default function CreateProductDialog({
  open,
  onOpenChange,
  shopId,
}: CreateProductDialogProps) {
  const queryClient = useQueryClient();
  const [step, setStep] = useState(1);
  const [images, setImages] = useState<File[]>([]);
  const [attributes, setAttributes] = useState<AttributeDef[]>([]);
  const [variants, setVariants] = useState<VariantDef[]>([]);

  const form = useForm<ProductBasicValues>({
    resolver: zodResolver(productSchema),
    defaultValues: { name: '', description: '', categoryId: '' },
  });

  const resetAll = () => {
    form.reset();
    setImages([]);
    setAttributes([]);
    setVariants([]);
    setStep(1);
  };

  const handleDialogOpenChange = (isOpen: boolean) => {
    if (!isOpen) resetAll();
    onOpenChange(isOpen);
  };

  // ─── Quản lý danh mục ─────────────────────────────────────────────────────────────
  const { data: categories } = useCategories(shopId, { enabled: open });

  // ─── Logic lưu sản phẩm (Submit) ──────────────────────────────────────────────────────────────────
  const mutation = useMutation({
    mutationFn: async (values: ProductBasicValues) => {
      const formData = buildProductFormData(values, { variants, images });
      return api.post(`/products/${shopId}`, formData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products', shopId] });
      queryClient.invalidateQueries({ queryKey: dashboardStatsQuery(shopId).queryKey });
      toast.success('Product created successfully!');
      resetAll();
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, 'Failed to create product'));
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
  const watchedName = useWatch({ control: form.control, name: 'name' });
  const step1Done = (watchedName?.length ?? 0) >= 2;
  const step2Done = variants.length > 0;
  const step3Done = images.length > 0;

  return (
    <Dialog open={open} onOpenChange={handleDialogOpenChange}>
      <DialogContent className="p-0 gap-0 max-w-2xl w-full overflow-hidden rounded-xl border-border">
        {/* ── Phần đầu (Header) ── */}
        <DialogHeader className="px-6 pt-6 pb-0">
          <div className="flex items-center gap-3 mb-5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground shrink-0">
              <Package className="h-4 w-4" />
            </div>
            <div>
              <DialogTitle className="text-base font-semibold leading-tight">
                New Product
              </DialogTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                Fill in the details to list a new product in your shop.
              </p>
            </div>
          </div>

          {/* Bộ chỉ số các bước thực hiện */}
          <div className="flex items-center gap-0">
            {STEPS.map((s, idx) => {
              const done =
                (s.id === 1 && step1Done) || (s.id === 2 && step2Done) || (s.id === 3 && step3Done);
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
                          : 'border-transparent text-muted-foreground/50 cursor-default',
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
              {step === 1 && <BasicStep control={form.control} categories={categories} />}

              {/* ── Bước 2: Các biến thể sản phẩm ── */}
              {step === 2 && (
                <VariantsEditor
                  attributes={attributes}
                  setAttributes={setAttributes}
                  variants={variants}
                  setVariants={setVariants}
                />
              )}

              {/* ── Bước 3: Hình ảnh sản phẩm ── */}
              {step === 3 && (
                <ImagesStep
                  images={images}
                  onAddImages={(files) => setImages((prev) => [...prev, ...files])}
                  onRemoveImage={(idx) => setImages((prev) => prev.filter((_, i) => i !== idx))}
                  onClearAll={() => setImages([])}
                />
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
                  <>
                    <ChevronLeft className="h-4 w-4" /> Back
                  </>
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
                        step === s.id ? 'w-4 h-1.5 bg-foreground' : 'w-1.5 h-1.5 bg-border',
                      )}
                    />
                  ))}
                </div>

                {step < 3 ? (
                  <Button
                    key="next-btn"
                    type="button"
                    onClick={handleNext}
                    className="gap-1.5 text-sm px-5"
                  >
                    Next <ChevronRight className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button
                    key="submit-btn"
                    type="submit"
                    disabled={mutation.isPending || variants.length === 0}
                    className="gap-2 text-sm px-5"
                  >
                    {mutation.isPending ? (
                      <>
                        <Spinner />
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
