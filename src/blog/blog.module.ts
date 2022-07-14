import { Module } from '@nestjs/common';

import { BlogController } from './blog.controller';
import { MongoBlogService } from './blog_mongo.service';

const blogServiceFactory = {
  provide: 'BLOG_SERVICE',
  useFactory: async () => new MongoBlogService(),
};

@Module({
  controllers: [BlogController],
  providers: [blogServiceFactory],
})
export class BlogModule {}
