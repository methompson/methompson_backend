import { Injectable } from '@nestjs/common';

@Injectable()
export abstract class ImageDataService {
  abstract getImageByName();

  abstract deleteImage();

  abstract addImage();
}
