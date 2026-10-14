import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEmail,
  IsPhoneNumber,
  IsInt,
  Matches,
  Max,
  MaxLength,
  Min,
  ValidateIf,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { normalizeSlug, SLUG_PATTERN } from '../../common/slug';

const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

// "#ABC" / "abc" / "#AABBCC" → "#aabbcc": màu được chèn vào CSS của storefront nên chỉ lưu một định dạng
function normalizeHexColor({ value }: { value: unknown }) {
  if (typeof value !== 'string') return value;
  const hex = value.trim().replace(/^#/, '').toLowerCase();
  if (/^[0-9a-f]{3}$/.test(hex))
    return `#${[...hex].map((c) => c + c).join('')}`;
  return `#${hex}`;
}

// Trường tuỳ chọn gửi chuỗi rỗng = xoá giá trị → bỏ qua kiểm tra định dạng
const isFilled = (_: unknown, value: unknown) =>
  value !== '' && value !== null && value !== undefined;

export class CreateShopDto {
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @Transform(({ value }) => normalizeSlug(value))
  @IsString()
  @Matches(SLUG_PATTERN, {
    message: 'Shop URL may only contain letters, numbers and dashes',
  })
  @MaxLength(50)
  slug: string;

  @IsString()
  @IsOptional()
  @MaxLength(1000)
  description?: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  logoUrl?: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  bannerUrl?: string;

  // Vị trí ảnh banner trong khung (0–100%)
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  bannerFocusX?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  bannerFocusY?: number;

  @Transform(normalizeHexColor)
  @IsOptional()
  @Matches(/^#[0-9a-f]{6}$/, {
    message: 'primaryColor must be a hex colour like #10b981',
  })
  primaryColor?: string;

  @Transform(trim)
  @IsOptional()
  @ValidateIf(isFilled)
  @IsEmail()
  @MaxLength(254)
  contactEmail?: string;

  // Mặc định Việt Nam: chấp nhận cả "0901 234 567" lẫn "+84 90 123 4567"
  @Transform(trim)
  @IsOptional()
  @ValidateIf(isFilled)
  @IsPhoneNumber('VN')
  contactPhone?: string;

  @Transform(trim)
  @IsString()
  @IsOptional()
  @MaxLength(255)
  address?: string;
}
