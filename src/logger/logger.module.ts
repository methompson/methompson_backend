import { Module, Global } from '@nestjs/common';

import { LoggerService } from '@/src/logger/logger.console.service';

@Global()
@Module({
  providers: [LoggerService],
  exports: [LoggerService],
})
export class LoggerModule {}
