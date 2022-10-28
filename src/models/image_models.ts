export class imageFileDetail {}

export class BaseImageDetails {
  constructor(protected _originalFilename: string) {}

  get originalFilename(): string {
    return this._originalFilename;
  }
}

export class NewImageDetails extends BaseImageDetails {}

export class ImageDetails extends BaseImageDetails {
  constructor(originalFilename: string) {
    super(originalFilename);
  }
}
