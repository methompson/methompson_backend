import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { blogConfiguration } from '@/src/config/blog_configuration';
import { logConfiguration } from '@/src/config/log_configuration';

import { BlogModule } from '@/src/blog/blog.module';
import { LoggerModule } from '@/src/logger/logger.module';

import { authCheckMiddlewareFactory } from '@/src/middleware/auth_check.middleware';
import { RequestLogMiddleware } from '@/src/middleware/request_log.middleware';

@Module({
  imports: [
    LoggerModule,
    BlogModule,
    ConfigModule.forRoot({
      load: [blogConfiguration, logConfiguration],
    }),
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(authCheckMiddlewareFactory()).forRoutes('');
    consumer.apply(RequestLogMiddleware).forRoutes('');
  }
}
