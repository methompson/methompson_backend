import { MongoDBDataController } from './data_controller';

let dataController;

(async function makeDataController() {
  dataController = await MongoDBDataController.make({});
})();

export { dataController };
