import { Controller, Get, Param } from '@nestjs/common';
import { ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { BookingsService } from './bookings.service';
import { SeatMapItemResponseDto } from './dto/booking-response.dto';
import { ShowingSeatView } from './entities/booking.entity';

@ApiTags('showings')
@Controller('showings')
export class ShowingsSeatMapController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Get(':id/seats')
  @ApiOperation({ summary: 'Схема місць залу з ознакою зайнятості на цьому сеансі' })
  @ApiOkResponse({ type: SeatMapItemResponseDto, isArray: true })
  @ApiNotFoundResponse({ description: 'Сеансу з таким id немає' })
  getSeatMap(@Param('id') showingId: string): ShowingSeatView[] {
    return this.bookingsService.getSeatMap(showingId);
  }
}
