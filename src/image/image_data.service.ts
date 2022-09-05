import { Injectable } from '@nestjs/common';
import { ImageDetails, NewImageDetails } from '@/src/models/image_models';

@Injectable()
export abstract class ImageDataService {
  abstract getImageByName(name: string): Promise<ImageDetails>;

  abstract deleteImage(id: string): Promise<string>;

  abstract addImages(imageDetails: NewImageDetails[]): Promise<ImageDetails[]>;
}
