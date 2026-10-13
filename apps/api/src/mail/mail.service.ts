import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CancelActor, CancelReason, Prisma } from '@prisma/client';
import { escapeHtml } from '../common/html';
import { AccessTokenService } from '../auth/access-token.service';
import { REVIEW_WINDOW_DAYS } from '../review/review-rules';
import {
  BrevoTransport,
  SmtpTransport,
  type MailTransport,
  type OutgoingMail,
} from './mail-transport';

type Money = Prisma.Decimal | number | string;

interface MailOrderItem {
  productId: string;
  productName: string;
  variantLabel: string | null;
  quantity: number;
  priceAtPurchase: Money;
}

// Các trường email dùng — khớp với đơn trả về từ OrderService (create / updateStatus)
export interface MailOrder {
  id: string;
  orderNumber: string;
  buyerName: string;
  buyerEmail: string;
  buyerPhone: string;
  shippingAddress: string;
  shippingCity: string;
  shippingNote: string | null;
  createdAt: Date;
  subtotal: Money;
  totalAmount: Money;
  items: MailOrderItem[];
  shop?: { name: string; slug: string } | null;
}

type OrderLink = Pick<MailOrder, 'id' | 'orderNumber' | 'shop'>;

interface MailCancelledOrder extends MailOrder {
  cancelledBy: CancelActor | null;
  cancelReason: CancelReason | null;
  cancelNote: string | null;
}

// Nhãn lý do huỷ cho người mua (khớp CANCEL_REASON_LABELS ở web)
const CANCEL_REASON_LABELS: Record<CancelReason, string> = {
  CHANGED_MIND: 'Changed my mind',
  WRONG_DETAILS: 'Need to change the address or items',
  FOUND_BETTER_PRICE: 'Found a better price elsewhere',
  OUT_OF_STOCK: 'Out of stock',
  BUYER_UNREACHABLE: "The shop couldn't reach you",
  DELIVERY_FAILED: 'Delivery was unsuccessful',
  OTHER: 'Other',
};

@Injectable()
export class MailService implements OnModuleInit {
  private readonly logger = new Logger(MailService.name);
  // null = chưa cấu hình cách gửi → chỉ in email ra log (máy dev)
  private readonly transport: MailTransport | null;

  constructor(
    private configService: ConfigService,
    private tokens: AccessTokenService,
  ) {
    this.transport = this.createTransport();
  }

  // BREVO_API_KEY (HTTPS, dùng trên Render) được ưu tiên; không có thì dùng SMTP nếu đủ biến
  private createTransport(): MailTransport | null {
    const brevoKey = this.configService.get<string>('BREVO_API_KEY');
    if (brevoKey) return new BrevoTransport(brevoKey);

    const host = this.configService.get<string>('SMTP_HOST');
    const port = this.configService.get<string>('SMTP_PORT');
    const user = this.configService.get<string>('SMTP_USER');
    const pass = this.configService.get<string>('SMTP_PASS');
    if (host && port && user && pass) {
      return new SmtpTransport({ host, port: Number(port), user, pass });
    }
    return null;
  }

  // Kiểm tra cấu hình ngay lúc khởi động để log cho biết email có gửi được không
  // (key sai, sender chưa xác minh, cổng SMTP bị chặn…). Không chặn API khởi động.
  onModuleInit() {
    if (!this.transport) {
      this.logger.warn(
        'No email transport configured (BREVO_API_KEY or SMTP_*). Emails are only logged.',
      );
      return;
    }
    const { name } = this.transport;
    this.transport
      .verify()
      .then(() => this.logger.log(`Email transport ready: ${name}`))
      .catch((error: unknown) =>
        this.logger.error(
          `Email transport ${name} is not working: ${error instanceof Error ? error.message : String(error)}`,
        ),
      );
  }

  private getFromHeader(): string {
    return (
      this.configService.get<string>('SMTP_FROM') ||
      'MarketUp <noreply@marketup.local>'
    );
  }

