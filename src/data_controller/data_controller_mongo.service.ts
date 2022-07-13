import { Global, Injectable } from '@nestjs/common';
import { MongoClient } from 'mongodb';

import { isMongoDBOptions } from '~/src/utils/mongodb_options';
import { BlogPostDBController } from '@src/data_controller/blog/blog_post_db_controller';
import { DataControllerService } from '@src/data_controller/data_controller.service';

@Global()
@Injectable()
export class MongoDBDataController extends DataControllerService {
  constructor(
    protected _client: MongoClient,
    protected _blogPostController: BlogPostDBController,
  ) {
    super();
  }

  get blogPostController() {
    return this._blogPostController;
  }

  static async makeUserCollection(client: MongoClient) {
    // Enforce required values
    const userCollection = await client.db('blog').createCollection('users', {
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

  static async init(options: unknown): Promise<MongoDBDataController> {
    if (!isMongoDBOptions(options)) {
      throw new Error('Invalid MongoDB Options Parameter');
    }

    const port = options.port || '27017';

    // const mongoDBUri = `mongodb+srv://${options.username}:${options.password}@${options.url}:${port}`;
    const mongoDBUri = `mongodb://${options.username}:${options.password}@${options.url}:${port}`;

    // console.log(mongoDBUri);
    const client = new MongoClient(mongoDBUri, {});

    await client.connect();

    const collections = await client.db('blog').collections();

    let containsUsers = false;
    for (const col of collections) {
      if (col.collectionName === 'users') {
        containsUsers = true;
      }
    }

    if (!containsUsers) {
      await this.makeUserCollection(client);
    }

    const blogPostController = await BlogPostDBController.make(client);

    return new MongoDBDataController(client, blogPostController);
  }
}
