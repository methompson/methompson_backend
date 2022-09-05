import { v4 as uuidv4 } from 'uuid';

import { MongoImageDataService } from '@/src/image/image_data.mongo.service';
import { FileDetails, NewImageDetails } from '@/src/models/image_models';
import { MongoDBClient } from '@/src/utils/mongodb_client_class';

describe('image_data.mongo.service', () => {
  // Subject to change
  const mongoDbClient = new MongoDBClient(
    'mongodb://blog-root:blog-password@localhost',
    'blog',
  );

  const filename = uuidv4();
  const originalFilename = 'originalFileName';

  const fileDetails = new FileDetails(filename, 'test', { x: 64, y: 32 });
  const newImageDetails = new NewImageDetails(
    [fileDetails],
    'imageId',
    originalFilename,
    new Date().toISOString(),
    false,
    '123',
  );

  let imageId = '';

  describe('MongoImageDataService', () => {
    let service: MongoImageDataService;

    afterEach(async () => {
      await service.mongoDBClient.close();
    });

    test('images can be added', async () => {
      service = new MongoImageDataService(mongoDbClient);

      const results = await service.addImages([newImageDetails]);
      expect(results.length).toBe(1);

      const result = results[0];
      expect(result.originalFilename).toBe(originalFilename);
      expect(result.files.length).toBe(1);

      const file = result.files[0];
      expect(file.filename).toBe(filename);

      imageId = result.id;
    });

    test('images can be retrieved using the filename', async () => {
      service = new MongoImageDataService(mongoDbClient);

      const result = await service.getImageByName(filename);

      // We use toMatchObject to make sure that the newImageDetails values are
      // included within result. We know that result has an id value, but we
      // aren't certain what that is and we aren't really even concerned
      // what it may be.
      expect(result.toJSON()).toMatchObject(newImageDetails.toJSON());
    });

    test('images can be deleted and searching for the image results in an error', async () => {
      service = new MongoImageDataService(mongoDbClient);

      await service.deleteImage(imageId);

      expect(() => service.deleteImage(imageId)).rejects.toThrow();
    });
  });
});
