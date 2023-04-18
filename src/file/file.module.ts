import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { LoggerModule } from '@/src/logger/logger.module';
import { FileController } from '@/src/file/file.controller';
import { FileAPIController } from '@/src/file/file_api.controller';
import { InMemoryFileDataService } from '@/src/file/file_data.memory.service';
import { MongoFileDataService } from './file_data.mongo.service';
import { delay } from '@/src/utils/delay';

const fileServiceFactory = {
  provide: 'FILE_SERVICE',
  useFactory: async (configService: ConfigService) => {
    const type = configService.get('fileServerType');

    if (type === 'mongo_db') {
      // return await MongoFileDataService.initFromConfig(configService);
      return await tryToInitFromConfig(configService);
    }

    return new InMemoryFileDataService();
  },
  inject: [ConfigService],
};

async function tryToInitFromConfig(configService: ConfigService) {
  const service = MongoFileDataService.makeFromConfig(configService);

  while (true) {
    console.log('Initializing File Service');
    try {
      await service.initialize();
      console.log('Initialized File Service');
      return service;
    } catch (e) {
      console.error('Error Connecting to MongoDB.', e);
      await delay();
      console.log('Trying again');
    }
  }
}

@Module({
  imports: [LoggerModule, ConfigModule],
  controllers: [FileController, FileAPIController],
  providers: [fileServiceFactory],
})
export class FileUploadModule {}
