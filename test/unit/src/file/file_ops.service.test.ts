import * as uuid from 'uuid';

import {
  FileDetails,
  FileDetailsJSON,
  FileDetailsMetadata,
  ParsedFilesAndFields,
  UploadedFile,
} from '@/src/models/file_models';
import { FileOpsService } from '@/src/file/file_ops.service';
import { InMemoryFileDataService } from '@/src/file/file_data.memory.service';

jest.mock('uuid', () => {
  const v4 = jest.fn(() => 'uuidv4');

  return {
    v4,
  };
});

const uuidv4 = uuid.v4 as jest.Mock<unknown, unknown[]>;

describe('FileOpsService', () => {
  const authorId = 'bd70a89c-b862-44ad-a980-a884ae9df5ad';

  const id1 = '9cc7ca64-5fa4-42ef-b790-67b640c76d28';
  const newFilename1 = 'newFileName1';
  const originalFilename1 = 'originalFileName1';
  const mimetype1 = 'image/jpeg';
  const size1 = 1024;
  const metadata1: FileDetailsMetadata = {};

  const id2 = '8c17b304-4fbf-477a-be84-05117ed4393e';
  const newFilename2 = 'newFileName2';
  const originalFilename2 = 'originalFileName2';
  const mimetype2 = 'application/json';
  const size2 = 512;
  const metadata2: FileDetailsMetadata = {};

  const uploadedFile1 = new UploadedFile(
    newFilename1,
    originalFilename1,
    mimetype1,
    size1,
  );

  const uploadedFile2 = new UploadedFile(
    newFilename2,
    originalFilename2,
    mimetype2,
    size2,
  );

  const fileDetailsJSON1: FileDetailsJSON = {
    id: id1,
    originalFilename: originalFilename1,
    filename: newFilename1,
    dateAdded: new Date(1).toISOString(),
    authorId: authorId,
    mimetype: mimetype1,
    size: size1,
    isPrivate: true,
    metadata: metadata1,
  };
  const fileDetails1 = FileDetails.fromJSON(fileDetailsJSON1);

  const fileDetailsJSON2: FileDetailsJSON = {
    id: id2,
    originalFilename: originalFilename2,
    filename: newFilename2,
    dateAdded: new Date(2).toISOString(),
    authorId: authorId,
    mimetype: mimetype2,
    size: size2,
    isPrivate: false,
    metadata: metadata2,
  };
  const fileDetails2 = FileDetails.fromJSON(fileDetailsJSON2);

  beforeEach(() => {
    uuidv4.mockReset();
    uuidv4.mockClear();
  });

  describe('saveUploadedFiles', () => {
    test('Makes new file details and runs saveFiles. Returns the results from saveFiles', async () => {});
    test('runs makeNewFileDetails and save files with expected input', async () => {});
    test('throws an error if makeNewFileDetails throws an error', async () => {});
    test('throws an error if saveFiles throws an error', async () => {});
    test('runs rollBackWrites when an error is thrown and newFiles is not null', async () => {});
    test('does not run rollBackWrites when an error is thrown and newFiles is null', async () => {});
    test('throws an error if saveFiles throws an error and rollBackWrites throws an error', async () => {});
  });

  describe('saveUploadedImages', () => {
    test('Creates new files, saves files to service and returns the results', async () => {});
    test('Runs convertImages and saveFilesToService with expected input', async () => {});
    test('throws an error if convertImages throws an error', async () => {});
    test('throws an error if saveFilesToService throws an error', async () => {});
    test('runs rollBackWrites when an error is thrown and newFiles is not null', async () => {});
    test('does not run rollBackWrites when an error is thrown and newFiles is null', async () => {});
    test('throws an error if an error is thrown and rollBackWrites throws an error', async () => {});
  });

  describe('makeNewFileDetails', () => {
    test('creates new files for all files provided', () => {
      const parsedFiles: ParsedFilesAndFields = {
        files: [uploadedFile1, uploadedFile2],
        ops: {},
      };

      const x = 0;
      uuidv4.mockImplementation(() => {
        if (x === 0) {
          return id1;
        } else {
          return id2;
        }
      });

      const fos = new FileOpsService(
        'savedFilePath',
        'uploadFilePath',
        new InMemoryFileDataService(),
      );

      const result = fos.makeNewFileDetails(parsedFiles, authorId);
    });

    test('runs uuidv4 for all files getting mapped', () => {});
  });

  describe('saveFiles', () => {
    test('Runs saveFilesToFileSystem and saveFilesToService. Returns the results from saveFilesToService', async () => {});
    test('Runs saveFilesToFileSystem and saveFilesToService with provided inputs', async () => {});
    test('throws an error if saveFilesToFileSystem throws an error', async () => {});
    test('throws an error if saveFilesToService throws an error', async () => {});
  });

  describe('saveFilesToFileSystem', () => {
    test('Runs FileSystemService.move for each provided file', async () => {});
    test('Throws an error if FileSystemService.move throws an error for any file', async () => {});
  });

  describe('saveFilesToService', () => {
    test('Runs FileDataService.addFiles for each provided file', async () => {});
    test('Throws an error if FileDataService.addFiles throws an error for any file', async () => {});
  });

  describe('rollBackWrites', () => {
    test('deleteFile is run for all NewFileDetails provided and all UploadedFile provided', async () => {});
    test('An error is thrown if deleteFile throws for any NewFileDetails object', async () => {});
    test('An error is thrown if deleteFile throws for any UploadedFile object', async () => {});
  });
});
