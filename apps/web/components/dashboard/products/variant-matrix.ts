import { UserFacingError } from '@/lib/api-client';

// Giới hạn khớp API: apps/api/src/product/product-options.ts và dto/product-variant.dto.ts
export const MAX_OPTIONS = 3;
export const MAX_VALUES = 50;
export const MAX_NAME_LENGTH = 50;
export const MAX_VARIANTS = 100;
const MAX_PRICE = 9_999_999_999.99;
const MAX_STOCK = 1_000_000;

export interface ProductOption {
  name: string;
  values: string[];
}

// Giá trị ô nhập (chuỗi); enabled = tổ hợp này có bán
export interface VariantRow {
  id?: string;
  price: string;
  comparePrice: string;
  stock: string;
  sku: string;
  enabled: boolean;
}

// Thuộc tính + dữ liệu của từng tổ hợp lựa chọn, theo khoá tổ hợp.
// Danh sách biến thể luôn được tính ra từ đây (variantLines), không lưu riêng → không thể lệch nhau.
// API suy ra thuộc tính và nhãn từ các biến thể gửi lên (apps/api/src/product/product-options.ts).
export interface VariantMatrix {
  options: ProductOption[];
  rows: Record<string, VariantRow>;
}

interface VariantLine {
  key: string;
  values: string[];
  row: VariantRow;
}

// Khoá tổ hợp: các lựa chọn theo thứ tự thuộc tính đang dùng; '[]' = sản phẩm không phân loại
const keyOf = (values: string[]) => JSON.stringify(values);
const valuesOf = (key: string) => JSON.parse(key) as string[];

const newRow = (): VariantRow => ({
  price: '',
  comparePrice: '',
  stock: '0',
  sku: '',
  enabled: true,
});

// Thuộc tính chưa có lựa chọn nào thì chưa tạo biến thể
const activeOptions = (options: ProductOption[]) => options.filter((o) => o.values.length > 0);

// Vị trí lựa chọn của thuộc tính i trong khoá tổ hợp
const keyIndex = (options: ProductOption[], i: number) => activeOptions(options.slice(0, i)).length;

function cartesian(arrays: string[][]): string[][] {
  return arrays.reduce<string[][]>(
    (acc, arr) => acc.flatMap((combo) => arr.map((item) => [...combo, item])),
    [[]],
  );
}

export const hasVariantOptions = (m: VariantMatrix) => activeOptions(m.options).length > 0;

export const variantCount = (options: ProductOption[]) =>
  activeOptions(options).reduce((n, o) => n * o.values.length, 1);

export function variantLines(m: VariantMatrix): VariantLine[] {
  return cartesian(activeOptions(m.options).map((o) => o.values)).map((values) => {
    const key = keyOf(values);
    return { key, values, row: m.rows[key] ?? { ...newRow(), enabled: false } };
  });
}

// Đổi khoá của mọi hàng; null = bỏ hàng. Hai hàng trùng khoá mới (khi bỏ một thuộc tính) → giữ hàng đang bán
function remapRows(rows: VariantMatrix['rows'], map: (values: string[]) => string[] | null) {
  const next: VariantMatrix['rows'] = {};
  for (const [key, row] of Object.entries(rows)) {
    const values = map(valuesOf(key));
    if (!values) continue;
    const k = keyOf(values);
    if (!next[k] || (!next[k].enabled && row.enabled)) next[k] = row;
  }
  return next;
}

const withoutAt = (values: string[], p: number) => values.filter((_, j) => j !== p);

export const emptyMatrix = (): VariantMatrix => ({ options: [], rows: { '[]': newRow() } });

// Sản phẩm đang có → ma trận; tổ hợp chưa có biến thể thì để ở trạng thái không bán
export function matrixFromProduct(
  attributes: { name: string; options: string[] }[],
  variants: {
    id: string;
    options: Record<string, string>;
    price?: number | string | null;
    comparePrice?: number | string | null;
    stock: number;
    sku?: string | null;
  }[],
): VariantMatrix {
  const options = attributes.map((a) => ({ name: a.name, values: [...a.options] }));
  const active = activeOptions(options);
  const rows: VariantMatrix['rows'] = {};
  for (const values of cartesian(active.map((o) => o.values))) {
    rows[keyOf(values)] = { ...newRow(), enabled: false };
  }
  for (const v of variants) {
    const values = active.map((o) => v.options[o.name]);
    if (values.some((x) => x === undefined)) continue;
    rows[keyOf(values)] = {
      id: v.id,
      price: v.price != null ? String(v.price) : '',
      comparePrice: v.comparePrice != null ? String(v.comparePrice) : '',
      stock: String(v.stock),
      sku: v.sku ?? '',
      enabled: true,
    };
  }
  return { options, rows };
}

export const addOption = (m: VariantMatrix, name: string): VariantMatrix => ({
  ...m,
  options: [...m.options, { name, values: [] }],
});

export const renameOption = (m: VariantMatrix, i: number, name: string): VariantMatrix => ({
  ...m,
  options: m.options.map((o, j) => (j === i ? { ...o, name } : o)),
});

export function removeOption(m: VariantMatrix, i: number): VariantMatrix {
  const p = keyIndex(m.options, i);
  return {
    options: m.options.filter((_, j) => j !== i),
    rows: m.options[i].values.length > 0 ? remapRows(m.rows, (v) => withoutAt(v, p)) : m.rows,
  };
}

