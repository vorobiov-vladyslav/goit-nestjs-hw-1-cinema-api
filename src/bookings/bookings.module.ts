import { Module } from '@nestjs/common';
import { HallsModule } from '../halls/halls.module';
import { ShowingsModule } from '../showings/showings.module';
import { BookingsController } from './bookings.controller';
import { BookingsService } from './bookings.service';
import { ShowingsSeatMapController } from './showings-seat-map.controller';

@Module({
  imports: [ShowingsModule, HallsModule],
  controllers: [BookingsController, ShowingsSeatMapController],
  providers: [BookingsService],
})
export class BookingsModule {}
