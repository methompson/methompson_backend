import { ConfigService } from '@nestjs/config';
import {
  Db,
  MongoClient,
  Collection,
  ObjectId,
  MongoServerError,
  AggregationCursor,
} from 'mongodb';

import { MongoBlogService } from '@/src/blog/blog.service.mongo';
import { MongoDBClient } from '@/src/utils/mongodb_client_class';
import {
  BlogPost,
  BlogStatus,
  NewBlogPost,
} from '@/src/models/blog_post_model';
import { InvalidInputError, NotFoundError } from '@/src/errors';

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
  MockCollection.prototype.insertOne = jest.fn();
  MockCollection.prototype.aggregate = jest.fn();

  const MockMongoClient = jest.fn();

  function MockAggregationCursor() {}
  MockAggregationCursor.prototype.toArray = jest.fn();

  return {
    ...originalModule,
    Db: MockDb,
    MongoClient: MockMongoClient,
    Collection: MockCollection,
    AggregationCursor: MockAggregationCursor,
  };
});

const uri = 'uri';
const dbName = 'dbName';
const testError = 'test error';

const errorSpy = jest.spyOn(console, 'error');
errorSpy.mockImplementation(() => {});
const logSpy = jest.spyOn(console, 'log');

const objectId1 = 'abcdef1234567890abcdef12';
const objectId2 = '1234567890abcdef12345678';
const objectId3 = '0987654321fedcba09876543';
const objectId4 = 'fedcba0987654321fedcba09';

const post1 = new BlogPost(
  objectId1,
  'title1',
  'slug1',
  'body1',
  ['tag1'],
  'authorId1',
  new Date(1),
  BlogStatus.Posted,
  {},
);

const post2 = new BlogPost(
  objectId2,
  'title2',
  'slug2',
  'body2',
  ['tag2'],
  'authorId2',
  new Date(2),
  BlogStatus.Posted,
  {},
);

const post3 = new BlogPost(
  objectId3,
  'title3',
  'slug3',
  'body3',
  ['tag3'],
  'authorId3',
  new Date(3),
  BlogStatus.Draft,
  {},
);

const post4 = new BlogPost(
  objectId4,
  'title4',
  'slug4',
  'body4',
  ['tag4'],
  'authorId4',
  new Date(4),
  BlogStatus.Draft,
  {},
);

