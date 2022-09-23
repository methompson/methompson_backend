import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Collection, Document, ObjectId } from 'mongodb';

import {
  DeleteImageOptions,
  ImageDataService,
} from '@/src/image/image_data.service';
import { ImageDetails, NewImageDetails } from '@/src/models/image_models';
import { NotFoundError, InvalidInputError } from '@/src/errors';
import { MongoDBClient } from '@/src/utils/mongodb_client_class';
import { isNull, isNullOrUndefined } from '@/src/utils/type_guards';

const imageDataCollectionName = 'images';

@Injectable()
export class MongoImageDataService implements ImageDataService {
  constructor(protected _mongoDBClient: MongoDBClient) {}

  protected get imageCollection(): Promise<Collection<Document>> {
    return this._mongoDBClient.db.then((db) =>
      db.collection(imageDataCollectionName),
    );
  }

  public get mongoDBClient() {
    return this._mongoDBClient;
  }

  protected async containsImageCollection(): Promise<boolean> {
    const db = await this._mongoDBClient.db;
    const collections = await db.collections();

    let containsBlog = false;
    collections.forEach((col) => {
      if (col.collectionName === imageDataCollectionName) {
        containsBlog = true;
      }
    });

    return containsBlog;
  }

  protected async makeImageCollection() {
    console.log('Making Blog Collection');
    const db = await this._mongoDBClient.db;

    // Enforce required values
    const imageCollection = await db.createCollection(imageDataCollectionName, {
      validator: {
        $jsonSchema: {
          bsonType: 'object',
          required: [
            'imageId',
            'authorId',
            'files',
            'originalFilename',
            'dateAdded',
            'isPrivate',
          ],
          properties: {
            imageId: {
              bsonType: 'string',
              description: 'imageId is required and must be a String',
            },
            authorId: {
              bsonType: 'string',
              description: 'authorId is required and must be a String',
            },
            files: {
              bsonType: 'array',
              description: 'files is required and must be an Array',
            },
            originalFilename: {
              bsonType: 'string',
              description: 'originalFilename is required and must be a String',
            },
            dateAdded: {
              bsonType: 'date',
              description: 'dateAdded is required and must be a Date',
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
    await imageCollection.createIndex({ 'files.filename': 1 });
  }

  async getImageByName(name: string): Promise<ImageDetails> {
    const imageCollection = await this.imageCollection;
    const result = await imageCollection.findOne({ 'files.filename': name });

    if (result === null) {
      throw new NotFoundError('Result is null');
    }

    return ImageDetails.fromMongo(result);
  }

  async deleteImage(options: DeleteImageOptions): Promise<ImageDetails> {
    const deleteOptions: Record<string, unknown> = {};

    if (!isNullOrUndefined(options.id)) {
      const _id = new ObjectId(options.id);
      deleteOptions._id = _id;
    }

    if (!isNullOrUndefined(options.filename)) {
      deleteOptions['files.filename'] = options.filename;
    }

    if (!isNullOrUndefined(options.originalFilename)) {
      deleteOptions.originalFilename = options.originalFilename;
    }

    if (Object.keys(deleteOptions).length === 0) {
      throw new InvalidInputError(
        'Invalid delete image options passed. No options passed',
      );
    }

    const collection = await this.imageCollection;
    const result = await collection.findOneAndDelete(deleteOptions);

    if (isNull(result.value)) {
      throw new InvalidInputError('Invalid delete image options passed');
    }

    const details = ImageDetails.fromMongo(result.value);

    return details;
  }

  async rollBackAdditions(imageDetails: NewImageDetails[]): Promise<void> {
    const collection = await this.imageCollection;

    const promises = imageDetails.map((detail) =>
      collection.deleteOne({ originalFilename: detail.originalFilename }),
    );

    await Promise.allSettled(promises);
  }

  async addImages(imageDetails: NewImageDetails[]): Promise<ImageDetails[]> {
    if (imageDetails.length === 0) {
      throw new InvalidInputError('imageDetails must contain a value');
    }

    const details = imageDetails.map((imageDetail) => imageDetail.toMongo());

    try {
      const imageCollection = await this.imageCollection;

      const results = await imageCollection.insertMany(details, {
        ordered: true,
      });

      if (
        !results.acknowledged ||
        results.insertedCount != imageDetails.length
      ) {
        throw new Error('Upload error');
      }
    } catch (e) {
      console.error('Add Image Error', e);

      throw new Error('Add Image Error');
    }

    const output = details.map((detail) => ImageDetails.fromMongo(detail));
    return output;
  }

  static async initFromConfig(
    configService: ConfigService,
    testClient?: MongoDBClient,
  ): Promise<MongoImageDataService> {
    // We only use the testClient if NODE_ENV is test
    const client =
      process.env.NODE_ENV === 'test'
        ? testClient ?? MongoDBClient.fromConfiguration(configService)
        : MongoDBClient.fromConfiguration(configService);

    const service = new MongoImageDataService(client);

    if (!(await service.containsImageCollection())) {
      await service.makeImageCollection();
    }

    return service;
  }
}
