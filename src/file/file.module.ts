import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { LoggerModule } from '@/src/logger/logger.module';

import { FileController } from '@/src/file/file.controller';
import { FileAPIController } from '@/src/file/file_api.controller';
import { FileBackupService } from '@/src/file/file_backup_service';
import { InMemoryFileDataService } from '@/src/file/file_data.service.memory';
import { MongoFileDataService } from '@/src/file/file_data.service.mongo';
import { FileFileDataService } from '@/src/file/file_data.service.file';

import { isString } from '@/src/utils/type_guards';

const fileServiceFactory = {
  provide: 'FILE_SERVICE',
  useFactory: async (configService: ConfigService) => {
    const type = configService.get('fileServerType');

    if (type === 'mongo_db') {
      const service = MongoFileDataService.makeFromConfig(configService);
      service.initialize();

      return service;
    } else if (type === 'file') {
      const path = configService.get('fileServerDataPath');

      if (isString(path)) {
        const service = FileFileDataService.init(path);
        return service;
      }
    }

    return new InMemoryFileDataService();
  },
  inject: [ConfigService],
};

@Module({
  imports: [LoggerModule, ConfigModule],
  controllers: [FileController, FileAPIController],
  providers: [fileServiceFactory, FileBackupService],
})
export class FileUploadModule {}
