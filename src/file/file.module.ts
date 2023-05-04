import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { LoggerModule } from '@/src/logger/logger.module';
import { FileController } from '@/src/file/file.controller';
import { FileAPIController } from '@/src/file/file_api.controller';
import { InMemoryFileDataService } from '@/src/file/file_data.service.memory';
import { MongoFileDataService } from './file_data.service.mongo';

const fileServiceFactory = {
  provide: 'FILE_SERVICE',
  useFactory: async (configService: ConfigService) => {
    const type = configService.get('fileServerType');

    if (type === 'mongo_db') {
      const service = MongoFileDataService.makeFromConfig(configService);
      service.initialize();

      return service;
    }

    return new InMemoryFileDataService();
  },
  inject: [ConfigService],
};

@Module({
  imports: [LoggerModule, ConfigModule],
  controllers: [FileController, FileAPIController],
  providers: [fileServiceFactory],
})
export class FileUploadModule {}
