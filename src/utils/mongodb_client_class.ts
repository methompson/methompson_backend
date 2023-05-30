import { ConfigService } from '@nestjs/config';
import { Db, MongoClient } from 'mongodb';

import { isNullOrUndefined, isString } from '@/src/utils/type_guards';

export class MongoDBClient {
  protected _mongoClient?: MongoClient;

  constructor(protected mongoDBUri: string, protected dbName: string) {}

  get mongoClient(): Promise<MongoClient> {
    if (!isNullOrUndefined(this._mongoClient)) {
      return Promise.resolve(this._mongoClient);
    }

    const client = new MongoClient(this.mongoDBUri, {});

    return client.connect().then((connectedClient) => {
      this._mongoClient = connectedClient;
      return connectedClient;
    });

    // return client.connect();
  }

  get db(): Promise<Db> {
    return this.mongoClient.then((client) => client.db(this.dbName));
  }

  async close() {
    await this._mongoClient?.close();
    this._mongoClient = undefined;
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
