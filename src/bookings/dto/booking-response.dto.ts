import { ApiProperty } from '@nestjs/swagger';
import { SeatDto } from '../../common/dto/seat.dto';

export class BookingResponseDto {
  @ApiProperty({ example: '6d1f2e3a-4b5c-6d7e-8f90-1a2b3c4d5e6f', description: 'UUID бронювання' })
  id: string;

  @ApiProperty({ example: '9b2f4c7a-1d3e-4f5a-8b6c-7d8e9f0a1b2c', description: 'Ідентифікатор сеансу' })
  showingId: string;

  @ApiProperty({ type: [SeatDto], description: 'Заброньовані місця' })
  seats: SeatDto[];

  @ApiProperty({
    example: 25000,
    description: 'Підсумкова ціна в копійках: ціна сеансу × кількість місць',
  })
  totalPrice: number;
}

export class SeatMapItemResponseDto {
  @ApiProperty({ example: 1, description: 'Номер ряду' })
  row: number;

  @ApiProperty({ example: 2, description: 'Номер місця' })
  seat: number;

  @ApiProperty({ example: true, description: 'Чи зайняте місце на цьому сеансі' })
  isBooked: boolean;
}
