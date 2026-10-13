import {
  CanActivate,
  createParamDecorator,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import { AccessTokenService } from '../access-token.service';

// Người mua vào bằng phiên đăng nhập (mọi đơn của email đó) hoặc link của một đơn
export type BuyerAccess =
  | { kind: 'buyer'; email: string }
  | { kind: 'order'; orderId: string };

type BuyerRequest = Request & { buyerAccess?: BuyerAccess };

// @Injectable ở lớp cha để Nest đọc được tham số constructor (lớp con không khai báo constructor)
@Injectable()
abstract class BuyerAccessGuardBase implements CanActivate {
  protected abstract readonly acceptsOrderLink: boolean;

  constructor(private tokens: AccessTokenService) {}

  canActivate(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest<BuyerRequest>();
    const [scheme, token] = req.headers.authorization?.split(' ') ?? [];
    const payload =
      scheme === 'Bearer' && token ? this.tokens.verify(token) : null;

    if (payload?.typ === 'buyer') {
      req.buyerAccess = { kind: 'buyer', email: payload.sub };
    } else if (payload?.typ === 'order' && this.acceptsOrderLink) {
      req.buyerAccess = { kind: 'order', orderId: payload.sub };
    } else {
      throw new UnauthorizedException('Please sign in to see your orders');
    }
    return true;
  }
}

// Danh sách đơn của người mua → bắt buộc đăng nhập bằng mã email
@Injectable()
export class BuyerSessionGuard extends BuyerAccessGuardBase {
  protected readonly acceptsOrderLink = false;
}

// Một đơn cụ thể → phiên người mua hoặc link của chính đơn đó
@Injectable()
export class OrderAccessGuard extends BuyerAccessGuardBase {
  protected readonly acceptsOrderLink = true;
}

// Sau OrderAccessGuard: phiên người mua hoặc link đơn
export const CurrentBuyer = createParamDecorator(
  (_: unknown, ctx: ExecutionContext) =>
    ctx.switchToHttp().getRequest<BuyerRequest>().buyerAccess!,
);

// Sau BuyerSessionGuard: email đã xác minh của người mua
export const BuyerEmail = createParamDecorator(
  (_: unknown, ctx: ExecutionContext) => {
    const access = ctx.switchToHttp().getRequest<BuyerRequest>().buyerAccess;
    if (access?.kind !== 'buyer') throw new UnauthorizedException();
    return access.email;
  },
);
