import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Collection, Document, MongoServerError } from 'mongodb';

import { NewBlogPost, BlogPost } from '@/src/models/blog_post_model';
import {
  DatabaseNotAvailableException,
  InvalidInputError,
  NotFoundError,
  UnimplementedError,
} from '@/src/errors';
import { BlogService, BlogPostRequestOutput } from '@/src/blog/blog.service';
import { MongoDBClient } from '@/src/utils/mongodb_client_class';
import { isNullOrUndefined, isNumber, isRecord } from '@/src/utils/type_guards';
import { delay } from '@/src/utils/delay';

export const blogPostsCollectionName = 'blogPosts';

@Injectable()
export class MongoBlogService implements BlogService {
  protected _initialized = false;

  constructor(protected _mongoDBClient: MongoDBClient) {}
  updateBlogPost(_updatedPost: BlogPost): Promise<BlogPost> {
    throw new UnimplementedError('Method not implemented.');
  }

  protected get blogCollection(): Promise<Collection<Document>> {
    return this.mongoDBClient.db.then((db) =>
      db.collection(blogPostsCollectionName),
    );
  }

  public get mongoDBClient() {
    return this._mongoDBClient;
  }

  async initialize(
    attempt = 1,
    maxAttempts?: number,
  ): Promise<MongoBlogService> {
    console.log('Initializing Blog Service');

    try {
      if (!(await this.containsBlogCollection())) {
        await this.makeBlogCollection();
      }

      console.log('Initialized Blog Service');
      this._initialized = true;
    } catch (e) {
      console.error('Error Connecting to MongoDB.');

      if (isNumber(maxAttempts) && attempt > maxAttempts) {
        throw e;
      }

      await delay();

      console.log('Trying again');
      this.initialize(attempt + 1, maxAttempts);
    }

    return this;
  }

  protected async containsBlogCollection(): Promise<boolean> {
    const db = await this.mongoDBClient.db;
    const collections = await db.collections();

    let containsBlog = false;
    collections.forEach((col) => {
      if (col.collectionName === blogPostsCollectionName) {
        containsBlog = true;
      }
    });

    return containsBlog;
  }

  protected async makeBlogCollection() {
    console.log('Making Blog Collection');
    const db = await this.mongoDBClient.db;

    // Enforce required values
    const blogCollection = await db.createCollection(blogPostsCollectionName, {
      validator: {
        $jsonSchema: {
          bsonType: 'object',
          required: ['title', 'slug', 'body', 'authorId', 'dateAdded'],
          properties: {
            title: {
              bsonType: 'string',
              description: 'title is required and must be a String',
            },
            slug: {
              bsonType: 'string',
              description: 'slug is required and must be a String',
            },
            body: {
              bsonType: 'string',
              description: 'body is required and must be a String',
            },
            authorId: {
              bsonType: 'string',
              description: 'authorId is required and must be a String',
            },
            dateAdded: {
              bsonType: 'string',
              description: 'dateAdded is required and must be a String',
            },
          },
        },
      },
    });

    // Enforce uniqueness
    await blogCollection.createIndex({ slug: 1 }, { unique: true });
  }

  async getAllPosts(
    _page: number,
    _pagination: number,
  ): Promise<BlogPostRequestOutput> {
    throw new UnimplementedError();
  }

  async getPosts(page = 1, pagination = 10): Promise<BlogPostRequestOutput> {
    if (!this._initialized) {
      throw new DatabaseNotAvailableException('Database Not Available');
    }

    const skip = pagination * (page - 1);

    const blogCollection = await this.blogCollection;

    // We get one more just to check if there exist any more posts AFTER this result.
    const rawAggregation = blogCollection.aggregate([
      { $sort: { dateAdded: -1 } },
      { $skip: skip },
      { $limit: pagination + 1 },
    ]);

    const aggregation = await rawAggregation.toArray();

    const output: BlogPost[] = [];

    for (const r of aggregation) {
      try {
        output.push(BlogPost.fromMongoDB(r));
      } catch (e) {
        console.error('Invalid Blog Post', e);
      }
    }

    // We check if there are more posts than the pagination value.
    // If there are, that means the user can hit 'next' and get more posts.
    const morePages = output.length > pagination;

    // We slice the output so that the end result is equal to the pagination.
    return {
      posts: output.slice(0, pagination),
      morePages,
    };
  }

  async findBySlug(slug: string): Promise<BlogPost> {
    if (!this._initialized) {
      throw new DatabaseNotAvailableException('Database Not Available');
    }

    const blogCollection = await this.blogCollection;
    const result = await blogCollection.findOne({ slug });

    if (result === null) {
      throw new NotFoundError('Result is null');
    }

    return await BlogPost.fromMongoDB(result);
  }

  async addBlogPost(newPost: NewBlogPost): Promise<BlogPost> {
    if (!this._initialized) {
      throw new DatabaseNotAvailableException('Database Not Available');
    }

    try {
      const blogCollection = await this.blogCollection;
      const result = await blogCollection.insertOne(newPost.toJSON());

      if (isNullOrUndefined(result.insertedId)) {
        throw new Error('Nothing written');
      }

      return BlogPost.fromNewBlogPost(result.insertedId.toString(), newPost);
    } catch (e) {
      if (e instanceof MongoServerError) {
        if (e.code === 11000) {
          let msg = 'Duplicate Key Error.';
          if (isRecord(e.keyPattern)) {
            msg = `${msg} The following keys must be unique: ${Object.keys(
              e.keyPattern,
            )}`;
          }

          throw new InvalidInputError(msg);
        }
      }

      console.error('Add blog error', e);
      throw new Error('Add blog error');
    }
  }

  async deleteBlogPost(slug: string): Promise<BlogPost> {
    if (!this._initialized) {
      throw new DatabaseNotAvailableException('Database Not Available');
    }

    const blogCollection = await this.blogCollection;

    const result = await blogCollection.findOneAndDelete({ slug });

    if (isNullOrUndefined(result.value)) {
      throw new InvalidInputError('Invalid delete blog slug passed');
    }

    const blogPost = BlogPost.fromMongoDB(result.value);

    return blogPost;
  }

  static makeFromConfig(
    configService: ConfigService,
    testClient?: MongoDBClient,
  ) {
    // We only use the testClient if NODE_ENV is test
    const client =
      process.env.NODE_ENV === 'test'
        ? testClient ?? MongoDBClient.fromConfiguration(configService)
        : MongoDBClient.fromConfiguration(configService);

    return new MongoBlogService(client);
  }

  async backup() {}
}
