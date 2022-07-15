/* eslint-disable brace-style */

import { Injectable } from '@nestjs/common';
import { MongoClient, MongoServerError } from 'mongodb';

import { NewBlogPost, BlogPost } from '@/src/models/blog_post_model';
import { InvalidInputError } from '@/src/errors/invalid_input_error';
import { BlogService, BlogPostRequestOutput } from '@/src/blog/blog.service';
import { MongoDBClientInterface } from '@/src/utils/mongodb_client_class';

@Injectable()
export class MongoBlogService
  extends MongoDBClientInterface
  implements BlogService
{
  constructor() {
    super();
  }

  async getMongoClient(): Promise<MongoClient> {
    const port = '27017';
    const username = process.env.MONGO_DB_USERNAME;
    const password = process.env.MONGO_DB_PASSWORD;
    const url = process.env.MONGO_DB_HOST;

    // const mongoDBUri = `mongodb+srv://${options.username}:${options.password}@${options.url}:${port}`;
    const mongoDBUri = `mongodb://${username}:${password}@${url}:${port}`;
    // console.log(mongoDBUri);

    const client = new MongoClient(mongoDBUri, {});

    await client.connect();

    return client;
  }

  async getBlogCollection() {
    const mongoClient = await this.getMongoClient();
    return mongoClient.db('blog').collection('blogPosts');
  }

  async getPosts(page = 1, pagination = 10): Promise<BlogPostRequestOutput> {
    const blogCollection = await this.getBlogCollection();
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
    const blogCollection = await this.getBlogCollection();
    const result = await blogCollection.findOne({ slug });

    return await BlogPost.fromMongoDB(result);
  }

  async addBlogPost(requestBody: unknown): Promise<BlogPost> {
    const blogCollection = await this.getBlogCollection();

    if (!NewBlogPost.isNewBlogPostInterface(requestBody)) {
      throw new InvalidInputError('Invalid requesty body');
    }

    const newPost = NewBlogPost.fromJSON(requestBody);

    try {
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

  // static init(dataService: DataService) {}
}
