import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEmail,
  IsPhoneNumber,
  IsHexColor,
} from 'class-validator';

export class CreateShopDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  slug: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  logoUrl?: string;

  @IsString()
  @IsOptional()
  bannerUrl?: string;

  @IsHexColor()
  @IsOptional()
  primaryColor?: string;

  @IsEmail()
  @IsOptional()
  contactEmail?: string;

  @IsPhoneNumber()
  @IsOptional()
  contactPhone?: string;

  @IsString()
  @IsOptional()
  address?: string;
}
