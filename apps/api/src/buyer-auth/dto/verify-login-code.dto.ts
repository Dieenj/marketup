import { IsEmail, Matches, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';
import { normalizeEmail } from '../../common/email';

export class VerifyLoginCodeDto {
  @Transform(normalizeEmail)
  @IsEmail()
  @MaxLength(254)
  email: string;

  // Cho phép người dùng dán "123 456"
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.replace(/\s/g, '') : value,
  )
  @Matches(/^\d{6}$/, { message: 'Enter the 6-digit code from your email' })
  code: string;
}
