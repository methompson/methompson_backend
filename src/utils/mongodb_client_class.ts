import { ConfigService } from '@nestjs/config';
import { Db, MongoClient } from 'mongodb';

import { isString } from '@/src/utils/type_guards';

export class MongoDBClient {
  constructor(protected mongoDBUri: string, protected dbName: string) {}

  get mongoClient(): Promise<MongoClient> {
    const client = new MongoClient(this.mongoDBUri, {});

    return client.connect();
  }

  get db(): Promise<Db> {
    return this.mongoClient.then((client) => client.db(this.dbName));
  }

  static fromConfiguration(configService: ConfigService): MongoDBClient {
    const uri = configService.get('mongoDBUri');
    const dbName = configService.get('mongoDBName');

    if (!isString(uri) || !isString(dbName)) {
      throw new Error('Invalid input');
    }

    const client = new MongoDBClient(uri, dbName);

    return client;
  }
}
