import { Db, MongoClient, Collection } from 'mongodb';

import { MongoImageDataService } from '@/src/image/image_data.mongo.service';
import { MongoDBClient } from '@/src/utils/mongodb_client_class';

// jest.mock('mongodb');
jest.mock('mongodb', () => {
  function MockDb() {}
  MockDb.prototype.collection = jest.fn();
  MockDb.prototype.collections = jest.fn();
  MockDb.prototype.createCollection = jest.fn();

  function MockCollection() {}
  MockCollection.prototype.createIndex = jest.fn();

  const MockMongoClient = jest.fn();

  return {
    Db: MockDb,
    MongoClient: MockMongoClient,
    Collection: MockCollection,
  };
});

const uri = 'uri';
const dbName = 'dbName';
const testError = 'test error';

function makeNewMockDocument() {
  const collection = new Collection<Document>();
  Object.defineProperty(collection, 'collectionName', {
    configurable: true,
    get: jest.fn(),
    set: jest.fn(),
  });

  return collection;
}

describe('MongoImageDataService', () => {
  let mockMongoDBClient: MongoDBClient;
  let mockMongoClient: MongoClient;
  let mockDb: Db;
  let mockCollection: Collection;

  let mockCollectionSpy: jest.SpyInstance;
  let clientDbSpy: jest.SpyInstance;

  beforeEach(() => {
    (Db.prototype.collection as unknown as jest.Mock).mockClear();
    (Db.prototype.collections as unknown as jest.Mock).mockClear();
    (Db.prototype.createCollection as unknown as jest.Mock).mockClear();
    (MongoClient as unknown as jest.Mock).mockClear();
    (Collection.prototype.createIndex as unknown as jest.Mock).mockClear();

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
      const imageDataCol = makeNewMockDocument();
      const imgNameSpy = jest.spyOn(imageDataCol, 'collectionName', 'get');
      imgNameSpy.mockReturnValue('images');

      const collection1 = makeNewMockDocument();
      const col1NameSpy = jest.spyOn(collection1, 'collectionName', 'get');
      col1NameSpy.mockReturnValue('collection1');

      const collection2 = makeNewMockDocument();
      const col2NameSpy = jest.spyOn(collection2, 'collectionName', 'get');
      col2NameSpy.mockReturnValue('collection2');

      const collectionsSpy = jest.spyOn(mockDb, 'collections');
      collectionsSpy.mockImplementationOnce(() => {
        console.log('contains true');
        return Promise.resolve([imageDataCol, collection1, collection2]);
      });

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
      const collection1 = makeNewMockDocument();
      const col1NameSpy = jest.spyOn(collection1, 'collectionName', 'get');
      col1NameSpy.mockReturnValue('collection1');

      const collection2 = makeNewMockDocument();
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
      const imageDataCol = makeNewMockDocument();
      const imgNameSpy = jest.spyOn(imageDataCol, 'collectionName', 'get');
      imgNameSpy.mockReturnValue('images');

      const collection1 = makeNewMockDocument();
      const col1NameSpy = jest.spyOn(collection1, 'collectionName', 'get');
      col1NameSpy.mockReturnValue('collection1');

      const collection2 = makeNewMockDocument();
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
      const imageDataCol = makeNewMockDocument();
      const imgNameSpy = jest.spyOn(imageDataCol, 'collectionName', 'get');
      imgNameSpy.mockReturnValue('images');

      const collection1 = makeNewMockDocument();
      const col1NameSpy = jest.spyOn(collection1, 'collectionName', 'get');
      col1NameSpy.mockReturnValue('collection1');

      const collection2 = makeNewMockDocument();
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

  describe('getImageByName', () => {});

  describe('deleteImage', () => {});

  describe('rollBackAdditions', () => {});

  describe('addImages', () => {});

  describe('initFromConfig', () => {});
});
