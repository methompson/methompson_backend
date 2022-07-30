import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { Collection, Document } from 'mongodb';

import { LoggerService } from '@/src/logger/logger.service';
import { MongoDBClient } from '@/src/utils/mongodb_client_class';
import { isString } from '@/src/utils/type_guards';

const loggingCollectionName = 'logging';

@Injectable()
export class MongoLoggerService implements LoggerService {
  constructor(protected mongoDBClient: MongoDBClient) {}

  protected async containsLoggerCollection(): Promise<boolean> {
    const client = await this.mongoDBClient.getMongoClient();
    const collections = await client.db('blog').collections();

    let containsLogging = false;
    collections.forEach((col) => {
      if (col.collectionName === loggingCollectionName) {
        containsLogging = true;
      }
    });

    return containsLogging;
  }

  protected async makeLoggerCollection() {
    console.log('Making Logger Collection');
    const client = await this.mongoDBClient.getMongoClient();

    // Enforce required values
    const blogCollection = await client
      .db('blog')
      .createCollection(loggingCollectionName, {
        validator: {
          $jsonSchema: {
            bsonType: 'object',
            required: ['date', 'message', 'type'],
            properties: {
              date: {
                bsonType: 'date',
                description: 'date is required and must be a Date',
              },
              MessageEvent: {
                bsonType: 'string',
                description: 'message is required and must be a String',
              },
              type: {
                bsonType: 'string',
                description: 'type is required and must be a String',
              },
            },
          },
        },
      });

    await blogCollection.createIndex({ date: 1 });
  }

  protected get loggerCollection(): Promise<Collection<Document>> {
    return this.mongoDBClient
      .getMongoClient()
      .then((mongoClient) =>
        mongoClient.db('blog').collection(loggingCollectionName),
      );
  }

  protected async addLogToDB(msg: string, type: string, date?: Date) {
    const _date = date ?? new Date();
    const loggerCollection = await this.loggerCollection;
    loggerCollection.insertOne({
      date: _date,
      message: msg,
      type: type,
    });
  }

  async addRequestLog(req: Request) {
    const requestType = req.method;
    const path = req.path;
    const remoteAddress =
      req.header['x-forwarded-for'] ?? req.socket.remoteAddress;

    await this.addLogToDB(
      `${remoteAddress} - ${requestType} - ${path}`,
      'request',
    );
  }

  async addLog(msg: unknown) {
    return this.addLogToDB(`${msg}`, 'info');
  }

  async addErrorLog(msg: unknown) {
    return this.addLogToDB(`${msg}`, 'error');
  }

  async addWarningLog(msg: unknown) {
    return this.addLogToDB(`${msg}`, 'warning');
  }

  static async initFromConfig(
    configService: ConfigService,
  ): Promise<MongoLoggerService> {
    const url = configService.get('url');
    const username = configService.get('username');
    const password = configService.get('password');
    const port = configService.get('port');

    if (
      !isString(url) ||
      !isString(username) ||
      !isString(password) ||
      !isString(port)
    ) {
      throw new Error('Invalid input');
    }

    const client = new MongoDBClient(url, username, password, port);
    const service = new MongoLoggerService(client);

    if (!(await service.containsLoggerCollection())) {
      console.log('Does not contain a logger Collection');
      await service.makeLoggerCollection();
    }

    return service;
  }
}
