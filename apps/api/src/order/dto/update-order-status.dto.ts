import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';
import { CancelReason, OrderStatus } from '@prisma/client';

const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

export class UpdateOrderStatusDto {
  @IsEnum(OrderStatus)
  status: OrderStatus;

  // Bắt buộc khi huỷ (status = CANCELLED)
  @IsOptional()
  @IsEnum(CancelReason)
  cancelReason?: CancelReason;

  @Transform(trim)
  @IsOptional()
  @IsString()
  @MaxLength(500)
  cancelNote?: string;
}
