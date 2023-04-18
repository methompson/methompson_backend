import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { LoggerModule } from '@/src/logger/logger.module';
import { BlogController } from './blog.controller';
import { MongoBlogService } from './blog.mongo.service';
import { InMemoryBlogService } from './blog.memory.service';
import { delay } from '@/src/utils/delay';

const blogServiceFactory = {
  provide: 'BLOG_SERVICE',
  useFactory: async (configService: ConfigService) => {
    const type = configService.get('blogType');

    if (type === 'mongo_db') {
      try {
        return await tryToInitFromConfig(configService);
      } catch (e) {
        console.error('blogServiceFactory Error:', e);
        throw e;
      }
    }

    return new InMemoryBlogService();
  },
  inject: [ConfigService],
};

async function tryToInitFromConfig(configService: ConfigService) {
  const service = MongoBlogService.makeFromConfig(configService);

  while (true) {
    console.log('Initializing Blog Service');
    try {
      await service.initialize();
      console.log('Initialized Blog Service');
      return service;
    } catch (e) {
      console.error('Error Connecting to MongoDB.', e);
      await delay();
      console.log('Trying again');
    }
  }
}

@Module({
  imports: [LoggerModule, ConfigModule],
  controllers: [BlogController],
  providers: [blogServiceFactory],
})
export class BlogModule {}
