import { BadRequestException } from '@nestjs/common';
import { deriveProductOptions } from './product-options';

const v = (options: Record<string, string>) => ({ options });
const errorOf = (fn: () => unknown) => {
  try {
    fn();
  } catch (e) {
    expect(e).toBeInstanceOf(BadRequestException);
    return (e as BadRequestException).message;
  }
  throw new Error('expected BadRequestException');
};

describe('deriveProductOptions', () => {
  it('derives attributes in order and labels from variant options', () => {
    const result = deriveProductOptions([
      v({ Size: 'S', Color: 'Red' }),
      v({ Color: 'Blue', Size: 'S' }),
      v({ Size: 'M', Color: 'Red' }),
    ]);
    expect(result.attributes).toEqual([
      { name: 'Size', options: ['S', 'M'] },
      { name: 'Color', options: ['Red', 'Blue'] },
    ]);
    expect(result.variants.map((x) => x.label)).toEqual([
      'Size: S / Color: Red',
      'Size: S / Color: Blue',
      'Size: M / Color: Red',
    ]);
    // options được ghi lại theo thứ tự thuộc tính
    expect(Object.keys(result.variants[1].options)).toEqual(['Size', 'Color']);
  });

  it('labels the single variant of a product without attributes "Default"', () => {
    expect(deriveProductOptions([v({})])).toEqual({
      attributes: [],
      variants: [{ label: 'Default', options: {} }],
    });
  });

  it('trims attribute names and options', () => {
    const { attributes, variants } = deriveProductOptions([
      v({ ' Size ': ' M ' }),
    ]);
    expect(attributes).toEqual([{ name: 'Size', options: ['M'] }]);
    expect(variants[0]).toEqual({ label: 'Size: M', options: { Size: 'M' } });
  });

  it.each([
    ['no variants', [], /at least one variant/],
    [
      'duplicate combinations',
      [v({ Size: 'M' }), v({ Size: 'M' })],
      /variants\[1\]: duplicate variant Size: M/,
    ],
    [
      'two variants without attributes',
      [v({}), v({})],
      /only have one variant/,
    ],
    [
      'variants with different attributes',
      [v({ Size: 'M' }), v({ Color: 'Red' })],
      /variants\[1\]: every variant must have the same attributes \(Size\)/,
    ],
    [
      'a variant missing an attribute',
      [v({ Size: 'M', Color: 'Red' }), v({ Size: 'L' })],
      /same attributes/,
    ],
    [
      'attribute names inherited from Object.prototype',
      [v({ toString: 'A' }), v({ Size: 'B' })],
      /variants\[1\]: every variant must have the same attributes \(toString\)/,
    ],
    ['empty option', [v({ Size: ' ' })], /must not be empty/],
    ['empty attribute name', [v({ '': 'M' })], /must not be empty/],
    [
      'attribute names that collide after trimming',
      [v({ Size: 'M', 'Size ': 'L' })],
      /duplicate attribute name/,
    ],
    ['too long option', [v({ Size: 'x'.repeat(51) })], /at most 50/],
  ])('rejects %s', (_label, variants, message) => {
    expect(errorOf(() => deriveProductOptions(variants))).toMatch(message);
  });

  it('limits the number of attributes', () => {
    const options = Object.fromEntries(
      Array.from({ length: 4 }, (_, i) => [`A${i}`, 'x']),
    );
    expect(errorOf(() => deriveProductOptions([v(options)]))).toMatch(
      /at most 3 attributes/,
    );
  });
});
