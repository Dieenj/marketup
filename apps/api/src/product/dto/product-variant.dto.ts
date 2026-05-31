import { IsString, IsNotEmpty, IsNumber, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateVariantDto {
  @IsString()
  @IsOptional()
  id?: string;

  @IsString()
  @IsNotEmpty()
  label: string; // Ví dụ: "Size: M / Color: Red"

  options: Record<string, string>; // Ví dụ: {"Size": "M", "Color": "Red"}

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  price?: number;

  @IsNumber()
  @Type(() => Number)
  stock: number;

  @IsString()
  @IsOptional()
  sku?: string;
}

export class CreateAttributeDto {
  @IsString()
  @IsNotEmpty()
  name: string; // Ví dụ: "Size" hoặc "Color"

  options: string[]; // Ví dụ: ["S", "M", "L", "XL"]
}
