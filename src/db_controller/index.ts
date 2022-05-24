import { MongoDBDataController } from './data_controller';

const dataController = new MongoDBDataController();

async function makeDataController() {
  try {
    await dataController.init({
      username: process.env.MONGO_DB_USERNAME,
      password: process.env.MONGO_DB_PASSWORD,
      url: process.env.MONGO_DB_HOST,
    });

    console.log('Data Controller initialized');
  } catch (e) {
    console.error(e);
    process.exit();
  }
}

export { dataController, makeDataController };
