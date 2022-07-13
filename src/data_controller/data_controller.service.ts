import { Injectable } from '@nestjs/common';

import { BlogPostDataController } from '@src/data_controller/blog/blog_post_controller';

@Injectable()
export abstract class DataControllerService {
  abstract get blogPostController(): BlogPostDataController;
}
