import { generateOrderNumber } from './order-number';

describe('generateOrderNumber', () => {
  afterEach(() => jest.useRealTimers());

  it('has the form ORD-YYMMDD-XXXXXX without ambiguous characters', () => {
    expect(generateOrderNumber()).toMatch(/^ORD-\d{6}-[2-9A-HJKMNP-Z]{6}$/);
  });

  it('uses the Vietnam date (UTC 20:30 on Oct 13 is already Oct 14)', () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-10-13T20:30:00Z'));
    expect(generateOrderNumber()).toMatch(/^ORD-261014-/);
  });

  it('does not repeat across many orders placed at the same moment', () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-10-13T10:00:00Z'));
    const numbers = new Set(
      Array.from({ length: 2000 }, () => generateOrderNumber()),
    );
    expect(numbers.size).toBe(2000);
  });
});
