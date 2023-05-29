import * as path from 'path';

import { v4 as uuidv4 } from 'uuid';

import {
  FileDetails,
  FileDetailsBase,
  NewFileDetailsJSON,
  ParsedFilesAndFields,
  ParsedImageFilesAndFields,
  UploadedFile,
} from '@/src/models/file_models';
import { FileDataService } from '@/src/file/file_data.service';
import { FileSystemService } from '@/src/file/file_system_service';
import { ImageWriter } from '@/src/image/image_writer';
import { isNullOrUndefined, isPromiseRejected } from '@/src/utils/type_guards';

export class FileOpsService {
  constructor(
    protected _savedFilePath: string,
    protected _uploadFilePath: string,
    protected _fileService: FileDataService,
  ) {}

  get savedFilePath(): string {
    return this._savedFilePath;
  }
  get uploadFilePath(): string {
    return this._uploadFilePath;
  }
  get fileService(): FileDataService {
    return this._fileService;
  }

  // Main entry point for uploading files
  async saveUploadedFiles(
    parsedData: ParsedFilesAndFields,
    userId: string,
  ): Promise<FileDetails[]> {
    let newFiles: NewFileDetailsJSON[] = [];
    try {
      newFiles = this.makeNewFileDetails(parsedData, userId);

      await this.saveFilesToFileSystem(newFiles);

      const result = await this.saveFilesToService(newFiles);

      return result;
    } catch (e) {
      if (newFiles.length > 0) {
        await this.rollBackFSWrites(newFiles, parsedData.files);
      }

      throw e;
    }
  }

  /**
   * Main entry point for uploading image files. This function will do the following:
   * - Take the parsed uploaded files and the respective image conversion ops:
   * - Generate new image files for each conversion op
   * - Save the image files to database
   */
  async saveUploadedImages(
    parsedData: ParsedImageFilesAndFields,
    userId: string,
    imageWriter?: ImageWriter,
  ): Promise<FileDetails[]> {
    const iw = imageWriter ?? new ImageWriter(this.savedFilePath);
    let newFiles: NewFileDetailsJSON[] = [];

    try {
      newFiles = await iw.convertImages(parsedData, userId);

      const result = await this.saveFilesToService(newFiles);

      return result;
    } catch (e) {
      // console.error(e);
      const nf = newFiles ?? [];
      if (nf.length > 0) {
        await this.rollBackFSWrites(nf, parsedData.imageFiles);
      }

      throw e;
    }
  }

  makeNewFileDetails(
    data: ParsedFilesAndFields,
    userId: string,
  ): NewFileDetailsJSON[] {
    const newFileDetails = data.files.map((file) => {
      const filename = uuidv4();

      const fileDetails = FileDetailsBase.fromJSON({
        filepath: file.filepath,
        originalFilename: file.originalFilename,
        filename,
        dateAdded: new Date().toISOString(),
        authorId: userId,
        mimetype: file.mimetype,
        size: file.size,
        isPrivate: data.ops.isPrivate ?? true,
        metadata: {},
      });

      return {
        filepath: file.filepath,
        fileDetails,
      };
    });

    return newFileDetails;
  }

  async saveFilesToFileSystem(
    files: NewFileDetailsJSON[],
    service?: FileSystemService,
  ): Promise<void> {
    const fss = service ?? new FileSystemService();
    const ops = files.map((file) => {
      // const originalFilePath = path.join(this._uploadFilePath, file.filename);
      const newFilePath = path.join(
        this._savedFilePath,
        file.fileDetails.filename,
      );

      return fss.moveFile(file.filepath, newFilePath);
    });

    await Promise.all(ops);
  }

  async saveFilesToService(
    newFiles: NewFileDetailsJSON[],
  ): Promise<FileDetails[]> {
    const savedFiles = await this.fileService.addFiles(newFiles);
    return savedFiles;
  }

  async rollBackFSWrites(
    files: NewFileDetailsJSON[],
    uploadedFiles: UploadedFile[],
    service?: FileSystemService,
  ) {
    const fss = service ?? new FileSystemService();

    const deleteOps1 = files.map(async (el) => {
      const newFilePath = path.join(
        this._savedFilePath,
        el.fileDetails.filename,
      );
      try {
        await fss.deleteFile(newFilePath);
      } catch (e) {
        throw new Error(`Unable to delete ${newFilePath}: ${e}`);
      }
    });

    const deleteOps2 = uploadedFiles.map(async (el) => {
      try {
        await fss.deleteFile(el.filepath);
      } catch (e) {
        throw new Error(`Unable to delete ${el.filepath}: ${e}`);
      }
    });

    // TODO Get failed file names?
    const results = await Promise.allSettled([...deleteOps1, ...deleteOps2]);
    const errors = results
      .filter(isPromiseRejected)
      .map((el) => `${el.reason}`);

    if (errors.length > 0) {
      throw new Error(`Unable to delete files: ${JSON.stringify(errors)}`);
    }
  }
}
