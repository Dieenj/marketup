import {
  IsString,
  IsNotEmpty,
  IsEmail,
  IsArray,
  ValidateNested,
  IsInt,
  IsOptional,
  Min,
  Max,
  MaxLength,
  ArrayNotEmpty,
  ArrayMaxSize,
  Matches,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { normalizeEmail } from '../../common/email';

// Giới hạn an toàn; giới hạn thật của số lượng là tồn kho của biến thể
export const MAX_QUANTITY_PER_LINE = 999;
export const MAX_LINES_PER_ORDER = 50;

const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

class OrderItemDto {
  @IsString()
  @IsNotEmpty()
  productId: string;

  @IsInt()
  @Min(1)
  @Max(MAX_QUANTITY_PER_LINE)
  quantity: number;

  // Mọi sản phẩm đều có ít nhất một biến thể → bắt buộc chọn
  @IsString()
  @IsNotEmpty()
  variantId: string;

  // FE gửi kèm để hiển thị; server luôn lấy nhãn từ DB nên bỏ qua giá trị này
  @IsString()
  @IsOptional()
  variantLabel?: string;
}

export class CreateOrderDto {
  @IsString()
  @IsNotEmpty()
  shopId: string;

  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  buyerName: string;

  @Transform(normalizeEmail)
  @IsEmail()
  @MaxLength(254)
  buyerEmail: string;

  @Transform(trim)
  @Matches(/^\+?[0-9][0-9 .-]{7,19}$/, { message: 'Invalid phone number' })
  buyerPhone: string;

  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  shippingAddress: string;

  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  shippingCity: string;

  @Transform(trim)
  @IsString()
  @IsOptional()
  @MaxLength(100)
  shippingDistrict?: string;

  @Transform(trim)
  @IsString()
  @IsOptional()
  @MaxLength(500)
  shippingNote?: string;

  @IsArray()
  @ArrayNotEmpty()
  @ArrayMaxSize(MAX_LINES_PER_ORDER)
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];
}
