import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { BookingsService } from './bookings.service';
import { BookingResponseDto } from './dto/booking-response.dto';
import { CreateBookingDto } from './dto/create-booking.dto';
import { Booking } from './entities/booking.entity';

@ApiTags('bookings')
@Controller()
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Get('bookings')
  @ApiOperation({ summary: 'Масив усіх бронювань сервісу' })
  @ApiOkResponse({ type: BookingResponseDto, isArray: true })
  findAll(): Booking[] {
    return this.bookingsService.findAll();
  }

  @Post('showings/:id/bookings')
  @ApiOperation({ summary: 'Забронювати місця на сеанс' })
  @ApiCreatedResponse({ type: BookingResponseDto, description: 'Бронювання створено' })
  @ApiBadRequestResponse({
    description:
      'Порожній масив seats, некоректний елемент, повтор місця в запиті або місце поза межами залу',
  })
  @ApiNotFoundResponse({ description: 'Сеансу з таким id немає' })
  @ApiConflictResponse({
    description: 'Хоча б одне місце вже заброньоване; жодне місце зі списку не бронюється',
  })
  create(@Param('id') showingId: string, @Body() dto: CreateBookingDto): Booking {
    return this.bookingsService.createForShowing(showingId, dto);
  }

  @Get('showings/:id/bookings')
  @ApiOperation({ summary: 'Бронювання конкретного сеансу' })
  @ApiOkResponse({ type: BookingResponseDto, isArray: true })
  @ApiNotFoundResponse({ description: 'Сеансу з таким id немає' })
  findByShowing(@Param('id') showingId: string): Booking[] {
    return this.bookingsService.findByShowing(showingId);
  }

  @Delete('bookings/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Скасувати бронювання (місця знову стають вільними)' })
  @ApiNoContentResponse({ description: 'Бронювання скасовано' })
  @ApiNotFoundResponse({ description: 'Бронювання з таким id немає' })
  remove(@Param('id') id: string): void {
    this.bookingsService.remove(id);
  }
}
