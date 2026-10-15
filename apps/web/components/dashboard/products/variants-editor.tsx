'use client';

import { useState, type ComponentProps } from 'react';
import { Plus, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import {
  MAX_NAME_LENGTH,
  MAX_OPTIONS,
  MAX_VALUES,
  MAX_VARIANTS,
  addOption,
  addValue,
  applyToAll,
  hasVariantOptions,
  removeOption,
  removeValue,
  renameOption,
  renameValue,
  rowErrors,
  updateRow,
  variantCount,
  variantLabel,
  variantLines,
  type ProductOption,
  type VariantMatrix,
  type VariantRow,
} from './variant-matrix';

interface VariantsEditorProps {
  value: VariantMatrix;
  onChange: (value: VariantMatrix) => void;
  // Sau lần lưu/đi tiếp đầu tiên: báo cả ô bắt buộc còn trống
  showErrors: boolean;
}

const OPTION_PLACEHOLDERS = ['Size', 'Color', 'Material'];

// Giá, giá gốc, tồn kho — dùng cho sản phẩm không phân loại và cho từng hàng biến thể
const FIELDS = [
  { field: 'price', label: 'Price', placeholder: '0.00' },
  { field: 'comparePrice', label: 'Compare-at', placeholder: 'Optional' },
  { field: 'stock', label: 'Stock', placeholder: '0' },
] as const;

// Như Shopify/Shopee: thuộc tính và lựa chọn ở trên, bảng biến thể tự cập nhật bên dưới (không có bước "Generate")
export default function VariantsEditor({ value, onChange, showErrors }: VariantsEditorProps) {
  const lines = variantLines(value);
  const withOptions = hasVariantOptions(value);

  return (
    <div className="@container space-y-5">
      {!withOptions && (
        <SimpleFields
          row={lines[0].row}
          showErrors={showErrors}
          onChange={(patch) => onChange(updateRow(value, lines[0], patch))}
        />
      )}

      <OptionsSection value={value} onChange={onChange} />

      {withOptions && <VariantTable value={value} onChange={onChange} showErrors={showErrors} />}
    </div>
  );
}

function SimpleFields({
  row,
  showErrors,
  onChange,
}: {
  row: VariantRow;
  showErrors: boolean;
  onChange: (patch: Partial<VariantRow>) => void;
}) {
  const errors = rowErrors(row);
  return (
    <div className="grid gap-3 @md:grid-cols-3">
      {FIELDS.map(({ field, label, placeholder }) => {
        const error = (showErrors || row[field] !== '') && errors[field];
        return (
          <div key={field} className="space-y-1.5">
            <Label htmlFor={`simple-${field}`}>
              {field === 'comparePrice' ? 'Compare-at price' : label}
            </Label>
            <NumberInput
              id={`simple-${field}`}
              value={row[field]}
              placeholder={placeholder}
              decimals={field !== 'stock'}
              invalid={!!error}
              onChange={(v) => onChange({ [field]: v })}
            />
            {error && <p className="text-xs text-destructive">{error}</p>}
          </div>
        );
      })}
    </div>
  );
}

function OptionsSection({
  value,
  onChange,
}: {
  value: VariantMatrix;
  onChange: (value: VariantMatrix) => void;
}) {
  const names = value.options.map((o) => o.name.trim());
  return (
    <div className="space-y-3">
      <div>
        <p className="text-sm font-medium">Options</p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Sell this product in different sizes, colors or materials.
        </p>
      </div>

      {value.options.map((option, i) => (
        <OptionCard
          // Theo vị trí: đổi tên thuộc tính không làm mất ô đang gõ
          key={i}
          option={option}
          index={i}
          value={value}
          duplicateName={!!names[i] && names.indexOf(names[i]) !== i}
          onChange={onChange}
        />
      ))}

      {value.options.length < MAX_OPTIONS ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-1.5"
          onClick={() => onChange(addOption(value, ''))}
        >
          <Plus className="h-3.5 w-3.5" />
          {value.options.length === 0 ? 'Add options like size or color' : 'Add another option'}
        </Button>
      ) : (
        <p className="text-xs text-muted-foreground">Up to {MAX_OPTIONS} options per product.</p>
      )}
    </div>
  );
}

