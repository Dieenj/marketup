// Nest nạp reflect-metadata khi khởi động; test DTO phải tự nạp (@Type() cần nó)
import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { CreateOrderDto } from '../order/dto/create-order.dto';
import { CreateShopDto } from '../shop/dto/create-shop.dto';
import { UpdateShopDto } from '../shop/dto/update-shop.dto';
import { WriteReviewDto } from '../review/dto/write-review.dto';
import { ReplyReviewDto } from '../review/dto/reply-review.dto';
import { RegisterDto } from '../auth/dto/register.dto';
import { VerifyLoginCodeDto } from '../buyer-auth/dto/verify-login-code.dto';

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
    buyerEmail: ' An@Example.com ',
    buyerPhone: '0901 234 567',
    shippingAddress: '12 Lê Lợi',
    shippingCity: 'HCM',
    items: [item],
  };

  it('accepts a normal checkout and trims text fields', () => {
    const { dto, fields } = check(CreateOrderDto, order);
    expect(fields).toEqual([]);
    expect(dto.buyerName).toBe('An');
    // Người mua đăng nhập bằng email → đơn phải lưu email dạng chuẩn để tìm lại được
    expect(dto.buyerEmail).toBe('an@example.com');
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

describe('WriteReviewDto', () => {
  it('accepts a rating with an optional trimmed comment', () => {
    const { dto, fields } = check(WriteReviewDto, {
      rating: 4,
      comment: '  Great  ',
    });
    expect(fields).toEqual([]);
    expect(dto.comment).toBe('Great');
  });

  it.each([
    ['rating 4.5', { rating: 4.5 }],
    ['rating 6', { rating: 6 }],
    ['rating 0', { rating: 0 }],
    ['very long comment', { comment: 'x'.repeat(2001) }],
    // Tên, sản phẩm, shop lấy từ đơn hàng — client không được tự gửi
    ['buyer name', { buyerName: 'Someone else' }],
    ['product id', { productId: 'p1' }],
  ])('rejects %s', (_label, patch) => {
    expect(
      check(WriteReviewDto, { rating: 5, ...patch }).fields.length,
    ).toBeGreaterThan(0);
  });
});

describe('ReplyReviewDto', () => {
  it.each([
    ['blank reply', '   '],
    ['very long reply', 'x'.repeat(1001)],
  ])('rejects %s', (_label, replyText) => {
    expect(check(ReplyReviewDto, { replyText }).fields).toEqual(['replyText']);
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

describe('VerifyLoginCodeDto', () => {
  it('normalises the email and strips spaces from a pasted code', () => {
    const { dto, fields } = check(VerifyLoginCodeDto, {
      email: ' Buyer@Example.COM',
      code: '123 456',
    });
    expect(fields).toEqual([]);
    expect(dto).toMatchObject({ email: 'buyer@example.com', code: '123456' });
  });

  it.each(['12345', '1234567', 'abcdef', ''])('rejects code %p', (code) => {
    expect(check(VerifyLoginCodeDto, { email: 'a@b.co', code }).fields).toEqual(
      ['code'],
    );
  });
});
