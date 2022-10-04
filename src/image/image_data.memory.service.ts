import { Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';

import {
  DeleteImageOptions,
  GetImageListOptions,
  ImageDataService,
  ImageListOutput,
  ImageSortOption,
} from '@/src/image/image_data.service';
import { ImageDetails, NewImageDetails } from '@/src/models/image_models';
import {
  NotFoundError,
  InvalidStateError,
  InvalidInputError,
} from '@/src/errors';

import { isNullOrUndefined } from '@/src/utils/type_guards';

@Injectable()
export class InMemoryImageDataService extends ImageDataService {
  private images: Record<string, ImageDetails> = {};

  async getImageByName(name: string): Promise<ImageDetails> {
    const file = Object.values(this.images).filter((img) => {
      console.log('img', img);
      return img.containsImage(name);
    });

    if (file.length > 1) {
      throw new InvalidStateError(
        'Invalid State. Too many images with same file name',
      );
    }

    if (file.length === 0) {
      throw new NotFoundError('File not found');
    }

    return file[0];
  }

  async getImageList(
    page = 1,
    pagination = 10,
    options: GetImageListOptions,
  ): Promise<ImageListOutput> {
    const stringCompare = (a: string, b: string) => a.localeCompare(b);
    const sortByName = (a: ImageDetails, b: ImageDetails) =>
      stringCompare(a.originalFilename, b.originalFilename);

    const sortByDate = (a: ImageDetails, b: ImageDetails) =>
      stringCompare(a.dateAdded.toISOString(), b.dateAdded.toISOString());

    let sortFunction = sortByName;

    if (options.sortBy === ImageSortOption.DateAdded) {
      sortFunction = sortByDate;
    }

    const skip = pagination * (page - 1);
    const end = pagination * page;

    const imageList = Object.values(this.images);
    imageList.sort(sortFunction);
    const totalImages = imageList.length;

    const images = imageList.slice(skip, end);

    const morePages = end < totalImages;

    return { images, morePages };
  }

  async deleteImage(options: DeleteImageOptions): Promise<ImageDetails> {
    if (!isNullOrUndefined(options.id)) {
      const details = this.images[options.id];

      if (isNullOrUndefined(details)) {
        throw new InvalidInputError(
          `Image does not exist for id ${options.id}`,
        );
      }

      delete this.images[options.id];
      return details;
    }

    const imagesToDelete = Object.values(this.images).filter((image) => {
      let toDelete = false;
      if (!isNullOrUndefined(options.originalFilename)) {
        if (image.originalFilename === options.originalFilename) {
          toDelete = true;
        }
      }

      if (!isNullOrUndefined(options.filename)) {
        const files = image.files;
        files.reduce((currVal, prevVal, index) => {
          if (currVal) return currVal;
          return files[index]?.filename === options.filename;
        }, false);

        if (files.length > 0) {
          toDelete = true;
        }
      }

      return toDelete;
    });

    if (imagesToDelete.length === 0) {
      throw new InvalidInputError('Image does not exist');
    }

    const image = this.images[0];

    delete this.images[image.id];
    this.images = { ...this.images };

    return image;
  }

  async addImages(imageDetails: NewImageDetails[]): Promise<ImageDetails[]> {
    const id = uuidv4();

    const images = imageDetails.map((imageDetail) => {
      const image = ImageDetails.fromNewImageDetails(id, imageDetail);

      this.images[image.imageId] = image;
      this.images = { ...this.images };

      return image;
    });

    return images;
  }
}
