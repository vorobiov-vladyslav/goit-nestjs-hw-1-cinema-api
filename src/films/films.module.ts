import { Module, forwardRef } from '@nestjs/common';
import { ShowingsModule } from '../showings/showings.module';
import { FilmsController } from './films.controller';
import { FilmsService } from './films.service';

@Module({
  imports: [forwardRef(() => ShowingsModule)],
  controllers: [FilmsController],
  providers: [FilmsService],
  exports: [FilmsService],
})
export class FilmsModule {}
