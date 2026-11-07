import { ApiProperty } from '@nestjs/swagger';
import { IsISO8601, IsInt, IsNotEmpty, IsString, Min } from 'class-validator';
import { IsNotInPast } from '../../common/validators/is-not-in-past.validator';

export class CreateShowingDto {
  @ApiProperty({
    example: '0f8fad5b-d9cb-469f-a165-70867728950e',
    description: 'Ідентифікатор фільму',
  })
  @IsString({ message: 'filmId must be a string' })
  @IsNotEmpty({ message: 'filmId must not be empty' })
  filmId: string;

  @ApiProperty({
    example: '3f8a1c2e-9b7d-4a6f-8e1d-2c3b4a5d6e7f',
    description: 'Ідентифікатор залу',
  })
  @IsString({ message: 'hallId must be a string' })
  @IsNotEmpty({ message: 'hallId must not be empty' })
  hallId: string;

  @ApiProperty({
    example: '2026-12-01T18:30:00.000Z',
    description: 'Дата й час початку у форматі ISO 8601; момент не може бути в минулому',
  })
  @IsISO8601(
    { strict: true, strictSeparator: true },
    { message: 'startsAt must be a valid ISO 8601 date-time string' },
  )
  @IsNotInPast()
  startsAt: string;

  @ApiProperty({
    example: 12500,
    description: 'Ціна одного квитка в копійках (ціле додатне число)',
  })
  @IsInt({ message: 'price must be an integer' })
  @Min(1, { message: 'price must be a positive integer' })
  price: number;
}
