import { DataControllerService } from '@src/data_controller/data_controller.service';
import { MongoDBDataController } from '@src/data_controller/data_controller_mongo.service';

export class DataControllerFactory {
  constructor() {}

  static init(options: unknown): Promise<DataControllerService> {
    return MongoDBDataController.init({
      username: process.env.MONGO_DB_USERNAME,
      password: process.env.MONGO_DB_PASSWORD,
      url: process.env.MONGO_DB_HOST,
    });
  }
}
