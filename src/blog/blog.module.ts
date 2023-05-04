import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { LoggerModule } from '@/src/logger/logger.module';
import { BlogController } from './blog.controller';
import { MongoBlogService } from './blog.service.mongo';
import { InMemoryBlogService } from './blog.service.memory';

const blogServiceFactory = {
  provide: 'BLOG_SERVICE',
  useFactory: async (configService: ConfigService) => {
    const type = configService.get('blogType');

    if (type === 'mongo_db') {
      try {
        const service = MongoBlogService.makeFromConfig(configService);
        service.initialize();
        return service;
      } catch (e) {
        console.error('blogServiceFactory Error:', e);
        throw e;
      }
    }

    return new InMemoryBlogService();
  },
  inject: [ConfigService],
};

@Module({
  imports: [LoggerModule, ConfigModule],
  controllers: [BlogController],
  providers: [blogServiceFactory],
})
export class BlogModule {}
