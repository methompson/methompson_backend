import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { LoggerService } from '@/src/logger/logger.service';
import { ConsoleLoggerInstanceService } from '@/src/logger/logger.console.service';
import { MongoLoggerInstanceService } from './logger.mongo.service';
import { LoggerInstanceService } from '@/src/logger/loggerInstance.service';
import { LoggerMongoClearTaskService } from './logger.mongo_clear.task';
import { FileLoggerInstanceService } from './logger.file.service';
import { delay } from '@/src/utils/delay';

const loggerServiceFactory = {
  provide: 'LOGGER_SERVICE',
  useFactory: async (configService: ConfigService) => {
    const loggerServices: LoggerInstanceService[] = [];

    if (configService.get('console_logging')) {
      loggerServices.push(new ConsoleLoggerInstanceService());
    }

    if (configService.get('db_logging')) {
      loggerServices.push(
        // await MongoLoggerServiceInstance.initFromConfig(configService),
        await tryToInitFromConfig(configService),
      );
    }

    if (configService.get('file_logging')) {
      console.log('Adding File Logging');
      loggerServices.push(await FileLoggerInstanceService.init());
    }

    return new LoggerService(loggerServices);
  },
  inject: [ConfigService],
};

async function tryToInitFromConfig(
  configService: ConfigService,
): Promise<MongoLoggerInstanceService> {
  const service = MongoLoggerInstanceService.makeFromConfig(configService);
  while (true) {
    console.log('Initializing Log Service');
    try {
      await service.initialize();
      console.log('Initialized Log Service');
      return service;
    } catch (e) {
      console.error('Error Connecting to MongoDB.');
      await delay();
      console.log('Trying again');
    }
  }
}

@Module({
  imports: [ConfigModule],
  providers: [loggerServiceFactory, LoggerMongoClearTaskService],
  exports: [loggerServiceFactory],
})
export class LoggerModule {}
