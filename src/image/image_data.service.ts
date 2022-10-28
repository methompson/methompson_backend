import { Injectable } from '@nestjs/common';
import { ImageDetails, NewImageDetails } from '@/src/models/image_models.old';

export interface DeleteImageOptions {
  id?: string;
  filename?: string;
  originalFilename?: string;
}

export enum ImageSortOption {
  Filename = 'Filename',
  DateAdded = 'DateAdded',
}

export interface GetImageListOptions {
  sortBy?: ImageSortOption;
}

export interface ImageListOutput {
  images: ImageDetails[];
  morePages: boolean;
}

@Injectable()
export abstract class ImageDataService {
  abstract getImageByName(name: string): Promise<ImageDetails>;

  abstract getImageList(
    page: number,
    pagination: number,
    options?: GetImageListOptions,
  ): Promise<ImageListOutput>;

  abstract deleteImage(options: DeleteImageOptions): Promise<ImageDetails>;

  abstract addImages(imageDetails: NewImageDetails[]): Promise<ImageDetails[]>;
}
