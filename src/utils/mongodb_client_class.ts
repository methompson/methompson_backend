import { ConfigService } from '@nestjs/config';
import { MongoClient } from 'mongodb';

import { isString } from '@/src/utils/type_guards';

export class MongoDBClient {
  constructor(
    protected url: string,
    protected username: string,
    protected password: string,
    protected mongoUseSrv?: boolean,
  ) {}

  async getMongoClient(): Promise<MongoClient> {
    const protocol = this.mongoUseSrv ?? false ? 'mongodb+srv' : 'mongodb';

    const mongoDBUri = `${protocol}://${this.username}:${this.password}@${this.url}`;

    const client = new MongoClient(mongoDBUri, {});
    await client.connect();

    return client;
  }

  static fromConfiguration(configService: ConfigService): MongoDBClient {
    const url = configService.get('url');
    const username = configService.get('username');
    const password = configService.get('password');
    const mongoUseSrv = configService.get('mongoUseSrv');

    if (!isString(url) || !isString(username) || !isString(password)) {
      throw new Error('Invalid input');
    }

    const client = new MongoDBClient(url, username, password, mongoUseSrv);

    return client;
  }
}