export function addValue(m: VariantMatrix, i: number, value: string): VariantMatrix {
  const option = m.options[i];
  const p = keyIndex(m.options, i);
  const options = m.options.map((o, j) => (j === i ? { ...o, values: [...o.values, value] } : o));

  // Lựa chọn đầu tiên của thuộc tính: các biến thể hiện có nhận lựa chọn này, giữ nguyên giá/kho/id
  if (option.values.length === 0) {
    return { options, rows: remapRows(m.rows, (v) => [...v.slice(0, p), value, ...v.slice(p)]) };
  }

  // Tổ hợp mới lấy giá theo tổ hợp cùng hàng với lựa chọn đầu tiên; tồn kho bắt đầu từ 0
  const rows = { ...m.rows };
  for (const { key, values } of variantLines({ options, rows: {} })) {
    if (values[p] !== value) continue;
    const sibling = m.rows[keyOf(values.map((x, j) => (j === p ? option.values[0] : x)))];
    rows[key] = {
      ...newRow(),
      price: sibling?.price ?? '',
      comparePrice: sibling?.comparePrice ?? '',
      enabled: sibling?.enabled ?? true,
    };
  }
  return { options, rows };
}

export function renameValue(m: VariantMatrix, i: number, from: string, to: string): VariantMatrix {
  const p = keyIndex(m.options, i);
  return {
    options: m.options.map((o, j) =>
      j === i ? { ...o, values: o.values.map((x) => (x === from ? to : x)) } : o,
    ),
    rows: remapRows(m.rows, (v) => (v[p] === from ? v.map((x, j) => (j === p ? to : x)) : v)),
  };
}

export function removeValue(m: VariantMatrix, i: number, value: string): VariantMatrix {
  const p = keyIndex(m.options, i);
  const last = m.options[i].values.length === 1;
  return {
    options: m.options.map((o, j) =>
      j === i ? { ...o, values: o.values.filter((x) => x !== value) } : o,
    ),
    // Bỏ lựa chọn cuối cùng: thuộc tính thôi tạo biến thể, các biến thể giữ nguyên dữ liệu
    rows: remapRows(m.rows, (v) => (last ? withoutAt(v, p) : v[p] === value ? null : v)),
  };
}

export const updateRow = (
  m: VariantMatrix,
  line: VariantLine,
  patch: Partial<VariantRow>,
): VariantMatrix => ({ ...m, rows: { ...m.rows, [line.key]: { ...line.row, ...patch } } });

// Điền cùng giá/kho cho mọi tổ hợp đang bán
export function applyToAll(m: VariantMatrix, patch: Partial<VariantRow>): VariantMatrix {
  const rows = { ...m.rows };
  for (const line of variantLines(m)) {
    if (line.row.enabled) rows[line.key] = { ...line.row, ...patch };
  }
  return { ...m, rows };
}

export const variantLabel = (values: string[]) => values.join(' / ') || 'Default';

type RowField = 'price' | 'comparePrice' | 'stock';
const PRICE_PATTERN = /^\d+(\.\d{1,2})?$/;

// Lỗi của từng ô ở một hàng đang bán (ô trống cũng là lỗi với giá/kho)
export function rowErrors(row: VariantRow): Partial<Record<RowField, string>> {
  if (!row.enabled) return {};
  const errors: Partial<Record<RowField, string>> = {};
  const price = row.price.trim();
  if (!PRICE_PATTERN.test(price) || Number(price) > MAX_PRICE) {
    errors.price = price ? 'Enter a price with up to 2 decimals' : 'Enter a price';
  }
  const compare = row.comparePrice.trim();
  if (compare) {
    if (!PRICE_PATTERN.test(compare) || Number(compare) > MAX_PRICE) {
      errors.comparePrice = 'Enter a price with up to 2 decimals';
    } else if (!errors.price && Number(compare) <= Number(price)) {
      errors.comparePrice = 'Must be higher than the price';
    }
  }
  const stock = row.stock.trim();
  if (!/^\d+$/.test(stock) || Number(stock) > MAX_STOCK) {
    errors.stock = `Enter a whole number up to ${MAX_STOCK.toLocaleString('en-US')}`;
  }
  return errors;
}

// Lỗi đầu tiên chặn việc lưu; null = hợp lệ
export function matrixError(m: VariantMatrix): string | null {
  const names = m.options.map((o) => o.name.trim());
  if (names.some((n) => !n)) return 'Give every option a name';
  if (new Set(names).size !== names.length) return 'Option names must be different';
  const empty = m.options.find((o) => o.values.length === 0);
  if (empty) return `Add a value to ${empty.name.trim()} or remove it`;

  const lines = variantLines(m);
  if (!lines.some((l) => l.row.enabled)) return 'Choose at least one variant to sell';
  for (const line of lines) {
    const [message] = Object.values(rowErrors(line.row));
    if (message) {
      return hasVariantOptions(m) ? `${variantLabel(line.values)}: ${message}` : message;
    }
  }
  return null;
}

// Payload `variants` cho API: chỉ các tổ hợp đang bán; tổ hợp bỏ bán (kể cả có id) sẽ bị API xoá
export function toVariantPayload(m: VariantMatrix) {
  const error = matrixError(m);
  if (error) throw new UserFacingError(error);
  const names = activeOptions(m.options).map((o) => o.name.trim());
  return variantLines(m)
    .filter((l) => l.row.enabled)
    .map(({ values, row }) => ({
      ...(row.id && { id: row.id }),
      options: Object.fromEntries(names.map((name, j) => [name, values[j]])),
      price: Number(row.price),
      comparePrice: row.comparePrice.trim() ? Number(row.comparePrice) : null,
      stock: Number(row.stock),
      ...(row.sku && { sku: row.sku }),
    }));
}
