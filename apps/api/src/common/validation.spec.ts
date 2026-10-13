// Nest nạp reflect-metadata khi khởi động; test DTO phải tự nạp (@Type() cần nó)
import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { CreateOrderDto } from '../order/dto/create-order.dto';
import { CreateShopDto } from '../shop/dto/create-shop.dto';
import { UpdateShopDto } from '../shop/dto/update-shop.dto';
import { CreateReviewDto } from '../review/dto/create-review.dto';
import { RegisterDto } from '../auth/dto/register.dto';

// Giống ValidationPipe toàn cục trong main.ts
function check<T extends object>(cls: new () => T, body: object) {
  const dto = plainToInstance(cls, body);
  const errors = validateSync(dto, {
    whitelist: true,
    forbidNonWhitelisted: true,
  });
  return { dto, fields: errors.map((e) => e.property) };
}

describe('CreateOrderDto', () => {
  const item = { productId: 'p1', variantId: 'v1', quantity: 2 };
  const order = {
    shopId: 's1',
    buyerName: ' An ',
    buyerEmail: 'an@example.com',
    buyerPhone: '0901 234 567',
    shippingAddress: '12 Lê Lợi',
    shippingCity: 'HCM',
    items: [item],
  };

  it('accepts a normal checkout and trims text fields', () => {
    const { dto, fields } = check(CreateOrderDto, order);
    expect(fields).toEqual([]);
    expect(dto.buyerName).toBe('An');
  });

  it.each([
    ['negative quantity', { items: [{ ...item, quantity: -5 }] }],
    ['zero quantity', { items: [{ ...item, quantity: 0 }] }],
    ['fractional quantity', { items: [{ ...item, quantity: 1.5 }] }],
    ['quantity above 999', { items: [{ ...item, quantity: 1000 }] }],
    ['no items', { items: [] }],
    ['51 lines', { items: Array(51).fill(item) }],
    ['missing variant', { items: [{ productId: 'p1', quantity: 1 }] }],
    ['client-sent total', { totalAmount: 0 }],
    ['invalid phone', { buyerPhone: 'call me' }],
  ])('rejects %s', (_label, patch) => {
    expect(
      check(CreateOrderDto, { ...order, ...patch }).fields.length,
    ).toBeGreaterThan(0);
  });
});

describe('CreateShopDto / UpdateShopDto', () => {
  const shop = { name: 'Lumière', slug: 'Cửa Hàng Lumière' };

  it('normalises the slug and brand colour', () => {
    const { dto, fields } = check(CreateShopDto, {
      ...shop,
      primaryColor: '#ABC',
    });
    expect(fields).toEqual([]);
    expect(dto.slug).toBe('cua-hang-lumiere');
    expect(dto.primaryColor).toBe('#aabbcc');
  });

  it.each(['red', '#12345678', '#xyz'])('rejects colour %p', (primaryColor) => {
    expect(check(CreateShopDto, { ...shop, primaryColor }).fields).toContain(
      'primaryColor',
    );
  });

  it('accepts Vietnamese phone formats and empty optional fields', () => {
    for (const contactPhone of ['0901 234 567', '+84 90 123 4567', '']) {
      expect(
        check(UpdateShopDto, { contactPhone, contactEmail: '' }).fields,
      ).toEqual([]);
    }
    expect(check(UpdateShopDto, { contactPhone: 'call me' }).fields).toContain(
      'contactPhone',
    );
  });

  it('does not allow changing the slug after creation', () => {
    expect(check(UpdateShopDto, { slug: 'hijacked' }).fields).toContain('slug');
  });
});

describe('CreateReviewDto', () => {
  const review = {
    shopId: 's1',
    rating: 5,
    buyerName: 'An',
    buyerEmail: 'an@example.com',
  };

  it('accepts a shop review with productId null (as the storefront sends it)', () => {
    expect(
      check(CreateReviewDto, { ...review, productId: null }).fields,
    ).toEqual([]);
  });

  it.each([
    ['rating 4.5', { rating: 4.5 }],
    ['rating 6', { rating: 6 }],
    ['bad email', { buyerEmail: 'nope' }],
    ['very long comment', { comment: 'x'.repeat(2001) }],
    ['self-verified flag', { isVerified: true }],
  ])('rejects %s', (_label, patch) => {
    expect(
      check(CreateReviewDto, { ...review, ...patch }).fields.length,
    ).toBeGreaterThan(0);
  });
});

describe('RegisterDto', () => {
  it('lower-cases and trims the email', () => {
    const { dto, fields } = check(RegisterDto, {
      name: 'An',
      email: '  An@Example.COM ',
      password: 'password123',
    });
    expect(fields).toEqual([]);
    expect(dto.email).toBe('an@example.com');
  });
});
