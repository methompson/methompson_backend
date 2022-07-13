import { Injectable } from '@nestjs/common';

import { BlogPostDataController } from '@src/data_controller/blog/blog_post_controller';
import { DataControllerService } from './data_controller.service';

@Injectable()
export class MockDataControllerService extends DataControllerService {
  constructor(protected _blogPostController: BlogPostDataController) {
    super();
  }

  get blogPostController(): BlogPostDataController {
    return this._blogPostController;
  }
}
