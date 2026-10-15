import { BadRequestException } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { CreateVariantDto } from './dto/product-variant.dto';

// variants đến dưới dạng chuỗi JSON trong multipart → ValidationPipe không kiểm tra được bên trong.
// Parse + validate từng phần tử bằng class-validator; undefined = client không gửi trường này.
export function parseJsonArray<T extends object>(
  raw: string | undefined,
  cls: new () => T,
  field: string,
  maxItems: number,
): T[] | undefined {
  if (raw === undefined) return undefined;
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new BadRequestException(`Invalid ${field} format`);
  }
  if (!Array.isArray(parsed)) {
    throw new BadRequestException(`${field} must be an array`);
  }
  if (parsed.length > maxItems) {
    throw new BadRequestException(
      `${field} must contain at most ${maxItems} items`,
    );
  }
  return parsed.map((item: unknown, index) => {
    if (typeof item !== 'object' || item === null) {
      throw new BadRequestException(`${field}[${index}] is invalid`);
    }
    const instance = plainToInstance(cls, item);
    const errors = validateSync(instance, {
      whitelist: true,
      forbidNonWhitelisted: true,
    });
    if (errors.length > 0) {
      // Ưu tiên báo sai kiểu dữ liệu ("must be a number") trước lỗi giới hạn
      const constraints = errors[0].constraints ?? {};
      const detail =
        constraints.isNumber ??
        constraints.isInt ??
        constraints.isString ??
        constraints.isNotEmpty ??
        Object.values(constraints)[0] ??
        'is invalid';
      throw new BadRequestException(`${field}[${index}]: ${detail}`);
    }
    // options của biến thể: {"Size": "M"} — chỉ chấp nhận giá trị chuỗi
    if (
      instance instanceof CreateVariantDto &&
      !Object.values(instance.options).every((o) => typeof o === 'string')
    ) {
      throw new BadRequestException(
        `${field}[${index}]: options must be strings`,
      );
    }
    return instance;
  });
}
