import { ApiProperty } from '@nestjs/swagger';

export class FilmResponseDto {
  @ApiProperty({ example: '0f8fad5b-d9cb-469f-a165-70867728950e', description: 'UUID фільму' })
  id: string;

  @ApiProperty({ example: 'Inception', description: 'Назва фільму' })
  title: string;

  @ApiProperty({ example: 148, description: 'Тривалість у хвилинах' })
  durationMinutes: number;

  @ApiProperty({ example: 2010, description: 'Рік випуску' })
  releaseYear: number;
}
