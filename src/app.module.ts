import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';

import { BlogModule } from './blog/blog.module';
import { LoggerModule } from '@/src/logger/logger.module';

import { authCheckMiddlewareFactory } from '@/src/middleware/auth_check.middleware';
import { RequestLogMiddleware } from '@/src/middleware/request_log.middleware';

@Module({
  imports: [LoggerModule, BlogModule],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(authCheckMiddlewareFactory()).forRoutes('');
    consumer.apply(RequestLogMiddleware).forRoutes('');
  }
}
