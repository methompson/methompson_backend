import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';

import { BlogModule } from './blog/blog.module';
import { LoggerModule } from '@src/logger/logger.module';

import { authCheckMiddlewareFactory } from './middleware/auth_check.middleware';
import { makeDataController } from './db_controller';

const connectionFactory = {
  provide: 'ASYNC_CONNECTION',
  useFactory: async () => {
    const promises: Promise<unknown>[] = [];

    promises.push(makeDataController());

    await Promise.all(promises);
  },
};

@Module({
  providers: [connectionFactory],
  imports: [BlogModule, LoggerModule],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(authCheckMiddlewareFactory()).forRoutes('api');
  }
}
