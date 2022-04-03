import { MongoClient } from 'mongodb';

class BlogPostController {
  constructor(protected client: MongoClient) {}

  protected async makeBlogCollection() {
    // Enforce required values
    const blogCollection = await this.client
      .db('blog')
      .createCollection('blog', {
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
                bsonType: 'objectId',
                description: 'authorId is required and must be a ObjectID',
              },
              dateAdded: {
                bsonType: 'date',
                description: 'dateAdded is required and must be a Date',
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
      if (col.collectionName === 'blog') {
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
