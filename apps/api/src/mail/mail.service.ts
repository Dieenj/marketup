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
import {
  button,
  detail,
  emailLayout,
  itemsTable,
  money,
  paragraph,
  strong,
} from './email-layout';

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

  private shopName(order: { shop?: { name: string } | null }) {
    return order.shop?.name || 'MarketUp';
  }

  private orderFooter(order: OrderLink) {
    return `You're receiving this email because of order ${escapeHtml(order.orderNumber)} at ${escapeHtml(this.shopName(order))}. The shop's contact details are on your order page.`;
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

    const brand = shopName || 'MarketUp';
    await this.sendMail({
      from: this.getFromHeader(),
      to,
      subject: `${code} is your ${brand} sign-in code`,
      html: emailLayout({
        title: 'Your sign-in code',
        preview: `${code} is your sign-in code. It expires in 10 minutes.`,
        brand,
        html: [
          paragraph(
            `Enter this code on ${escapeHtml(brand)} to see your orders. It expires in 10 minutes.`,
          ),
          `<p style="margin: 8px 0 24px 0; font-size: 30px; font-weight: 600; letter-spacing: 6px; font-family: 'SFMono-Regular', Consolas, monospace;">${escapeHtml(code)}</p>`,
        ].join(''),
        footer:
          "If you didn't ask for this code, you can ignore this email. Nobody can sign in without it.",
      }),
    });
  }

  async sendOrderPlacedEmail(order: MailOrder) {
    const shop = this.shopName(order);
    const placedOn = new Date(order.createdAt).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'Asia/Ho_Chi_Minh',
    });

    await this.sendMail({
      from: this.getFromHeader(),
      to: order.buyerEmail,
      subject: `We've received your order ${order.orderNumber}`,
      html: emailLayout({
        title: 'Thanks for your order',
        preview: `${shop} will confirm order ${order.orderNumber} soon.`,
        brand: shop,
        html: [
          paragraph(`Hi ${escapeHtml(order.buyerName)},`),
          paragraph(
            `We've received your order ${strong(order.orderNumber)}, placed on ${escapeHtml(placedOn)}. ${escapeHtml(shop)} will confirm it soon, and we'll email you again when it ships.`,
          ),
          paragraph(
            `You'll pay ${strong(money(order.totalAmount))} in cash when it's delivered.`,
          ),
          itemsTable(order.items, [
            { label: 'Subtotal', value: order.subtotal },
            { label: 'Total', value: order.totalAmount, bold: true },
          ]),
          detail('Delivery address', [
            order.buyerName,
            order.buyerPhone,
            `${order.shippingAddress}, ${order.shippingCity}`,
            order.shippingNote && `Note: ${order.shippingNote}`,
          ]),
          button(this.getOrderUrl(order), 'View your order'),
        ].join(''),
        footer: this.orderFooter(order),
      }),
    });
  }

  // Báo cho người mua khi đơn bị huỷ (do shop, hoặc xác nhận khi người mua tự huỷ)
  async sendOrderCancelledEmail(order: MailCancelledOrder) {
    const shop = this.shopName(order);
    const reason = order.cancelReason
      ? CANCEL_REASON_LABELS[order.cancelReason]
      : null;

    await this.sendMail({
      from: this.getFromHeader(),
      to: order.buyerEmail,
      subject: `Order ${order.orderNumber} has been cancelled`,
      html: emailLayout({
        title: 'Your order has been cancelled',
        preview: `Order ${order.orderNumber} from ${shop} has been cancelled.`,
        brand: shop,
        html: [
          paragraph(`Hi ${escapeHtml(order.buyerName)},`),
          paragraph(
            order.cancelledBy === 'BUYER'
              ? `You cancelled order ${strong(order.orderNumber)} from ${escapeHtml(shop)}. You won't be charged.`
              : `${escapeHtml(shop)} cancelled your order ${strong(order.orderNumber)}. You won't be charged.`,
          ),
          reason ? detail('Reason', [reason, order.cancelNote]) : '',
          button(this.getOrderUrl(order), 'View order'),
        ].join(''),
        footer: this.orderFooter(order),
      }),
    });
  }

  async sendOrderShippedEmail(order: MailOrder) {
    const shop = this.shopName(order);

    await this.sendMail({
      from: this.getFromHeader(),
      to: order.buyerEmail,
      subject: `Your order ${order.orderNumber} is on its way`,
      html: emailLayout({
        title: 'Your order is on its way',
        preview: `${shop} has shipped order ${order.orderNumber}.`,
        brand: shop,
        html: [
          paragraph(`Hi ${escapeHtml(order.buyerName)},`),
          paragraph(
            `${escapeHtml(shop)} has handed order ${strong(order.orderNumber)} to the courier. Please have ${strong(money(order.totalAmount))} ready in cash when it arrives.`,
          ),
          button(this.getOrderUrl(order), 'Track your order'),
        ].join(''),
        footer: this.orderFooter(order),
      }),
    });
  }

  async sendOrderDeliveredEmail(order: MailOrder) {
    const shop = this.shopName(order);

    await this.sendMail({
      from: this.getFromHeader(),
      to: order.buyerEmail,
      subject: `Your order ${order.orderNumber} has been delivered`,
      html: emailLayout({
        title: 'Your order has been delivered',
        preview: `Order ${order.orderNumber} from ${shop} has arrived.`,
        brand: shop,
        html: [
          paragraph(`Hi ${escapeHtml(order.buyerName)},`),
          paragraph(
            `Order ${strong(order.orderNumber)} from ${escapeHtml(shop)} has been delivered.`,
          ),
          paragraph(
            `If you have a minute, rate what you bought. It helps other shoppers, and you can leave a review for the next ${REVIEW_WINDOW_DAYS} days.`,
          ),
          button(this.getOrderUrl(order), 'Rate your items'),
        ].join(''),
        footer: this.orderFooter(order),
      }),
    });
  }
}
