import { MongoClient } from 'mongodb';

export class MongoDBClient {
  constructor(
    protected url: string,
    protected username: string,
    protected password: string,
    protected port: string,
  ) {}

  async getMongoClient(): Promise<MongoClient> {
    // const port = '27017';
    // const username = process.env.MONGO_DB_USERNAME;
    // const password = process.env.MONGO_DB_PASSWORD;
    // const url = process.env.MONGO_DB_HOST;

    // const mongoDBUri = `mongodb+srv://${options.username}:${options.password}@${options.url}:${port}`;
    const mongoDBUri = `mongodb://${this.username}:${this.password}@${this.url}:${this.port}`;

    const client = new MongoClient(mongoDBUri, {});
    await client.connect();

    return client;
  }
}
