import { IsString, IsNotEmpty, IsNumber, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateVariantDto {
  @IsString()
  @IsNotEmpty()
  label: string; // "Size: M / Color: Red"

  options: Record<string, string>; // {"Size": "M", "Color": "Red"}

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
  name: string; // "Size"

  options: string[]; // ["S", "M", "L", "XL"]
}
