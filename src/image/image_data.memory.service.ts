import { ImageDataService } from '@/src/image/image_data.service';
import { ImageDetails } from '@/src/models/image_models';

export class ImageMemoryDataService extends ImageDataService {
  private images: Record<string, ImageDetails> = {};

  getImageByName() {}

  deleteImage(id: string) {
    delete this.images[id];
    this.images = { ...this.images };
  }

  addImage(imageDetails: ImageDetails) {
    this.images[imageDetails.id] = imageDetails;

    this.images = { ...this.images };
  }
}
