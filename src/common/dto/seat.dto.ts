import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Min } from 'class-validator';

export class SeatDto {
  @ApiProperty({ example: 1, description: 'Номер ряду (починається з 1)' })
  @IsInt({ message: 'row must be an integer' })
  @Min(1, { message: 'row must be a positive integer' })
  row: number;

  @ApiProperty({ example: 5, description: 'Номер місця в ряду (починається з 1)' })
  @IsInt({ message: 'seat must be an integer' })
  @Min(1, { message: 'seat must be a positive integer' })
  seat: number;
}
