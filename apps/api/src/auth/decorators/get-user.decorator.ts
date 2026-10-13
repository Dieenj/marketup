import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { AuthUser } from '../auth-user';

// @GetUser() → cả AuthUser; @GetUser('id') → một trường
export const GetUser = createParamDecorator(
  (data: keyof AuthUser | undefined, ctx: ExecutionContext) => {
    const { user } = ctx.switchToHttp().getRequest<{ user: AuthUser }>();
    return data ? user[data] : user;
  },
);
