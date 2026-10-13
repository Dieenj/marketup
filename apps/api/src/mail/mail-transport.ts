import * as nodemailer from 'nodemailer';

export interface OutgoingMail {
  from: string; // "MarketUp <hello@example.com>" hoặc chỉ địa chỉ email
  to: string;
  subject: string;
  html: string;
}

// Cách gửi email thật. Render (gói miễn phí) chặn mọi cổng SMTP ra ngoài → production gửi qua API HTTPS
// của Brevo; SMTP vẫn dùng được ở máy local hoặc khi tự host bằng Docker.
export interface MailTransport {
  readonly name: string;
  send(mail: OutgoingMail): Promise<string | undefined>; // id của email (nếu nhà cung cấp trả về)
  verify(): Promise<void>; // kiểm tra cấu hình lúc khởi động, lỗi thì throw
}

// "MarketUp <hello@example.com>" → { name: 'MarketUp', email: 'hello@example.com' }
export function parseAddress(address: string): {
  name?: string;
  email: string;
} {
  const match = /^\s*"?([^"<]*?)"?\s*<([^>]+)>\s*$/.exec(address);
  if (!match) return { email: address.trim() };
  const name = match[1].trim();
  return name ? { name, email: match[2].trim() } : { email: match[2].trim() };
}

const BREVO_API = 'https://api.brevo.com/v3';
const REQUEST_TIMEOUT_MS = 15_000;

// Body của POST /v3/smtp/email (https://developers.brevo.com/reference/sendtransacemail)
export function brevoPayload(mail: OutgoingMail) {
  return {
    sender: parseAddress(mail.from),
    to: [{ email: mail.to }],
    subject: mail.subject,
    htmlContent: mail.html,
  };
}

export class BrevoTransport implements MailTransport {
  readonly name = 'Brevo API';

  constructor(private readonly apiKey: string) {}

  private async request(path: string, init?: RequestInit) {
    const res = await fetch(`${BREVO_API}${path}`, {
      ...init,
      headers: {
        'api-key': this.apiKey,
        accept: 'application/json',
        'content-type': 'application/json',
      },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
    if (!res.ok) {
      // Nội dung lỗi của Brevo (vd. sender chưa xác minh, key sai) — không chứa key
      const detail = (await res.text()).slice(0, 300);
      throw new Error(`Brevo responded ${res.status}: ${detail}`);
    }
    return res.json() as Promise<Record<string, unknown>>;
  }

  async send(mail: OutgoingMail) {
    const data = await this.request('/smtp/email', {
      method: 'POST',
      body: JSON.stringify(brevoPayload(mail)),
    });
    return typeof data.messageId === 'string' ? data.messageId : undefined;
  }

  async verify() {
    await this.request('/account');
  }
}

export class SmtpTransport implements MailTransport {
  readonly name = 'SMTP';
  private readonly transporter: nodemailer.Transporter;

  constructor(options: {
    host: string;
    port: number;
    user: string;
    pass: string;
  }) {
    this.transporter = nodemailer.createTransport({
      host: options.host,
      port: options.port,
      secure: options.port === 465, // Kết nối bảo mật SSL
      auth: { user: options.user, pass: options.pass },
    });
  }

  async send(mail: OutgoingMail) {
    const info = (await this.transporter.sendMail(mail)) as {
      messageId?: string;
    };
    return info.messageId;
  }

  async verify() {
    await this.transporter.verify();
  }
}
