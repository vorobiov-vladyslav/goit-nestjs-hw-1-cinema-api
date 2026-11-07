import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { IsValidDateOnly } from '../../common/validators/is-valid-date-only.validator';

export class GetShowingsQueryDto {
  @ApiPropertyOptional({
    description: 'Залишити лише сеанси цього фільму',
    example: '0f8fad5b-d9cb-469f-a165-70867728950e',
  })
  @IsOptional()
  @IsString({ message: 'filmId must be a string' })
  filmId?: string;

  @ApiPropertyOptional({
    description: 'Залишити сеанси, що починаються цієї доби',
    example: '2026-12-01',
  })
  @IsOptional()
  @IsValidDateOnly()
  date?: string;
}
