import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';

import { mongodbConfiguration } from '@/src/config/mongodb_configuration';
import { blogConfiguration } from '@/src/config/blog_configuration';
import { imageConfiguration } from '@/src/config/image_configuration';
import { logConfiguration } from '@/src/config/log_configuration';
import { authConfiguration } from '@/src/config/auth_configuration';

import { BlogModule } from '@/src/blog/blog.module';
import { LoggerModule } from '@/src/logger/logger.module';

import { authCheckMiddlewareFactory } from '@/src/middleware/auth_check.middleware';
import { ImageUploadModule } from '@/src/image/image.module';

@Module({
  imports: [
    LoggerModule,
    BlogModule,
    ImageUploadModule,
    ConfigModule.forRoot({
      load: [
        mongodbConfiguration,
        blogConfiguration,
        imageConfiguration,
        logConfiguration,
        authConfiguration,
      ],
    }),
    ScheduleModule.forRoot(),
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(authCheckMiddlewareFactory()).forRoutes('');
  }
}
