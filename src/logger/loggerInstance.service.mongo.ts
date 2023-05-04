import { ConfigService } from '@nestjs/config';
import { Request, Response } from 'express';
import { Collection, Document } from 'mongodb';

import { LoggerInstanceService } from '@/src/logger/loggerInstance.service';
import { MongoDBClient } from '@/src/utils/mongodb_client_class';
import { delay } from '@/src/utils/delay';
import { DatabaseNotAvailableException } from '@/src/errors';

const loggingCollectionName = 'logging';

export class MongoLoggerInstanceService implements LoggerInstanceService {
  protected _initialized = false;

  constructor(protected mongoDBClient: MongoDBClient) {}

  protected async containsLoggerCollection(): Promise<boolean> {
    const db = await this.mongoDBClient.db;
    const collections = await db.collections();

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
    const db = await this.mongoDBClient.db;

    // Enforce required values
    const blogCollection = await db.createCollection(loggingCollectionName, {
      validator: {
        $jsonSchema: {
          bsonType: 'object',
          required: ['date', 'logType'],
          properties: {
            date: {
              bsonType: 'date',
              description: 'date is required and must be a Date',
            },
            logType: {
              bsonType: 'string',
              description: 'logType is required and must be a String',
            },
          },
        },
      },
    });

    await blogCollection.createIndex({ date: 1 });
  }

  protected get loggerCollection(): Promise<Collection<Document>> {
    return this.mongoDBClient.db.then((db) =>
      db.collection(loggingCollectionName),
    );
  }

  async initialize(): Promise<void> {
    console.log('Initializing Log Service');

    try {
      if (!(await this.containsLoggerCollection())) {
        console.log('Does not contain a logger Collection');
        await this.makeLoggerCollection();
      }

      console.log('Initialized Log Service');
      this._initialized = true;
    } catch (e) {
      console.error('Error Connecting to MongoDB.');
      // console.error('Error Connecting to MongoDB.', e);

      await delay();

      console.log('Trying again');
      this.initialize();
    }
  }

  protected async addLogToDB(msg: string, logType: string, date?: Date) {
    if (!this._initialized) {
      throw new DatabaseNotAvailableException('Database Not Available');
    }

    const _date = date ?? new Date();
    const loggerCollection = await this.loggerCollection;
    await loggerCollection.insertOne({
      date: _date,
      message: msg,
      logType,
    });
  }

  async addLog(msg: unknown) {
    if (!this._initialized) {
      throw new DatabaseNotAvailableException('Database Not Available');
    }

    return this.addLogToDB(`${msg}`, 'info');
  }

  async addWarningLog(msg: unknown) {
    if (!this._initialized) {
      throw new DatabaseNotAvailableException('Database Not Available');
    }

    return this.addLogToDB(`${msg}`, 'warning');
  }

  async addErrorLog(msg: unknown) {
    if (!this._initialized) {
      throw new DatabaseNotAvailableException('Database Not Available');
    }

    return this.addLogToDB(`${msg}`, 'error');
  }

  async addRequestLog(req: Request, res: Response) {
    if (!this._initialized) {
      throw new DatabaseNotAvailableException('Database Not Available');
    }

    const method = req.method;
    const path = req.path;
    const remoteAddress =
      req.header['x-forwarded-for'] ?? req.socket.remoteAddress;

    const _date = new Date();
    const loggerCollection = await this.loggerCollection;
    const statusCode = res.statusCode ?? '';

    await loggerCollection.insertOne({
      date: _date,
      logType: 'request',
      method,
      remoteAddress,
      path,
      statusCode,
    });

    // await this.addLogToDB(`${remoteAddress} - ${method} - ${path}`, 'request');
  }

  async cycleLogs() {
    if (!this._initialized) {
      throw new DatabaseNotAvailableException('Database Not Available');
    }

    const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);

    const col = await this.loggerCollection;
    col.deleteMany({
      date: {
        $lte: twoWeeksAgo,
      },
    });
  }

  static makeFromConfig(
    configService: ConfigService,
  ): MongoLoggerInstanceService {
    const client = MongoDBClient.fromConfiguration(configService);
    return new MongoLoggerInstanceService(client);
  }
}
