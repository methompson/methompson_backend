import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Collection, Document, MongoServerError, ObjectId } from 'mongodb';

import { ImageDataService } from '@/src/image/image_data.service';
import { ImageDetails, NewImageDetails } from '@/src/models/image_models';
import {
  NotFoundError,
  InvalidStateError,
  InvalidInputError,
  MutateDataException,
} from '@/src/errors';
import { MongoDBClient } from '@/src/utils/mongodb_client_class';

const imageDataCollectionName = 'images';

@Injectable()
export class MongoImageDataService extends ImageDataService {
  constructor(protected _mongoDBClient: MongoDBClient) {
    super();
  }

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

  async deleteImage(imageId: string): Promise<string> {
    const _id = new ObjectId(imageId);
    const collection = await this.imageCollection;

    const result = await collection.deleteOne({ _id });

    if (result.deletedCount !== 1) {
      throw new MutateDataException('No Exchanges Deleted');
    }

    return imageId;
  }

  async addImages(imageDetails: NewImageDetails[]): Promise<ImageDetails[]> {
    if (imageDetails.length === 0) {
      throw new InvalidInputError('imageDetails must contain a value');
    }

    try {
      const imageCollection = await this.imageCollection;
      const details = imageDetails.map((imageDetail) => imageDetail.toMongo());

      const results = await imageCollection.insertMany(details, {
        ordered: false,
      });

      const output = details.map((detail) => ImageDetails.fromMongo(detail));

      console.log('upload result', results);

      if (
        !results.acknowledged ||
        results.insertedCount != imageDetails.length
      ) {
        throw new Error('Upload error');
      }

      return output;
    } catch (e) {
      console.error('Add Image Error', e);

      throw new Error('Add Image Error');
    }
  }

  static async initFromConfig(
    configService: ConfigService,
  ): Promise<MongoImageDataService> {
    const client = MongoDBClient.fromConfiguration(configService);
    const service = new MongoImageDataService(client);

    if (!(await service.containsImageCollection())) {
      console.log('Does not contain an image Collection');
      await service.makeImageCollection();
    }

    return service;
  }
}
