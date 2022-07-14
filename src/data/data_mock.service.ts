import { Injectable } from '@nestjs/common';

import { BlogPostDataController } from '@/src/data/blog/blog_post_controller';
import { DataService } from './data.service';

@Injectable()
export class MockDataService extends DataService {
  constructor(protected _blogPostController: BlogPostDataController) {
    super();
  }

  get blogPostController(): BlogPostDataController {
    return this._blogPostController;
  }
}
