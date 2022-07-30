import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { LoggerConsoleService } from '@/src/logger/logger.console.service';
import { MongoLoggerService } from './logger.mongo.service';

const loggerServiceFactory = {
  provide: 'LOGGER_SERVICE',
  useFactory: async (configService: ConfigService) => {
    const type = configService.get('loggingType');
    console.log('log type', type);

    if (type === 'mongo_db') {
      return await MongoLoggerService.initFromConfig(configService);
    } else if (type === 'file') {
      // TODO Develop a file based logger
    }

    return new LoggerConsoleService();
  },
  inject: [ConfigService],
};

@Module({
  imports: [ConfigModule],
  providers: [loggerServiceFactory],
  exports: [loggerServiceFactory],
})
export class LoggerModule {}
