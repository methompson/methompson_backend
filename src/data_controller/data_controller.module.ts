import { Module, Global } from '@nestjs/common';

import { BlogPostMockController } from '@src/data_controller/blog/blog_post_mock_controller';
import { MockDataControllerService } from '@src/data_controller/data_controller_mock.service';
import { DataControllerService } from '@src/data_controller/data_controller.service';
import { MongoDBDataController } from './data_controller_mongo.service';

const dataControllerFactory = {
  provide: 'DATA_CONTROLLER',
  useFactory: async () => {
    let controller: DataControllerService;

    try {
      controller = await MongoDBDataController.init({
        username: process.env.MONGO_DB_USERNAME,
        password: process.env.MONGO_DB_PASSWORD,
        url: process.env.MONGO_DB_HOST,
      });
    } catch (e) {
      controller = new MockDataControllerService(new BlogPostMockController());
    }

    return controller;
  },
};

@Global()
@Module({
  providers: [dataControllerFactory],
  exports: [dataControllerFactory],
})
export class DataControllerModule {}
