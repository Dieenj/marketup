import {
  IsEmail,
  IsNotEmpty,
  MinLength,
  IsString,
  MaxLength,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { normalizeEmail } from '../../common/email';

export class RegisterDto {
  @Transform(normalizeEmail)
  @IsEmail()
  @MaxLength(254)
  email: string;

  @IsNotEmpty()
  @MinLength(6)
  @MaxLength(72) // bcrypt chỉ dùng 72 byte đầu
  password: string;

  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;
}
