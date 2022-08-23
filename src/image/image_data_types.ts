import formidable from 'formidable';

import { isNumber, isString } from '@/src/utils/type_guards';

interface FilenameComponents {
  name: string;
  extension: string;
}

export class UploadedFile {
  constructor(
    protected _filepath: string,
    protected _originalFilename: string,
    protected _mimetype: string,
    protected _size: number,
  ) {}

  get filepath() {
    return this._filepath;
  }
  get originalFilename() {
    return this._originalFilename;
  }
  get mimetype() {
    return this._mimetype;
  }
  get size() {
    return this._size;
  }

  get nameComponents(): FilenameComponents {
    const split = this.originalFilename.split('.');
    if (split.length === 1) {
      return {
        name: this.originalFilename,
        extension: '',
      };
    }

    const splitPoint = split.length - 1;

    return {
      name: split.slice(0, splitPoint).join('.'),
      extension: split[splitPoint],
    };
  }

  get sanitizedFilename(): string {
    return UploadedFile.sanitizeFilename(this.originalFilename);
  }

  static fromFormidable(file: formidable.File): UploadedFile {
    return new UploadedFile(
      file.filepath,
      file.originalFilename,
      file.mimetype,
      file.size,
    );
  }

  static sanitizeFilename(filename: string): string {
    const sanitizedName = filename.replace(/[^A-Za-z0-9._-]+/g, '_');

    return sanitizedName.replace(/[_]+/g, '_');
  }
}

export type ParsedFilesAndFields = {
  imageFiles: UploadedFile[];
  ops: Record<string, Record<string, unknown>>;
};

export enum ImageType {
  png = 'png',
  jpeg = 'jpeg',
  gif = 'gif',
  heic = 'heic',
  bmp = 'bmp',
  tiff = 'tiff',
}

interface ImageResizeOptionsInterface {
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
  // use this value to do that. Otherwise, it will default to jpg.
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

  constructor(
    protected _identifier: string,
    protected _newFilename: string,
    options: ImageResizeOptionsInterface,
  ) {
    this._newFormat = options.newFormat ?? null;
    this._retainImage = options.retainImage ?? false;
    this._stripMeta = options.stripMeta ?? false;
    this._resize = options.resize ?? false;
    this._maxSize = options.maxSize ?? null;
  }

  get newFilename() {
    return this._newFilename;
  }
  get doNotConvert() {
    return this._retainImage;
  }
  get newFormat() {
    return this._newFormat;
  }
  get resize() {
    return this._resize;
  }
  get stripMeta() {
    return this._stripMeta;
  }
  get maxSize() {
    return this._maxSize;
  }
  get identifier() {
    return this._identifier;
  }

  get newFileNameInfo() {
    const ext = this.newFormat ?? 'jpg';
    let name = this.newFilename;

    if (this.identifier.length > 0) {
      name += '_' + this.identifier;
    }

    return { ext, name };
  }

  static fromWebFields(
    newFilename: string,
    op: Record<string, unknown>,
  ): ImageResizeOptions {
    const options: ImageResizeOptionsInterface = {};

    const identifier = isString(op?.identifier) ? op.identifier : '';

    // We set the doNotConvert first.
    options.retainImage =
      op?.retainImage === 'true' || op?.retainImage === true;

    // If it's true, we can short circuit the entire process.
    if (options.retainImage) {
      return new ImageResizeOptions(identifier, newFilename, options);
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
    options.stripMeta = op?.stripMeta === 'true';
    options.resize = op?.resize !== 'false';

    return new ImageResizeOptions(identifier, newFilename, options);
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

interface Resolution {
  x: number;
  y: number;
}

interface SavedImage {
  filename: string;
  originalName: string;
  resolution: Resolution;
  identifier: string;
}

export interface SavedImageGroup {
  images: Record<string, SavedImage>;
  filename: string;
}
