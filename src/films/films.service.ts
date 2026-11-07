import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
  forwardRef,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { ShowingsService } from '../showings/showings.service';
import { CreateFilmDto } from './dto/create-film.dto';
import { UpdateFilmDto } from './dto/update-film.dto';
import { Film } from './entities/film.entity';

@Injectable()
export class FilmsService {
  private readonly films: Film[] = [];

  constructor(
    @Inject(forwardRef(() => ShowingsService))
    private readonly showingsService: ShowingsService,
  ) {}

  create(dto: CreateFilmDto): Film {
    const film: Film = {
      id: randomUUID(),
      title: dto.title,
      durationMinutes: dto.durationMinutes,
      releaseYear: dto.releaseYear,
    };

    this.films.push(film);

    return { ...film };
  }

  findAll(): Film[] {
    return this.films.map((film) => ({ ...film }));
  }

  findById(id: string): Film | undefined {
    return this.films.find((film) => film.id === id);
  }

  findOne(id: string): Film {
    const film = this.findById(id);

    if (!film) {
      throw new NotFoundException(`Film with id "${id}" not found`);
    }

    return { ...film };
  }

  update(id: string, dto: UpdateFilmDto): Film {
    const film = this.films.find((item) => item.id === id);

    if (!film) {
      throw new NotFoundException(`Film with id "${id}" not found`);
    }

    Object.assign(film, dto);

    return { ...film };
  }

  remove(id: string): void {
    const index = this.films.findIndex((film) => film.id === id);

    if (index === -1) {
      throw new NotFoundException(`Film with id "${id}" not found`);
    }

    if (this.showingsService.existsByFilm(id)) {
      throw new ConflictException(
        `Film with id "${id}" cannot be deleted because at least one showing references it`,
      );
    }

    this.films.splice(index, 1);
  }
}
