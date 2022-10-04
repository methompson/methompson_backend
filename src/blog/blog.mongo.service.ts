import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Collection, Document, MongoServerError } from 'mongodb';

import { NewBlogPost, BlogPost } from '@/src/models/blog_post_model';
import { InvalidInputError } from '@/src/errors/invalid_input_error';
import { BlogService, BlogPostRequestOutput } from '@/src/blog/blog.service';
import { MongoDBClient } from '@/src/utils/mongodb_client_class';
import { NotFoundError } from '@/src/errors';
import { isNullOrUndefined, isRecord } from '../utils/type_guards';

const blogPostsCollectionName = 'blogPosts';

@Injectable()
export class MongoBlogService implements BlogService {
  constructor(protected _mongoDBClient: MongoDBClient) {}

  protected get blogCollection(): Promise<Collection<Document>> {
    return this.mongoDBClient.db.then((db) =>
      db.collection(blogPostsCollectionName),
    );
  }

  public get mongoDBClient() {
    return this._mongoDBClient;
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

  async getPosts(page = 1, pagination = 10): Promise<BlogPostRequestOutput> {
    const skip = pagination * (page - 1);

    const blogCollection = await this.blogCollection;

    // We get one more just to check if there exist any more posts AFTER this result.
    const rawAggregation = blogCollection.aggregate([
      { $sort: { dateAdded: -1 } },
      { $skip: skip },
      { $limit: pagination + 1 },
    ]);

    const aggregation = await rawAggregation.toArray();

    const output = [];

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
    const blogCollection = await this.blogCollection;
    const result = await blogCollection.findOne({ slug });

    if (result === null) {
      throw new NotFoundError('Result is null');
    }

    return await BlogPost.fromMongoDB(result);
  }

  async addBlogPost(requestBody: unknown): Promise<BlogPost> {
    if (!NewBlogPost.isNewBlogPostInterface(requestBody)) {
      throw new InvalidInputError('Invalid request body');
    }

    const newPost = NewBlogPost.fromJSON(requestBody);

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
    const blogCollection = await this.blogCollection;

    const result = await blogCollection.findOneAndDelete({ slug });

    if (isNullOrUndefined(result.value)) {
      throw new InvalidInputError('Invalid delete blog slug passed');
    }

    const blogPost = BlogPost.fromMongoDB(result.value);

    return blogPost;
  }

  static async initFromConfig(
    configService: ConfigService,
    testClient?: MongoDBClient,
  ) {
    // We only use the testClient if NODE_ENV is test
    const client =
      process.env.NODE_ENV === 'test'
        ? testClient ?? MongoDBClient.fromConfiguration(configService)
        : MongoDBClient.fromConfiguration(configService);

    const service = new MongoBlogService(client);

    if (!(await service.containsBlogCollection())) {
      console.log('Does not contain a blog Collection');
      await service.makeBlogCollection();
    }

    return service;
  }
}
