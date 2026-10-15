import { BadRequestException } from '@nestjs/common';
import { CreateVariantDto } from './dto/product-variant.dto';
import { parseJsonArray } from './product-payload';

const variant = {
  options: { Size: 'M' },
  price: 12.5,
  stock: 3,
};
const parseVariants = (value: unknown) =>
  parseJsonArray(JSON.stringify(value), CreateVariantDto, 'variants', 100);
const errorOf = (fn: () => unknown) => {
  try {
    fn();
  } catch (e) {
    expect(e).toBeInstanceOf(BadRequestException);
    return (e as BadRequestException).message;
  }
  throw new Error('expected BadRequestException');
};

describe('parseJsonArray', () => {
  it('returns undefined when the field was not sent', () => {
    expect(
      parseJsonArray(undefined, CreateVariantDto, 'variants', 100),
    ).toBeUndefined();
  });

  it('parses valid variants into DTO instances', () => {
    const [v] = parseVariants([variant])!;
    expect(v).toBeInstanceOf(CreateVariantDto);
    expect(v).toMatchObject(variant);
  });

  it.each([
    [
      'negative price',
      { ...variant, price: -1 },
      /variants\[0\]: price must not be less than 0/,
    ],
    [
      'price with 3 decimals',
      { ...variant, price: 1.234 },
      /variants\[0\]: price/,
    ],
    [
      'text price (reports the type error)',
      { ...variant, price: 'abc' },
      /price must be a number/,
    ],
    [
      'fractional stock',
      { ...variant, stock: 1.5 },
      /stock must be an integer/,
    ],
    [
      'label sent by the client (derived by the API)',
      { ...variant, label: 'M' },
      /property label should not exist/,
    ],
    [
      'non-string option value',
      { ...variant, options: { Size: 5 } },
      /options must be strings/,
    ],
    [
      'unknown field',
      { ...variant, hacked: true },
      /property hacked should not exist/,
    ],
  ])('rejects %s', (_label, item, message) => {
    expect(errorOf(() => parseVariants([item]))).toMatch(message);
  });

  it('rejects invalid JSON, non-arrays and too many items', () => {
    expect(
      errorOf(() =>
        parseJsonArray('[{oops', CreateVariantDto, 'variants', 100),
      ),
    ).toBe('Invalid variants format');
    expect(errorOf(() => parseVariants(variant))).toBe(
      'variants must be an array',
    );
    expect(errorOf(() => parseVariants(Array(101).fill(variant)))).toMatch(
      /at most 100/,
    );
    expect(errorOf(() => parseVariants([null]))).toMatch(
      /variants\[0\] is invalid/,
    );
  });
});
