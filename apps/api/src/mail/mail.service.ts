import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter;
  private readonly logger = new Logger(MailService.name);
  private readonly isMailConfigured: boolean;

  constructor(private configService: ConfigService) {
    const host = this.configService.get<string>('SMTP_HOST');
    const port = this.configService.get<number>('SMTP_PORT');
    const user = this.configService.get<string>('SMTP_USER');
    const pass = this.configService.get<string>('SMTP_PASS');

    if (host && port && user && pass) {
      this.transporter = nodemailer.createTransport({
        host,
        port: Number(port),
        secure: Number(port) === 465, // Kết nối bảo mật SSL
        auth: { user, pass },
      });
      this.isMailConfigured = true;
      this.logger.log('SMTP Mail Transporter successfully configured.');
    } else {
      this.isMailConfigured = false;
      this.logger.warn(
        'SMTP environment variables are missing. Mail Service is running in Mock/Log mode.',
      );
    }
  }

  private getFromHeader(): string {
    return (
      this.configService.get<string>('SMTP_FROM') ||
      'MarketUp <noreply@marketup.local>'
    );
  }

  private getBaseUrl(): string {
    return (
      this.configService.get<string>('FRONTEND_URL') ||
      'http://localhost:3000'
    );
  }

  private async sendMail(options: nodemailer.SendMailOptions) {
    if (this.isMailConfigured) {
      try {
        const info = await this.transporter.sendMail(options);
        this.logger.log(`Email sent successfully: ${info.messageId}`);
        return info;
      } catch (error) {
        this.logger.error('Failed to dispatch email via SMTP:', error);
      }
    } else {
      this.logger.log(`[MOCK EMAIL DISPATCH]
To: ${options.to}
Subject: ${options.subject}
Body: (HTML length: ${String(options.html).length} characters)
      `);
    }
  }

  async sendOrderPlacedEmail(order: any) {
    const formattedDate = new Date(order.createdAt).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const itemsHtml = order.items
      .map(
        (item: any) => `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #eeeeee;">
          <div style="font-weight: bold; font-size: 14px; color: #111111;">${item.productName}</div>
          ${
            item.variantLabel
              ? `<div style="font-size: 12px; color: #666666; margin-top: 2px;">Variant: ${item.variantLabel}</div>`
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
              <p style="margin: 8px 0 0 0; color: #aaaaaa; font-size: 14px; font-weight: 500;">Thank you for shopping with ${
                order.shop?.name || 'our store'
              }!</p>
            </td>
          </tr>

          <!-- Message Block -->
          <tr>
            <td style="padding: 40px 40px 20px 40px;">
              <h2 style="margin: 0 0 10px 0; font-size: 18px; font-weight: 700; color: #111111;">Hello ${
                order.buyerName
              },</h2>
              <p style="margin: 0; color: #555555; font-size: 14px; line-height: 1.6;">
                Your order <strong>${
                  order.orderNumber
                }</strong> has been successfully placed on <strong>${formattedDate}</strong> and is currently <strong>awaiting shop confirmation</strong>.
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
                <strong style="color: #111111; font-size: 14px;">${
                  order.buyerName
                }</strong><br/>
                📞 ${order.buyerPhone}<br/>
                📍 ${order.shippingAddress}, ${order.shippingCity}<br/>
                ${
                  order.shippingNote
                    ? `<span style="font-style: italic; color: #888888; display: block; margin-top: 6px;">Note: ${order.shippingNote}</span>`
                    : ''
                }
              </div>
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

  async sendOrderShippedEmail(order: any) {
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
              <h2 style="margin: 0 0 15px 0; font-size: 20px; font-weight: 700; color: #111111;">Good news, ${
                order.buyerName
              }!</h2>
              <p style="margin: 0 0 25px 0; color: #555555; font-size: 15px; line-height: 1.6; max-width: 460px; margin-left: auto; margin-right: auto;">
                Chủ shop <strong>${
                  order.shop?.name || 'our store'
                }</strong> đã bàn giao đơn hàng <strong>${
                  order.orderNumber
                }</strong> của bạn cho đơn vị vận chuyển. Gói hàng đang trên đường di chuyển đến bạn!
              </p>
              
              <div style="display: inline-flex; align-items: center; justify-content: center; gap: 8px; background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 14px 24px; font-size: 14px; font-weight: bold; color: #166534; line-height: 1.4; text-align: left;">
                📦 Trạng thái: Đang vận chuyển (Shipping)<br/>
                💵 Số tiền thanh toán COD: $${Number(order.totalAmount).toFixed(
                  2,
                )}
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

  async sendOrderDeliveredEmail(order: any) {
    const baseUrl = this.getBaseUrl();
    const shopSlug = order.shop?.slug || '';
    
    // Tạo liên kết đánh giá cho các sản phẩm trong đơn hàng
    const firstItem = order.items?.[0];
    const reviewUrl = firstItem
      ? `${baseUrl}/shop/${shopSlug}/products/${firstItem.productId}`
      : `${baseUrl}/shop/${shopSlug}`;

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
                Hi <strong>${
                  order.buyerName
                }</strong>, đơn hàng <strong>${
                  order.orderNumber
                }</strong> từ shop <strong>${
                  order.shop?.name || 'our store'
                }</strong> đã được giao thành công đến bạn! Chúng tôi hy vọng bạn hài lòng với các sản phẩm vừa nhận được.
              </p>

              <!-- Star Rating Call to Action Box -->
              <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 16px; padding: 30px; max-width: 440px; margin: 0 auto; box-sizing: border-box;">
                <h3 style="margin: 0 0 8px 0; font-size: 16px; font-weight: bold; color: #111111;">Share Your Feedback</h3>
                <p style="margin: 0 0 20px 0; font-size: 13px; color: #666666; line-height: 1.5;">
                  Hãy dành ra 1 phút để đánh giá chất lượng sản phẩm & dịch vụ của shop nhé. Ý kiến của bạn sẽ rất hữu ích cho những khách hàng sau!
                </p>
                <a href="${reviewUrl}" style="display: inline-block; background-color: #111111; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: bold; padding: 12px 28px; border-radius: 12px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); transition: background-color 0.2s;">
                  ⭐ Write a Product Review
                </a>
                <p style="margin: 12px 0 0 0; font-size: 11px; color: #888888;">
                  Note: Write the review using email <strong>${
                    order.buyerEmail
                  }</strong> to receive your <strong>Verified Purchase</strong> badge!
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
