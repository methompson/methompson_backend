import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';

import { BlogModule } from './blog/blog.module';

import { authCheckMiddlewareFactory } from './middleware/auth_check.middleware';
import { makeDataController } from './db_controller';

const connectionFactory = {
  provide: 'ASYNC_CONNECTION',
  useFactory: async () => {
    await makeDataController();
  },
};

@Module({
  providers: [connectionFactory],
  imports: [BlogModule],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(authCheckMiddlewareFactory()).forRoutes('api');
  }
}
