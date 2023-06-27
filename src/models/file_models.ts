import formidable from 'formidable';

import {
  isBoolean,
  isNumber,
  isRecord,
  isString,
} from '@/src/utils/type_guards';
import { InvalidInputError } from '@/src/errors';

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
    if (!isRecord(file)) {
      throw new InvalidInputError('Invalid Uploaded File format');
    }

    const { filepath, originalFilename, mimetype, size } = file;

    const filepathTest = isString(filepath);
    const originalFilenameTest = isString(originalFilename);
    const mimetypeTest = isString(mimetype);
    const sizeTest = isNumber(size);

    if (!filepathTest || !originalFilenameTest || !mimetypeTest || !sizeTest) {
      throw new InvalidInputError('Invalid Uploaded File format');
    }

    return new UploadedFile(filepath, originalFilename, mimetype, size);
  }

  static sanitizeFilename(filename: string): string {
    const sanitizedName = filename.replace(/[^A-Za-z0-9._-]+/g, '_');

    return sanitizedName.replace(/[_]+/g, '_');
  }
}

export type ParsedFilesAndFields = {
  files: UploadedFile[];
  ops: Record<string, unknown>;
  fileOps: Record<string, FileOps>;
};

export interface FileOps {
  isPrivate: boolean;
  filename: string;
}

export type FileDetailsMetadata = Record<string, string | number | boolean>;

function fileDetailsBaseTest(input: unknown): string[] {
  if (!isRecord(input)) {
    return ['root'];
  }

  const output: string[] = [];

  if (!isFileDetailsMetadata(input.metadata)) output.push('metadata');

  if (!isString(input.originalFilename)) output.push('originalFilename');
  if (!isString(input.filename)) output.push('filename');
  if (!isString(input.dateAdded)) output.push('dateAdded');
  if (!isString(input.authorId)) output.push('authorId');
  if (!isString(input.mimetype)) output.push('mimetype');
  if (!isNumber(input.size)) output.push('size');
  if (!isBoolean(input.isPrivate)) output.push('isPrivate');

  return output;
}

function newFileDetailsTest(input: unknown): string[] {
  if (!isRecord(input)) {
    return ['root'];
  }

  const baseTest = fileDetailsBaseTest(input);
  if (!isString(input.filepath)) baseTest.push('filepath');

  return baseTest;
}

function isFileDetailsMetadata(input: unknown): input is FileDetailsMetadata {
  if (!isRecord(input)) {
    return false;
  }

  for (const val of Object.values(input)) {
    if (!(isString(val) || isNumber(val) || isBoolean(val))) {
      return false;
    }
  }

  return true;
}

// TODO change originalFilename and filename to different values
// Probably change filename to id and originalFilename to filename
export interface FileDetailsJSON {
  originalFilename: string;
  filename: string;
  dateAdded: string;
  authorId: string;
  mimetype: string;
  size: number;
  isPrivate: boolean;
  metadata: FileDetailsMetadata;
}

export class FileDetails {
  constructor(
    protected _originalFilename: string,
    protected _filename: string,
    protected _dateAdded: Date,
    protected _authorId: string,
    protected _mimetype: string,
    protected _size: number,
    protected _isPrivate: boolean,
    protected _metadata: FileDetailsMetadata,
  ) {}

  get originalFilename(): string {
    return this._originalFilename;
  }
  get filename(): string {
    return this._filename;
  }
  get dateAdded(): Date {
    return this._dateAdded;
  }
  get authorId(): string {
    return this._authorId;
  }
  get mimetype(): string {
    return this._mimetype;
  }
  get size(): number {
    return this._size;
  }
  get isPrivate(): boolean {
    return this._isPrivate;
  }
  get metadata(): Record<string, string | number | boolean> {
    return this._metadata;
  }

  baseDetails(): FileDetailsJSON {
    return {
      originalFilename: this.originalFilename,
      filename: this.filename,
      dateAdded: this.dateAdded.toISOString(),
      authorId: this.authorId,
      mimetype: this.mimetype,
      size: this.size,
      isPrivate: this.isPrivate,
      metadata: this.metadata,
    };
  }

  toJSON(): FileDetailsJSON {
    return this.baseDetails();
  }

  toMongo(): Record<string, unknown> {
    return {
      ...this.toJSON(),
      dateAdded: this.dateAdded,
    };
  }

  static fromJSON(input: unknown): FileDetails {
    if (!FileDetails.isFileDetailsBaseJSON(input)) {
      const errors = fileDetailsBaseTest(input);
      throw new InvalidInputError(`Invalid File Details Input: ${errors}`);
    }

    const dateAdded = new Date(input.dateAdded);

    return new FileDetails(
      input.originalFilename,
      input.filename,
      dateAdded,
      input.authorId,
      input.mimetype,
      input.size,
      input.isPrivate,
      input.metadata,
    );
  }

  static isFileDetailsBaseJSON(input: unknown): input is FileDetailsJSON {
    return fileDetailsBaseTest(input).length === 0;
  }
}

export interface NewFileDetailsJSON {
  filepath: string;
  fileDetails: FileDetails;
}
