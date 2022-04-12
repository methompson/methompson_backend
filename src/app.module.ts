import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';

import { BlogModule } from './blog/blog.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';

import { AuthCheckMiddlware } from './middleware/auth_check.middleware';

@Module({
  controllers: [AppController],
  providers: [AppService],
  imports: [BlogModule],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(AuthCheckMiddlware).forRoutes('api');
  }
}
