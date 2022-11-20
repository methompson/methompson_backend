import * as path from 'path';

import { v4 as uuidv4 } from 'uuid';

import {
  FileDetails,
  NewFileDetails,
  ParsedFilesAndFields,
  ParsedImageFilesAndFields,
  UploadedFile,
} from '@/src/models/file_models';
import { FileDataService } from '@/src/file/file_data.service';
import { FileSystemService } from '@/src/file/file_system_service';
import { ImageWriter } from '@/src/image/image_writer';
import { isNullOrUndefined } from '@/src/utils/type_guards';

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
    let newFiles: NewFileDetails[];
    try {
      newFiles = this.makeNewFileDetails(parsedData, userId);
      const result = await this.saveFiles(newFiles);

      return result;
    } catch (e) {
      if (!isNullOrUndefined(newFiles)) {
        await this.rollBackWrites(newFiles, parsedData.files);
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
  ) {
    const iw = imageWriter ?? new ImageWriter(this.savedFilePath);
    let newFiles: NewFileDetails[];

    try {
      newFiles = await iw.convertImages(parsedData, userId);

      const result = await this.saveFilesToService(newFiles);

      return result;
    } catch (e) {
      if (!isNullOrUndefined(newFiles)) {
        await this.rollBackWrites(newFiles, parsedData.imageFiles);
      }

      throw e;
    }
  }

  makeNewFileDetails(
    data: ParsedFilesAndFields,
    userId: string,
  ): NewFileDetails[] {
    const newFileDetails = data.files.map((file) => {
      const filename = uuidv4();

      return NewFileDetails.fromJSON({
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
    });

    return newFileDetails;
  }

  /**
   * Saves files to the file system and saves files to the database
   */
  async saveFiles(newFileDetails: NewFileDetails[]): Promise<FileDetails[]> {
    const [_, fileDetails] = await Promise.all([
      this.saveFilesToFileSystem(newFileDetails),
      this.saveFilesToService(newFileDetails),
    ]);

    return fileDetails;
  }

  async saveFilesToFileSystem(
    files: NewFileDetails[],
    service?: FileSystemService,
  ): Promise<void> {
    const fss = service ?? new FileSystemService();
    const ops = files.map((file) => {
      // const originalFilePath = path.join(this._uploadFilePath, file.filename);
      const newFilePath = path.join(this._savedFilePath, file.filename);

      return fss.moveFile(file.filepath, newFilePath);
    });

    await Promise.all(ops);
  }

  async saveFilesToService(newFiles: NewFileDetails[]): Promise<FileDetails[]> {
    const savedFiles = await this.fileService.addFiles(newFiles);
    return savedFiles;
  }

  async rollBackWrites(files: NewFileDetails[], uploadedFiles: UploadedFile[]) {
    const fss = new FileSystemService();
    const deleteOps1 = files.map((el) => {
      const newFilePath = path.join(this._savedFilePath, el.filename);
      return fss.deleteFile(newFilePath);
    });

    const deleteOps2 = uploadedFiles.map((el) => {
      fss.deleteFile(el.filepath);
    });

    await Promise.allSettled([...deleteOps1, ...deleteOps2]);
  }
}
