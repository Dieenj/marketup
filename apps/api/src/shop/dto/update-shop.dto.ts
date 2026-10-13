import { OmitType, PartialType } from '@nestjs/mapped-types';
import { CreateShopDto } from './create-shop.dto';

// Slug là địa chỉ storefront: đổi sẽ làm hỏng link đã chia sẻ, link trong email và đơn đã lưu → không cho sửa
export class UpdateShopDto extends PartialType(
  OmitType(CreateShopDto, ['slug'] as const),
) {}
