import { Db, MongoClient, Collection, ObjectId } from 'mongodb';
import { ConfigService } from '@nestjs/config';

import { NotFoundError } from '@/src/errors';
import { MongoImageDataService } from '@/src/image/image_data.mongo.service';
import { ImageDetails, NewImageDetails } from '@/src/models/image_models';
import { MongoDBClient } from '@/src/utils/mongodb_client_class';

// jest.mock('mongodb');
jest.mock('mongodb', () => {
  const originalModule = jest.requireActual('mongodb');

  function MockDb() {}
  MockDb.prototype.collection = jest.fn();
  MockDb.prototype.collections = jest.fn();
  MockDb.prototype.createCollection = jest.fn();

  function MockCollection() {
    Object.defineProperty(this, 'collectionName', {
      configurable: true,
      get: jest.fn(),
      set: jest.fn(),
    });
  }
  MockCollection.prototype.createIndex = jest.fn();
  MockCollection.prototype.findOne = jest.fn();
  MockCollection.prototype.findOneAndDelete = jest.fn();
  MockCollection.prototype.deleteOne = jest.fn();
  MockCollection.prototype.insertMany = jest.fn();

  const MockMongoClient = jest.fn();

  return {
    ...originalModule,
    Db: MockDb,
    MongoClient: MockMongoClient,
    Collection: MockCollection,
  };
});

const uri = 'uri';
const dbName = 'dbName';
const testError = 'test error';

const errorSpy = jest.spyOn(console, 'error');
const logSpy = jest.spyOn(console, 'log');

test('Testing ES5 Classes', () => {
  const helloWorld = 'Hello, world';
  const value = 'value';

  function MyTestClass() {
    this.helloWorld = helloWorld;
    this.value = value;

    Object.defineProperty(this, 'testValue', {
      configurable: true,
      get() {
        return this.value;
      },
      set(input) {
        this.value = input;
      },
    });
  }
  MyTestClass.prototype.helloWorld = function helloWorld() {
    return this.helloWorld;
  };

  const mtc = new MyTestClass();

  expect(mtc.helloWorld).toBe(helloWorld);
  expect(mtc.testValue).toBe(value);

  const value2 = '123';
  mtc.testValue = value2;
  expect(mtc.testValue).toBe(value2);
});

