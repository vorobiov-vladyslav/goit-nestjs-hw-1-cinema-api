import { Module, forwardRef } from '@nestjs/common';
import { ShowingsModule } from '../showings/showings.module';
import { HallsController } from './halls.controller';
import { HallsService } from './halls.service';

@Module({
  imports: [forwardRef(() => ShowingsModule)],
  controllers: [HallsController],
  providers: [HallsService],
  exports: [HallsService],
})
export class HallsModule {}
