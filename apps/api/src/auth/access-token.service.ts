import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { Role } from '@prisma/client';

// Mọi token ký bằng cùng JWT_SECRET; `typ` cho biết token dùng vào việc gì,
// nên token của người mua không mở được dashboard và ngược lại.
export interface SellerTokenPayload {
  typ: 'seller';
  sub: string; // user id
  email: string;
  role: Role;
}

// Phiên người mua: chỉ cấp sau khi nhập đúng mã gửi tới email → chứng minh sở hữu email
export interface BuyerTokenPayload {
  typ: 'buyer';
  sub: string; // email (chữ thường)
}

// Link xem một đơn (trong email và trả về khi đặt hàng). Không phải phiên đăng nhập:
// ai cũng có thể gõ email người khác lúc đặt hàng, nên token này chỉ mở đúng đơn đó.
export interface OrderTokenPayload {
  typ: 'order';
  sub: string; // order id
}

export type AccessTokenPayload =
  | SellerTokenPayload
  | BuyerTokenPayload
  | OrderTokenPayload;

const BUYER_SESSION_TTL = '30d';
const ORDER_LINK_TTL = '180d';

@Injectable()
export class AccessTokenService {
  constructor(private jwt: JwtService) {}

  // Hạn dùng theo JWT_EXPIRES_IN (cấu hình trong AuthModule)
  signSeller(user: { id: string; email: string; role: Role }) {
    const payload: SellerTokenPayload = {
      typ: 'seller',
      sub: user.id,
      email: user.email,
      role: user.role,
    };
    return this.jwt.sign(payload);
  }

  signBuyer(email: string) {
    const payload: BuyerTokenPayload = { typ: 'buyer', sub: email };
    return this.jwt.sign(payload, { expiresIn: BUYER_SESSION_TTL });
  }

  signOrder(orderId: string) {
    const payload: OrderTokenPayload = { typ: 'order', sub: orderId };
    return this.jwt.sign(payload, { expiresIn: ORDER_LINK_TTL });
  }

  // null khi sai chữ ký, hết hạn hoặc không đúng định dạng
  verify(token: string): AccessTokenPayload | null {
    try {
      return this.jwt.verify<AccessTokenPayload>(token);
    } catch {
      return null;
    }
  }
}
