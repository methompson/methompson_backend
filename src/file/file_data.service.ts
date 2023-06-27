import { Injectable } from '@nestjs/common';
import {
  FileDetails,
  FileDetailsJSON,
  NewFileDetailsJSON,
} from '@/src/models/file_models';
import { Backupable } from '@/src/utils/backuppable';

export enum FileSortOption {
  Filename = 'filename',
  ReverseFilename = 'reverseFilename',
  Chrono = 'chrono',
  ReverseChrono = 'reverseChrono',
}

export interface GetFileListOptions {
  page?: number;
  pagination?: number;
  sortBy?: FileSortOption;
}

// Provides information on files deleted
export interface DeleteDetails {
  filename: string;
  fileDetails?: FileDetails;
  error?: string;
}

export interface DeleteDetailsJSON {
  filename: string;
  fileDetails?: FileDetailsJSON;
  error?: string;
}

export interface DeleteFilesJSON {
  filename: string;
  error?: string;
}

export interface DeleteResultJSON {
  filename: string;
  fileDetails?: FileDetailsJSON;
  errors: string[];
}

export interface UpdateFileRequest {
  id: string;
  filename?: string;
  isPrivate?: boolean;
}

@Injectable()
export abstract class FileDataService implements Backupable {
  abstract addFiles(fileDetails: NewFileDetailsJSON[]): Promise<FileDetails[]>;

  abstract getFileList(options?: GetFileListOptions): Promise<FileDetails[]>;

  abstract getTotalFiles(): Promise<number>;

  abstract getFileByName(name: string): Promise<FileDetails>;

  abstract updateFile(details: UpdateFileRequest): Promise<FileDetails>;

  abstract deleteFiles(names: string[]): Promise<Record<string, DeleteDetails>>;

  abstract backup(): Promise<void>;
}
