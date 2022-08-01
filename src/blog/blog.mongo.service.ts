import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Collection, Document, MongoServerError } from 'mongodb';

import { NewBlogPost, BlogPost } from '@/src/models/blog_post_model';
import { InvalidInputError } from '@/src/errors/invalid_input_error';
import { BlogService, BlogPostRequestOutput } from '@/src/blog/blog.service';
import { MongoDBClient } from '@/src/utils/mongodb_client_class';

const blogPostsCollectionName = 'blogPosts';

@Injectable()
export class MongoBlogService extends BlogService {
  constructor(protected mongoDBClient: MongoDBClient) {
    super();
  }

  protected async containsBlogCollection(): Promise<boolean> {
    const client = await this.mongoDBClient.getMongoClient();
    const collections = await client.db('blog').collections();

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
    const client = await this.mongoDBClient.getMongoClient();

    // Enforce required values
    const blogCollection = await client
      .db('blog')
      .createCollection(blogPostsCollectionName, {
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

  protected get blogCollection(): Promise<Collection<Document>> {
    return this.mongoDBClient
      .getMongoClient()
      .then((mongoClient) =>
        mongoClient.db('blog').collection(blogPostsCollectionName),
      );
  }

  async getPosts(page = 1, pagination = 10): Promise<BlogPostRequestOutput> {
    const blogCollection = await this.blogCollection;
    const skip = pagination * (page - 1);

    // We get one more just to check if there exist any more posts AFTER this result.
    const aggregation = await blogCollection
      .aggregate([
        { $sort: { dateAdded: -1 } },
        { $skip: skip },
        { $limit: pagination + 1 },
      ])
      .toArray();

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

    return await BlogPost.fromMongoDB(result);
  }

  async addBlogPost(requestBody: unknown): Promise<BlogPost> {
    if (!NewBlogPost.isNewBlogPostInterface(requestBody)) {
      throw new InvalidInputError('Invalid requesty body');
    }

    const newPost = NewBlogPost.fromJSON(requestBody);

    try {
      const blogCollection = await this.blogCollection;
      const result = await blogCollection.insertOne(newPost.toJSON());

      if (result.insertedId === null || result.insertedId === undefined) {
        throw new Error('Nothing written');
      }

      return BlogPost.fromNewBlogPost(result.insertedId.toString(), newPost);
    } catch (e) {
      if (e instanceof MongoServerError) {
        if (e.code === 11000) {
          throw new InvalidInputError(
            `Duplicate Key Error. The following keys must be unique: ${Object.keys(
              e.keyPattern,
            )}`,
          );
        }
      }

      console.error('Add blog error', e);
      throw new Error('Add blog error');
    }
  }

  static async initFromConfig(configService: ConfigService) {
    const client = MongoDBClient.fromConfiguration(configService);
    const service = new MongoBlogService(client);

    if (!(await service.containsBlogCollection())) {
      console.log('Does not contain a blog Collection');
      await service.makeBlogCollection();
    }

    return service;
  }
}
