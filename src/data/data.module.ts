import { Module, Global } from '@nestjs/common';

import { BlogPostMockController } from '@/src/data/blog/blog_post_mock_controller';
import { MockDataService } from '@/src/data/data_mock.service';
import { DataService } from '@/src/data/data.service';
import { MongoDBDataService } from './data_mongo.service';

const dataServiceFactory = {
  provide: 'DATA_SERVICE',
  useFactory: async () => {
    let controller: DataService;

    try {
      controller = await MongoDBDataService.init({
        username: process.env.MONGO_DB_USERNAME,
        password: process.env.MONGO_DB_PASSWORD,
        url: process.env.MONGO_DB_HOST,
      });
    } catch (e) {
      controller = new MockDataService(new BlogPostMockController());
    }

    return controller;
  },
};

@Global()
@Module({
  providers: [dataServiceFactory],
  exports: [dataServiceFactory],
})
export class DataModule {}
