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
  ApiTags,
} from '@nestjs/swagger';
import { CreateHallDto } from './dto/create-hall.dto';
import { HallResponseDto, HallWithSeatsResponseDto } from './dto/hall-response.dto';
import { Hall, HallSeat } from './entities/hall.entity';
import { HallsService } from './halls.service';

@ApiTags('halls')
@Controller('halls')
export class HallsController {
  constructor(private readonly hallsService: HallsService) {}

  @Post()
  @ApiCreatedResponse({ type: HallResponseDto, description: 'Зал створено' })
  @ApiBadRequestResponse({
    description: 'Поле відсутнє, має неправильний тип або число не є цілим додатним',
  })
  @ApiConflictResponse({ description: 'Зал з такою назвою вже існує' })
  create(@Body() dto: CreateHallDto): Hall {
    return this.hallsService.create(dto);
  }

  @Get()
  @ApiOkResponse({ type: HallResponseDto, isArray: true, description: 'Масив усіх залів' })
  findAll(): Hall[] {
    return this.hallsService.findAll();
  }

  @Get(':id')
  @ApiOkResponse({
    type: HallWithSeatsResponseDto,
    description: 'Зал разом із переліком усіх його місць',
  })
  @ApiNotFoundResponse({ description: 'Залу з таким id немає' })
  findOne(@Param('id') id: string): Hall & { seats: HallSeat[] } {
    return this.hallsService.findOneWithSeats(id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse({ description: 'Зал видалено' })
  @ApiNotFoundResponse({ description: 'Залу з таким id немає' })
  @ApiConflictResponse({ description: 'На зал посилається хоча б один сеанс' })
  remove(@Param('id') id: string): void {
    this.hallsService.remove(id);
  }
}
