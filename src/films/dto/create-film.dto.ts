import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsString, Min } from 'class-validator';

export class CreateFilmDto {
  @ApiProperty({ example: 'Inception', description: 'Назва фільму' })
  @IsString({ message: 'title must be a string' })
  @IsNotEmpty({ message: 'title must not be empty' })
  title: string;

  @ApiProperty({ example: 148, description: 'Тривалість фільму в хвилинах (ціле додатне число)' })
  @IsInt({ message: 'durationMinutes must be an integer' })
  @Min(1, { message: 'durationMinutes must be a positive integer' })
  durationMinutes: number;

  @ApiProperty({ example: 2010, description: 'Рік випуску фільму' })
  @IsInt({ message: 'releaseYear must be an integer' })
  @Min(1888, { message: 'releaseYear must be a valid year (1888 or later)' })
  releaseYear: number;
}
