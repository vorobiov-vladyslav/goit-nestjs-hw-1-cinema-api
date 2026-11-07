import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsString, Min } from 'class-validator';

export class CreateHallDto {
  @ApiProperty({ example: 'Червона зала', description: 'Назва залу (унікальна серед усіх залів)' })
  @IsString({ message: 'name must be a string' })
  @IsNotEmpty({ message: 'name must not be empty' })
  name: string;

  @ApiProperty({ example: 3, description: 'Кількість рядів (ціле додатне число)' })
  @IsInt({ message: 'rows must be an integer' })
  @Min(1, { message: 'rows must be a positive integer' })
  rows: number;

  @ApiProperty({ example: 5, description: 'Кількість місць у кожному ряду (ціле додатне число)' })
  @IsInt({ message: 'seatsPerRow must be an integer' })
  @Min(1, { message: 'seatsPerRow must be a positive integer' })
  seatsPerRow: number;
}
