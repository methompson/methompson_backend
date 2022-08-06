import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { mongodbConfiguration } from '@/src/config/mongodb_configuration';
import { blogConfiguration } from '@/src/config/blog_configuration';
import { logConfiguration } from '@/src/config/log_configuration';
import { authConfiguration } from '@/src/config/auth_configuration';

import { BlogModule } from '@/src/blog/blog.module';
import { LoggerModule } from '@/src/logger/logger.module';

import { authCheckMiddlewareFactory } from '@/src/middleware/auth_check.middleware';

@Module({
  imports: [
    LoggerModule,
    BlogModule,
    ConfigModule.forRoot({
      load: [
        mongodbConfiguration,
        blogConfiguration,
        logConfiguration,
        authConfiguration,
      ],
    }),
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(authCheckMiddlewareFactory()).forRoutes('');
  }
}
