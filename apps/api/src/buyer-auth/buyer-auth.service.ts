import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { AccessTokenService } from '../auth/access-token.service';
import { RequestLoginCodeDto } from './dto/request-login-code.dto';
import { VerifyLoginCodeDto } from './dto/verify-login-code.dto';
import {
  generateLoginCode,
  hashLoginCode,
  matchesLoginCode,
} from './login-code';

const MINUTE = 60_000;
const CODE_TTL = 10 * MINUTE;
const RESEND_COOLDOWN = MINUTE;
const MAX_CODES_PER_HOUR = 5;
const MAX_ATTEMPTS_PER_CODE = 5;

const EXPIRED_MESSAGE = 'This code has expired. Request a new one.';

@Injectable()
export class BuyerAuthService {
  private readonly logger = new Logger(BuyerAuthService.name);
  private readonly secret: string;

  constructor(
    private prisma: PrismaService,
    private mail: MailService,
    private tokens: AccessTokenService,
    config: ConfigService,
  ) {
    this.secret = config.getOrThrow<string>('JWT_SECRET');
  }

  // Luôn trả cùng dạng phản hồi dù email đã từng mua hay chưa → không dò được ai là khách của shop
  async requestCode({ email, shopSlug }: RequestLoginCodeDto) {
    const now = Date.now();
    const recent = await this.prisma.buyerLoginCode.findMany({
      where: { email, createdAt: { gte: new Date(now - 60 * MINUTE) } },
      orderBy: { createdAt: 'desc' },
      select: { createdAt: true },
    });

    // Vừa gửi xong → không gửi thêm, mã trước vẫn dùng được
    const waitMs = recent[0]
      ? recent[0].createdAt.getTime() + RESEND_COOLDOWN - now
      : 0;
    if (waitMs > 0) return { resendInSeconds: Math.ceil(waitMs / 1000) };

    if (recent.length >= MAX_CODES_PER_HOUR) {
      throw new HttpException(
        'Too many codes requested for this email. Please try again in an hour.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const code = generateLoginCode();
    await this.prisma.$transaction([
      // Chỉ mã mới nhất có hiệu lực (consumedAt = đã dùng hoặc đã bị thay)
      this.prisma.buyerLoginCode.updateMany({
        where: { email, consumedAt: null },
        data: { consumedAt: new Date(now) },
      }),
      // Dọn mã cũ; bảng chỉ cần giữ đủ 1 giờ để đếm giới hạn gửi
      this.prisma.buyerLoginCode.deleteMany({
        where: { createdAt: { lt: new Date(now - 24 * 60 * MINUTE) } },
      }),
      this.prisma.buyerLoginCode.create({
        data: {
          email,
          codeHash: hashLoginCode(this.secret, email, code),
          expiresAt: new Date(now + CODE_TTL),
        },
      }),
    ]);

    const shop = shopSlug
      ? await this.prisma.shop.findUnique({
          where: { slug: shopSlug },
          select: { name: true },
        })
      : null;
    this.mail
      .sendLoginCodeEmail({ to: email, code, shopName: shop?.name })
      .catch((err) =>
        this.logger.error(`Failed to send login code to ${email}:`, err),
      );

    return { resendInSeconds: RESEND_COOLDOWN / 1000 };
  }

  async verifyCode({ email, code }: VerifyLoginCodeDto) {
    const entry = await this.prisma.buyerLoginCode.findFirst({
      where: { email, consumedAt: null, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: 'desc' },
    });
    if (!entry) throw new BadRequestException(EXPIRED_MESSAGE);

    // Tính lượt thử TRƯỚC khi so mã (nguyên tử) → gửi song song cũng không vượt quá số lần cho phép
    const { count } = await this.prisma.buyerLoginCode.updateMany({
      where: { id: entry.id, attempts: { lt: MAX_ATTEMPTS_PER_CODE } },
      data: { attempts: { increment: 1 } },
    });
    if (count === 0) {
      throw new BadRequestException(
        'Too many incorrect attempts. Request a new code.',
      );
    }

    if (!matchesLoginCode(entry.codeHash, this.secret, email, code)) {
      const left = MAX_ATTEMPTS_PER_CODE - entry.attempts - 1;
      throw new BadRequestException(
        left > 0
          ? `Incorrect code. ${left} ${left === 1 ? 'attempt' : 'attempts'} left.`
          : 'Too many incorrect attempts. Request a new code.',
      );
    }

    // Mỗi mã chỉ dùng một lần, kể cả khi hai request đúng mã đến cùng lúc
    const consumed = await this.prisma.buyerLoginCode.updateMany({
      where: { id: entry.id, consumedAt: null },
      data: { consumedAt: new Date() },
    });
    if (consumed.count === 0) throw new BadRequestException(EXPIRED_MESSAGE);

    return { email, token: this.tokens.signBuyer(email) };
  }
}
