import { isNumber, isString } from '@/src/utils/type_guards';

export enum ImageType {
  png = 'png',
  jpeg = 'jpeg',
  gif = 'gif',
  heic = 'heic',
  bmp = 'bmp',
  tiff = 'tiff',
}

interface ImageResizeOptionsJSON {
  identifier?: string;
  newFormat?: ImageType | null;
  retainImage?: boolean;
  resize?: boolean;
  stripMeta?: boolean;
  maxSize?: number | null;
}

/**
 * The ResizeOptions class helps us organize user input to make a 'recipe' for
 * uploading and resizing an image. We have the following options:
 * - Do not convert (save image as-is)
 * - Convert to a new format and compress
 * - Resize an image
 * - Remove Meta Data
 */
export class ImageResizeOptions {
  // retainImage should supersede any process. When set to true, the rest of the
  // functions should be ignored and no script should be run
  protected _retainImage: boolean;

  // If the user wants to convert to a specific image format (e.g. png), they can
  // use this value to do that.
  protected _newFormat: ImageType | null;

  // If set to true, the image will be resized to maxSize
  protected _resize: boolean;

  // If set to true, the -strip command will be added. This strips exif or other
  // metadata
  protected _stripMeta: boolean;

  // This nullable value represents the maximum size set by the user when uploading
  // image files. If this value is not set, the resize function will default to
  // whatever value it wants.
  protected _maxSize: number | null;

  constructor(protected _identifier: string, options: ImageResizeOptionsJSON) {
    this._newFormat = options.newFormat ?? null;
    this._retainImage = options.retainImage ?? false;
    this._stripMeta = options.stripMeta ?? false;
    this._resize = options.resize ?? false;
    this._maxSize = options.maxSize ?? null;
  }

  get doNotConvert(): boolean {
    return this._retainImage;
  }
  get newFormat(): ImageType | null {
    return this._newFormat;
  }
  get resize(): boolean {
    return this._resize;
  }
  get stripMeta(): boolean {
    return this._stripMeta;
  }
  get maxSize(): number | null {
    return this._maxSize;
  }
  get identifier(): string {
    return this._identifier;
  }

  get newMimetype(): string | null {
    switch (this.newFormat) {
      case ImageType.png:
        return 'image/png';
      case ImageType.jpeg:
        return 'image/jpeg';
      case ImageType.gif:
        return 'image/gif';
      case ImageType.heic:
        return 'image/heic';
      case ImageType.bmp:
        return 'image/bmp';
      case ImageType.tiff:
        return 'image/tiff';
      default:
        return null;
    }
  }

  get imageFormatPrefix(): string {
    switch (this.newFormat) {
      case ImageType.png:
        return 'png';
      case ImageType.jpeg:
        return 'jpeg';
      case ImageType.gif:
        return 'gif';
      case ImageType.heic:
        return 'heic';
      case ImageType.bmp:
        return 'bmp3';
      case ImageType.tiff:
        return 'tiff';
      default:
        return '';
    }
  }

  static fromWebFields(op: Record<string, unknown>): ImageResizeOptions {
    const options: ImageResizeOptionsJSON = {};

    const identifier = isString(op?.identifier) ? op.identifier : '';

    // We set the doNotConvert first.
    options.retainImage =
      op?.retainImage === 'true' || op?.retainImage === true;

    // If it's true, we can short circuit the entire process.
    if (options.retainImage) {
      return new ImageResizeOptions(identifier, options);
    }

    // If we get a maxSize value, we have to parse it before adding it to options.
    if (isString(op?.maxSize)) {
      const maxSize = parseInt(op?.maxSize, 10);
      if (!Number.isNaN(maxSize)) {
        options.maxSize = maxSize;
      }
    } else if (isNumber(op?.maxSize)) {
      options.maxSize = op.maxSize;
    }

    // We'll get the new format from the string, if it exists. Otherwise, it's null
    options.newFormat = ImageResizeOptions.getImageTypeFromString(
      op?.newFormat,
    );

    // These options are just booleans. We can use comparisons to string to maintain
    // default values. stripMeta is true only if the string is 'true'. This allows
    // us to easily default to false. Resize is true in all situations, unless
    // resize is set to 'false'.
    options.stripMeta = op?.stripMeta === 'true' || op?.stripMeta === true;
    options.resize = op?.resize !== 'false' && op?.resize !== false;

    return new ImageResizeOptions(identifier, options);
  }

  static getImageTypeFromString(type: unknown): ImageType | null {
    if (!isString(type)) {
      return null;
    }

    switch (type.toLowerCase()) {
      case 'jpg':
      case 'jpeg':
        return ImageType.jpeg;
      case 'png':
        return ImageType.png;
      case 'gif':
        return ImageType.gif;
      case 'heic':
        return ImageType.heic;
      case 'bmp':
        return ImageType.bmp;
      case 'tiff':
        return ImageType.tiff;
    }

    return null;
  }
}

export interface ImageDimensions {
  x: number;
  y: number;
}
