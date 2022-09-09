import { Injectable } from '@nestjs/common';
import { ImageDetails, NewImageDetails } from '@/src/models/image_models';

export interface DeleteImageOptions {
  id?: string;
  filename?: string;
  originalFilename?: string;
}

@Injectable()
export abstract class ImageDataService {
  abstract getImageByName(name: string): Promise<ImageDetails>;

  abstract deleteImage(options: DeleteImageOptions): Promise<ImageDetails>;

  abstract addImages(imageDetails: NewImageDetails[]): Promise<ImageDetails[]>;
}
