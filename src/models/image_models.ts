import {
  FileDetails,
  FileDetailsJSON,
  NewFileDetailsJSON,
} from '@/src/models/file_models';
import {
  isInteger,
  isNumber,
  isRecord,
  isString,
} from '@/src/utils/type_guards';
import { InvalidInputError } from '@/src/errors';

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

  constructor(protected _identifier: string, options: ImageResizeOptionsJSON) {
    this._newFormat = options.newFormat ?? null;
    this._retainImage = options.retainImage ?? false;
    this._stripMeta = options.stripMeta ?? false;
    this._resize = options.resize ?? false;
    this._maxSize = options.maxSize ?? null;
  }

  // get newFilename() {
  //   return this._newFilename;
  // }
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
    options.stripMeta = op?.stripMeta === 'true';
    options.resize = op?.resize !== 'false';

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

// export interface NewImageFileDetailsJSON extends NewFileDetailsJSON {
//   identifier: string;
//   resolution: ImageDimensions;
// }

// export interface ImageFileDetailsJSON extends FileDetailsJSON {
//   identifier: string;
//   resolution: ImageDimensions;
// }

// export class ImageFileDetails extends FileDetails {
//   constructor(
//     protected _identifier: string,
//     protected _resolution: ImageDimensions,
//     id: string,
//     originalFilename: string,
//     filename: string,
//     dateAdded: Date,
//     authorId: string,
//     mimetype: string,
//     size: number,
//     isPrivate: boolean,
//   ) {
//     super(
//       id,
//       originalFilename,
//       filename,
//       dateAdded,
//       authorId,
//       mimetype,
//       size,
//       isPrivate,
//     );
//   }

//   get identifier(): string {
//     return this._identifier;
//   }
//   get resolution(): ImageDimensions {
//     return this._resolution;
//   }

//   get fileDetails(): FileDetails {
//     return FileDetails.fromJSON(super.toJSON());
//   }

//   toJSON(): ImageFileDetailsJSON {
//     const superJSON = super.toJSON();
//     return {
//       identifier: this.identifier,
//       resolution: this.resolution,
//       ...superJSON,
//     };
//   }

//   static fromJSON(input: unknown): ImageFileDetails {
//     if (!ImageFileDetails.isImageFileDetailJSON(input)) {
//       throw new InvalidInputError('Invalid ImageFileDetail input');
//     }

//     const dateAdded = new Date(input.dateAdded);

//     return new ImageFileDetails(
//       input.identifier,
//       input.resolution,
//       input.id,
//       input.originalFilename,
//       input.filename,
//       dateAdded,
//       input.authorId,
//       input.mimetype,
//       input.size,
//       input.isPrivate,
//     );
//   }

//   static isImageFileDetailJSON(input: unknown): input is ImageFileDetailsJSON {
//     if (!isRecord(input)) {
//       return false;
//     }

//     const identifierTest = isString(input.identifier);
//     const resolutionTest = ImageFileDetails.isResolution(input.resolution);
//     const fileDetailsTest = FileDetails.isFileDetailsJSON(input);

//     return identifierTest && resolutionTest && fileDetailsTest;
//   }

//   static isResolution(input: unknown): input is ImageDimensions {
//     if (!isRecord(input)) {
//       return false;
//     }

//     const xTest = isInteger(input.x);
//     const yTest = isInteger(input.y);

//     return xTest && yTest;
//   }
// }

// export interface ImageDetailsJSON {
//   originalFilename: string;
//   imageDetails: ImageFileDetailsJSON[];
// }

// export interface NewImageDetailsJSON {
//   originalFilename: string;
//   imageDetails: NewImageFileDetailsJSON[];
// }

// export class ImageDetails {
//   protected _imageDetails: Record<string, ImageFileDetails> = {};

//   constructor(
//     protected _originalFilename: string,
//     imageDetails: ImageFileDetails[],
//   ) {
//     for (const detail of imageDetails) {
//       this._imageDetails[detail.identifier] = detail;
//     }
//   }

//   get originalFilename(): string {
//     return this._originalFilename;
//   }
//   get imageDetails(): Record<string, ImageFileDetails> {
//     return this._imageDetails;
//   }
//   get imageDetailsList(): ImageFileDetails[] {
//     return Object.values(this.imageDetails);
//   }

//   toJSON(): ImageDetailsJSON {
//     const details = this.imageDetailsList.map((el) => el.toJSON());

//     return {
//       originalFilename: this.originalFilename,
//       imageDetails: details,
//     };
//   }

//   static fromJSON(input: unknown): ImageDetails {
//     if (!ImageDetails.isImageDetailsJSON(input)) {
//       throw new InvalidInputError('Invalid ImageDetails input');
//     }

//     const details = input.imageDetails.map((el) =>
//       ImageFileDetails.fromJSON(el),
//     );

//     return new ImageDetails(input.originalFilename, details);
//   }

//   static isImageDetailsJSON(input): input is ImageDetailsJSON {
//     if (!isRecord(input) || !Array.isArray(input.imageDetails)) {
//       return false;
//     }

//     const filenameTest = isString(input.originalFilename);
//     const detailsTest = input.imageDetails.reduce((prev, cur) => {
//       if (!prev) {
//         return prev;
//       }
//       return ImageFileDetails.isImageFileDetailJSON(cur);
//     }, true);

//     return filenameTest && detailsTest;
//   }
// }
