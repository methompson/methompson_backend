import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Collection, Document } from 'mongodb';

import {
  DeleteDetails,
  FileDataService,
  FileSortOption,
  GetFileListOptions,
} from '@/src/file/file_data.service';
import { FileDetails, NewFileDetails } from '@/src/models/file_models';

import {
  DatabaseNotAvailableException,
  InvalidInputError,
  NotFoundError,
} from '@/src/errors';
import { MongoDBClient } from '@/src/utils/mongodb_client_class';
import { isNullOrUndefined } from '@/src/utils/type_guards';
import { delay } from '@/src/utils/delay';

export const fileCollectionName = 'files';

@Injectable()
export class MongoFileDataService implements FileDataService {
  protected _initialized = false;

  constructor(protected _mongoDBClient: MongoDBClient) {}

  protected get fileCollection(): Promise<Collection<Document>> {
    return this._mongoDBClient.db.then((db) =>
      db.collection(fileCollectionName),
    );
  }

  public get mongoDBClient() {
    return this._mongoDBClient;
  }

  async initialize() {
    console.log('Initializing File Service');
    try {
      if (!(await this.containsFileCollection())) {
        await this.makeFileCollection();
      }

      this._initialized = true;
    } catch (e) {
      // console.error('Error Connecting to MongoDB.', e);
      console.error('Error Connecting to MongoDB.');
      await delay();

      console.log('Trying again');
      this.initialize();
    }
  }

  protected async containsFileCollection(): Promise<boolean> {
    const db = await this._mongoDBClient.db;
    const collections = await db.collections();

    let containsFiles = false;
    collections.forEach((col) => {
      if (col.collectionName === fileCollectionName) {
        containsFiles = true;
      }
    });

    return containsFiles;
  }

  protected async makeFileCollection() {
    console.log('Making File Collection');
    const db = await this._mongoDBClient.db;

    // Enforce required values
    const fileCollection = await db.createCollection(fileCollectionName, {
      validator: {
        $jsonSchema: {
          bsonType: 'object',
          required: [
            'originalFilename',
            'filename',
            'dateAdded',
            'authorId',
            'mimetype',
            'size',
            'isPrivate',
          ],
          properties: {
            originalFilename: {
              bsonType: 'string',
              description: 'originalFilename is required and must be a String',
            },
            filename: {
              bsonType: 'string',
              description: 'filename is required and must be a String',
            },
            dateAdded: {
              bsonType: 'date',
              description: 'dateAdded is required and must be a Date',
            },
            authorId: {
              bsonType: 'string',
              description: 'authorId is required and must be a String',
            },
            mimetype: {
              bsonType: 'string',
              description: 'mimetype is required and must be an String',
            },
            size: {
              bsonType: 'int',
              description: 'size is required and must be an Integer',
            },
            isPrivate: {
              bsonType: 'bool',
              description: 'isPrivate is required and must be a Boolean',
            },
          },
        },
      },
    });

    // Creating an index on filenames for searching.
    await fileCollection.createIndex({ filename: 1 });
  }

  async addFiles(fileDetails: NewFileDetails[]): Promise<FileDetails[]> {
    if (!this._initialized) {
      throw new DatabaseNotAvailableException('Database Not Available');
    }

    if (fileDetails.length === 0) {
      throw new InvalidInputError('fileDetails must contain a value');
    }

    // Conforming details to fit MongoDB
    const details = fileDetails.map((fileDetail) => fileDetail.toMongo());

    const fileCollection = await this.fileCollection;

    const results = await fileCollection.insertMany(details, {
      ordered: true,
    });

    if (!results.acknowledged || results.insertedCount != fileDetails.length) {
      throw new Error('Upload error');
    }

    // Conforming output to match JSON
    const output = details.map((detail) => FileDetails.fromMongoDB(detail));

    return output;
  }

  async getFileList(options?: GetFileListOptions): Promise<FileDetails[]> {
    if (!this._initialized) {
      throw new DatabaseNotAvailableException('Database Not Available');
    }

    const page = options?.page ?? 1;
    const pagination = options?.pagination ?? 20;

    const $skip = pagination * (page - 1);

    let $sort: Record<string, number> = { dateAdded: -1 };

    if (options?.sortBy === FileSortOption.Filename) {
      $sort = { originalFilename: 1 };
    }

    const fileCollection = await this.fileCollection;
    const rawAggregation = fileCollection.aggregate([
      { $sort },
      { $skip },
      { $limit: pagination },
    ]);

    const aggregation = await rawAggregation.toArray();

    const files: FileDetails[] = [];

    for (const agg of aggregation) {
      try {
        files.push(FileDetails.fromMongoDB(agg));
      } catch (e) {
        console.error('Invalid File', e);
      }
    }

    return files;
  }

  async getTotalFiles(): Promise<number> {
    if (!this._initialized) {
      throw new DatabaseNotAvailableException('Database Not Available');
    }

    const fileCollection = await this.fileCollection;
    return fileCollection.countDocuments();
  }

  async getFileByName(name: string): Promise<FileDetails> {
    if (!this._initialized) {
      throw new DatabaseNotAvailableException('Database Not Available');
    }

    const fileCollection = await this.fileCollection;
    const result = await fileCollection.findOne({ filename: name });

    if (isNullOrUndefined(result)) {
      throw new NotFoundError('Result is null');
    }

    return FileDetails.fromMongoDB(result);
  }

  async deleteFiles(names: string[]): Promise<Record<string, DeleteDetails>> {
    if (!this._initialized) {
      throw new DatabaseNotAvailableException('Database Not Available');
    }

    const output: Record<string, DeleteDetails> = {};

    const collection = await this.fileCollection;

    const ops: Promise<void>[] = names.map(async (filename) => {
      try {
        const result = await collection.findOneAndDelete({ filename });

        /**
         *  {
         *    lastErrorObject: Unsure what this is
         *    ok: number
         *    value: object containing the find portion
         *  }
         */
        if (isNullOrUndefined(result.value)) {
          throw new NotFoundError('File Not Found');
        }

        const fileDetails = FileDetails.fromMongoDB(result.value);
        output[filename] = {
          filename,
          fileDetails,
        };
      } catch (e) {
        let error = 'Internal Server Error';
        if (e instanceof NotFoundError) {
          error = 'File Not Found';
        }

        if (e instanceof InvalidInputError) {
          error = 'Invalid File Details';
        }

        output[filename] = { filename, error };
      }
    });

    await Promise.all(ops);

    return output;
  }

  static makeFromConfig(
    configService: ConfigService,
    testClient?: MongoDBClient,
  ) {
    // We only use the testClient if NODE_ENV is test
    const client =
      process.env.NODE_ENV === 'test'
        ? testClient ?? MongoDBClient.fromConfiguration(configService)
        : MongoDBClient.fromConfiguration(configService);

    return new MongoFileDataService(client);
  }
}
