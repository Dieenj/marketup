import { normalizeSlug, SLUG_PATTERN } from './slug';

describe('normalizeSlug', () => {
  it.each([
    ['Áo Thun & Quần Đùi', 'ao-thun-quan-dui'],
    ['  Cửa Hàng Đồ Gỗ  ', 'cua-hang-do-go'],
    ['shoes--bags', 'shoes-bags'],
    ['-Summer Sale 2026-', 'summer-sale-2026'],
    ['UPPER_case.dots', 'upper-case-dots'],
  ])('%p → %p', (input, expected) => {
    const slug = normalizeSlug(input);
    expect(slug).toBe(expected);
    expect(SLUG_PATTERN.test(slug as string)).toBe(true);
  });

  it('returns an empty string when nothing is left (rejected by the pattern)', () => {
    expect(normalizeSlug('!!!')).toBe('');
    expect(SLUG_PATTERN.test('')).toBe(false);
  });

  it('leaves non-strings for the validator to reject', () => {
    expect(normalizeSlug(42)).toBe(42);
  });
});
