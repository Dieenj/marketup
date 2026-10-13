import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { OrderStatus } from '@prisma/client';

const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

// Tab trạng thái + con trỏ của trang trước (xem order-list.ts)
class ListOrdersQueryDto {
  @IsOptional()
  @IsEnum(OrderStatus)
  status?: OrderStatus;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  cursor?: string;
}

// Người bán tìm theo mã đơn, tên, email, số điện thoại
export class SellerOrdersQueryDto extends ListOrdersQueryDto {
  @Transform(trim)
  @IsOptional()
  @IsString()
  @MaxLength(100)
  q?: string;
}

// Người mua xem đơn của mình trong một shop
export class BuyerOrdersQueryDto extends ListOrdersQueryDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  shop: string;
}
