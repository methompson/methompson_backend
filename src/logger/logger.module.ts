import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { LoggerService } from '@/src/logger/logger.service';
import { LoggerConsoleController } from '@/src/logger/logger.console.service';
import { MongoLoggerController } from './logger.mongo.service';
import { LoggerController } from '@/src/logger/logger.controller';

const loggerServiceFactory = {
  provide: 'LOGGER_SERVICE',
  useFactory: async (configService: ConfigService) => {
    const loggerServices: LoggerController[] = [];

    if (configService.get('console_logging')) {
      loggerServices.push(new LoggerConsoleController());
    }

    if (configService.get('db_logging')) {
      loggerServices.push(
        await MongoLoggerController.initFromConfig(configService),
      );
    }

    return new LoggerService(loggerServices);
  },
  inject: [ConfigService],
};

@Module({
  imports: [ConfigModule],
  providers: [loggerServiceFactory],
  exports: [loggerServiceFactory],
})
export class LoggerModule {}
