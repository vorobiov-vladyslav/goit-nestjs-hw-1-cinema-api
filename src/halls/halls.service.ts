import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
  forwardRef,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { ShowingsService } from '../showings/showings.service';
import { CreateHallDto } from './dto/create-hall.dto';
import { Hall, HallSeat } from './entities/hall.entity';

@Injectable()
export class HallsService {
  private readonly halls: Hall[] = [];

  constructor(
    @Inject(forwardRef(() => ShowingsService))
    private readonly showingsService: ShowingsService,
  ) {}

  create(dto: CreateHallDto): Hall {
    const nameTaken = this.halls.some((hall) => hall.name === dto.name);

    if (nameTaken) {
      throw new ConflictException(`Hall with name "${dto.name}" already exists`);
    }

    const hall: Hall = {
      id: randomUUID(),
      name: dto.name,
      rows: dto.rows,
      seatsPerRow: dto.seatsPerRow,
    };

    this.halls.push(hall);

    return { ...hall };
  }

  findAll(): Hall[] {
    return this.halls.map((hall) => ({ ...hall }));
  }

  findById(id: string): Hall | undefined {
    return this.halls.find((hall) => hall.id === id);
  }

  findOne(id: string): Hall {
    const hall = this.findById(id);

    if (!hall) {
      throw new NotFoundException(`Hall with id "${id}" not found`);
    }

    return { ...hall };
  }

  getSeats(hall: Hall): HallSeat[] {
    const seats: HallSeat[] = [];

    for (let row = 1; row <= hall.rows; row += 1) {
      for (let seat = 1; seat <= hall.seatsPerRow; seat += 1) {
        seats.push({ row, seat });
      }
    }

    return seats;
  }

  findOneWithSeats(id: string): Hall & { seats: HallSeat[] } {
    const hall = this.findOne(id);

    return { ...hall, seats: this.getSeats(hall) };
  }

  remove(id: string): void {
    const index = this.halls.findIndex((hall) => hall.id === id);

    if (index === -1) {
      throw new NotFoundException(`Hall with id "${id}" not found`);
    }

    if (this.showingsService.existsByHall(id)) {
      throw new ConflictException(
        `Hall with id "${id}" cannot be deleted because at least one showing references it`,
      );
    }

    this.halls.splice(index, 1);
  }
}
