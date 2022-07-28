import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { LoggerConsoleService } from '@/src/logger/logger.console.service';

const loggerServiceFactory = {
  provide: 'LOGGER_SERVICE',
  useFactory: async (configService: ConfigService) => {
    const type = configService.get('loggingType');
    console.log('log type', type);

    if (type === 'mongo_db') {
      // TODO Develop a DB based logger
    } else if (type === 'file') {
      // TODO Develop a file based logger
    }

    new LoggerConsoleService();
  },
  inject: [ConfigService],
};

@Module({
  imports: [ConfigModule],
  providers: [loggerServiceFactory],
  exports: [loggerServiceFactory],
})
export class LoggerModule {}
