import formidable from 'formidable';
import { WithId, Document } from 'mongodb';

import {
  isBoolean,
  isNumber,
  isRecord,
  isString,
} from '@/src/utils/type_guards';
import { InvalidInputError } from '@/src/errors/invalid_input_error';

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

/**
 * Represents the image file dimensions in pixels
 */
export interface ImageDimensions {
  x: number;
  y: number;
}

/**
 * @param {string} filename is the obfuscated id file name of the file, currently sitting in the filesystem
 * @param {string} identifier is a name for this specific converted version of the file (e.g. thumb, web, etc.)
 * @param {ImageDimensions} dimensions are the dimensions for this specific converted version of the file in pixels
 */
export interface FileDetailsInterface {
  filename: string;
  identifier: string;
  dimensions: ImageDimensions;
}

export class FileDetails {
  constructor(
    protected _filename: string,
    protected _identifier: string,
    protected _dimensions: ImageDimensions,
  ) {}

  get filename(): string {
    return this._filename;
  }
  get identifier(): string {
    return this._identifier;
  }
  get dimensions(): ImageDimensions {
    return this._dimensions;
  }

  toJSON(): FileDetailsInterface {
    return {
      filename: this.filename,
      identifier: this.identifier,
      dimensions: this.dimensions,
    };
  }

  static fromJSON(input: unknown): FileDetails {
    if (!FileDetails.isFileDetailsInterface(input)) {
      throw new InvalidInputError('Invalid file details input');
    }

    return new FileDetails(input.filename, input.identifier, input.dimensions);
  }

  static isFileDetailsInterface(input: unknown): input is FileDetailsInterface {
    return (
      isRecord(input) &&
      isString(input.filename) &&
      isString(input.identifier) &&
      FileDetails.isImageDimensions(input.dimensions)
    );
  }

  static isImageDimensions(input: unknown): input is ImageDimensions {
    return isRecord(input) && isNumber(input.x) && isNumber(input.y);
  }
}

export interface NewImageDetailsInterface {
  imageId: string;
  files: FileDetailsInterface[];
  originalFilename: string;
  dateAdded: string;
  authorId: string;
  isPrivate: boolean;
}

export class NewImageDetails {
  protected _fileMap: Record<string, FileDetails>;
  protected _filenames: string[];

  constructor(
    files: FileDetails[],
    protected _imageId: string,
    protected _originalFilename: string,
    protected _dateAdded: string,
    protected _isPrivate: boolean,
    protected _authorId: string,
  ) {
    const fileMap = {};
    const filenames = [];

    for (const file of files) {
      fileMap[file.identifier] = file;
      filenames.push(file.filename);
    }

    this._fileMap = fileMap;
    this._filenames = filenames;
  }

  get files(): FileDetails[] {
    return Object.values(this._fileMap);
  }
  get imageId(): string {
    return this._imageId;
  }
  get originalFilename(): string {
    return this._originalFilename;
  }
  get dateAdded(): string {
    return this._dateAdded;
  }
  get authorId(): string {
    return this._authorId;
  }
  get isPrivate(): boolean {
    return this._isPrivate;
  }

  getFileById(id: string): FileDetails | null {
    return this._fileMap[id] ?? null;
  }

  containsImage(name: string): boolean {
    return this._filenames.includes(name);
  }

  toJSON(): NewImageDetailsInterface {
    const files = this.files.map((file) => file.toJSON());
    return {
      files,
      imageId: this.imageId,
      originalFilename: this.originalFilename,
      dateAdded: this.dateAdded,
      isPrivate: this.isPrivate,
      authorId: this.authorId,
    };
  }

  toMongo(): Record<string, unknown> {
    const json = this.toJSON();

    const dateAdded = new Date(this.dateAdded);

    return {
      ...json,
      dateAdded,
    };
  }

  static fromJSON(input: unknown): NewImageDetails {
    if (!NewImageDetails.isNewImageDetailsInterface(input)) {
      throw new InvalidInputError('Invalid Image Details');
    }

    const details: FileDetails[] = [];
    for (const file of input.files) {
      details.push(FileDetails.fromJSON(file));
    }

    return new NewImageDetails(
      details,
      input.imageId,
      input.originalFilename,
      input.dateAdded,
      input.isPrivate,
      input.authorId,
    );
  }

  static isNewImageDetailsInterface(
    input: unknown,
  ): input is NewImageDetailsInterface {
    if (!isRecord(input)) {
      return false;
    }

    if (!Array.isArray(input.files)) {
      return false;
    }

    for (const file of input.files) {
      if (!FileDetails.isFileDetailsInterface(file)) {
        return false;
      }
    }

    return (
      isString(input.originalFilename) &&
      isString(input.dateAdded) &&
      isString(input.imageId) &&
      isString(input.authorId) &&
      isBoolean(input.isPrivate)
    );
  }
}

export interface ImageDetailsInterface {
  id: string;
  imageId: string;
  files: FileDetailsInterface[];
  originalFilename: string;
  dateAdded: string;
  authorId: string;
  isPrivate: boolean;
}

export class ImageDetails extends NewImageDetails {
  constructor(
    protected _id: string,
    files: FileDetails[],
    imageId: string,
    originalFilename: string,
    dateAdded: string,
    isPrivate: boolean,
    authorId: string,
  ) {
    super(files, imageId, originalFilename, dateAdded, isPrivate, authorId);
  }

  get id(): string {
    return this._id;
  }

  toJSON(): ImageDetailsInterface {
    const files = this.files.map((file) => file.toJSON());

    return {
      id: this.id,
      imageId: this.imageId,
      authorId: this.authorId,
      files,
      originalFilename: this.originalFilename,
      dateAdded: this.dateAdded,
      isPrivate: this._isPrivate,
    };
  }

  static fromNewImageDetails(
    id: string,
    imageDetails: NewImageDetails,
  ): ImageDetails {
    return new ImageDetails(
      id,
      imageDetails.files,
      imageDetails.imageId,
      imageDetails.originalFilename,
      imageDetails.dateAdded,
      imageDetails.isPrivate,
      imageDetails.authorId,
    );
  }

  static fromJSON(input: unknown): ImageDetails {
    if (!ImageDetails.isImageDetailsInterface(input)) {
      throw new InvalidInputError('Invalid Image Details Input');
    }

    const nid = NewImageDetails.fromJSON(input);

    return ImageDetails.fromNewImageDetails(input.id, nid);
  }

  static fromMongo(input: WithId<Document> | Document): ImageDetails {
    // console.log(JSON.stringify(input));
    const dateAdded = input?.dateAdded?.toISOString();
    const id = input?._id?.toString();

    return ImageDetails.fromJSON({
      ...input,
      id,
      dateAdded,
    });
  }

  static isImageDetailsInterface(
    input: unknown,
  ): input is ImageDetailsInterface {
    return (
      isRecord(input) &&
      isString(input.id) &&
      NewImageDetails.isNewImageDetailsInterface(input)
    );
  }
}
