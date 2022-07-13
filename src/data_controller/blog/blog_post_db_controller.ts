import { Collection, MongoClient, MongoServerError } from 'mongodb';

import { BlogPost, NewBlogPost } from '@src/models/blog_post_model';
import { InvalidInputError } from '@src/errors/invalid_input_error';
import { BlogPostRequestOutput } from '@src/data_controller/blog/blog_post_controller';

export class BlogPostDBController {
  constructor(protected client: MongoClient) {}

  get blogCollection(): Collection {
    return this.client.db('blog').collection('blogPosts');
  }

  async getPosts(
    page: number,
    pagination: number,
  ): Promise<BlogPostRequestOutput> {
    const skip = pagination * (page - 1);

    // We get one more just to check if there exist any more posts AFTER this result.
    const aggregation = await this.blogCollection
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

  async getPostBySlug(slug: string): Promise<BlogPost> {
    const result = await this.blogCollection.findOne({ slug });

    return await BlogPost.fromMongoDB(result);
  }

  async addPost(post: NewBlogPost): Promise<BlogPost> {
    try {
      const result = await this.blogCollection.insertOne(post.toJSON());
      console.log('result', result);
      console.log('id', result.insertedId);

      if (result.insertedId === null || result.insertedId === undefined) {
        throw new Error('Nothing written');
      }

      return BlogPost.fromNewBlogPost(result.insertedId.toString(), post);
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

      console.log('Add blog error', e);
      throw new Error('Add blog error');
    }
  }

  protected async makeBlogCollection() {
    // Enforce required values
    const blogCollection = await this.client
      .db('blog')
      .createCollection('blogPosts', {
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

  static async make(client: MongoClient): Promise<BlogPostDBController> {
    const blogPostController = new BlogPostDBController(client);

    const collections = await blogPostController.client
      .db('blog')
      .collections();

    let containsBlog = false;
    for (const col of collections) {
      if (col.collectionName === 'blogPosts') {
        containsBlog = true;
      }
    }

    if (!containsBlog) {
      blogPostController.makeBlogCollection();
    }

    return blogPostController;
  }
}
