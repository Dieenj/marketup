import {
  ArrayMaxSize,
  ArrayNotEmpty,
  IsArray,
  IsInt,
  IsNotEmpty,
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
export const MAX_ATTRIBUTES = 10;

export class CreateVariantDto {
  // Có id = cập nhật biến thể hiện có (phải thuộc chính sản phẩm đang sửa)
  @IsString()
  @IsOptional()
  id?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  label: string; // Ví dụ: "M / Red"

  @IsObject()
  options: Record<string, string>; // Ví dụ: {"Size": "M", "Color": "Red"}

  @IsNumber({ allowNaN: false, allowInfinity: false, maxDecimalPlaces: 2 })
  @Min(0)
  @Max(MAX_PRICE)
  price: number;

  @IsInt()
  @Min(0)
  @Max(MAX_STOCK)
  stock: number;

  @IsString()
  @IsOptional()
  @MaxLength(64)
  sku?: string;
}

export class CreateAttributeDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  name: string; // Ví dụ: "Size" hoặc "Color"

  @IsArray()
  @ArrayNotEmpty()
  @ArrayMaxSize(50)
  @IsString({ each: true })
  @MaxLength(50, { each: true })
  options: string[]; // Ví dụ: ["S", "M", "L", "XL"]
}
