import {
  button,
  detail,
  emailLayout,
  itemsTable,
  money,
  strong,
} from './email-layout';

const evil = '<img src=x onerror=alert(1)>';

describe('email layout', () => {
  it('formats money with two decimals', () => {
    expect(money('38')).toBe('$38.00');
    expect(money(145.5)).toBe('$145.50');
  });

  it('escapes every text value it is given', () => {
    const html = [
      emailLayout({
        title: evil,
        preview: evil,
        brand: evil,
        html: '',
        footer: '',
      }),
      strong(evil),
      button(`https://shop.example/orders?q="${evil}`, evil),
      detail(evil, [evil, null, evil]),
      itemsTable(
        [
          {
            productName: evil,
            variantLabel: evil,
            quantity: 2,
            priceAtPurchase: '10',
          },
        ],
        [{ label: evil, value: 20 }],
      ),
    ].join('');
    expect(html).not.toContain('<img');
    expect(html).toContain('&lt;img src=x onerror=alert(1)&gt;');
  });

  it('shows line totals and skips empty detail lines', () => {
    const table = itemsTable(
      [
        {
          productName: 'Belt',
          variantLabel: null,
          quantity: 3,
          priceAtPurchase: '12.5',
        },
      ],
      [{ label: 'Total', value: '37.5', bold: true }],
    );
    expect(table).toContain('× 3');
    expect(table).toContain('$37.50');
    expect(detail('Reason', ['Changed my mind', null])).not.toContain(
      '<br><br>',
    );
  });
});
