import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CreateFilmDto } from './dto/create-film.dto';
import { FilmResponseDto } from './dto/film-response.dto';
import { UpdateFilmDto } from './dto/update-film.dto';
import { Film } from './entities/film.entity';
import { FilmsService } from './films.service';

@ApiTags('films')
@Controller('films')
export class FilmsController {
  constructor(private readonly filmsService: FilmsService) {}

  @Post()
  @ApiCreatedResponse({ type: FilmResponseDto, description: 'Фільм створено' })
  @ApiBadRequestResponse({ description: 'Відсутнє поле або неправильний тип поля' })
  create(@Body() dto: CreateFilmDto): Film {
    return this.filmsService.create(dto);
  }

  @Get()
  @ApiOkResponse({ type: FilmResponseDto, isArray: true, description: 'Масив усіх фільмів' })
  findAll(): Film[] {
    return this.filmsService.findAll();
  }

  @Get(':id')
  @ApiOkResponse({ type: FilmResponseDto, description: 'Знайдений фільм' })
  @ApiNotFoundResponse({ description: 'Фільму з таким id немає' })
  findOne(@Param('id') id: string): Film {
    return this.filmsService.findOne(id);
  }

  @Patch(':id')
  @ApiOkResponse({ type: FilmResponseDto, description: 'Оновлений фільм' })
  @ApiBadRequestResponse({ description: 'Неправильний тип поля' })
  @ApiNotFoundResponse({ description: 'Фільму з таким id немає' })
  update(@Param('id') id: string, @Body() dto: UpdateFilmDto): Film {
    return this.filmsService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse({ description: 'Фільм видалено' })
  @ApiNotFoundResponse({ description: 'Фільму з таким id немає' })
  @ApiConflictResponse({ description: 'На фільм посилається хоча б один сеанс' })
  remove(@Param('id') id: string): void {
    this.filmsService.remove(id);
  }
}
