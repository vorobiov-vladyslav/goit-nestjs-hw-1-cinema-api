import { ApiProperty } from '@nestjs/swagger';
import { SeatDto } from '../../common/dto/seat.dto';

export class HallResponseDto {
  @ApiProperty({ example: '3f8a1c2e-9b7d-4a6f-8e1d-2c3b4a5d6e7f', description: 'UUID залу' })
  id: string;

  @ApiProperty({ example: 'Червона зала', description: 'Назва залу' })
  name: string;

  @ApiProperty({ example: 3, description: 'Кількість рядів' })
  rows: number;

  @ApiProperty({ example: 5, description: 'Кількість місць у ряду' })
  seatsPerRow: number;
}

export class HallWithSeatsResponseDto extends HallResponseDto {
  @ApiProperty({
    type: [SeatDto],
    description: 'Перелік усіх місць залу: rows × seatsPerRow елементів',
  })
  seats: SeatDto[];
}
