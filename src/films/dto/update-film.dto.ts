import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsString, Min, ValidateIf } from 'class-validator';

const isProvided = (_object: unknown, value: unknown): boolean => value !== undefined;

export class UpdateFilmDto {
  @ApiPropertyOptional({ example: 'Inception', description: 'Нова назва фільму' })
  @ValidateIf(isProvided)
  @IsString({ message: 'title must be a string' })
  @IsNotEmpty({ message: 'title must not be empty' })
  title?: string;

  @ApiPropertyOptional({
    example: 150,
    description: 'Нова тривалість фільму в хвилинах (ціле додатне число)',
  })
  @ValidateIf(isProvided)
  @IsInt({ message: 'durationMinutes must be an integer' })
  @Min(1, { message: 'durationMinutes must be a positive integer' })
  durationMinutes?: number;

  @ApiPropertyOptional({ example: 2010, description: 'Новий рік випуску фільму' })
  @ValidateIf(isProvided)
  @IsInt({ message: 'releaseYear must be an integer' })
  @Min(1888, { message: 'releaseYear must be a valid year (1888 or later)' })
  releaseYear?: number;
}
