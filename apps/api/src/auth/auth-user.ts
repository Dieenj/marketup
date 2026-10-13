import type { Role } from '@prisma/client';

// req.user sau khi JwtStrategy xác thực token của seller
export interface AuthUser {
  id: string;
  email: string;
  role: Role;
}
