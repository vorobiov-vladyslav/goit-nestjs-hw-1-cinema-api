import { ApiProperty } from '@nestjs/swagger';

export class ShowingResponseDto {
  @ApiProperty({ example: '9b2f4c7a-1d3e-4f5a-8b6c-7d8e9f0a1b2c', description: 'UUID сеансу' })
  id: string;

  @ApiProperty({ example: 'Inception', description: 'Назва фільму' })
  filmTitle: string;

  @ApiProperty({ example: 'Червона зала', description: 'Назва залу' })
  hallName: string;

  @ApiProperty({ example: '2026-12-01T18:30:00.000Z', description: 'Дата й час початку (ISO 8601)' })
  startsAt: string;

  @ApiProperty({ example: 12500, description: 'Ціна квитка в копійках' })
  price: number;
}

export class CreatedShowingResponseDto {
  @ApiProperty({ example: '9b2f4c7a-1d3e-4f5a-8b6c-7d8e9f0a1b2c', description: 'UUID сеансу' })
  id: string;

  @ApiProperty({ example: '0f8fad5b-d9cb-469f-a165-70867728950e', description: 'Ідентифікатор фільму' })
  filmId: string;

  @ApiProperty({ example: '3f8a1c2e-9b7d-4a6f-8e1d-2c3b4a5d6e7f', description: 'Ідентифікатор залу' })
  hallId: string;

  @ApiProperty({ example: '2026-12-01T18:30:00.000Z', description: 'Дата й час початку (ISO 8601)' })
  startsAt: string;

  @ApiProperty({ example: 12500, description: 'Ціна квитка в копійках' })
  price: number;
}