function OptionCard({
  option,
  index,
  value,
  duplicateName,
  onChange,
}: {
  option: ProductOption;
  index: number;
  value: VariantMatrix;
  duplicateName: boolean;
  onChange: (value: VariantMatrix) => void;
}) {
  const [draft, setDraft] = useState('');
  const [error, setError] = useState('');
  const placeholder = OPTION_PLACEHOLDERS[index] ?? 'Option';
  const label = option.name.trim() || placeholder;

  // Lựa chọn mới/đổi tên không được trùng lựa chọn khác của thuộc tính này
  const checkValue = (raw: string, current?: string) => {
    const v = raw.trim();
    if (!v) return null;
    if (v !== current && option.values.includes(v)) {
      setError(`${label} already has "${v}".`);
      return null;
    }
    return v;
  };

  const add = () => {
    const v = checkValue(draft);
    if (!v) return;
    const count = variantCount(
      value.options.map((o, j) => (j === index ? { ...o, values: [...o.values, v] } : o)),
    );
    if (count > MAX_VARIANTS) {
      setError(`That would make ${count} variants — up to ${MAX_VARIANTS} per product.`);
      return;
    }
    onChange(addValue(value, index, v));
    setDraft('');
  };

  // Lựa chọn không còn tổ hợp nào đang bán sẽ biến mất khi lưu (API suy ra lựa chọn từ biến thể)
  const position = value.options.slice(0, index).filter((o) => o.values.length > 0).length;
  const lines = variantLines(value);
  const unsold = option.values.filter(
    (v) => !lines.some((l) => l.row.enabled && l.values[position] === v),
  );

  return (
    <div className="space-y-2.5 rounded-xl border bg-muted/30 p-3">
      <div className="flex items-start gap-2">
        <div className="flex-1 space-y-1">
          <Input
            aria-label={`Option ${index + 1} name`}
            placeholder={`Option name, e.g. ${placeholder}`}
            className="h-8 text-sm font-medium"
            maxLength={MAX_NAME_LENGTH}
            autoFocus={!option.name && option.values.length === 0}
            aria-invalid={duplicateName || undefined}
            value={option.name}
            onChange={(e) => onChange(renameOption(value, index, e.target.value))}
          />
          {duplicateName && (
            <p className="text-xs text-destructive">Another option already uses this name.</p>
          )}
        </div>
        <Button
          type="button"
          variant="ghost-destructive"
          size="icon-sm"
          onClick={() => onChange(removeOption(value, index))}
          aria-label={`Remove option ${label}`}
        >
          <Trash2 />
        </Button>
      </div>

      {option.values.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {option.values.map((v) => (
            <ValuePill
              key={v}
              value={v}
              onRename={(raw) => {
                const to = checkValue(raw, v);
                if (to && to !== v) onChange(renameValue(value, index, v, to));
              }}
              onRemove={() => onChange(removeValue(value, index, v))}
            />
          ))}
        </div>
      )}

      {option.values.length < MAX_VALUES ? (
        <div className="flex gap-2">
          <Input
            aria-label={`Add a value to ${label}`}
            placeholder={index === 1 ? 'Add value, e.g. Black' : 'Add value, e.g. M'}
            className="h-8 text-sm"
            maxLength={MAX_NAME_LENGTH}
            aria-invalid={!!error || undefined}
            value={draft}
            onChange={(e) => {
              setDraft(e.target.value);
              setError('');
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                add();
              }
            }}
          />
          <Button type="button" size="sm" variant="outline" className="h-8 shrink-0" onClick={add}>
            Add
          </Button>
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">Up to {MAX_VALUES} values per option.</p>
      )}
      {error && <p className="text-xs text-destructive">{error}</p>}
      {option.values.length === 0 && !error && (
        <p className="text-xs text-muted-foreground">Add at least one value.</p>
      )}
      {unsold.length > 0 && (
        <p className="text-xs text-muted-foreground">
          No variant for sale with {unsold.join(', ')}, so it is removed from {label} when you save.
        </p>
      )}
    </div>
  );
}

