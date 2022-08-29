import { Injectable } from '@nestjs/common';
import { ImageDetails } from '@/src/models/image_models';

@Injectable()
export abstract class ImageDataService {
  abstract getImageByName();

  abstract deleteImage(id: string);

  abstract addImage(imageDetails: ImageDetails);
}
