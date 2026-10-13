import { IsString, IsOptional, IsBoolean } from 'class-validator';
import { Transform } from 'class-transformer';

export class UpdateProductDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  categoryId?: string;

  // Gửi dạng multipart nên giá trị là chuỗi "true"/"false"; @Type(() => Boolean) biến "false" thành true
  @IsBoolean()
  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    value === 'true' ? true : value === 'false' ? false : value,
  )
  isVisible?: boolean;

  @IsOptional()
  images?: any;

  @IsString()
  @IsOptional()
  attributes?: string;

  @IsString()
  @IsOptional()
  variants?: string;
}
