import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { HallsService } from '../halls/halls.service';
import { isValidSeatEntry } from '../common/validators/is-seat-list.validator';
import { ShowingsService } from '../showings/showings.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { Booking, BookingSeat, ShowingSeatView } from './entities/booking.entity';

const seatKey = (seat: { row: number; seat: number }): string => `${seat.row}:${seat.seat}`;

@Injectable()
export class BookingsService {
  private readonly bookings: Booking[] = [];

  constructor(
    private readonly showingsService: ShowingsService,
    private readonly hallsService: HallsService,
  ) {}

  findAll(): Booking[] {
    return this.bookings.map((booking) => this.toResponse(booking));
  }

  createForShowing(showingId: string, dto: CreateBookingDto): Booking {
    const showing = this.showingsService.findEntity(showingId);
    const hall = this.hallsService.findOne(showing.hallId);

    const requestedSeats = new Set<string>();

    for (const seat of dto.seats) {
      if (!isValidSeatEntry(seat)) {
        throw new BadRequestException(
          'Each seat must be an object with positive integer "row" and "seat" numbers',
        );
      }

      const key = seatKey(seat);

      if (requestedSeats.has(key)) {
        throw new BadRequestException(
          `Seat row ${seat.row}, seat ${seat.seat} is specified more than once in the request`,
        );
      }

      if (seat.row < 1 || seat.seat < 1 || seat.row > hall.rows || seat.seat > hall.seatsPerRow) {
        throw new BadRequestException(
          `Seat row ${seat.row}, seat ${seat.seat} is outside of the hall bounds ` +
            `(rows: ${hall.rows}, seatsPerRow: ${hall.seatsPerRow})`,
        );
      }

      requestedSeats.add(key);
    }

    const occupiedSeats = this.occupiedSeatKeys(showingId);

    for (const seat of dto.seats) {
      if (occupiedSeats.has(seatKey(seat))) {
        throw new ConflictException(
          `Seat row ${seat.row}, seat ${seat.seat} is already booked for this showing`,
        );
      }
    }

    const booking: Booking = {
      id: randomUUID(),
      showingId,
      seats: dto.seats.map(({ row, seat }) => ({ row, seat })),
      totalPrice: showing.price * dto.seats.length,
    };

    this.bookings.push(booking);

    return this.toResponse(booking);
  }

  findByShowing(showingId: string): Booking[] {
    this.showingsService.findEntity(showingId);

    return this.bookings
      .filter((booking) => booking.showingId === showingId)
      .map((booking) => this.toResponse(booking));
  }

  getSeatMap(showingId: string): ShowingSeatView[] {
    const showing = this.showingsService.findEntity(showingId);
    const hall = this.hallsService.findOne(showing.hallId);
    const occupiedSeats = this.occupiedSeatKeys(showingId);

    return this.hallsService
      .getSeats(hall)
      .map(({ row, seat }) => ({ row, seat, isBooked: occupiedSeats.has(`${row}:${seat}`) }));
  }

  remove(id: string): void {
    const index = this.bookings.findIndex((booking) => booking.id === id);

    if (index === -1) {
      throw new NotFoundException(`Booking with id "${id}" not found`);
    }

    this.bookings.splice(index, 1);
  }

  private occupiedSeatKeys(showingId: string): Set<string> {
    const keys = new Set<string>();

    for (const booking of this.bookings) {
      if (booking.showingId !== showingId) {
        continue;
      }

      for (const seat of booking.seats) {
        keys.add(seatKey(seat));
      }
    }

    return keys;
  }

  private toResponse(booking: Booking): Booking {
    const seats: BookingSeat[] = booking.seats.map(({ row, seat }) => ({ row, seat }));

    return { ...booking, seats };
  }
}