  private getBaseUrl(): string {
    return (
      this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000'
    );
  }

  // Trang đơn của người mua; token trong link mở đúng đơn này mà không cần đăng nhập
  private getOrderUrl(order: OrderLink): string {
    const path = `/shop/${order.shop?.slug ?? ''}/orders/${encodeURIComponent(order.orderNumber)}`;
    return `${this.getBaseUrl()}${path}?t=${this.tokens.signOrder(order.id)}`;
  }

  private orderButton(order: OrderLink, label = 'Track your order'): string {
    return `<a href="${this.getOrderUrl(order)}" style="display: inline-block; background-color: #111111; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: bold; padding: 12px 28px; border-radius: 12px;">${label}</a>`;
  }

  private async sendMail(mail: OutgoingMail) {
    if (!this.transport) {
      this.logger.log(`[MOCK EMAIL DISPATCH]
To: ${mail.to}
Subject: ${mail.subject}
Body: (HTML length: ${mail.html.length} characters)
      `);
      return;
    }
    try {
      const messageId = await this.transport.send(mail);
      this.logger.log(
        `Email sent via ${this.transport.name}: ${messageId ?? 'ok'}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to send email via ${this.transport.name}:`,
        error,
      );
    }
  }

  async sendLoginCodeEmail({
    to,
    code,
    shopName,
  }: {
    to: string;
    code: string;
    shopName?: string;
  }) {
    // Chưa cấu hình cách gửi ở máy dev → in mã ra log để đăng nhập/test được; không bao giờ in trên server
    if (
      !this.transport &&
      this.configService.get('NODE_ENV') !== 'production'
    ) {
      this.logger.log(`[DEV] Login code for ${to}: ${code}`);
    }

    const store = escapeHtml(shopName || 'MarketUp');
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Your sign-in code</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #f6f9fc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
        <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 480px; margin: 40px auto; background-color: #ffffff; border-radius: 16px; border: 1px solid #eef2f5;">
          <tr>
            <td style="padding: 40px; text-align: center;">
              <h1 style="margin: 0 0 8px 0; font-size: 20px; font-weight: 700; color: #111111;">Sign in to ${store}</h1>
              <p style="margin: 0 0 24px 0; color: #555555; font-size: 14px; line-height: 1.6;">Enter this code to see your orders. It expires in 10 minutes.</p>
              <div style="display: inline-block; padding: 16px 28px; background-color: #f4f4f5; border-radius: 12px; font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #111111; font-family: 'SFMono-Regular', Consolas, monospace;">${code}</div>
              <p style="margin: 24px 0 0 0; color: #888888; font-size: 12px; line-height: 1.5;">If you didn't ask for this code, you can ignore this email — nobody can sign in without it.</p>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    await this.sendMail({
      from: this.getFromHeader(),
      to,
      subject: `${code} is your ${shopName || 'MarketUp'} sign-in code`,
      html: htmlContent,
    });
  }

  async sendOrderPlacedEmail(order: MailOrder) {
    const formattedDate = new Date(order.createdAt).toLocaleDateString(
      'en-US',
      {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        timeZone: 'Asia/Ho_Chi_Minh',
      },
    );

    const itemsHtml = order.items
      .map(
        (item) => `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #eeeeee;">
          <div style="font-weight: bold; font-size: 14px; color: #111111;">${escapeHtml(item.productName)}</div>
          ${
            item.variantLabel
              ? `<div style="font-size: 12px; color: #666666; margin-top: 2px;">Variant: ${escapeHtml(item.variantLabel)}</div>`
              : ''
          }
        </td>
        <td style="padding: 12px; border-bottom: 1px solid #eeeeee; text-align: center; color: #666666;">
          x${item.quantity}
        </td>
        <td style="padding: 12px; border-bottom: 1px solid #eeeeee; text-align: right; font-weight: bold; color: #111111;">
          $${Number(item.priceAtPurchase).toFixed(2)}
        </td>
      </tr>
    `,
      )
      .join('');

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Order Confirmed</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #f6f9fc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
        <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.05); border: 1px solid #eef2f5;">
          <!-- Header Banner -->
          <tr>
            <td style="background-color: #111111; padding: 40px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 26px; font-weight: 800; letter-spacing: -0.5px;">Order Placed</h1>
              <p style="margin: 8px 0 0 0; color: #aaaaaa; font-size: 14px; font-weight: 500;">Thank you for shopping with ${escapeHtml(
                order.shop?.name || 'our store',
              )}!</p>
            </td>
          </tr>

          <!-- Message Block -->
          <tr>
            <td style="padding: 40px 40px 20px 40px;">
              <h2 style="margin: 0 0 10px 0; font-size: 18px; font-weight: 700; color: #111111;">Hello ${escapeHtml(
                order.buyerName,
              )},</h2>
              <p style="margin: 0; color: #555555; font-size: 14px; line-height: 1.6;">
                Your order <strong>${escapeHtml(
                  order.orderNumber,
                )}</strong> has been successfully placed on <strong>${formattedDate}</strong> and is currently <strong>awaiting shop confirmation</strong>.
              </p>
              <div style="margin-top: 20px; padding: 16px; background-color: #f9fbfd; border-left: 4px solid #3b82f6; border-radius: 4px; font-size: 13px; color: #1e3a8a; line-height: 1.5;">
                ℹ️ <strong>Payment Method: Cash on Delivery (COD)</strong><br/>
                Payment is only due once your package arrives at your delivery address. You do not need to make any online transactions now.
              </div>
            </td>
          </tr>

          <!-- Order details -->
          <tr>
            <td style="padding: 0 40px 20px 40px;">
              <h3 style="margin: 0 0 12px 0; font-size: 14px; font-weight: 700; color: #888888; text-transform: uppercase; letter-spacing: 1px;">Order Summary</h3>
              <table cellpadding="0" cellspacing="0" width="100%" style="border-collapse: collapse;">
                <thead>
                  <tr style="background-color: #fafafa;">
                    <th style="padding: 10px 12px; text-align: left; font-size: 12px; font-weight: 700; color: #666666; border-bottom: 2px solid #eeeeee;">Product</th>
                    <th style="padding: 10px 12px; text-align: center; font-size: 12px; font-weight: 700; color: #666666; border-bottom: 2px solid #eeeeee;">Qty</th>
                    <th style="padding: 10px 12px; text-align: right; font-size: 12px; font-weight: 700; color: #666666; border-bottom: 2px solid #eeeeee;">Price</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsHtml}
                  <tr>
                    <td colspan="2" style="padding: 16px 12px 6px 12px; text-align: right; font-size: 14px; color: #666666;">Subtotal:</td>
                    <td style="padding: 16px 12px 6px 12px; text-align: right; font-size: 14px; font-weight: bold; color: #111111;">$${Number(
                      order.subtotal,
                    ).toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td colspan="2" style="padding: 6px 12px 16px 12px; text-align: right; font-size: 16px; font-weight: bold; color: #111111;">Total (COD):</td>
                    <td style="padding: 6px 12px 16px 12px; text-align: right; font-size: 18px; font-weight: 800; color: #111111;">$${Number(
                      order.totalAmount,
                    ).toFixed(2)}</td>
                  </tr>
                </tbody>
              </table>
            </td>
          </tr>

          <!-- Shipping Details -->
          <tr>
            <td style="padding: 0 40px 40px 40px;">
              <h3 style="margin: 0 0 12px 0; font-size: 14px; font-weight: 700; color: #888888; text-transform: uppercase; letter-spacing: 1px;">Shipping Address</h3>
              <div style="padding: 20px; background-color: #fafafa; border-radius: 12px; border: 1px solid #eeeeee; font-size: 13.5px; color: #555555; line-height: 1.6;">
                <strong style="color: #111111; font-size: 14px;">${escapeHtml(
                  order.buyerName,
                )}</strong><br/>
                📞 ${escapeHtml(order.buyerPhone)}<br/>
                📍 ${escapeHtml(order.shippingAddress)}, ${escapeHtml(order.shippingCity)}<br/>
                ${
                  order.shippingNote
                    ? `<span style="font-style: italic; color: #888888; display: block; margin-top: 6px;">Note: ${escapeHtml(order.shippingNote)}</span>`
                    : ''
                }
              </div>
            </td>
          </tr>

          <!-- Track order -->
          <tr>
            <td style="padding: 0 40px 40px 40px; text-align: center;">
              ${this.orderButton(order)}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #fafafa; padding: 30px; text-align: center; border-top: 1px solid #eeeeee; font-size: 12px; color: #999999;">
              <p style="margin: 0;">This is an automated order confirmation from MarketUp.</p>
              <p style="margin: 4px 0 0 0;">Need help? Please reply to this email or contact the shop directly.</p>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    await this.sendMail({
      from: this.getFromHeader(),
      to: order.buyerEmail,
      subject: `Order Confirmation #${order.orderNumber}`,
      html: htmlContent,
    });
  }

  // Báo cho người mua khi đơn bị huỷ (do shop, hoặc xác nhận khi người mua tự huỷ)
  async sendOrderCancelledEmail(order: MailCancelledOrder) {
    const byBuyer = order.cancelledBy === 'BUYER';
    const shopName = escapeHtml(order.shop?.name || 'the shop');
    const reason = order.cancelReason
      ? CANCEL_REASON_LABELS[order.cancelReason]
      : null;
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Order cancelled</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #f6f9fc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
        <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #eef2f5;">
          <tr>
            <td style="padding: 40px; text-align: center;">
              <h1 style="margin: 0 0 12px 0; font-size: 22px; font-weight: 800; color: #111111;">Order cancelled</h1>
              <p style="margin: 0 0 20px 0; color: #555555; font-size: 15px; line-height: 1.6;">
                Hi <strong>${escapeHtml(order.buyerName)}</strong>, ${
                  byBuyer
                    ? `you cancelled order <strong>${escapeHtml(order.orderNumber)}</strong> from <strong>${shopName}</strong>.`
                    : `<strong>${shopName}</strong> cancelled your order <strong>${escapeHtml(order.orderNumber)}</strong>.`
                } You won't be charged.
              </p>
              ${
                reason
                  ? `<p style="margin: 0 0 24px 0; padding: 14px 18px; background-color: #fafafa; border: 1px solid #eeeeee; border-radius: 12px; font-size: 14px; color: #555555; text-align: left;">
                <strong style="color: #111111;">Reason:</strong> ${escapeHtml(reason)}${
                  order.cancelNote
                    ? `<br/><span style="color: #777777;">${escapeHtml(order.cancelNote)}</span>`
                    : ''
                }
              </p>`
                  : ''
              }
              ${this.orderButton(order, 'View order')}
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    await this.sendMail({
      from: this.getFromHeader(),
      to: order.buyerEmail,
      subject: `Order cancelled: #${order.orderNumber}`,
      html: htmlContent,
    });
  }

  async sendOrderShippedEmail(order: MailOrder) {
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Your Order is on its Way!</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #f6f9fc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
        <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.05); border: 1px solid #eef2f5;">
          <!-- Header Banner -->
          <tr>
            <td style="background-color: #111111; padding: 40px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 26px; font-weight: 800; letter-spacing: -0.5px;">On Its Way!</h1>
              <p style="margin: 8px 0 0 0; color: #aaaaaa; font-size: 14px; font-weight: 500;">Your package is being shipped!</p>
            </td>
          </tr>

          <!-- Message Block -->
          <tr>
            <td style="padding: 40px 40px 40px 40px; text-align: center;">
              <h2 style="margin: 0 0 15px 0; font-size: 20px; font-weight: 700; color: #111111;">Good news, ${escapeHtml(
                order.buyerName,
              )}!</h2>
              <p style="margin: 0 0 25px 0; color: #555555; font-size: 15px; line-height: 1.6; max-width: 460px; margin-left: auto; margin-right: auto;">
                <strong>${escapeHtml(
                  order.shop?.name || 'The shop',
                )}</strong> has handed your order <strong>${escapeHtml(
                  order.orderNumber,
                )}</strong> to the courier. It's on its way to you!
              </p>
              
              <div style="display: inline-flex; align-items: center; justify-content: center; gap: 8px; background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 14px 24px; font-size: 14px; font-weight: bold; color: #166534; line-height: 1.4; text-align: left;">
                📦 Status: On the way<br/>
                💵 Cash on delivery: $${Number(order.totalAmount).toFixed(2)}
              </div>
              <div style="margin-top: 28px;">
                ${this.orderButton(order)}
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #fafafa; padding: 30px; text-align: center; border-top: 1px solid #eeeeee; font-size: 12px; color: #999999;">
              <p style="margin: 0;">This is an automated shipment update from MarketUp.</p>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    await this.sendMail({
      from: this.getFromHeader(),
      to: order.buyerEmail,
      subject: `Order Shipped: #${order.orderNumber}`,
      html: htmlContent,
    });
  }

  async sendOrderDeliveredEmail(order: MailOrder) {
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Order Delivered</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #f6f9fc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
        <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.05); border: 1px solid #eef2f5;">
          <!-- Header Banner -->
          <tr>
            <td style="background-color: #10b981; padding: 40px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 26px; font-weight: 800; letter-spacing: -0.5px;">Delivered!</h1>
              <p style="margin: 8px 0 0 0; color: #d1fae5; font-size: 14px; font-weight: 500;">Your order was successfully delivered!</p>
            </td>
          </tr>

          <!-- Message Block -->
          <tr>
            <td style="padding: 40px 40px 30px 40px; text-align: center;">
              <h2 style="margin: 0 0 15px 0; font-size: 20px; font-weight: 700; color: #111111;">Delivered successfully!</h2>
              <p style="margin: 0 0 30px 0; color: #555555; font-size: 15px; line-height: 1.6; max-width: 460px; margin-left: auto; margin-right: auto;">
                Hi <strong>${escapeHtml(order.buyerName)}</strong>, your order <strong>${escapeHtml(
                  order.orderNumber,
                )}</strong> from <strong>${escapeHtml(
                  order.shop?.name || 'our store',
                )}</strong> has been delivered. We hope you love your new items!
              </p>

              <!-- Star Rating Call to Action Box -->
              <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 16px; padding: 30px; max-width: 440px; margin: 0 auto; box-sizing: border-box;">
                <h3 style="margin: 0 0 8px 0; font-size: 16px; font-weight: bold; color: #111111;">Share Your Feedback</h3>
                <p style="margin: 0 0 20px 0; font-size: 13px; color: #666666; line-height: 1.5;">
                  Take a minute to rate what you received — your review helps other shoppers decide.
                </p>
                ${this.orderButton(order, '⭐ Rate your items')}
                <p style="margin: 12px 0 0 0; font-size: 11px; color: #888888;">
                  You can review each item for ${REVIEW_WINDOW_DAYS} days after delivery.
                </p>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #fafafa; padding: 30px; text-align: center; border-top: 1px solid #eeeeee; font-size: 12px; color: #999999;">
              <p style="margin: 0;">Thank you for being our valued customer.</p>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    await this.sendMail({
      from: this.getFromHeader(),
      to: order.buyerEmail,
      subject: `Order Delivered! Write a review for #${order.orderNumber}`,
      html: htmlContent,
    });
  }
}
