import { BadRequestException } from '@nestjs/common';

// Như Shopify: trang sản phẩm chọn lần lượt từng thuộc tính, quá 3 thì người mua khó dùng
const MAX_ATTRIBUTES = 3;
const MAX_OPTIONS_PER_ATTRIBUTE = 50;
const MAX_NAME_LENGTH = 50;

// Nhãn của biến thể duy nhất khi sản phẩm không có thuộc tính
const DEFAULT_VARIANT_LABEL = 'Default';

interface DerivedAttribute {
  name: string;
  options: string[];
}

interface DerivedVariant {
  label: string;
  options: Record<string, string>;
}

// Thuộc tính và nhãn biến thể suy ra từ `options` của các biến thể → luôn khớp nhau, client không gửi riêng.
// - Mọi biến thể có cùng tập thuộc tính; không có hai biến thể trùng tổ hợp lựa chọn
// - Thứ tự thuộc tính theo biến thể đầu tiên, thứ tự lựa chọn theo lần xuất hiện đầu tiên
//   (bảng product_attributes giữ thứ tự này; cột options là jsonb nên không giữ thứ tự khoá)
// - Nhãn: "Size: M / Color: Red"; không có thuộc tính → "Default"
export function deriveProductOptions(
  variants: { options: Record<string, string> }[],
): { attributes: DerivedAttribute[]; variants: DerivedVariant[] } {
  if (variants.length === 0) {
    throw new BadRequestException('Product must have at least one variant');
  }

  const normalized = variants.map((variant, index) =>
    Object.entries(variant.options).map(([name, value]) => {
      const cleanName = name.trim();
      const cleanValue = typeof value === 'string' ? value.trim() : '';
      if (!cleanName || !cleanValue) {
        throw new BadRequestException(
          `variants[${index}]: attribute names and options must not be empty`,
        );
      }
      if (
        cleanName.length > MAX_NAME_LENGTH ||
        cleanValue.length > MAX_NAME_LENGTH
      ) {
        throw new BadRequestException(
          `variants[${index}]: attribute names and options must be at most ${MAX_NAME_LENGTH} characters`,
        );
      }
      return [cleanName, cleanValue] as const;
    }),
  );

  const names = normalized[0].map(([name]) => name);
  if (new Set(names).size !== names.length) {
    throw new BadRequestException('variants[0]: duplicate attribute name');
  }
  if (names.length > MAX_ATTRIBUTES) {
    throw new BadRequestException(
      `A product can have at most ${MAX_ATTRIBUTES} attributes`,
    );
  }

  const optionsByName = new Map(names.map((name) => [name, new Set<string>()]));
  const seenCombos = new Set<string>();

  const derived = normalized.map((entries, index) => {
    const options = Object.fromEntries(entries);
    if (
      entries.length !== names.length ||
      // hasOwn, không dùng `in`: tên như "toString" có sẵn trên prototype của mọi object
      !names.every((name) => Object.hasOwn(options, name))
    ) {
      throw new BadRequestException(
        `variants[${index}]: every variant must have the same attributes (${names.join(', ') || 'none'})`,
      );
    }

    const values = names.map((name) => options[name]);
    const combo = JSON.stringify(values);
    if (seenCombos.has(combo)) {
      throw new BadRequestException(
        names.length > 0
          ? `variants[${index}]: duplicate variant ${labelOf(names, values)}`
          : 'A product without attributes can only have one variant',
      );
    }
    seenCombos.add(combo);

    names.forEach((name, i) => optionsByName.get(name)!.add(values[i]));
    return {
      label: labelOf(names, values),
      // Ghi theo thứ tự thuộc tính
      options: Object.fromEntries(names.map((name, i) => [name, values[i]])),
    };
  });

  const attributes = names.map((name) => ({
    name,
    options: [...optionsByName.get(name)!],
  }));
  const crowded = attributes.find(
    (a) => a.options.length > MAX_OPTIONS_PER_ATTRIBUTE,
  );
  if (crowded) {
    throw new BadRequestException(
      `${crowded.name} can have at most ${MAX_OPTIONS_PER_ATTRIBUTE} options`,
    );
  }

  return { attributes, variants: derived };
}

function labelOf(names: string[], values: string[]) {
  if (names.length === 0) return DEFAULT_VARIANT_LABEL;
  return names.map((name, i) => `${name}: ${values[i]}`).join(' / ');
}
