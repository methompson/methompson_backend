import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { LoggerModule } from '@/src/logger/logger.module';
import { ImageController } from '@/src/image/image.controller';
import { ImageMemoryDataService } from '@/src/image/image_data.memory.service';

const imageServiceFactory = {
  provide: 'IMAGE_SERVICE',
  useFactory: async (configService: ConfigService) => {
    const type = configService.get('ImageServerType');

    return new ImageMemoryDataService();
  },
  inject: [ConfigService],
};

@Module({
  imports: [LoggerModule, ConfigModule],
  controllers: [ImageController],
  providers: [imageServiceFactory],
})
export class ImageUploadModule {}
