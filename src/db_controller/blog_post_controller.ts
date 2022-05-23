import { Collection, MongoClient } from 'mongodb';
import { BlogPost, NewBlogPost } from '../models/blog_post_model';

class BlogPostController {
  constructor(protected client: MongoClient) {}

  get blogCollection(): Collection {
    return this.client.db('blog').collection('blogPosts');
  }

  async findAll(): Promise<BlogPost[]> {
    const result = await this.blogCollection.find().toArray();

    return [];
  }

  async addPost(post: NewBlogPost) {
    const result = await this.blogCollection.insertOne(post.toJSON());
    console.log('result', result);
    console.log('id', result.insertedId);

    if (result.insertedId === null || result.insertedId === undefined) {
      throw new Error('Nothing written');
    }

    return BlogPost.fromNewBlogPost(result.insertedId.toString(), post);
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

  static async make(client: MongoClient): Promise<BlogPostController> {
    const blogPostController = new BlogPostController(client);

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

export { BlogPostController };
