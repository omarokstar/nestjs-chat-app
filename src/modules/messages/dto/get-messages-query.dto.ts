import { Type } from 'class-transformer';
import { IsInt, IsNumberString, IsOptional, Max, Min } from 'class-validator';

// Cursor pagination: pass the oldest message id you have to load older ones.
export class GetMessagesQueryDto {
  @IsOptional()
  @IsNumberString()
  before?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit: number = 30;
}