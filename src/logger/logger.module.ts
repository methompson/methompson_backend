import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { LoggerService } from '@/src/logger/logger.service';
import { ConsoleLoggerInstanceService } from '@/src/logger/logger.console.service';
import { MongoLoggerInstanceService } from './loggerInstance.service.mongo';
import { LoggerInstanceService } from '@/src/logger/loggerInstance.service';
import { LoggerCycleService } from './logger.cycle.service';
import { FileLoggerInstanceService } from './loggerInstance.service.file';

const loggerServiceFactory = {
  provide: 'LOGGER_SERVICE',
  useFactory: async (configService: ConfigService) => {
    const loggerServices: LoggerInstanceService[] = [];

    if (configService.get('console_logging')) {
      loggerServices.push(new ConsoleLoggerInstanceService());
    }

    if (configService.get('db_logging')) {
      const service = MongoLoggerInstanceService.makeFromConfig(configService);
      service.initialize();

      loggerServices.push(service);
    }

    if (configService.get('file_logging')) {
      console.log('Adding File Logging');
      loggerServices.push(await FileLoggerInstanceService.init());
    }

    return new LoggerService(loggerServices);
  },
  inject: [ConfigService],
};

@Module({
  imports: [ConfigModule],
  providers: [loggerServiceFactory, LoggerCycleService],
  exports: [loggerServiceFactory],
})
export class LoggerModule {}
