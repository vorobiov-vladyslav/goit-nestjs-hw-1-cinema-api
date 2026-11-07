import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayNotEmpty, IsArray, ValidateNested } from 'class-validator';
import { SeatDto } from '../../common/dto/seat.dto';
import { IsSeatList } from '../../common/validators/is-seat-list.validator';
import { IsUniqueSeats } from '../../common/validators/is-unique-seats.validator';

export class CreateBookingDto {
  @ApiProperty({
    type: [SeatDto],
    example: [
      { row: 1, seat: 2 },
      { row: 1, seat: 3 },
    ],
    description:
      'Непорожній масив обʼєктів {row, seat} з цілими додатними числами; ' +
      'одне місце не може повторюватися в запиті',
  })
  @IsArray({ message: 'seats must be an array' })
  @ArrayNotEmpty({ message: 'seats must not be empty' })
  @IsSeatList()
  @ValidateNested({ each: true })
  @Type(() => SeatDto)
  @IsUniqueSeats()
  seats: SeatDto[];
}
