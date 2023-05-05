import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { LoggerModule } from '@/src/logger/logger.module';

import { BlogController } from '@/src/blog/blog.controller';
import { MongoBlogService } from '@/src/blog/blog.service.mongo';
import { InMemoryBlogService } from '@/src/blog/blog.service.memory';
import { FileBlogService } from '@/src/blog/blog.service.file';
import { BlogBackupService } from '@/src/blog/blog_backup_service';

import { isString } from '@/src/utils/type_guards';

const blogServiceFactory = {
  provide: 'BLOG_SERVICE',
  useFactory: async (configService: ConfigService) => {
    const type = configService.get('blogType');

    if (type === 'mongo_db') {
      console.log('mongo_db blog service');
      try {
        const service = MongoBlogService.makeFromConfig(configService);
        service.initialize();
        return service;
      } catch (e) {
        console.error('blogServiceFactory Error:', e);
        throw e;
      }
    } else if (type === 'file') {
      const path = configService.get('blogFilePath');
      if (isString(path)) {
        const service = await FileBlogService.init(path);
        return service;
      }
    }

    console.log('memory blog service');

    return new InMemoryBlogService();
  },
  inject: [ConfigService],
};

@Module({
  imports: [LoggerModule, ConfigModule],
  controllers: [BlogController],
  providers: [blogServiceFactory, BlogBackupService],
})
export class BlogModule {}
