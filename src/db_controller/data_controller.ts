import { MongoClient } from 'mongodb';

import { isMongoDBOptions } from './mongodb_options';
import { BlogPostController } from './blog_post_controller';

class MongoDBDataController {
  protected client: MongoClient | null;
  protected blogPostController: BlogPostController | null;

  constructor() {
    this.client = null;
    this.blogPostController = null;
  }

  get test() {
    return 'hey!';
  }

  protected async makeUserCollection() {
    // Enforce required values
    const userCollection = await this.client
      .db('blog')
      .createCollection('users', {
        validator: {
          $jsonSchema: {
            bsonType: 'object',
            required: ['username', 'passwordHash', 'email', 'enabled'],
            properties: {
              username: {
                bsonType: 'string',
                description: 'username is required and must be a string',
              },
              passwordHash: {
                bsonType: 'string',
                description: 'passwordHash is required and must be a string',
              },
              email: {
                bsonType: 'string',
                description: 'email is required and must be a string',
              },
              enabled: {
                bsonType: 'bool',
                description: 'enabled is required and must be a boolean',
              },
            },
          },
        },
      });

    // Enforce uniqueness
    await userCollection.createIndex({ username: 1 }, { unique: true });
    await userCollection.createIndex({ email: 1 }, { unique: true });
  }

  async init(options: unknown): Promise<void> {
    if (!isMongoDBOptions(options)) {
      throw new Error('Invalid MongoDB Options Parameter');
    }

    const port = options.port || '27017';

    const mongoDBUri = `mongodb+srv://${options.username}:${options.password}@${options.url}:${port}`;
    const client = new MongoClient(mongoDBUri, {});

    await client.connect();

    this.client = client;

    const collections = await client.db('blog').collections();

    let containsUsers = false;
    for (const col of collections) {
      if (col.collectionName === 'users') {
        containsUsers = true;
      }
    }

    if (!containsUsers) {
      await this.makeUserCollection();
    }

    this.blogPostController = await BlogPostController.make(this.client);
  }
}

export { MongoDBDataController };
