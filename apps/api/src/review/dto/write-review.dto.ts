import {
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { Transform } from 'class-transformer';

const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

// Người mua viết / sửa đánh giá cho một sản phẩm trong đơn đã giao.
// Tên, sản phẩm, shop lấy từ đơn hàng — không nhận từ client.
export class WriteReviewDto {
  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;

  @Transform(trim)
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  comment?: string;
}
