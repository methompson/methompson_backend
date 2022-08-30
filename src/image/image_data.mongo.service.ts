import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Collection, Document, MongoServerError } from 'mongodb';

import { ImageDataService } from '@/src/image/image_data.service';
import { ImageDetails, NewImageDetails } from '@/src/models/image_models';
import {
  NotFoundError,
  InvalidStateError,
  InvalidInputError,
} from '@/src/errors';
import { MongoDBClient } from '@/src/utils/mongodb_client_class';

const imageDataCollectionName = 'images';

@Injectable()
export class MongoImageDataService extends ImageDataService {
  constructor(protected mongoDBClient: MongoDBClient) {
    super();
  }

  protected get imageCollection(): Promise<Collection<Document>> {
    return this.mongoDBClient.db.then((db) =>
      db.collection(imageDataCollectionName),
    );
  }

  protected async containsImageCollection(): Promise<boolean> {
    const db = await this.mongoDBClient.db;
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
    const db = await this.mongoDBClient.db;

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
              bsonType: 'string',
              description: 'dateAdded is required and must be a String',
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

    console.log('result', result);

    throw new Error('unimplemented');
  }

  async deleteImage(id: string): Promise<string> {
    return '';
  }

  async addImage(imageDetails: NewImageDetails): Promise<ImageDetails> {
    try {
      const imageCollection = await this.imageCollection;
      const result = await imageCollection.insertOne(imageDetails.toJSON());

      console.log('upload result', result);

      const id = result.insertedId.toString();

      return ImageDetails.fromNewImageDetails(id, imageDetails);
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
