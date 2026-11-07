import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
  forwardRef,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { FilmsService } from '../films/films.service';
import { HallsService } from '../halls/halls.service';
import { CreateShowingDto } from './dto/create-showing.dto';
import { GetShowingsQueryDto } from './dto/get-showings-query.dto';
import { Showing, ShowingView } from './entities/showing.entity';

@Injectable()
export class ShowingsService {
  private readonly showings: Showing[] = [];

  constructor(
    @Inject(forwardRef(() => FilmsService))
    private readonly filmsService: FilmsService,
    @Inject(forwardRef(() => HallsService))
    private readonly hallsService: HallsService,
  ) {}

  create(dto: CreateShowingDto): Showing {
    if (!this.filmsService.findById(dto.filmId)) {
      throw new BadRequestException(`Film with id "${dto.filmId}" not found`);
    }

    if (!this.hallsService.findById(dto.hallId)) {
      throw new BadRequestException(`Hall with id "${dto.hallId}" not found`);
    }

    const showing: Showing = {
      id: randomUUID(),
      filmId: dto.filmId,
      hallId: dto.hallId,
      startsAt: new Date(dto.startsAt).toISOString(),
      price: dto.price,
    };

    this.showings.push(showing);

    return { ...showing };
  }

  findAll(query: GetShowingsQueryDto): ShowingView[] {
    let result = [...this.showings];

    if (query.filmId) {
      result = result.filter((showing) => showing.filmId === query.filmId);
    }

    if (query.date) {
      result = result.filter((showing) => showing.startsAt.startsWith(`${query.date}T`));
    }

    result.sort((left, right) => {
      const byStart = Date.parse(left.startsAt) - Date.parse(right.startsAt);

      return byStart !== 0 ? byStart : left.id.localeCompare(right.id);
    });

    return result.map((showing) => this.toView(showing));
  }

  findOne(id: string): ShowingView {
    return this.toView(this.findEntity(id));
  }

  findEntity(id: string): Showing {
    const showing = this.showings.find((item) => item.id === id);

    if (!showing) {
      throw new NotFoundException(`Showing with id "${id}" not found`);
    }

    return showing;
  }

  existsByFilm(filmId: string): boolean {
    return this.showings.some((showing) => showing.filmId === filmId);
  }

  existsByHall(hallId: string): boolean {
    return this.showings.some((showing) => showing.hallId === hallId);
  }

  private toView(showing: Showing): ShowingView {
    const film = this.filmsService.findById(showing.filmId);
    const hall = this.hallsService.findById(showing.hallId);

    return {
      id: showing.id,
      filmTitle: film?.title ?? '',
      hallName: hall?.name ?? '',
      startsAt: showing.startsAt,
      price: showing.price,
    };
  }
}
