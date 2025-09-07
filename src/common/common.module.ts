import { Module, Global } from '@nestjs/common';
import { TimezoneService } from './services/timezone.service';

@Global()
@Module({
  providers: [TimezoneService],
  exports: [TimezoneService],
})
export class CommonModule {}
