import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';
import { CancelReason } from '@prisma/client';

const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

// Người mua huỷ đơn (lý do hợp lệ theo vai trò được kiểm tra trong OrderService)
export class CancelOrderDto {
  @IsEnum(CancelReason)
  reason: CancelReason;

  @Transform(trim)
  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}
