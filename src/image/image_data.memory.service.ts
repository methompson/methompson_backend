import { Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';

import { ImageDataService } from '@/src/image/image_data.service';
import { ImageDetails, NewImageDetails } from '@/src/models/image_models';
import { NotFoundError, InvalidStateError } from '@/src/errors';

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

  async deleteImage(id: string): Promise<string> {
    delete this.images[id];
    this.images = { ...this.images };

    return id;
  }

  async addImage(imageDetails: NewImageDetails): Promise<ImageDetails> {
    const id = uuidv4();
    const image = ImageDetails.fromNewImageDetails(id, imageDetails);

    this.images[image.imageId] = image;
    this.images = { ...this.images };

    return image;
  }
}
