import { Module, Global } from '@nestjs/common';

import { LoggerConsoleService } from '@/src/logger/logger.console.service';

const loggerServiceFactory = {
  provide: 'LOGGER_SERVICE',
  useFactory: async () => new LoggerConsoleService(),
};

@Global()
@Module({
  providers: [loggerServiceFactory],
  exports: [loggerServiceFactory],
})
export class LoggerModule {}
