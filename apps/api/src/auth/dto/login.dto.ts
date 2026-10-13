import { IsEmail, IsNotEmpty, MinLength, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';
import { normalizeEmail } from '../../common/email';

export class LoginDto {
  @Transform(normalizeEmail)
  @IsEmail()
  @MaxLength(254)
  email: string;

  @IsNotEmpty()
  @MinLength(6)
  password: string;
}
