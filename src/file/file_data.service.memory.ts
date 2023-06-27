import { Injectable } from '@nestjs/common';

import {
  DeleteDetails,
  FileDataService,
  FileSortOption,
  GetFileListOptions,
  UpdateFileRequest,
} from '@/src/file/file_data.service';
import { FileDetails, NewFileDetailsJSON } from '@/src/models/file_models';
import { isNullOrUndefined } from '@/src/utils/type_guards';
import { NotFoundError } from '@/src/errors';

const stringCompare = (a: string, b: string) => a.localeCompare(b);

@Injectable()
export class InMemoryFileDataService implements FileDataService {
  protected _files: Record<string, FileDetails> = {};

  constructor(files?: FileDetails[]) {
    if (isNullOrUndefined(files)) {
      return;
    }

    for (const file of files) {
      this._files[file.filename] = file;
    }
  }

  get files(): Record<string, FileDetails> {
    return { ...this._files };
  }

  get filesList(): FileDetails[] {
    return Object.values(this._files);
  }

  get filesByName(): FileDetails[] {
    const sort = (a: FileDetails, b: FileDetails) =>
      stringCompare(a.originalFilename, b.originalFilename);

    const fileList = this.filesList;
    fileList.sort(sort);

    return fileList;
  }

  get filesByReverseName(): FileDetails[] {
    const sort = (a: FileDetails, b: FileDetails) =>
      stringCompare(b.originalFilename, a.originalFilename);

    const fileList = this.filesList;
    fileList.sort(sort);

    return fileList;
  }

  get filesByChrono(): FileDetails[] {
    const sort = (a: FileDetails, b: FileDetails) =>
      stringCompare(a.dateAdded.toISOString(), b.dateAdded.toISOString());

    const fileList = this.filesList;
    fileList.sort(sort);

    return fileList;
  }

  get filesByReverseChrono(): FileDetails[] {
    const sort = (a: FileDetails, b: FileDetails) =>
      stringCompare(b.dateAdded.toISOString(), a.dateAdded.toISOString());

    const fileList = this.filesList;
    fileList.sort(sort);

    return fileList;
  }

  async addFiles(newFileDetails: NewFileDetailsJSON[]): Promise<FileDetails[]> {
    const files = newFileDetails.map((nfd) => {
      const { fileDetails } = nfd;

      this._files[fileDetails.filename] = fileDetails;

      return fileDetails;
    });

    return files;
  }

  async getFileList(options?: GetFileListOptions): Promise<FileDetails[]> {
    const page = options?.page ?? 1;
    const pagination = options?.pagination ?? 20;

    let fileList: FileDetails[];

    if (options?.sortBy === FileSortOption.Filename) {
      fileList = this.filesByName;
    } else if (options?.sortBy === FileSortOption.ReverseChrono) {
      fileList = this.filesByReverseChrono;
    } else if (options?.sortBy === FileSortOption.Chrono) {
      fileList = this.filesByChrono;
    } else {
      fileList = this.filesByReverseChrono;
    }

    const skip = pagination * (page - 1);
    const end = pagination * page;

    const files = fileList.slice(skip, end);

    return files;
  }

  async getTotalFiles(): Promise<number> {
    return Object.keys(this._files).length;
  }

  async getFileByName(name: string): Promise<FileDetails> {
    const file = this._files[name];

    if (isNullOrUndefined(file)) {
      throw new NotFoundError('File Not Found');
    }

    return file;
  }

  async updateFile(details: UpdateFileRequest): Promise<FileDetails> {
    const file = this._files[details.id];

    if (isNullOrUndefined(file)) {
      throw new NotFoundError('File Not Found');
    }

    // file.update(details);

    return file;
  }

  async deleteFiles(names: string[]): Promise<Record<string, DeleteDetails>> {
    const output: Record<string, DeleteDetails> = {};

    for (const filename of names) {
      const file = this._files[filename];
      if (!isNullOrUndefined(file)) {
        delete this._files[filename];
        output[filename] = {
          filename,
          fileDetails: file,
        };
      } else {
        output[filename] = {
          filename,
          fileDetails: undefined,
          error: 'File Does Not Exist In Database',
        };
      }
    }

    return output;
  }

  async backup() {}
}
