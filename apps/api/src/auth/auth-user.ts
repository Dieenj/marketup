import type { Role } from '@prisma/client';

// Nội dung token JWT do AuthService ký
export interface JwtPayload {
  sub: string;
  email: string;
  role: Role;
}

// req.user sau khi JwtStrategy xác thực token
export interface AuthUser {
  id: string;
  email: string;
  role: Role;
}
