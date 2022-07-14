import { Injectable } from '@nestjs/common';

import { BlogPostDataController } from '@/src/data/blog/blog_post_controller';

@Injectable()
export abstract class DataService {
  abstract get blogPostController(): BlogPostDataController;
}