describe('MongoImageDataService', () => {
  let mockMongoDBClient: MongoDBClient;
  let mockMongoClient: MongoClient;
  let mockDb: Db;
  let mockCollection: Collection;

  let mockCollectionSpy: jest.SpyInstance;
  let clientDbSpy: jest.SpyInstance;

  const objectId1 = 'abcdef1234567890abcdef12';
  const objectId2 = '0987654321fedcba09876543';

  const imageDetails = {
    files: [
      {
        filename: 'fa713d2c-877c-4ddc-b87d-dc39e2ac0061.jpg',
        identifier: '',
        dimensions: {
          x: 1280,
          y: 928,
        },
      },
      {
        filename: 'fa713d2c-877c-4ddc-b87d-dc39e2ac0061_thumb.jpg',
        identifier: 'thumb',
        dimensions: {
          x: 128,
          y: 93,
        },
      },
    ],
    imageId: 'test',
    originalFilename: 'originalFilename',
    dateAdded: new Date('2022-09-15T06:46:00.000Z'),
    isPrivate: false,
    authorId: 'authorId',
    _id: new ObjectId(objectId1),
  };

  beforeEach(() => {
    (Db.prototype.collection as unknown as jest.Mock).mockReset();
    (Db.prototype.collections as unknown as jest.Mock).mockReset();
    (Db.prototype.createCollection as unknown as jest.Mock).mockReset();

    (MongoClient as unknown as jest.Mock).mockReset();

    (Collection.prototype.createIndex as unknown as jest.Mock).mockReset();
    (Collection.prototype.findOne as unknown as jest.Mock).mockReset();
    (Collection.prototype.findOneAndDelete as unknown as jest.Mock).mockReset();
    (Collection.prototype.deleteOne as unknown as jest.Mock).mockReset();
    (Collection.prototype.insertMany as unknown as jest.Mock).mockReset();

    mockMongoClient = new MongoClient(dbName);
    mockDb = new Db(mockMongoClient, dbName);

    mockCollection = new Collection();
    mockCollectionSpy = jest.spyOn(mockDb, 'collection');
    mockCollectionSpy.mockReturnValue(mockCollection);

    mockMongoDBClient = new MongoDBClient(uri, dbName);
    clientDbSpy = jest.spyOn(mockMongoDBClient, 'db', 'get');
    clientDbSpy.mockReturnValue(Promise.resolve(mockDb));
  });

  describe('imageCollection', () => {
    test('Returns the appropriate value', async () => {
      const mockMongoClient = new MongoClient(dbName);
      const mockDb = new Db(mockMongoClient, dbName);

      const mockCollection = new Collection();
      const mockCollectionSpy = jest.spyOn(mockDb, 'collection');
      mockCollectionSpy.mockReturnValue(mockCollection);

      const client = new MongoDBClient(uri, dbName);
      const clientDbSpy = jest.spyOn(client, 'db', 'get');
      clientDbSpy.mockReturnValue(Promise.resolve(mockDb));

      const svc = new MongoImageDataService(client);
      const val = await svc['imageCollection'];

      expect(val).toBe(mockCollection);

      expect(clientDbSpy).toHaveBeenCalledTimes(1);
      expect(mockCollectionSpy).toHaveBeenCalledTimes(1);
    });

    test('Throws an error when collection throws an error', async () => {
      mockCollectionSpy.mockImplementationOnce(async () => {
        throw new Error(testError);
      });

      const svc = new MongoImageDataService(mockMongoDBClient);
      expect(() => svc['imageCollection']).rejects.toThrow(testError);
    });

    test('Throws an error when _mongoDBClient.db throws an error', async () => {
      clientDbSpy.mockImplementationOnce(async () => {
        throw new Error(testError);
      });

      const svc = new MongoImageDataService(mockMongoDBClient);
      expect(() => svc['imageCollection']).rejects.toThrow(testError);
    });
  });

  describe('mongoDBClient', () => {
    test('Returns the value assigned to _mongoDBClient', () => {
      const svc = new MongoImageDataService(mockMongoDBClient);
      expect(svc.mongoDBClient).toBe(mockMongoDBClient);
    });
  });

  describe('containsImageCollection', () => {
    test('returns true if the collection is included in the database', async () => {
      const imageDataCol = new Collection<Document>();
      const imgNameSpy = jest.spyOn(imageDataCol, 'collectionName', 'get');
      imgNameSpy.mockReturnValue('images');

      const collection1 = new Collection<Document>();
      const col1NameSpy = jest.spyOn(collection1, 'collectionName', 'get');
      col1NameSpy.mockReturnValue('collection1');

      const collection2 = new Collection<Document>();
      const col2NameSpy = jest.spyOn(collection2, 'collectionName', 'get');
      col2NameSpy.mockReturnValue('collection2');

      const collectionsSpy = jest.spyOn(mockDb, 'collections');
      collectionsSpy.mockImplementationOnce(() =>
        Promise.resolve([imageDataCol, collection1, collection2]),
      );

      const svc = new MongoImageDataService(mockMongoDBClient);
      const result = await svc['containsImageCollection']();

      expect(result).toBe(true);

      expect(clientDbSpy).toHaveBeenCalledTimes(1);
      expect(collectionsSpy).toHaveBeenCalledTimes(1);
      expect(imgNameSpy).toHaveBeenCalledTimes(1);
      expect(col1NameSpy).toHaveBeenCalledTimes(1);
      expect(col2NameSpy).toHaveBeenCalledTimes(1);
    });

    test('returns false if the collection is not included in the database', async () => {
      const collection1 = new Collection<Document>();
      const col1NameSpy = jest.spyOn(collection1, 'collectionName', 'get');
      col1NameSpy.mockReturnValue('collection1');

      const collection2 = new Collection<Document>();
      const col2NameSpy = jest.spyOn(collection2, 'collectionName', 'get');
      col2NameSpy.mockReturnValue('collection2');

      const collectionsSpy = jest.spyOn(mockDb, 'collections');
      collectionsSpy.mockImplementationOnce(() =>
        Promise.resolve([collection1, collection2]),
      );

      const svc = new MongoImageDataService(mockMongoDBClient);
      const result = await svc['containsImageCollection']();

      expect(result).toBe(false);

      expect(clientDbSpy).toHaveBeenCalledTimes(1);
      expect(collectionsSpy).toHaveBeenCalledTimes(1);
      expect(col1NameSpy).toHaveBeenCalledTimes(1);
      expect(col2NameSpy).toHaveBeenCalledTimes(1);
    });

    test('throws an error if _mongoDBClient.db throws an error', async () => {
      const imageDataCol = new Collection<Document>();
      const imgNameSpy = jest.spyOn(imageDataCol, 'collectionName', 'get');
      imgNameSpy.mockReturnValue('images');

      const collection1 = new Collection<Document>();
      const col1NameSpy = jest.spyOn(collection1, 'collectionName', 'get');
      col1NameSpy.mockReturnValue('collection1');

      const collection2 = new Collection<Document>();
      const col2NameSpy = jest.spyOn(collection2, 'collectionName', 'get');
      col2NameSpy.mockReturnValue('collection2');

      clientDbSpy.mockImplementationOnce(() => {
        throw new Error(testError);
      });

      const collectionsSpy = jest.spyOn(mockDb, 'collections');

      const svc = new MongoImageDataService(mockMongoDBClient);
      await expect(() => svc['containsImageCollection']()).rejects.toThrow(
        testError,
      );

      expect(clientDbSpy).toHaveBeenCalledTimes(1);
      expect(collectionsSpy).toHaveBeenCalledTimes(0);
      expect(imgNameSpy).toHaveBeenCalledTimes(0);
      expect(col1NameSpy).toHaveBeenCalledTimes(0);
      expect(col2NameSpy).toHaveBeenCalledTimes(0);
    });

    test('throws an error if db.collections throws an error', async () => {
      const imageDataCol = new Collection<Document>();
      const imgNameSpy = jest.spyOn(imageDataCol, 'collectionName', 'get');
      imgNameSpy.mockReturnValue('images');

      const collection1 = new Collection<Document>();
      const col1NameSpy = jest.spyOn(collection1, 'collectionName', 'get');
      col1NameSpy.mockReturnValue('collection1');

      const collection2 = new Collection<Document>();
      const col2NameSpy = jest.spyOn(collection2, 'collectionName', 'get');
      col2NameSpy.mockReturnValue('collection2');

      const collectionsSpy = jest.spyOn(mockDb, 'collections');
      collectionsSpy.mockImplementation(() => {
        throw new Error(testError);
      });

      const svc = new MongoImageDataService(mockMongoDBClient);
      await expect(() => svc['containsImageCollection']()).rejects.toThrow(
        testError,
      );

      expect(clientDbSpy).toHaveBeenCalledTimes(1);
      expect(collectionsSpy).toHaveBeenCalledTimes(1);
      expect(imgNameSpy).toHaveBeenCalledTimes(0);
      expect(col1NameSpy).toHaveBeenCalledTimes(0);
      expect(col2NameSpy).toHaveBeenCalledTimes(0);
    });
  });

  describe('makeImageCollection', () => {
    beforeEach(() => {
      logSpy.mockImplementationOnce(() => {});
    });

    afterEach(() => {
      logSpy.mockReset();
    });

    test('calls createCollection and createIndex on the DB', async () => {
      const createSpy = jest.spyOn(mockDb, 'createCollection');
      createSpy.mockImplementationOnce(async () => mockCollection);

      const createIndexSpy = jest.spyOn(mockCollection, 'createIndex');

      const svc = new MongoImageDataService(mockMongoDBClient);
      await svc['makeImageCollection']();

      expect(createSpy).toHaveBeenCalledTimes(1);
      expect(createIndexSpy).toHaveBeenCalledTimes(1);
      expect(createIndexSpy).toHaveBeenCalledWith({ 'files.filename': 1 });
    });

    test('throws an error if _mongoDBClient.db throws an error', async () => {
      clientDbSpy.mockImplementationOnce(() => {
        throw new Error(testError);
      });

      const createSpy = jest.spyOn(mockDb, 'createCollection');
      const createIndexSpy = jest.spyOn(mockCollection, 'createIndex');

      const svc = new MongoImageDataService(mockMongoDBClient);
      await expect(() => svc['makeImageCollection']()).rejects.toThrow(
        testError,
      );

      expect(createSpy).toHaveBeenCalledTimes(0);
      expect(createIndexSpy).toHaveBeenCalledTimes(0);
    });

    test('throws an error if db.createCollection throws an error', async () => {
      const createSpy = jest.spyOn(mockDb, 'createCollection');
      createSpy.mockImplementationOnce(() => {
        throw new Error(testError);
      });

      const createIndexSpy = jest.spyOn(mockCollection, 'createIndex');

      const svc = new MongoImageDataService(mockMongoDBClient);
      await expect(() => svc['makeImageCollection']()).rejects.toThrow(
        testError,
      );

      expect(createSpy).toHaveBeenCalledTimes(1);
      expect(createIndexSpy).toHaveBeenCalledTimes(0);
    });

    test('throws an error if db.createIndex throws an error', async () => {
      const createSpy = jest.spyOn(mockDb, 'createCollection');
      createSpy.mockImplementationOnce(async () => mockCollection);

      const createIndexSpy = jest.spyOn(mockCollection, 'createIndex');
      createIndexSpy.mockImplementationOnce(() => {
        throw new Error(testError);
      });

      const svc = new MongoImageDataService(mockMongoDBClient);
      await expect(() => svc['makeImageCollection']()).rejects.toThrow(
        testError,
      );

      expect(createSpy).toHaveBeenCalledTimes(1);
      expect(createIndexSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('getImageByName', () => {
    test('returns the value from findOne', async () => {
      const findOneSpy = jest.spyOn(mockCollection, 'findOne');
      findOneSpy.mockImplementationOnce(async () => imageDetails);

      const svc = new MongoImageDataService(mockMongoDBClient);
      const result = await svc.getImageByName('test');

      expect(result.imageId).toBe(imageDetails.imageId);
      expect(result.originalFilename).toBe(imageDetails.originalFilename);
      expect(result.isPrivate).toBe(imageDetails.isPrivate);
      expect(result.authorId).toBe(imageDetails.authorId);
      expect(result.dateAdded).toBe(imageDetails.dateAdded.toISOString());

      const images = result.files.map((file) => file.toJSON());
      expect(images).toStrictEqual(imageDetails.files);
    });

    test('throws an error when findOne throws an error', async () => {
      const findOneSpy = jest.spyOn(mockCollection, 'findOne');
      findOneSpy.mockImplementationOnce(async () => {
        throw new Error(testError);
      });

      const svc = new MongoImageDataService(mockMongoDBClient);
      await expect(() => svc.getImageByName('test')).rejects.toThrow(testError);
    });

    test('throws an error when findOne returns null', async () => {
      const findOneSpy = jest.spyOn(mockCollection, 'findOne');
      findOneSpy.mockImplementationOnce(async () => null);

      const svc = new MongoImageDataService(mockMongoDBClient);
      await expect(() => svc.getImageByName('test')).rejects.toThrow(
        new NotFoundError('Result is null'),
      );
    });

    test('throws an error when the value returned does not conform to ImageDetails', async () => {
      const findOneSpy = jest.spyOn(mockCollection, 'findOne');
      findOneSpy.mockImplementationOnce(async () => ({}));

      const svc = new MongoImageDataService(mockMongoDBClient);
      await expect(() => svc.getImageByName('test')).rejects.toThrow();
    });
  });

  describe('deleteImage', () => {
    test('calls findOneAndDelete and returns the value that was deleted', async () => {
      const svc = new MongoImageDataService(mockMongoDBClient);

      const deleteOneSpy = jest.spyOn(mockCollection, 'findOneAndDelete');
      deleteOneSpy.mockImplementationOnce(async () => ({
        value: imageDetails,
      }));

      const result = await svc.deleteImage({ id: objectId1 });

      expect(deleteOneSpy).toHaveBeenCalledTimes(1);

      expect(result.imageId).toBe(imageDetails.imageId);
      expect(result.originalFilename).toBe(imageDetails.originalFilename);
      expect(result.isPrivate).toBe(imageDetails.isPrivate);
      expect(result.authorId).toBe(imageDetails.authorId);
      expect(result.dateAdded).toBe(imageDetails.dateAdded.toISOString());
    });

    test('calls findOneAndDelete with id if provided', async () => {
      const svc = new MongoImageDataService(mockMongoDBClient);

      const deleteOneSpy = jest.spyOn(mockCollection, 'findOneAndDelete');
      deleteOneSpy.mockImplementationOnce(async () => ({
        value: imageDetails,
      }));

      await svc.deleteImage({ id: objectId1 });

      expect(deleteOneSpy).toHaveBeenCalledWith({
        _id: new ObjectId(objectId1),
      });
    });

    test('calls findOneAndDelete with filename if provided', async () => {
      const svc = new MongoImageDataService(mockMongoDBClient);

      const deleteOneSpy = jest.spyOn(mockCollection, 'findOneAndDelete');
      deleteOneSpy.mockImplementationOnce(async () => ({
        value: imageDetails,
      }));

      const filename = 'filename.jpg';

      await svc.deleteImage({ filename });

      expect(deleteOneSpy).toHaveBeenCalledWith({
        'files.filename': filename,
      });
    });

    test('calls findOneAndDelete with originalFilename if provided', async () => {
      const svc = new MongoImageDataService(mockMongoDBClient);

      const deleteOneSpy = jest.spyOn(mockCollection, 'findOneAndDelete');
      deleteOneSpy.mockImplementationOnce(async () => ({
        value: imageDetails,
      }));

      const originalFilename = 'filename.jpg';

      await svc.deleteImage({ originalFilename });

      expect(deleteOneSpy).toHaveBeenCalledWith({
        originalFilename,
      });
    });

    test('throws an error if id, filename or originalFilename are not provided', async () => {
      const svc = new MongoImageDataService(mockMongoDBClient);

      const deleteOneSpy = jest.spyOn(mockCollection, 'findOneAndDelete');

      await expect(() => svc.deleteImage({})).rejects.toThrow(
        'Invalid delete image options passed. No options passed',
      );

      expect(deleteOneSpy).toHaveBeenCalledTimes(0);
    });

    test('throws an error if findOneAndDelete throws an option', async () => {
      const svc = new MongoImageDataService(mockMongoDBClient);

      const deleteOneSpy = jest.spyOn(mockCollection, 'findOneAndDelete');
      deleteOneSpy.mockImplementationOnce(async () => {
        throw new Error(testError);
      });

      const originalFilename = 'filename.jpg';
      const input = { originalFilename };

      await expect(() => svc.deleteImage(input)).rejects.toThrow(testError);

      expect(deleteOneSpy).toHaveBeenCalledTimes(1);
      expect(deleteOneSpy).toHaveBeenCalledWith(input);
    });

    test('throws an error if findOneAndDelete returns a null value', async () => {
      const svc = new MongoImageDataService(mockMongoDBClient);

      const deleteOneSpy = jest.spyOn(mockCollection, 'findOneAndDelete');
      deleteOneSpy.mockImplementationOnce(async () => ({
        value: null,
      }));

      const originalFilename = 'filename.jpg';
      const input = { originalFilename };

      await expect(() => svc.deleteImage(input)).rejects.toThrow(
        'Invalid delete image options passed',
      );

      expect(deleteOneSpy).toHaveBeenCalledTimes(1);
      expect(deleteOneSpy).toHaveBeenCalledWith(input);
    });

    test('throws an error if findOneAndDelete returns an invalid input', async () => {
      const svc = new MongoImageDataService(mockMongoDBClient);

      const deleteOneSpy = jest.spyOn(mockCollection, 'findOneAndDelete');
      deleteOneSpy.mockImplementation(async () => ({}));

      const originalFilename = 'filename.jpg';
      const input = { originalFilename };

      await expect(() => svc.deleteImage(input)).rejects.toThrow(
        'Invalid Image Details Input',
      );

      expect(deleteOneSpy).toHaveBeenCalledTimes(1);
      expect(deleteOneSpy).toHaveBeenCalledWith(input);
    });
  });

  describe('rollBackAdditions', () => {
    test('awaits the completion of delete operations for all images passed in', async () => {
      const svc = new MongoImageDataService(mockMongoDBClient);

      const nid = NewImageDetails.fromJSON({
        ...imageDetails,
        dateAdded: imageDetails.dateAdded.toISOString(),
      });

      const deleteOneSpy = jest.spyOn(mockCollection, 'deleteOne');

      await svc.rollBackAdditions([nid]);

      expect(deleteOneSpy).toHaveBeenCalledTimes(1);
      expect(deleteOneSpy).toHaveBeenCalledWith({
        originalFilename: imageDetails.originalFilename,
      });
    });

    test('runs deleteOne for every image passed in', async () => {
      const svc = new MongoImageDataService(mockMongoDBClient);

      const nid1 = NewImageDetails.fromJSON({
        ...imageDetails,
        dateAdded: imageDetails.dateAdded.toISOString(),
      });

      const originalFilename2 = 'originalFilename2';
      const nid2 = NewImageDetails.fromJSON({
        ...imageDetails,
        originalFilename: originalFilename2,
        dateAdded: imageDetails.dateAdded.toISOString(),
      });

      const deleteOneSpy = jest.spyOn(mockCollection, 'deleteOne');

      await svc.rollBackAdditions([nid1, nid2]);

      expect(deleteOneSpy).toHaveBeenCalledTimes(2);
      expect(deleteOneSpy).toHaveBeenNthCalledWith(1, {
        originalFilename: imageDetails.originalFilename,
      });
      expect(deleteOneSpy).toHaveBeenNthCalledWith(2, {
        originalFilename: originalFilename2,
      });
    });

    test('still runs all promises, if deleteOne fails for one', async () => {
      const svc = new MongoImageDataService(mockMongoDBClient);

      const nid1 = NewImageDetails.fromJSON({
        ...imageDetails,
        dateAdded: imageDetails.dateAdded.toISOString(),
      });

      const originalFilename2 = 'originalFilename2';
      const nid2 = NewImageDetails.fromJSON({
        ...imageDetails,
        originalFilename: originalFilename2,
        dateAdded: imageDetails.dateAdded.toISOString(),
      });

      const deleteOneSpy = jest.spyOn(mockCollection, 'deleteOne');
      deleteOneSpy.mockImplementationOnce(async () => {
        throw new Error(testError);
      });

      await svc.rollBackAdditions([nid1, nid2]);

      expect(deleteOneSpy).toHaveBeenCalledTimes(2);
      expect(deleteOneSpy).toHaveBeenNthCalledWith(1, {
        originalFilename: imageDetails.originalFilename,
      });
      expect(deleteOneSpy).toHaveBeenNthCalledWith(2, {
        originalFilename: originalFilename2,
      });
    });
  });

  describe('addImages', () => {
    test('runs insertMany for all images passed to the function and returns all the ImageDetails', async () => {
      const nid1 = NewImageDetails.fromJSON({
        ...imageDetails,
        dateAdded: imageDetails.dateAdded.toISOString(),
      });

      const originalFilename2 = 'originalFilename2';
      const nid2 = NewImageDetails.fromJSON({
        ...imageDetails,
        originalFilename: originalFilename2,
        dateAdded: imageDetails.dateAdded.toISOString(),
      });

      const id1 = ImageDetails.fromNewImageDetails(objectId1, nid1);
      const id2 = ImageDetails.fromNewImageDetails(objectId2, nid2);

      const insertManySpy = jest.spyOn(mockCollection, 'insertMany');
      insertManySpy.mockImplementationOnce(async (input) => {
        input[0]._id = new ObjectId(objectId1);
        input[1]._id = new ObjectId(objectId2);

        return {
          acknowledged: true,
          insertedCount: 2,
        };
      });

      const svc = new MongoImageDataService(mockMongoDBClient);
      const result = await svc.addImages([nid1, nid2]);

      expect(insertManySpy).toHaveBeenCalledTimes(1);
      expect(result[0].toJSON()).toStrictEqual(id1.toJSON());
      expect(result[1].toJSON()).toStrictEqual(id2.toJSON());
    });

    test('throws an error if acknowledged is not true', async () => {
      errorSpy.mockImplementationOnce(() => {});
      const nid1 = NewImageDetails.fromJSON({
        ...imageDetails,
        dateAdded: imageDetails.dateAdded.toISOString(),
      });

      const originalFilename2 = 'originalFilename2';
      const nid2 = NewImageDetails.fromJSON({
        ...imageDetails,
        originalFilename: originalFilename2,
        dateAdded: imageDetails.dateAdded.toISOString(),
      });

      const insertManySpy = jest.spyOn(mockCollection, 'insertMany');
      insertManySpy.mockImplementationOnce(async (input) => {
        input[0]._id = new ObjectId(objectId1);
        input[1]._id = new ObjectId(objectId2);

        return {
          acknowledged: false,
          insertedCount: 2,
        };
      });

      const svc = new MongoImageDataService(mockMongoDBClient);
      await expect(() => svc.addImages([nid1, nid2])).rejects.toThrow();

      expect(insertManySpy).toHaveBeenCalledTimes(1);
    });

    test('throws an error if insertedCount does not match the quantity of images passed in', async () => {
      errorSpy.mockImplementationOnce(() => {});
      const nid1 = NewImageDetails.fromJSON({
        ...imageDetails,
        dateAdded: imageDetails.dateAdded.toISOString(),
      });

      const originalFilename2 = 'originalFilename2';
      const nid2 = NewImageDetails.fromJSON({
        ...imageDetails,
        originalFilename: originalFilename2,
        dateAdded: imageDetails.dateAdded.toISOString(),
      });

      const insertManySpy = jest.spyOn(mockCollection, 'insertMany');
      insertManySpy.mockImplementationOnce(async (input) => {
        input[0]._id = new ObjectId(objectId1);
        input[1]._id = new ObjectId(objectId2);

        return {
          acknowledged: true,
          insertedCount: 1,
        };
      });

      const svc = new MongoImageDataService(mockMongoDBClient);
      await expect(() => svc.addImages([nid1, nid2])).rejects.toThrow();

      expect(insertManySpy).toHaveBeenCalledTimes(1);
    });

    test('throws an error if insertMany throws an error', async () => {
      errorSpy.mockImplementationOnce(() => {});
      const nid1 = NewImageDetails.fromJSON({
        ...imageDetails,
        dateAdded: imageDetails.dateAdded.toISOString(),
      });

      const originalFilename2 = 'originalFilename2';
      const nid2 = NewImageDetails.fromJSON({
        ...imageDetails,
        originalFilename: originalFilename2,
        dateAdded: imageDetails.dateAdded.toISOString(),
      });

      const insertManySpy = jest.spyOn(mockCollection, 'insertMany');
      insertManySpy.mockImplementationOnce(async () => {
        throw new Error(testError);
      });

      const svc = new MongoImageDataService(mockMongoDBClient);
      await expect(() => svc.addImages([nid1, nid2])).rejects.toThrow();

      expect(insertManySpy).toHaveBeenCalledTimes(1);
    });

    test('throws an error if imageCollection getter throws an error', async () => {
      errorSpy.mockImplementationOnce(() => {});
      const nid1 = NewImageDetails.fromJSON({
        ...imageDetails,
        dateAdded: imageDetails.dateAdded.toISOString(),
      });

      const originalFilename2 = 'originalFilename2';
      const nid2 = NewImageDetails.fromJSON({
        ...imageDetails,
        originalFilename: originalFilename2,
        dateAdded: imageDetails.dateAdded.toISOString(),
      });

      mockCollectionSpy.mockImplementationOnce(async () => {
        throw new Error(testError);
      });

      const insertManySpy = jest.spyOn(mockCollection, 'insertMany');
      insertManySpy.mockImplementationOnce(async () => ({}));

      const svc = new MongoImageDataService(mockMongoDBClient);
      await expect(() => svc.addImages([nid1, nid2])).rejects.toThrow();

      expect(insertManySpy).toHaveBeenCalledTimes(0);
    });

    test('throws an error if ImageDetails.fromMongo throws an error', async () => {
      errorSpy.mockImplementationOnce(() => {});
      const nid1 = NewImageDetails.fromJSON({
        ...imageDetails,
        dateAdded: imageDetails.dateAdded.toISOString(),
      });

      const originalFilename2 = 'originalFilename2';
      const nid2 = NewImageDetails.fromJSON({
        ...imageDetails,
        originalFilename: originalFilename2,
        dateAdded: imageDetails.dateAdded.toISOString(),
      });

      const insertManySpy = jest.spyOn(mockCollection, 'insertMany');
      insertManySpy.mockImplementationOnce(async () => ({
        acknowledged: true,
        insertedCount: 2,
      }));

      const svc = new MongoImageDataService(mockMongoDBClient);
      await expect(() => svc.addImages([nid1, nid2])).rejects.toThrow();

      expect(insertManySpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('initFromConfig', () => {
    test('creates a service with a client. Does not run makeImageCollection if images exists in the collections', async () => {
      const imageDataCol = new Collection<Document>();
      const imgNameSpy = jest.spyOn(imageDataCol, 'collectionName', 'get');
      imgNameSpy.mockReturnValue('images');

      const collection1 = new Collection<Document>();
      const col1NameSpy = jest.spyOn(collection1, 'collectionName', 'get');
      col1NameSpy.mockReturnValue('collection1');

      const collection2 = new Collection<Document>();
      const col2NameSpy = jest.spyOn(collection2, 'collectionName', 'get');
      col2NameSpy.mockReturnValue('collection2');

      const collectionsSpy = jest.spyOn(mockDb, 'collections');
      collectionsSpy.mockImplementationOnce(() =>
        Promise.resolve([imageDataCol, collection1, collection2]),
      );

      const createSpy = jest.spyOn(mockDb, 'createCollection');
      createSpy.mockImplementationOnce(async () => mockCollection);

      await MongoImageDataService.initFromConfig(
        new ConfigService(),
        mockMongoDBClient,
      );

      expect(clientDbSpy).toHaveBeenCalledTimes(1);
      expect(collectionsSpy).toHaveBeenCalledTimes(1);
      expect(imgNameSpy).toHaveBeenCalledTimes(1);
      expect(col1NameSpy).toHaveBeenCalledTimes(1);
      expect(col2NameSpy).toHaveBeenCalledTimes(1);
      expect(createSpy).toHaveBeenCalledTimes(0);
    });

    test('creates a service with a client. Runs makeImageCollection if images does not exist in the collections', async () => {
      const collection1 = new Collection<Document>();
      const col1NameSpy = jest.spyOn(collection1, 'collectionName', 'get');
      col1NameSpy.mockReturnValue('collection1');

      const collection2 = new Collection<Document>();
      const col2NameSpy = jest.spyOn(collection2, 'collectionName', 'get');
      col2NameSpy.mockReturnValue('collection2');

      const collectionsSpy = jest.spyOn(mockDb, 'collections');
      collectionsSpy.mockImplementationOnce(() =>
        Promise.resolve([collection1, collection2]),
      );

      const createSpy = jest.spyOn(mockDb, 'createCollection');
      createSpy.mockImplementationOnce(async () => mockCollection);

      await MongoImageDataService.initFromConfig(
        new ConfigService(),
        mockMongoDBClient,
      );

      expect(clientDbSpy).toHaveBeenCalledTimes(2);
      expect(collectionsSpy).toHaveBeenCalledTimes(1);
      expect(col1NameSpy).toHaveBeenCalledTimes(1);
      expect(col2NameSpy).toHaveBeenCalledTimes(1);
      expect(createSpy).toHaveBeenCalledTimes(1);
    });

    test('Throws an error if createCollection throws an error', async () => {
      const collection1 = new Collection<Document>();
      const col1NameSpy = jest.spyOn(collection1, 'collectionName', 'get');
      col1NameSpy.mockReturnValue('collection1');

      const collection2 = new Collection<Document>();
      const col2NameSpy = jest.spyOn(collection2, 'collectionName', 'get');
      col2NameSpy.mockReturnValue('collection2');

      const collectionsSpy = jest.spyOn(mockDb, 'collections');
      collectionsSpy.mockImplementationOnce(() =>
        Promise.resolve([collection1, collection2]),
      );

      const createSpy = jest.spyOn(mockDb, 'createCollection');
      createSpy.mockImplementationOnce(async () => {
        throw new Error(testError);
      });

      await expect(() =>
        MongoImageDataService.initFromConfig(
          new ConfigService(),
          mockMongoDBClient,
        ),
      ).rejects.toThrow(testError);

      expect(clientDbSpy).toHaveBeenCalledTimes(2);
      expect(collectionsSpy).toHaveBeenCalledTimes(1);
      expect(col1NameSpy).toHaveBeenCalledTimes(1);
      expect(col2NameSpy).toHaveBeenCalledTimes(1);
      expect(createSpy).toHaveBeenCalledTimes(1);
    });

    test('Throws an error if createIndex throws an error', async () => {
      const collection1 = new Collection<Document>();
      const col1NameSpy = jest.spyOn(collection1, 'collectionName', 'get');
      col1NameSpy.mockReturnValue('collection1');

      const collection2 = new Collection<Document>();
      const col2NameSpy = jest.spyOn(collection2, 'collectionName', 'get');
      col2NameSpy.mockReturnValue('collection2');

      const collectionsSpy = jest.spyOn(mockDb, 'collections');
      collectionsSpy.mockImplementationOnce(() =>
        Promise.resolve([collection1, collection2]),
      );

      const createSpy = jest.spyOn(mockDb, 'createCollection');
      createSpy.mockImplementationOnce(async () => mockCollection);

      const createIndexSpy = jest.spyOn(mockCollection, 'createIndex');
      createIndexSpy.mockImplementationOnce(async () => {
        throw new Error(testError);
      });

      await expect(() =>
        MongoImageDataService.initFromConfig(
          new ConfigService(),
          mockMongoDBClient,
        ),
      ).rejects.toThrow(testError);

      expect(clientDbSpy).toHaveBeenCalledTimes(2);
      expect(collectionsSpy).toHaveBeenCalledTimes(1);
      expect(col1NameSpy).toHaveBeenCalledTimes(1);
      expect(col2NameSpy).toHaveBeenCalledTimes(1);
      expect(createSpy).toHaveBeenCalledTimes(1);
      expect(createIndexSpy).toHaveBeenCalledTimes(1);
    });

    test('Throws an error if _mongoDBClient.db', async () => {
      const imageDataCol = new Collection<Document>();
      const imgNameSpy = jest.spyOn(imageDataCol, 'collectionName', 'get');
      imgNameSpy.mockReturnValue('images');

      const collection1 = new Collection<Document>();
      const col1NameSpy = jest.spyOn(collection1, 'collectionName', 'get');
      col1NameSpy.mockReturnValue('collection1');

      const collection2 = new Collection<Document>();
      const col2NameSpy = jest.spyOn(collection2, 'collectionName', 'get');
      col2NameSpy.mockReturnValue('collection2');

      clientDbSpy.mockImplementationOnce(() => {
        throw new Error(testError);
      });

      const collectionsSpy = jest.spyOn(mockDb, 'collections');

      await expect(() =>
        MongoImageDataService.initFromConfig(
          new ConfigService(),
          mockMongoDBClient,
        ),
      ).rejects.toThrow();

      expect(clientDbSpy).toHaveBeenCalledTimes(1);
      expect(collectionsSpy).toHaveBeenCalledTimes(0);
      expect(imgNameSpy).toHaveBeenCalledTimes(0);
      expect(col1NameSpy).toHaveBeenCalledTimes(0);
      expect(col2NameSpy).toHaveBeenCalledTimes(0);
    });

    test('throws an error if db.collections throws an error', async () => {
      const imageDataCol = new Collection<Document>();
      const imgNameSpy = jest.spyOn(imageDataCol, 'collectionName', 'get');
      imgNameSpy.mockReturnValue('images');

      const collection1 = new Collection<Document>();
      const col1NameSpy = jest.spyOn(collection1, 'collectionName', 'get');
      col1NameSpy.mockReturnValue('collection1');

      const collection2 = new Collection<Document>();
      const col2NameSpy = jest.spyOn(collection2, 'collectionName', 'get');
      col2NameSpy.mockReturnValue('collection2');

      const collectionsSpy = jest.spyOn(mockDb, 'collections');
      collectionsSpy.mockImplementation(() => {
        throw new Error(testError);
      });

      await expect(() =>
        MongoImageDataService.initFromConfig(
          new ConfigService(),
          mockMongoDBClient,
        ),
      ).rejects.toThrow();

      expect(clientDbSpy).toHaveBeenCalledTimes(1);
      expect(collectionsSpy).toHaveBeenCalledTimes(1);
      expect(imgNameSpy).toHaveBeenCalledTimes(0);
      expect(col1NameSpy).toHaveBeenCalledTimes(0);
      expect(col2NameSpy).toHaveBeenCalledTimes(0);
    });
  });
});
