'use client';

import * as React from 'react';
import { useState } from 'react';
import { Trash2, X, Plus, Sparkles, DollarSign, Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

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

export function cartesian(arrays: string[][]): string[][] {
  return arrays.reduce<string[][]>(
    (acc, arr) => acc.flatMap((combo) => arr.map((item) => [...combo, item])),
    [[]]
  );
}

interface VariantsEditorProps {
  attributes: AttributeDef[];
  setAttributes: (attrs: AttributeDef[]) => void;
  variants: VariantDef[];
  setVariants: (vars: VariantDef[]) => void;
}

export default function VariantsEditor({
  attributes,
  setAttributes,
  variants,
  setVariants,
}: VariantsEditorProps) {
  const [newAttrName, setNewAttrName] = useState('');
  const [optionInputs, setOptionInputs] = useState<Record<number, string>>({});

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
      attributes.forEach((a, i) => {
        options[a.name] = combo[i];
      });
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

  return (
    <div className="space-y-5">
      {/* Thuộc tính sản phẩm */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Attributes</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Define option groups like Size, Color, Material.
            </p>
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
                    <span className="text-xs text-muted-foreground">
                      {attr.options.length} option{attr.options.length !== 1 ? 's' : ''}
                    </span>
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
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setOptionInputs((p) => ({ ...p, [i]: e.target.value }))}
                    onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addOption(i);
                      }
                    }}
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
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewAttrName(e.target.value)}
            onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addAttribute();
              }
            }}
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
                <span className="text-xs font-medium truncate" title={v.label}>
                  {v.label}
                </span>
                <Input
                  type="number"
                  placeholder="0.00"
                  className="h-7 text-xs text-center px-2 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  value={v.price}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateVariant(i, 'price', e.target.value)}
                  onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                    if (e.key === 'Enter') e.preventDefault();
                  }}
                  min="0"
                  step="0.01"
                />
                <Input
                  type="number"
                  placeholder="0"
                  className="h-7 text-xs text-center px-2 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  value={v.stock}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateVariant(i, 'stock', e.target.value)}
                  onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                    if (e.key === 'Enter') e.preventDefault();
                  }}
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
          <p className="text-xs text-muted-foreground/70 mt-1">
            Add an attribute like "Color" or "Size" to generate variants.
          </p>
        </div>
      )}
    </div>
  );
}
