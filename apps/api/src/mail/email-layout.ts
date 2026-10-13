import { escapeHtml } from '../common/html';

// Khung chung cho mọi email: chữ trên nền trắng như một bức thư (kiểu email giao dịch của Shopify/Stripe) —
// tên shop ở đầu, một tiêu đề ngắn, vài đoạn văn, một nút. Không banner màu, hộp nền hay emoji.
// Hàm nhận `text` tự escape; tham số tên `html` là HTML đã an toàn do nơi gọi dựng.

const FONT =
  "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";
const MUTED = '#6b7280';
const RULE = '#e5e7eb';

export const money = (value: unknown) => `$${Number(value).toFixed(2)}`;

export function emailLayout({
  title,
  preview,
  brand,
  html,
  footer,
}: {
  title: string; // tiêu đề trong thư, cũng là <title>
  preview: string; // dòng xem trước trong hộp thư
  brand: string; // tên shop
  html: string;
  footer: string;
}) {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #ffffff;">
  <div style="display: none; max-height: 0; overflow: hidden;">${escapeHtml(preview)}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
    <tr>
      <td align="center" style="padding: 32px 16px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 520px; font-family: ${FONT}; font-size: 15px; line-height: 1.6; color: #111827;">
          <tr>
            <td style="padding-bottom: 28px; font-size: 16px; font-weight: 600;">${escapeHtml(brand)}</td>
          </tr>
          <tr>
            <td>
              <h1 style="margin: 0 0 16px 0; font-size: 22px; font-weight: 600; line-height: 1.3;">${escapeHtml(title)}</h1>
              ${html}
            </td>
          </tr>
          <tr>
            <td style="padding-top: 32px;">
              <p style="margin: 0; padding-top: 16px; border-top: 1px solid ${RULE}; font-size: 12px; line-height: 1.5; color: ${MUTED};">${footer}</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export const paragraph = (html: string) =>
  `<p style="margin: 0 0 16px 0;">${html}</p>`;

export const strong = (text: string) =>
  `<strong style="font-weight: 600;">${escapeHtml(text)}</strong>`;

export function button(url: string, label: string) {
  return `<p style="margin: 24px 0;"><a href="${escapeHtml(url)}" style="display: inline-block; background-color: #111827; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 600; padding: 11px 20px; border-radius: 6px;">${escapeHtml(label)}</a></p>`;
}

// Nhãn nhỏ + nội dung, vd. "Delivery address" rồi các dòng địa chỉ
export function detail(label: string, lines: (string | null | undefined)[]) {
  const body = lines
    .filter((line): line is string => !!line)
    .map(escapeHtml)
    .join('<br>');
  return `<p style="margin: 0 0 16px 0;"><span style="font-size: 13px; color: ${MUTED};">${escapeHtml(label)}</span><br>${body}</p>`;
}

// Bảng sản phẩm kẻ dòng mảnh + tổng tiền
export function itemsTable(
  items: {
    productName: string;
    variantLabel: string | null;
    quantity: number;
    priceAtPurchase: unknown;
  }[],
  totals: { label: string; value: unknown; bold?: boolean }[],
) {
  const cell = `padding: 10px 0; border-top: 1px solid ${RULE}; vertical-align: top;`;
  const rows = items
    .map(
      (item) => `<tr>
        <td style="${cell}">${escapeHtml(item.productName)}${
          item.variantLabel
            ? `<br><span style="font-size: 13px; color: ${MUTED};">${escapeHtml(item.variantLabel)}</span>`
            : ''
        }</td>
        <td style="${cell} padding-left: 12px; white-space: nowrap; color: ${MUTED};">× ${item.quantity}</td>
        <td style="${cell} padding-left: 12px; white-space: nowrap; text-align: right;">${money(Number(item.priceAtPurchase) * item.quantity)}</td>
      </tr>`,
    )
    .join('');
  const totalRows = totals
    .map(
      ({ label, value, bold }, i) => `<tr>
        <td colspan="2" style="padding: ${i === 0 ? '12px' : '2px'} 0 2px 0;${i === 0 ? ` border-top: 1px solid ${RULE};` : ''}${bold ? ' font-weight: 600;' : ` color: ${MUTED};`}">${escapeHtml(label)}</td>
        <td style="padding: ${i === 0 ? '12px' : '2px'} 0 2px 12px;${i === 0 ? ` border-top: 1px solid ${RULE};` : ''} text-align: right; white-space: nowrap;${bold ? ' font-weight: 600;' : ''}">${money(value)}</td>
      </tr>`,
    )
    .join('');
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 8px 0 24px 0; font-size: 14px;">${rows}${totalRows}</table>`;
}
