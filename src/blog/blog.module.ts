import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { LoggerModule } from '@/src/logger/logger.module';
import { BlogController } from './blog.controller';
import { MongoBlogService } from './blog.mongo.service';
import { InMemoryBlogService } from './blog.memory.service';

const blogServiceFactory = {
  provide: 'BLOG_SERVICE',
  useFactory: async (configService: ConfigService) => {
    const type = configService.get('blogType');

    if (type === 'mongo_db') {
      return await MongoBlogService.initFromConfig(configService);
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