describe('MongoBlogService', () => {
  let mockMongoDBClient: MongoDBClient;
  let mockMongoClient: MongoClient;
  let mockDb: Db;
  let mockCollection: Collection;

  let mockCollectionSpy: jest.SpyInstance;
  let mockCollectionsSpy: jest.SpyInstance;
  let clientDbSpy: jest.SpyInstance;

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
    (Collection.prototype.insertOne as unknown as jest.Mock).mockReset();
    (Collection.prototype.aggregate as unknown as jest.Mock).mockReset();

    (AggregationCursor.prototype.toArray as unknown as jest.Mock).mockReset();

    mockMongoClient = new MongoClient(dbName);
    mockDb = new Db(mockMongoClient, dbName);

    mockCollection = new Collection();
    mockCollectionSpy = jest.spyOn(mockDb, 'collection');
    mockCollectionSpy.mockReturnValue(mockCollection);

    const blogCollection = new Collection();
    const blogCollectionNameSpy = jest.spyOn(
      blogCollection,
      'collectionName',
      'get',
    );
    blogCollectionNameSpy.mockReturnValue('blogPosts');
    mockCollectionsSpy = jest.spyOn(mockDb, 'collections');
    mockCollectionsSpy.mockImplementation(async () => [blogCollection]);

    mockMongoDBClient = new MongoDBClient(uri, dbName);
    clientDbSpy = jest.spyOn(mockMongoDBClient, 'db', 'get');
    clientDbSpy.mockReturnValue(Promise.resolve(mockDb));
  });

  describe('blogCollection', () => {
    test('Returns the appropriate value', async () => {
      const mockMongoClient = new MongoClient(dbName);
      const mockDb = new Db(mockMongoClient, dbName);

      const mockCollection = new Collection();
      const mockCollectionSpy = jest.spyOn(mockDb, 'collection');
      mockCollectionSpy.mockReturnValue(mockCollection);

      const client = new MongoDBClient(uri, dbName);
      const clientDbSpy = jest.spyOn(client, 'db', 'get');
      clientDbSpy.mockReturnValue(Promise.resolve(mockDb));

      const svc = new MongoBlogService(client);
      const val = await svc['blogCollection'];

      expect(val).toBe(mockCollection);

      expect(clientDbSpy).toHaveBeenCalledTimes(1);
      expect(mockCollectionSpy).toHaveBeenCalledTimes(1);
    });

    test('Throws an error when collection throws an error', async () => {
      mockCollectionSpy.mockImplementationOnce(async () => {
        throw new Error(testError);
      });

      const svc = new MongoBlogService(mockMongoDBClient);
      expect(() => svc['blogCollection']).rejects.toThrow(testError);
    });

    test('Throws an error when _mongoDBClient.db throws an error', async () => {
      clientDbSpy.mockImplementationOnce(async () => {
        throw new Error(testError);
      });

      const svc = new MongoBlogService(mockMongoDBClient);
      expect(() => svc['blogCollection']).rejects.toThrow(testError);
    });
  });

  describe('mongoDBClient', () => {
    test('Returns the value assigned to _mongoDBClient', () => {
      const svc = new MongoBlogService(mockMongoDBClient);
      expect(svc.mongoDBClient).toBe(mockMongoDBClient);
    });
  });

  describe('containsBlogCollection', () => {
    test('returns true if the collection is included in the database', async () => {
      const blogDataCol = new Collection<Document>();
      const blogNameSpy = jest.spyOn(blogDataCol, 'collectionName', 'get');
      blogNameSpy.mockReturnValue('blogPosts');

      const collection1 = new Collection<Document>();
      const col1NameSpy = jest.spyOn(collection1, 'collectionName', 'get');
      col1NameSpy.mockReturnValue('collection1');

      const collection2 = new Collection<Document>();
      const col2NameSpy = jest.spyOn(collection2, 'collectionName', 'get');
      col2NameSpy.mockReturnValue('collection2');

      mockCollectionsSpy.mockImplementation(async () => [
        blogDataCol,
        collection1,
        collection2,
      ]);

      const svc = new MongoBlogService(mockMongoDBClient);
      const result = await svc['containsBlogCollection']();

      expect(result).toBe(true);

      expect(clientDbSpy).toHaveBeenCalledTimes(1);
      expect(mockCollectionsSpy).toHaveBeenCalledTimes(1);
      expect(blogNameSpy).toHaveBeenCalledTimes(1);
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

      mockCollectionsSpy.mockImplementationOnce(async () => [
        collection1,
        collection2,
      ]);

      const svc = new MongoBlogService(mockMongoDBClient);
      const result = await svc['containsBlogCollection']();

      expect(result).toBe(false);

      expect(clientDbSpy).toHaveBeenCalledTimes(1);
      expect(mockCollectionsSpy).toHaveBeenCalledTimes(1);
      expect(col1NameSpy).toHaveBeenCalledTimes(1);
      expect(col2NameSpy).toHaveBeenCalledTimes(1);
    });

    test('throws an error if _mongoDBClient.db throws an error', async () => {
      const blogDataCol = new Collection<Document>();
      const blogNameSpy = jest.spyOn(blogDataCol, 'collectionName', 'get');
      blogNameSpy.mockReturnValue('blogPosts');

      const collection1 = new Collection<Document>();
      const col1NameSpy = jest.spyOn(collection1, 'collectionName', 'get');
      col1NameSpy.mockReturnValue('collection1');

      const collection2 = new Collection<Document>();
      const col2NameSpy = jest.spyOn(collection2, 'collectionName', 'get');
      col2NameSpy.mockReturnValue('collection2');

      clientDbSpy.mockImplementationOnce(() => {
        throw new Error(testError);
      });

      const svc = new MongoBlogService(mockMongoDBClient);
      await expect(() => svc['containsBlogCollection']()).rejects.toThrow(
        testError,
      );

      expect(clientDbSpy).toHaveBeenCalledTimes(1);
      expect(mockCollectionsSpy).toHaveBeenCalledTimes(0);
      expect(blogNameSpy).toHaveBeenCalledTimes(0);
      expect(col1NameSpy).toHaveBeenCalledTimes(0);
      expect(col2NameSpy).toHaveBeenCalledTimes(0);
    });

    test('throws an error if db.collections throws an error', async () => {
      const blogDataCol = new Collection<Document>();
      const blogNameSpy = jest.spyOn(blogDataCol, 'collectionName', 'get');
      blogNameSpy.mockReturnValue('blogPosts');

      const collection1 = new Collection<Document>();
      const col1NameSpy = jest.spyOn(collection1, 'collectionName', 'get');
      col1NameSpy.mockReturnValue('collection1');

      const collection2 = new Collection<Document>();
      const col2NameSpy = jest.spyOn(collection2, 'collectionName', 'get');
      col2NameSpy.mockReturnValue('collection2');

      mockCollectionsSpy.mockImplementation(() => {
        throw new Error(testError);
      });

      const svc = new MongoBlogService(mockMongoDBClient);
      await expect(() => svc['containsBlogCollection']()).rejects.toThrow(
        testError,
      );

      expect(clientDbSpy).toHaveBeenCalledTimes(1);
      expect(mockCollectionsSpy).toHaveBeenCalledTimes(1);
      expect(blogNameSpy).toHaveBeenCalledTimes(0);
      expect(col1NameSpy).toHaveBeenCalledTimes(0);
      expect(col2NameSpy).toHaveBeenCalledTimes(0);
    });
  });

  describe('makeBlogCollection', () => {
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

      const svc = new MongoBlogService(mockMongoDBClient);
      await svc['makeBlogCollection']();

      expect(createSpy).toHaveBeenCalledTimes(1);
      expect(createIndexSpy).toHaveBeenCalledTimes(1);
      expect(createIndexSpy).toHaveBeenCalledWith(
        { slug: 1 },
        { unique: true },
      );
    });

    test('throws an error if _mongoDBClient.db throws an error', async () => {
      clientDbSpy.mockImplementationOnce(() => {
        throw new Error(testError);
      });

      const createSpy = jest.spyOn(mockDb, 'createCollection');
      const createIndexSpy = jest.spyOn(mockCollection, 'createIndex');

      const svc = new MongoBlogService(mockMongoDBClient);
      await expect(() => svc['makeBlogCollection']()).rejects.toThrow(
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

      const svc = new MongoBlogService(mockMongoDBClient);
      await expect(() => svc['makeBlogCollection']()).rejects.toThrow(
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

      const svc = new MongoBlogService(mockMongoDBClient);
      await expect(() => svc['makeBlogCollection']()).rejects.toThrow(
        testError,
      );

      expect(createSpy).toHaveBeenCalledTimes(1);
      expect(createIndexSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('getPosts', () => {
    test('returns a BlogPostRequestOutput with a list of blog posts', async () => {
      const cursor = new AggregationCursor<Document>();
      const toArraySpy = jest.spyOn(cursor, 'toArray');
      toArraySpy.mockImplementationOnce(async () => [
        { ...post1.toJSON(), _id: new ObjectId(objectId1) },
        { ...post2.toJSON(), _id: new ObjectId(objectId2) },
        { ...post3.toJSON(), _id: new ObjectId(objectId3) },
        { ...post4.toJSON(), _id: new ObjectId(objectId4) },
      ]);

      const aggregateSpy = jest.spyOn(mockCollection, 'aggregate');
      aggregateSpy.mockImplementationOnce(() => cursor);

      const svc = await new MongoBlogService(mockMongoDBClient).initialize();
      const result = await svc.getPosts();

      expect(aggregateSpy).toHaveBeenCalledTimes(1);
      expect(aggregateSpy).toHaveBeenCalledWith([
        { $sort: { dateAdded: -1 } },
        { $skip: 0 },
        { $limit: 11 },
      ]);
      expect(toArraySpy).toHaveBeenCalledTimes(1);

      expect(result.posts.length).toBe(4);

      const result1 = result.posts.find((el) => el.title === post1.title);
      const result2 = result.posts.find((el) => el.title === post2.title);
      const result3 = result.posts.find((el) => el.title === post3.title);
      const result4 = result.posts.find((el) => el.title === post4.title);

      expect(result1.toJSON()).toStrictEqual(post1.toJSON());
      expect(result2.toJSON()).toStrictEqual(post2.toJSON());
      expect(result3.toJSON()).toStrictEqual(post3.toJSON());
      expect(result4.toJSON()).toStrictEqual(post4.toJSON());
    });

    test('Changing the pagination affects the values passed into aggregate', async () => {
      const cursor = new AggregationCursor<Document>();
      const toArraySpy = jest.spyOn(cursor, 'toArray');
      toArraySpy.mockImplementationOnce(async () => []);

      const aggregateSpy = jest.spyOn(mockCollection, 'aggregate');
      aggregateSpy.mockImplementationOnce(() => cursor);

      const svc = await new MongoBlogService(mockMongoDBClient).initialize();
      await svc.getPosts(4, 7);

      expect(aggregateSpy).toHaveBeenCalledTimes(1);
      expect(aggregateSpy).toHaveBeenCalledWith([
        { $sort: { dateAdded: -1 } },
        { $skip: 21 },
        { $limit: 8 },
      ]);
      expect(toArraySpy).toHaveBeenCalledTimes(1);
    });

    test('morePages is false if there are the same amount of results as the pagination value', async () => {
      const cursor = new AggregationCursor<Document>();
      const toArraySpy = jest.spyOn(cursor, 'toArray');
      toArraySpy.mockImplementationOnce(async () => [
        { ...post1.toJSON(), _id: new ObjectId(objectId1) },
        { ...post2.toJSON(), _id: new ObjectId(objectId2) },
        { ...post3.toJSON(), _id: new ObjectId(objectId3) },
        { ...post4.toJSON(), _id: new ObjectId(objectId4) },
      ]);

      const aggregateSpy = jest.spyOn(mockCollection, 'aggregate');
      aggregateSpy.mockImplementationOnce(() => cursor);

      const svc = await new MongoBlogService(mockMongoDBClient).initialize();
      const result = await svc.getPosts(1, 4);

      expect(result.morePages).toBe(false);
    });

    test('morePages is true if there are more results than the pagination value', async () => {
      const cursor = new AggregationCursor<Document>();
      const toArraySpy = jest.spyOn(cursor, 'toArray');
      toArraySpy.mockImplementationOnce(async () => [
        { ...post1.toJSON(), _id: new ObjectId(objectId1) },
        { ...post2.toJSON(), _id: new ObjectId(objectId2) },
        { ...post3.toJSON(), _id: new ObjectId(objectId3) },
        { ...post4.toJSON(), _id: new ObjectId(objectId4) },
      ]);

      const aggregateSpy = jest.spyOn(mockCollection, 'aggregate');
      aggregateSpy.mockImplementationOnce(() => cursor);

      const svc = await new MongoBlogService(mockMongoDBClient).initialize();
      const result = await svc.getPosts(1, 3);

      expect(result.morePages).toBe(true);
    });

    test('returns an empty array if toArray returns an empty array', async () => {
      const cursor = new AggregationCursor<Document>();
      const toArraySpy = jest.spyOn(cursor, 'toArray');
      toArraySpy.mockImplementationOnce(async () => []);

      const aggregateSpy = jest.spyOn(mockCollection, 'aggregate');
      aggregateSpy.mockImplementationOnce(() => cursor);

      const svc = await new MongoBlogService(mockMongoDBClient).initialize();
      const result = await svc.getPosts();

      expect(aggregateSpy).toHaveBeenCalledTimes(1);
      expect(toArraySpy).toHaveBeenCalledTimes(1);

      expect(result.posts.length).toBe(0);
    });

    test('throws an error if aggregate throws an error', async () => {
      const aggregateSpy = jest.spyOn(mockCollection, 'aggregate');
      aggregateSpy.mockImplementationOnce(() => {
        throw new Error(testError);
      });

      const svc = await new MongoBlogService(mockMongoDBClient).initialize();
      await expect(() => svc.getPosts()).rejects.toThrow(testError);

      expect(aggregateSpy).toHaveBeenCalledTimes(1);
    });

    test('throws an error if toArray throws an error', async () => {
      const cursor = new AggregationCursor<Document>();
      const toArraySpy = jest.spyOn(cursor, 'toArray');
      toArraySpy.mockImplementationOnce(async () => {
        throw new Error(testError);
      });

      const aggregateSpy = jest.spyOn(mockCollection, 'aggregate');
      aggregateSpy.mockImplementationOnce(() => cursor);

      const svc = await new MongoBlogService(mockMongoDBClient).initialize();
      await expect(() => svc.getPosts()).rejects.toThrow(testError);

      expect(aggregateSpy).toHaveBeenCalledTimes(1);
      expect(toArraySpy).toHaveBeenCalledTimes(1);
    });

    test('Only returns values that can conform to a BlogPost interface from a MongoDB return value', async () => {
      const cursor = new AggregationCursor<Document>();
      const toArraySpy = jest.spyOn(cursor, 'toArray');
      toArraySpy.mockImplementationOnce(async () => [
        post1.toJSON(),
        post2.toJSON(),
        post3.toJSON(),
        { ...post4.toJSON(), _id: new ObjectId(objectId4) },
      ]);

      const aggregateSpy = jest.spyOn(mockCollection, 'aggregate');
      aggregateSpy.mockImplementationOnce(() => cursor);

      const svc = await new MongoBlogService(mockMongoDBClient).initialize();
      const result = await svc.getPosts();

      expect(result.posts.length).toBe(1);
    });
  });

  describe('findBySlug', () => {
    test('returns the value from findOne', async () => {
      const findOneSpy = jest.spyOn(mockCollection, 'findOne');
      findOneSpy.mockImplementationOnce(async () => ({
        ...post1.toJSON(),
        _id: post1.id,
      }));

      const svc = await new MongoBlogService(mockMongoDBClient).initialize();
      const result = await svc.findBySlug('test');

      expect(result.title).toBe(post1.title);
      expect(result.slug).toBe(post1.slug);
      expect(result.body).toBe(post1.body);
      expect(result.authorId).toBe(post1.authorId);
      expect(result.dateAdded.toISOString()).toBe(
        post1.dateAdded.toISOString(),
      );
    });

    test('throws an error when findOne throws an error', async () => {
      const findOneSpy = jest.spyOn(mockCollection, 'findOne');
      findOneSpy.mockImplementationOnce(async () => {
        throw new Error(testError);
      });

      const svc = await new MongoBlogService(mockMongoDBClient).initialize();
      await expect(() => svc.findBySlug('test')).rejects.toThrow(testError);
    });

    test('throws an error when findOne returns null', async () => {
      const findOneSpy = jest.spyOn(mockCollection, 'findOne');
      findOneSpy.mockImplementationOnce(async () => null);

      const svc = await new MongoBlogService(mockMongoDBClient).initialize();
      await expect(() => svc.findBySlug('test')).rejects.toThrow(
        new NotFoundError('Result is null'),
      );
    });

    test('throws an error when the value returned does not conform to BlogPost', async () => {
      const findOneSpy = jest.spyOn(mockCollection, 'findOne');
      findOneSpy.mockImplementationOnce(async () => ({}));

      const svc = await new MongoBlogService(mockMongoDBClient).initialize();
      await expect(() => svc.findBySlug('test')).rejects.toThrow();
    });
  });

  describe('addBlogPost', () => {
    test('runs insertOne and returns a blogPost', async () => {
      const insertOneSpy = jest.spyOn(mockCollection, 'insertOne');
      insertOneSpy.mockImplementationOnce(async () => ({
        insertedId: new ObjectId(objectId1),
      }));

      const svc = await new MongoBlogService(mockMongoDBClient).initialize();

      const newPost = NewBlogPost.fromJSON(post1.toJSON());

      const result = await svc.addBlogPost(newPost);

      expect(insertOneSpy).toHaveBeenCalledTimes(1);
      expect(result.id).toBe(objectId1);
    });

    test('Throws an error when insertOne throws an error', async () => {
      const insertOneSpy = jest.spyOn(mockCollection, 'insertOne');
      insertOneSpy.mockImplementationOnce(async () => {
        throw new Error(testError);
      });

      const newPost = NewBlogPost.fromJSON(post1.toJSON());

      const svc = await new MongoBlogService(mockMongoDBClient).initialize();
      await expect(() => svc.addBlogPost(newPost)).rejects.toThrow(
        'Add blog error',
      );

      expect(insertOneSpy).toHaveBeenCalledTimes(1);
    });

    test('Throws a specific error when insertOne throws a specific error', async () => {
      const insertOneSpy = jest.spyOn(mockCollection, 'insertOne');
      insertOneSpy.mockImplementationOnce(async () => {
        const er = new MongoServerError({});
        er.code = 11000;
        er.keyPattern = {};

        throw er;
      });

      const newPost = NewBlogPost.fromJSON(post1.toJSON());

      const svc = await new MongoBlogService(mockMongoDBClient).initialize();
      await expect(() => svc.addBlogPost(newPost)).rejects.toThrow(
        'Duplicate Key Error. The following keys must be unique:',
      );

      expect(insertOneSpy).toHaveBeenCalledTimes(1);
    });

    test('Throws an error when insertOne returns an invalid object', async () => {
      const insertOneSpy = jest.spyOn(mockCollection, 'insertOne');
      insertOneSpy.mockImplementationOnce(async () => ({}));

      const newPost = NewBlogPost.fromJSON(post1.toJSON());

      const svc = await new MongoBlogService(mockMongoDBClient).initialize();
      await expect(() => svc.addBlogPost(newPost)).rejects.toThrow();

      expect(insertOneSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('deleteBlogPost', () => {
    test('calls findOneAndDelete and returns the value that was deleted', async () => {
      const svc = await new MongoBlogService(mockMongoDBClient).initialize();

      const deleteOneSpy = jest.spyOn(mockCollection, 'findOneAndDelete');
      deleteOneSpy.mockImplementationOnce(async () => ({
        value: {
          ...post1.toJSON(),
          _id: new ObjectId(post1.id),
        },
      }));

      const result = await svc.deleteBlogPost(post1.slug);

      expect(deleteOneSpy).toHaveBeenCalledTimes(1);
      expect(deleteOneSpy).toHaveBeenCalledWith({ slug: post1.slug });

      expect(result.toJSON()).toStrictEqual(post1.toJSON());
    });

    test('throws an error if findOneAndDelete throws an error', async () => {
      const svc = await new MongoBlogService(mockMongoDBClient).initialize();

      const deleteOneSpy = jest.spyOn(mockCollection, 'findOneAndDelete');
      deleteOneSpy.mockImplementationOnce(async () => {
        throw new Error(testError);
      });

      await expect(() => svc.deleteBlogPost(post1.slug)).rejects.toThrow(
        testError,
      );

      expect(deleteOneSpy).toHaveBeenCalledTimes(1);
      expect(deleteOneSpy).toHaveBeenCalledWith({ slug: post1.slug });
    });

    test('throws an error if findOneAndDelete returns a null value', async () => {
      const svc = await new MongoBlogService(mockMongoDBClient).initialize();

      const deleteOneSpy = jest.spyOn(mockCollection, 'findOneAndDelete');
      deleteOneSpy.mockImplementationOnce(async () => ({
        value: null,
      }));

      await expect(() => svc.deleteBlogPost(post1.slug)).rejects.toThrow(
        'Invalid delete blog slug passed',
      );

      expect(deleteOneSpy).toHaveBeenCalledTimes(1);
      expect(deleteOneSpy).toHaveBeenCalledWith({ slug: post1.slug });
    });

    test('throws an error if findOneAndDelete returns an invalid input', async () => {
      const svc = await new MongoBlogService(mockMongoDBClient).initialize();

      const deleteOneSpy = jest.spyOn(mockCollection, 'findOneAndDelete');
      deleteOneSpy.mockImplementation(async () => ({}));

      await expect(() => svc.deleteBlogPost(post1.slug)).rejects.toThrow(
        'Invalid delete blog slug passed',
      );

      expect(deleteOneSpy).toHaveBeenCalledTimes(1);
      expect(deleteOneSpy).toHaveBeenCalledWith({ slug: post1.slug });
    });
  });

  describe('initialize', () => {
    test('creates a service with a client. Does not run makeBlogCollection if blogPosts exists in the collections', async () => {
      const blogDataCol = new Collection<Document>();
      const blogNameSpy = jest.spyOn(blogDataCol, 'collectionName', 'get');
      blogNameSpy.mockReturnValue('blogPosts');

      const collection1 = new Collection<Document>();
      const col1NameSpy = jest.spyOn(collection1, 'collectionName', 'get');
      col1NameSpy.mockReturnValue('collection1');

      const collection2 = new Collection<Document>();
      const col2NameSpy = jest.spyOn(collection2, 'collectionName', 'get');
      col2NameSpy.mockReturnValue('collection2');

      mockCollectionsSpy.mockImplementationOnce(async () => [
        blogDataCol,
        collection1,
        collection2,
      ]);

      const createSpy = jest.spyOn(mockDb, 'createCollection');
      createSpy.mockImplementationOnce(async () => mockCollection);

      await MongoBlogService.makeFromConfig(
        new ConfigService(),
        mockMongoDBClient,
      ).initialize();

      expect(clientDbSpy).toHaveBeenCalledTimes(1);
      expect(mockCollectionsSpy).toHaveBeenCalledTimes(1);
      expect(blogNameSpy).toHaveBeenCalledTimes(1);
      expect(col1NameSpy).toHaveBeenCalledTimes(1);
      expect(col2NameSpy).toHaveBeenCalledTimes(1);
      expect(createSpy).toHaveBeenCalledTimes(0);
    });

    test('creates a service with a client. Runs makeBlogCollection if blogPosts does not exist in the collections', async () => {
      const collection1 = new Collection<Document>();
      const col1NameSpy = jest.spyOn(collection1, 'collectionName', 'get');
      col1NameSpy.mockReturnValue('collection1');

      const collection2 = new Collection<Document>();
      const col2NameSpy = jest.spyOn(collection2, 'collectionName', 'get');
      col2NameSpy.mockReturnValue('collection2');

      mockCollectionsSpy.mockImplementationOnce(async () => [
        collection1,
        collection2,
      ]);

      const createSpy = jest.spyOn(mockDb, 'createCollection');
      createSpy.mockImplementationOnce(async () => mockCollection);

      await MongoBlogService.makeFromConfig(
        new ConfigService(),
        mockMongoDBClient,
      ).initialize();

      expect(clientDbSpy).toHaveBeenCalledTimes(2);
      expect(mockCollectionsSpy).toHaveBeenCalledTimes(1);
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

      mockCollectionsSpy.mockImplementationOnce(async () => [
        collection1,
        collection2,
      ]);

      const createSpy = jest.spyOn(mockDb, 'createCollection');
      createSpy.mockImplementationOnce(async () => {
        throw new Error(testError);
      });

      await expect(() =>
        MongoBlogService.makeFromConfig(
          new ConfigService(),
          mockMongoDBClient,
        ).initialize(1, 0),
      ).rejects.toThrow(testError);

      expect(clientDbSpy).toHaveBeenCalledTimes(2);
      expect(mockCollectionsSpy).toHaveBeenCalledTimes(1);
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

      mockCollectionsSpy.mockImplementationOnce(async () => [
        collection1,
        collection2,
      ]);

      const createSpy = jest.spyOn(mockDb, 'createCollection');
      createSpy.mockImplementationOnce(async () => mockCollection);

      const createIndexSpy = jest.spyOn(mockCollection, 'createIndex');
      createIndexSpy.mockImplementationOnce(async () => {
        throw new Error(testError);
      });

      await expect(() =>
        MongoBlogService.makeFromConfig(
          new ConfigService(),
          mockMongoDBClient,
        ).initialize(1, 0),
      ).rejects.toThrow(testError);

      expect(clientDbSpy).toHaveBeenCalledTimes(2);
      expect(mockCollectionsSpy).toHaveBeenCalledTimes(1);
      expect(col1NameSpy).toHaveBeenCalledTimes(1);
      expect(col2NameSpy).toHaveBeenCalledTimes(1);
      expect(createSpy).toHaveBeenCalledTimes(1);
      expect(createIndexSpy).toHaveBeenCalledTimes(1);
    });

    test('Throws an error if _mongoDBClient.db throws an error', async () => {
      const blogDataCol = new Collection<Document>();
      const blogNameSpy = jest.spyOn(blogDataCol, 'collectionName', 'get');
      blogNameSpy.mockReturnValue('blogPosts');

      const collection1 = new Collection<Document>();
      const col1NameSpy = jest.spyOn(collection1, 'collectionName', 'get');
      col1NameSpy.mockReturnValue('collection1');

      const collection2 = new Collection<Document>();
      const col2NameSpy = jest.spyOn(collection2, 'collectionName', 'get');
      col2NameSpy.mockReturnValue('collection2');

      clientDbSpy.mockImplementationOnce(() => {
        throw new Error(testError);
      });

      await expect(() =>
        MongoBlogService.makeFromConfig(
          new ConfigService(),
          mockMongoDBClient,
        ).initialize(1, 0),
      ).rejects.toThrow();

      expect(clientDbSpy).toHaveBeenCalledTimes(1);
      expect(mockCollectionsSpy).toHaveBeenCalledTimes(0);
      expect(blogNameSpy).toHaveBeenCalledTimes(0);
      expect(col1NameSpy).toHaveBeenCalledTimes(0);
      expect(col2NameSpy).toHaveBeenCalledTimes(0);
    });

    test('throws an error if db.collections throws an error', async () => {
      const blogDataCol = new Collection<Document>();
      const blogNameSpy = jest.spyOn(blogDataCol, 'collectionName', 'get');
      blogNameSpy.mockReturnValue('blogPosts');

      const collection1 = new Collection<Document>();
      const col1NameSpy = jest.spyOn(collection1, 'collectionName', 'get');
      col1NameSpy.mockReturnValue('collection1');

      const collection2 = new Collection<Document>();
      const col2NameSpy = jest.spyOn(collection2, 'collectionName', 'get');
      col2NameSpy.mockReturnValue('collection2');

      mockCollectionsSpy.mockImplementation(async () => {
        throw new Error(testError);
      });

      await expect(() =>
        MongoBlogService.makeFromConfig(
          new ConfigService(),
          mockMongoDBClient,
        ).initialize(1, 0),
      ).rejects.toThrow();

      expect(clientDbSpy).toHaveBeenCalledTimes(1);
      expect(mockCollectionsSpy).toHaveBeenCalledTimes(1);
      expect(blogNameSpy).toHaveBeenCalledTimes(0);
      expect(col1NameSpy).toHaveBeenCalledTimes(0);
      expect(col2NameSpy).toHaveBeenCalledTimes(0);
    });
  });
});
