import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CreateShowingDto } from './dto/create-showing.dto';
import { GetShowingsQueryDto } from './dto/get-showings-query.dto';
import { CreatedShowingResponseDto, ShowingResponseDto } from './dto/showing-response.dto';
import { Showing, ShowingView } from './entities/showing.entity';
import { ShowingsService } from './showings.service';

@ApiTags('showings')
@Controller('showings')
export class ShowingsController {
  constructor(private readonly showingsService: ShowingsService) {}

  @Post()
  @ApiCreatedResponse({ type: CreatedShowingResponseDto, description: 'Сеанс створено' })
  @ApiBadRequestResponse({
    description: 'Фільму або залу з переданим id немає; startsAt не ISO 8601 / у минулому; price не ціле додатне',
  })
  create(@Body() dto: CreateShowingDto): Showing {
    return this.showingsService.create(dto);
  }

  @Get()
  @ApiOkResponse({
    type: ShowingResponseDto,
    isArray: true,
    description: 'Масив сеансів (назви фільму й залу замість id), відсортований за часом початку',
  })
  @ApiBadRequestResponse({ description: 'date не відповідає формату YYYY-MM-DD' })
  findAll(@Query() query: GetShowingsQueryDto): ShowingView[] {
    return this.showingsService.findAll(query);
  }

  @Get(':id')
  @ApiOkResponse({ type: ShowingResponseDto, description: 'Знайдений сеанс' })
  @ApiNotFoundResponse({ description: 'Сеансу з таким id немає' })
  findOne(@Param('id') id: string): ShowingView {
    return this.showingsService.findOne(id);
  }
}
