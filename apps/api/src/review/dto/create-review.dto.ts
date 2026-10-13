import {
  IsEmail,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { Transform } from 'class-transformer';

const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

export class CreateReviewDto {
  @IsString()
  @IsNotEmpty()
  shopId: string;

  // null/không gửi = đánh giá chung cho shop
  @IsOptional()
  @IsString()
  productId?: string | null;

  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;

  @Transform(trim)
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  comment?: string;

  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  buyerName: string;

  @Transform(trim)
  @IsEmail()
  @MaxLength(254)
  buyerEmail: string;
}
