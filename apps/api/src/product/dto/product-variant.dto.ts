import {
  IsInt,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

// Giới hạn khớp với cột DB: price Decimal(12,2)
const MAX_PRICE = 9_999_999_999.99;
const MAX_STOCK = 1_000_000;
export const MAX_VARIANTS = 100;

// Thuộc tính (Size, Color…) và nhãn biến thể do API suy ra từ `options` (xem product-options.ts)
export class CreateVariantDto {
  // Có id = cập nhật biến thể hiện có (phải thuộc chính sản phẩm đang sửa)
  @IsString()
  @IsOptional()
  id?: string;

  @IsObject()
  options: Record<string, string>; // Ví dụ: {"Size": "M", "Color": "Red"}; {} = sản phẩm không có biến thể

  @IsNumber({ allowNaN: false, allowInfinity: false, maxDecimalPlaces: 2 })
  @Min(0)
  @Max(MAX_PRICE)
  price: number;

  // Giá gốc (gạch ngang trên storefront); null/không gửi = không có. Phải cao hơn price (product-payload.ts)
  @IsNumber({ allowNaN: false, allowInfinity: false, maxDecimalPlaces: 2 })
  @Min(0)
  @Max(MAX_PRICE)
  @IsOptional()
  comparePrice?: number | null;

  @IsInt()
  @Min(0)
  @Max(MAX_STOCK)
  stock: number;

  @IsString()
  @IsOptional()
  @MaxLength(64)
  sku?: string;
}
