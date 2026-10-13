import { IsEmail, IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';

const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

// Người mua không có tài khoản → tra cứu đơn bằng mã đơn + email đã dùng khi đặt (cả hai phải khớp)
export class LookupOrderDto {
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  shopSlug: string;

  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toUpperCase() : value,
  )
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  orderNumber: string;

  @Transform(trim)
  @IsEmail()
  @MaxLength(254)
  email: string;
}
