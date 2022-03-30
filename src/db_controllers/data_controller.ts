import { MongoClient } from 'mongodb';

import { isMongoDBOptions } from './mongodb_options';

class MongoDBDataController {
  constructor(
    protected client: MongoClient,
  ) {}

  protected async makeUserCollection() {
    // Enforce required values
    const userCollection = await this.client.db('action-bank').createCollection('users', {
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

  static async make(options: unknown): Promise<MongoDBDataController> {
    if (!isMongoDBOptions(options)) {
      throw new Error('Invalid MongoDB Options Parameter');
    }

    const mongoDBUri = `mongodb://${options.username}:${options.password}@${options.url}:${options.port}`;
    const client = new MongoClient(mongoDBUri, {});

    await client.connect();

    const controller = new MongoDBDataController(client);

    const collections = await client.db('action-bank').collections();

    let containsUsers = false;
    for (const col of collections) {
      if (col.collectionName === 'users') {
        containsUsers = true;
      }
    }

    if (!containsUsers) {
      await controller.makeUserCollection();
    }

    return controller;
  }
}

export {
  MongoDBDataController,
};