// Bấm vào lựa chọn để đổi tên (biến thể giữ nguyên giá/kho)
function ValuePill({
  value,
  onRename,
  onRemove,
}: {
  value: string;
  onRename: (value: string) => void;
  onRemove: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  if (editing) {
    const commit = () => {
      setEditing(false);
      onRename(draft);
    };
    return (
      <Input
        aria-label={`New name for ${value}`}
        className="h-6 w-28 rounded-full px-2.5 text-xs"
        maxLength={MAX_NAME_LENGTH}
        autoFocus
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            commit();
          } else if (e.key === 'Escape') {
            // Chỉ huỷ đổi tên, không đóng dialog
            e.preventDefault();
            e.stopPropagation();
            setEditing(false);
          }
        }}
      />
    );
  }

  return (
    <span className="inline-flex items-center rounded-full border bg-background text-xs font-medium">
      <button
        type="button"
        className="py-0.5 pl-2.5 pr-1 hover:underline"
        aria-label={`Rename ${value}`}
        onClick={() => {
          setDraft(value);
          setEditing(true);
        }}
      >
        {value}
      </button>
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove ${value}`}
        className="py-0.5 pl-0.5 pr-2 text-muted-foreground transition-colors hover:text-destructive"
      >
        <X className="h-3 w-3" />
      </button>
    </span>
  );
}

// Hẹp (điện thoại): tên biến thể một dòng, ba ô nhập dòng dưới; rộng: một hàng như bảng
const ROW_GRID = '@md:grid-cols-[minmax(0,1fr)_6rem_7rem_5rem]';

function VariantTable({
  value,
  onChange,
  showErrors,
}: {
  value: VariantMatrix;
  onChange: (value: VariantMatrix) => void;
  showErrors: boolean;
}) {
  const lines = variantLines(value);
  const forSale = lines.filter((l) => l.row.enabled).length;

  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-sm font-medium">Variants</p>
        <p className="text-xs text-muted-foreground">
          {forSale} of {lines.length} for sale
        </p>
      </div>

      <ApplyToAll onApply={(patch) => onChange(applyToAll(value, patch))} />

      {/* Hẹp: tiêu đề thẳng cột với ba ô nhập ở dòng dưới của mỗi hàng */}
      <div className={cn('grid grid-cols-3 gap-2 px-3 text-xs text-muted-foreground', ROW_GRID)}>
        <span className="hidden @md:block">Variant</span>
        {FIELDS.map(({ field, label }) => (
          <span key={field}>{label}</span>
        ))}
      </div>

      <div className="space-y-1.5">
        {lines.map((line) => {
          const label = variantLabel(line.values);
          const errors = rowErrors(line.row);
          return (
            <div
              key={line.key}
              className={cn(
                'grid gap-2 rounded-lg border px-3 py-2 @md:items-center',
                ROW_GRID,
                !line.row.enabled && 'bg-muted/40',
              )}
            >
              <label className="flex min-w-0 cursor-pointer items-center gap-2">
                <Checkbox
                  checked={line.row.enabled}
                  onCheckedChange={(checked) =>
                    onChange(updateRow(value, line, { enabled: checked }))
                  }
                  aria-label={`Sell ${label}`}
                />
                <span
                  className={cn('truncate text-sm', !line.row.enabled && 'text-muted-foreground')}
                  title={label}
                >
                  {label}
                </span>
              </label>
              <div className="grid grid-cols-3 gap-2 @md:contents">
                {FIELDS.map(({ field, label: fieldLabel, placeholder }) => {
                  const error = (showErrors || line.row[field] !== '') && errors[field];
                  return (
                    <NumberInput
                      key={field}
                      aria-label={`${fieldLabel} for ${label}`}
                      title={error || undefined}
                      value={line.row.enabled ? line.row[field] : ''}
                      placeholder={line.row.enabled ? placeholder : '—'}
                      decimals={field !== 'stock'}
                      disabled={!line.row.enabled}
                      invalid={!!error}
                      onChange={(v) => onChange(updateRow(value, line, { [field]: v }))}
                    />
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const EMPTY_BULK = { price: '', comparePrice: '', stock: '' };

function ApplyToAll({ onApply }: { onApply: (patch: Partial<VariantRow>) => void }) {
  const [draft, setDraft] = useState(EMPTY_BULK);
  const patch = Object.fromEntries(Object.entries(draft).filter(([, v]) => v.trim() !== ''));

  return (
    <div
      className={cn(
        'grid gap-2 rounded-lg border border-dashed px-3 py-2 @md:items-center',
        ROW_GRID,
      )}
    >
      <span className="text-sm text-muted-foreground">Apply to all for sale</span>
      <div className="grid grid-cols-3 gap-2 @md:contents">
        {FIELDS.map(({ field, label }) => (
          <NumberInput
            key={field}
            aria-label={`${label} for all variants`}
            placeholder={label}
            decimals={field !== 'stock'}
            value={draft[field]}
            onChange={(v) => setDraft((d) => ({ ...d, [field]: v }))}
          />
        ))}
      </div>
      <Button
        type="button"
        size="sm"
        variant="secondary"
        className="@md:col-span-3 @md:col-start-2"
        disabled={Object.keys(patch).length === 0}
        onClick={() => {
          onApply(patch);
          setDraft(EMPTY_BULK);
        }}
      >
        Apply
      </Button>
    </div>
  );
}

function NumberInput({
  value,
  onChange,
  decimals,
  invalid,
  ...props
}: Omit<ComponentProps<typeof Input>, 'onChange' | 'value'> & {
  value: string;
  onChange: (value: string) => void;
  decimals: boolean;
  invalid?: boolean;
}) {
  return (
    <Input
      type="number"
      inputMode={decimals ? 'decimal' : 'numeric'}
      min="0"
      step={decimals ? '0.01' : '1'}
      className="h-8 px-2 text-sm [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
      aria-invalid={invalid || undefined}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === 'Enter') e.preventDefault();
      }}
      {...props}
    />
  );
}
