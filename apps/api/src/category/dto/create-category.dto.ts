import { IsString, IsNotEmpty, Matches, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';
import { normalizeSlug, SLUG_PATTERN } from '../../common/slug';

export class CreateCategoryDto {
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  name: string;

  @Transform(({ value }) => normalizeSlug(value))
  @IsString()
  @Matches(SLUG_PATTERN, {
    message: 'Slug may only contain letters, numbers and dashes',
  })
  @MaxLength(60)
  slug: string;
}
