import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { LoggerModule } from '@/src/logger/logger.module';
import { ImageController } from './image.controller';

@Module({
  imports: [LoggerModule, ConfigModule],
  controllers: [ImageController],
})
export class ImageUploadModule {}
