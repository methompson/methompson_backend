import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { LoggerModule } from '@/src/logger/logger.module';
import { ImageController } from '@/src/image/image.controller';
import { InMemoryImageDataService } from '@/src/image/image_data.memory.service';
import { MongoImageDataService } from './image_data.mongo.service';

const imageServiceFactory = {
  provide: 'IMAGE_SERVICE',
  useFactory: async (configService: ConfigService) => {
    const type = configService.get('imageServerType');

    if (type === 'mongo_db') {
      return await MongoImageDataService.initFromConfig(configService);
    }

    return new InMemoryImageDataService();
  },
  inject: [ConfigService],
};

@Module({
  imports: [LoggerModule, ConfigModule],
  controllers: [ImageController],
  providers: [imageServiceFactory],
})
export class ImageUploadModule {}
