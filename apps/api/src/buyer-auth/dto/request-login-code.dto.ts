import { IsEmail, IsOptional, IsString, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';
import { normalizeEmail } from '../../common/email';

export class RequestLoginCodeDto {
  @Transform(normalizeEmail)
  @IsEmail()
  @MaxLength(254)
  email: string;

  // Shop người mua đang xem → email ghi tên shop cho dễ nhận ra
  @IsOptional()
  @IsString()
  @MaxLength(100)
  shopSlug?: string;
}
