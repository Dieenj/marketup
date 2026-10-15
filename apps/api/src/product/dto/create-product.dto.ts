import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  MaxLength,
} from 'class-validator';
import { Transform } from 'class-transformer';

const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

// Gửi dạng multipart (kèm ảnh) → mọi trường đều là chuỗi;
// variants là JSON, được kiểm tra chi tiết trong ProductService (parseJsonArray + deriveProductOptions);
// thuộc tính và nhãn biến thể do API suy ra từ options của các biến thể
export class CreateProductDto {
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name: string;

  @IsString()
  @IsOptional()
  @MaxLength(5000)
  description?: string;

  @IsString()
  @IsOptional()
  categoryId?: string;

  // "true"/"false" từ form; @Type(() => Boolean) từng biến "false" thành true
  @IsBoolean()
  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    value === 'true' ? true : value === 'false' ? false : value,
  )
  isVisible?: boolean;

  @IsString()
  @IsOptional()
  variants?: string;
}
