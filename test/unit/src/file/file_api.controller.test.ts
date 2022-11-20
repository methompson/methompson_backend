import formidable, { Formidable } from 'formidable';
import { Request } from 'express';
import { ConfigService } from '@nestjs/config';
import { HttpException, HttpStatus } from '@nestjs/common';

import { FileAPIController } from '@/src/file/file_api.controller';
import { DeleteFilesJSON } from '@/src/file/file_data.service';
import { InMemoryFileDataService } from '@/src/file/file_data.memory.service';
import { FileSystemService } from '@/src/file/file_system_service';
import { FileOpsService } from '@/src/file/file_ops.service';

import {
  FileDetails,
  FileDetailsJSON,
  FileDetailsMetadata,
  UploadedFile,
} from '@/src/models/file_models';
import { LoggerService } from '@/src/logger/logger.service';

type FormidableParseCallback = (
  err: any,
  fields: formidable.Fields,
  files: formidable.Files,
) => void;

jest.mock('@/src/file/file_ops.service', () => {
  function FileOpsService() {}
  FileOpsService.prototype.saveUploadedFiles = jest.fn();
  FileOpsService.prototype.saveUploadedImages = jest.fn();

  return {
    FileOpsService,
  };
});

jest.mock('@/src/file/file_system_service', () => {
  function FileSystemService() {}
  FileSystemService.prototype.getNewFileName = jest.fn();
  FileSystemService.prototype.pathExists = jest.fn(async () => {});
  FileSystemService.prototype.makeDirectory = jest.fn(async () => {});
  FileSystemService.prototype.moveFile = jest.fn(async () => {});
  FileSystemService.prototype.deleteFile = jest.fn(async () => {});
  FileSystemService.prototype.deleteFiles = jest.fn(async () => {});
  FileSystemService.prototype.rollBackWrites = jest.fn(async () => {});

  return {
    FileSystemService,
  };
});

jest.mock('formidable', () => {
  function Formidable() {}
  Formidable.prototype.parse = jest.fn(() => {});

  return { Formidable };
});

jest.mock('@nestjs/config', () => {
  function ConfigService() {}
  ConfigService.prototype.get = jest.fn(() => {});

  return { ConfigService };
});

const getNewFileName = FileSystemService.prototype.getNewFileName as jest.Mock;
const pathExists = FileSystemService.prototype.pathExists as jest.Mock;
const makeDirectory = FileSystemService.prototype.makeDirectory as jest.Mock;
const moveFile = FileSystemService.prototype.moveFile as jest.Mock;
const deleteFile = FileSystemService.prototype.deleteFile as jest.Mock;
const deleteFiles = FileSystemService.prototype.deleteFiles as jest.Mock;

const saveUploadedFiles = FileOpsService.prototype
  .saveUploadedFiles as jest.Mock;
const saveUploadedImages = FileOpsService.prototype
  .saveUploadedImages as jest.Mock;

const errorSpy = jest.spyOn(console, 'error');
errorSpy.mockImplementation(() => {});

const parse = Formidable.prototype.parse as jest.Mock<unknown, unknown[]>;

const testError = 'Test Error ;oasdfkln';

describe('FileController', () => {
  const id1 = '9cc7ca64-5fa4-42ef-b790-67b640c76d28';
  const newFilename1 = 'newFileName1';
  const originalFilename1 = 'originalFileName1';
  const authorId1 = 'bd70a89c-b862-44ad-a980-a884ae9df5ad';
  const mimetype1 = 'image/jpeg';
  const size1 = 1024;
  const metadata1: FileDetailsMetadata = {};

  const id2 = '8c17b304-4fbf-477a-be84-05117ed4393e';
  const newFilename2 = 'newFileName2';
  const originalFilename2 = 'originalFileName2';
  const authorId2 = '32ea27be-c5b4-425b-b6ba-c5b67ecf9c63';
  const mimetype2 = 'application/json';
  const size2 = 512;
  const metadata2: FileDetailsMetadata = {};

  const file1 = {
    filepath: newFilename1,
    originalFilename: originalFilename1,
    mimetype: mimetype1,
    size: size1,
  } as formidable.File;

  const file2 = {
    filepath: newFilename2,
    originalFilename: originalFilename2,
    mimetype: mimetype2,
    size: size2,
  } as formidable.File;

  const fileDetailsJSON1: FileDetailsJSON = {
    id: id1,
    originalFilename: originalFilename1,
    filename: newFilename1,
    dateAdded: new Date(1).toISOString(),
    authorId: authorId1,
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
    authorId: authorId2,
    mimetype: mimetype2,
    size: size2,
    isPrivate: false,
    metadata: metadata2,
  };
  const fileDetails2 = FileDetails.fromJSON(fileDetailsJSON2);

  const uploadedFile1 = UploadedFile.fromFormidable(file1);
  const uploadedFile2 = UploadedFile.fromFormidable(file2);

  beforeEach(() => {
    parse.mockReset();
    parse.mockClear();

    getNewFileName.mockReset();
    pathExists.mockReset();
    makeDirectory.mockReset();
    moveFile.mockReset();
    deleteFile.mockReset();
    deleteFiles.mockReset();

    saveUploadedFiles.mockReset();
    saveUploadedImages.mockReset();
  });

  const userId = '99c44a1a-2582-4792-9879-45b5e43b0f33';

  describe('getFileList', () => {
    test('Returns a list of files and a morePages value', async () => {
      const fileDataService = new InMemoryFileDataService([
        fileDetails1,
        fileDetails2,
      ]);
      const fc = new FileAPIController(
        new ConfigService(),
        fileDataService,
        new LoggerService([]),
      );

      const req = {} as unknown as Request;

      const result = await fc.getFileList(req);

      expect(result).toStrictEqual({
        totalFiles: 2,
        files: [fileDetails1.toJSON(), fileDetails2.toJSON()],
        page: 1,
        pagination: 20,
      });
    });

    test('returns an empty array if no files are returned', async () => {
      const fileDataService = new InMemoryFileDataService();
      const fc = new FileAPIController(
        new ConfigService(),
        fileDataService,
        new LoggerService([]),
      );

      const getFilesSpy = jest.spyOn(fileDataService, 'getFileList');
      getFilesSpy.mockImplementationOnce(async () => []);

      const req = {} as unknown as Request;

      const result = await fc.getFileList(req);

      expect(result).toStrictEqual({
        files: [],
        page: 1,
        pagination: 20,
        totalFiles: 0,
      });
    });

    test('passes default values to getFileList', async () => {
      const fileDataService = new InMemoryFileDataService();
      const fc = new FileAPIController(
        new ConfigService(),
        fileDataService,
        new LoggerService([]),
      );

      const getFilesSpy = jest.spyOn(fileDataService, 'getFileList');
      getFilesSpy.mockImplementationOnce(async () => [
        fileDetails1,
        fileDetails2,
      ]);

      const req = {} as unknown as Request;

      await fc.getFileList(req);

      expect(getFilesSpy).toHaveBeenCalledTimes(1);
      expect(getFilesSpy).toHaveBeenCalledWith({ page: 1, pagination: 20 });
    });

    test('passes parsed values to getFileList', async () => {
      const fileDataService = new InMemoryFileDataService();
      const fc = new FileAPIController(
        new ConfigService(),
        fileDataService,
        new LoggerService([]),
      );

      const getFilesSpy = jest.spyOn(fileDataService, 'getFileList');
      getFilesSpy.mockImplementationOnce(async () => [
        fileDetails1,
        fileDetails2,
      ]);

      const req = {
        query: {
          page: '11',
          pagination: '23',
        },
      } as unknown as Request;

      await fc.getFileList(req);

      expect(getFilesSpy).toHaveBeenCalledTimes(1);
      expect(getFilesSpy).toHaveBeenCalledWith({ page: 11, pagination: 23 });
    });

    test('passes default values to getFileList', async () => {
      const fileDataService = new InMemoryFileDataService();
      const fc = new FileAPIController(
        new ConfigService(),
        fileDataService,
        new LoggerService([]),
      );

      const getFilesSpy = jest.spyOn(fileDataService, 'getFileList');

      const req = {} as unknown as Request;

      await fc.getFileList(req);

      expect(getFilesSpy).toHaveBeenCalledTimes(1);
      expect(getFilesSpy).toHaveBeenCalledWith({ page: 1, pagination: 20 });
    });

    test('Throws an error if getFileList throws an error', async () => {
      const fileDataService = new InMemoryFileDataService();
      const fc = new FileAPIController(
        new ConfigService(),
        fileDataService,
        new LoggerService([]),
      );

      const getFilesSpy = jest.spyOn(fileDataService, 'getFileList');
      getFilesSpy.mockImplementationOnce(async () => {
        throw new Error(testError);
      });

      const req = {} as unknown as Request;

      await expect(() => fc.getFileList(req)).rejects.toThrow();
    });
  });

  describe('getTotal', () => {
    test('Returns the value returned by the fileSerivce in a specific format', async () => {
      const fileDataService = new InMemoryFileDataService([
        fileDetails1,
        fileDetails2,
      ]);
      const totalSpy = jest.spyOn(fileDataService, 'getTotalFiles');

      const fc = new FileAPIController(
        new ConfigService(),
        fileDataService,
        new LoggerService([]),
      );

      const total = await fc.getTotal();
      expect(total).toStrictEqual({ totalFiles: 2 });
      expect(totalSpy).toHaveBeenCalledTimes(1);
    });

    test('Returns the value returned by the fileSerivce', async () => {
      const fileDataService = new InMemoryFileDataService([]);
      const totalSpy = jest.spyOn(fileDataService, 'getTotalFiles');

      const fc = new FileAPIController(
        new ConfigService(),
        fileDataService,
        new LoggerService([]),
      );

      totalSpy.mockImplementationOnce(async () => 3);
      expect(await fc.getTotal()).toStrictEqual({ totalFiles: 3 });

      totalSpy.mockImplementationOnce(async () => 4);
      expect(await fc.getTotal()).toStrictEqual({ totalFiles: 4 });

      totalSpy.mockImplementationOnce(async () => 5);
      expect(await fc.getTotal()).toStrictEqual({ totalFiles: 5 });

      totalSpy.mockImplementationOnce(async () => 6);
      expect(await fc.getTotal()).toStrictEqual({ totalFiles: 6 });

      totalSpy.mockImplementationOnce(async () => 0);
      expect(await fc.getTotal()).toStrictEqual({ totalFiles: 0 });
    });

    test('Throws an error if fileService.getTotalFiles throws an error', async () => {
      const fileDataService = new InMemoryFileDataService([]);
      const totalSpy = jest.spyOn(fileDataService, 'getTotalFiles');

      const fc = new FileAPIController(
        new ConfigService(),
        fileDataService,
        new LoggerService([]),
      );

      totalSpy.mockImplementationOnce(async () => {
        throw new Error(testError);
      });

      await expect(() => fc.getTotal()).rejects.toThrow(
        'Error getting total files',
      );

      expect(totalSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('uploadFiles', () => {
    test('Runs parseFilesAndFields and saveUploadedFiles', async () => {
      const fileDataService = new InMemoryFileDataService();
      const fc = new FileAPIController(
        new ConfigService(),
        fileDataService,
        new LoggerService([]),
      );

      const req = {} as unknown as Request;

      const file = { file: file1 };
      parse.mockImplementationOnce((a, b: FormidableParseCallback) => {
        b(null, {}, file);
      });

      const parseSpy = jest.spyOn(fc, 'parseFilesAndFields');

      saveUploadedFiles.mockImplementationOnce(() => [
        fileDetails1,
        fileDetails2,
      ]);

      await fc.uploadFiles(req, userId);

      expect(parseSpy).toHaveBeenCalledTimes(1);
      expect(parseSpy).toHaveBeenCalledWith(req, '');

      expect(saveUploadedFiles).toHaveBeenCalledTimes(1);
      expect(saveUploadedFiles).toHaveBeenCalledWith(
        {
          files: [UploadedFile.fromFormidable(file1)],
          ops: { isPrivate: true },
        },
        userId,
      );
    });

    test('Returns an array of objects', async () => {
      const fileDataService = new InMemoryFileDataService();
      const fc = new FileAPIController(
        new ConfigService(),
        fileDataService,
        new LoggerService([]),
      );

      const req = {} as unknown as Request;

      const file = { file: file1 };
      parse.mockImplementationOnce((a, b: FormidableParseCallback) => {
        b(null, {}, file);
      });

      saveUploadedFiles.mockImplementationOnce(() => [fileDetails1]);

      const result = await fc.uploadFiles(req, userId);

      expect(result).toMatchObject([
        {
          originalFilename: file1.originalFilename,
          size: file1.size,
          isPrivate: true,
        },
      ]);
    });

    test('Performs operations for multiple files. Returns what saveFiles returns', async () => {
      const fileDataService = new InMemoryFileDataService();
      const fc = new FileAPIController(
        new ConfigService(),
        fileDataService,
        new LoggerService([]),
      );

      const req = {} as unknown as Request;

      const file = { file: [file1, file2] };
      parse.mockImplementationOnce((a, b: FormidableParseCallback) => {
        b(null, {}, file);
      });

      saveUploadedFiles.mockImplementationOnce(() => [
        fileDetails1,
        fileDetails2,
      ]);

      const result = await fc.uploadFiles(req, userId);

      expect(result).toMatchObject([
        {
          originalFilename: file1.originalFilename,
          size: file1.size,
          isPrivate: true,
        },
        {
          originalFilename: file2.originalFilename,
          size: file2.size,
          isPrivate: false,
        },
      ]);

      expect(saveUploadedFiles).toHaveBeenCalledTimes(1);
      expect(saveUploadedFiles).toHaveBeenCalledWith(
        {
          files: [
            UploadedFile.fromFormidable(file1),
            UploadedFile.fromFormidable(file2),
          ],
          ops: { isPrivate: true },
        },
        userId,
      );
    });

    test('throws an error if parseFilesAndFields throws an error', async () => {
      const fileDataService = new InMemoryFileDataService();
      const fc = new FileAPIController(
        new ConfigService(),
        fileDataService,
        new LoggerService([]),
      );

      const req = {} as unknown as Request;

      const parseSpy = jest.spyOn(fc, 'parseFilesAndFields');

      parseSpy.mockImplementationOnce(() => {
        throw new Error(testError);
      });

      await expect(() => fc.uploadFiles(req, userId)).rejects.toThrow(
        testError,
      );

      expect(parseSpy).toHaveBeenCalledTimes(1);
      expect(saveUploadedFiles).toHaveBeenCalledTimes(0);
    });

    test('throws an error if saveUploadedFiles throws an error', async () => {
      const fileDataService = new InMemoryFileDataService();
      const fc = new FileAPIController(
        new ConfigService(),
        fileDataService,
        new LoggerService([]),
      );

      const req = {} as unknown as Request;

      const file = { file: file1 };
      parse.mockImplementationOnce((a, b: FormidableParseCallback) => {
        b(null, {}, file);
      });

      const parseSpy = jest.spyOn(fc, 'parseFilesAndFields');

      saveUploadedFiles.mockImplementationOnce(() => {
        throw new Error(testError);
      });

      // const result = await fc.uploadFiles(req, userId);
      await expect(() => fc.uploadFiles(req, userId)).rejects.toThrow(
        'Error Uploading Files',
      );

      expect(parseSpy).toHaveBeenCalledTimes(1);
      expect(saveUploadedFiles).toHaveBeenCalledTimes(1);
    });
  });

  describe('uploadImages', () => {
    test('Runs parseImageFilesAndFields and saveUploadedImages', async () => {
      const fileDataService = new InMemoryFileDataService();
      const fc = new FileAPIController(
        new ConfigService(),
        fileDataService,
        new LoggerService([]),
      );

      const req = {} as unknown as Request;

      const parseSpy = jest.spyOn(fc, 'parseImageFilesAndFields');
      parseSpy.mockImplementationOnce(async () => ({
        imageFiles: [uploadedFile1, uploadedFile2],
        ops: {},
      }));

      saveUploadedImages.mockImplementationOnce(() => [
        fileDetails1,
        fileDetails2,
      ]);

      await fc.uploadImages(req, userId);

      expect(parseSpy).toHaveBeenCalledTimes(1);
      expect(parseSpy).toHaveBeenCalledWith(req, '');

      expect(saveUploadedImages).toHaveBeenCalledTimes(1);
      expect(saveUploadedImages).toHaveBeenCalledWith(
        {
          imageFiles: [uploadedFile1, uploadedFile2],
          ops: {},
        },
        userId,
      );
    });

    test('Returns an array of objects', async () => {
      const fileDataService = new InMemoryFileDataService();
      const fc = new FileAPIController(
        new ConfigService(),
        fileDataService,
        new LoggerService([]),
      );

      const req = {} as unknown as Request;

      const parseSpy = jest.spyOn(fc, 'parseImageFilesAndFields');
      parseSpy.mockImplementationOnce(async () => ({
        imageFiles: [uploadedFile1, uploadedFile2],
        ops: {},
      }));

      saveUploadedImages.mockImplementationOnce(() => [
        fileDetails1,
        fileDetails2,
      ]);

      const result = await fc.uploadImages(req, userId);

      expect(result).toStrictEqual([
        fileDetails1.toJSON(),
        fileDetails2.toJSON(),
      ]);
    });

    test('throws an error if parseImageFilesAndFields throws an error', async () => {
      const fileDataService = new InMemoryFileDataService();
      const fc = new FileAPIController(
        new ConfigService(),
        fileDataService,
        new LoggerService([]),
      );

      const req = {} as unknown as Request;

      const parseSpy = jest.spyOn(fc, 'parseImageFilesAndFields');
      parseSpy.mockImplementationOnce(async () => {
        throw new Error(testError);
      });

      saveUploadedImages.mockImplementationOnce(() => [
        fileDetails1,
        fileDetails2,
      ]);

      await expect(() => fc.uploadImages(req, userId)).rejects.toThrow(
        'Error Uploading Files',
      );

      expect(parseSpy).toHaveBeenCalledTimes(1);
      expect(parseSpy).toHaveBeenCalledWith(req, '');

      expect(saveUploadedImages).toHaveBeenCalledTimes(0);
    });

    test('throws an error if saveUploadedImages throws an error', async () => {
      const fileDataService = new InMemoryFileDataService();
      const fc = new FileAPIController(
        new ConfigService(),
        fileDataService,
        new LoggerService([]),
      );

      const req = {} as unknown as Request;

      const parseSpy = jest.spyOn(fc, 'parseImageFilesAndFields');
      parseSpy.mockImplementationOnce(async () => ({
        imageFiles: [uploadedFile1, uploadedFile2],
        ops: {},
      }));

      saveUploadedImages.mockImplementationOnce(() => {
        throw new Error(testError);
      });

      await expect(() => fc.uploadImages(req, userId)).rejects.toThrow(
        'Error Uploading Files',
      );

      expect(parseSpy).toHaveBeenCalledTimes(1);
      expect(parseSpy).toHaveBeenCalledWith(req, '');

      expect(saveUploadedImages).toHaveBeenCalledTimes(1);
      expect(saveUploadedImages).toHaveBeenCalledWith(
        {
          imageFiles: [uploadedFile1, uploadedFile2],
          ops: {},
        },
        userId,
      );
    });
  });

  describe('deleteFiles', () => {
    test('Returns a JSON object of data about the deletion', async () => {
      const fds = new InMemoryFileDataService([fileDetails1, fileDetails2]);
      const fc = new FileAPIController(
        new ConfigService(),
        fds,
        new LoggerService([]),
      );

      deleteFiles.mockImplementationOnce(async () => {
        const output: Record<string, DeleteFilesJSON> = {};
        output[fileDetails1.filename] = { filename: fileDetails1.filename };
        output[fileDetails2.filename] = { filename: fileDetails2.filename };
        return output;
      });

      const req = {
        body: [fileDetails1.filename, fileDetails2.filename],
      } as unknown as Request;

      const result = await fc.deleteFiles(req);
      expect(result.length).toBe(2);

      const result1 = result.find(
        (el) => el.filename === fileDetails1.filename,
      );
      const result2 = result.find(
        (el) => el.filename === fileDetails2.filename,
      );

      expect(result1.fileDetails).toStrictEqual(fileDetails1.toJSON());
      expect(result1.errors).toStrictEqual([]);
      expect(result1.filename).toBe(fileDetails1.filename);

      expect(result2.fileDetails).toStrictEqual(fileDetails2.toJSON());
      expect(result2.errors).toStrictEqual([]);
      expect(result2.filename).toBe(fileDetails2.filename);
    });

    test('Returns error details from fileService.delete files', async () => {
      const badFilename = 'badFilename';
      const fds = new InMemoryFileDataService([fileDetails1, fileDetails2]);
      const fc = new FileAPIController(
        new ConfigService(),
        fds,
        new LoggerService([]),
      );

      deleteFiles.mockImplementationOnce(async () => {
        const output: Record<string, DeleteFilesJSON> = {};
        output[fileDetails1.filename] = { filename: fileDetails1.filename };
        output[badFilename] = { filename: badFilename };
        return output;
      });

      const req = {
        body: [fileDetails1.filename, badFilename],
      } as unknown as Request;

      const result = await fc.deleteFiles(req);
      expect(result.length).toBe(2);

      const result1 = result.find(
        (el) => el.filename === fileDetails1.filename,
      );
      const result2 = result.find((el) => el.filename === badFilename);

      expect(result1.fileDetails).toStrictEqual(fileDetails1.toJSON());
      expect(result1.errors).toStrictEqual([]);
      expect(result1.filename).toBe(fileDetails1.filename);

      expect(result2.fileDetails).toBeUndefined();
      expect(result2.errors.length).toBe(1);
      expect(result2.errors).toContain('File Does Not Exist In Database');
      expect(result2.filename).toBe(badFilename);
    });

    test('Returns error details from deleteFilesFromFileSystem', async () => {
      const fds = new InMemoryFileDataService([fileDetails1, fileDetails2]);
      const fc = new FileAPIController(
        new ConfigService(),
        fds,
        new LoggerService([]),
      );

      deleteFiles.mockImplementationOnce(async () => {
        const output: Record<string, DeleteFilesJSON> = {};
        output[fileDetails1.filename] = { filename: fileDetails1.filename };
        output[fileDetails2.filename] = {
          filename: fileDetails2.filename,
          error: testError,
        };
        return output;
      });

      const req = {
        body: [fileDetails1.filename, fileDetails2.filename],
      } as unknown as Request;

      const result = await fc.deleteFiles(req);
      expect(result.length).toBe(2);

      const result1 = result.find(
        (el) => el.filename === fileDetails1.filename,
      );
      const result2 = result.find(
        (el) => el.filename === fileDetails2.filename,
      );

      expect(deleteFiles).toHaveBeenCalledWith(fc.savedFilePath, [
        fileDetails1.filename,
        fileDetails2.filename,
      ]);

      expect(result1.fileDetails).toStrictEqual(fileDetails1.toJSON());
      expect(result1.errors).toStrictEqual([]);
      expect(result1.filename).toBe(fileDetails1.filename);

      expect(result2.fileDetails).toStrictEqual(fileDetails2.toJSON());
      expect(result2.errors.length).toBe(1);
      expect(result2.errors[0]).toContain(testError);
      expect(result2.filename).toBe(fileDetails2.filename);
    });

    test('Runs several functions with specific inputs', async () => {
      const fds = new InMemoryFileDataService([fileDetails1, fileDetails2]);
      const fc = new FileAPIController(
        new ConfigService(),
        fds,
        new LoggerService([]),
      );

      deleteFiles.mockImplementationOnce(async () => {
        const output: Record<string, DeleteFilesJSON> = {};
        output[fileDetails1.filename] = { filename: fileDetails1.filename };
        output[fileDetails2.filename] = { filename: fileDetails2.filename };
        return output;
      });

      const body = [fileDetails1.filename, fileDetails2.filename];

      const req = { body } as unknown as Request;

      const deleteFSSpy = jest.spyOn(fds, 'deleteFiles');

      await fc.deleteFiles(req);

      expect(deleteFSSpy).toHaveBeenCalledTimes(1);
      expect(deleteFSSpy).toHaveBeenCalledWith(body);

      expect(deleteFiles).toHaveBeenCalledTimes(1);

      expect(deleteFiles).toHaveBeenCalledWith(fc.savedFilePath, [
        fileDetails1.filename,
        fileDetails2.filename,
      ]);
    });

    test('Throws an error if fileService.deleteFiles throws an error', async () => {
      const fds = new InMemoryFileDataService([fileDetails1, fileDetails2]);
      const fc = new FileAPIController(
        new ConfigService(),
        fds,
        new LoggerService([]),
      );

      deleteFiles.mockImplementationOnce(async () => {
        const output: Record<string, DeleteFilesJSON> = {};
        output[fileDetails1.filename] = { filename: fileDetails1.filename };
        output[fileDetails2.filename] = { filename: fileDetails2.filename };
        return output;
      });

      const body = [fileDetails1.filename, fileDetails2.filename];

      const req = { body } as unknown as Request;

      const deleteFSSpy = jest.spyOn(fds, 'deleteFiles');
      deleteFSSpy.mockImplementationOnce(async () => {
        throw new Error(testError);
      });

      await expect(() => fc.deleteFiles(req)).rejects.toThrow(
        new HttpException('', HttpStatus.BAD_REQUEST),
      );

      expect(deleteFSSpy).toHaveBeenCalledTimes(1);
      expect(deleteFSSpy).toHaveBeenCalledWith(body);

      expect(deleteFiles).toHaveBeenCalledTimes(1);

      expect(deleteFiles).toHaveBeenCalledWith(fc.savedFilePath, [
        fileDetails1.filename,
        fileDetails2.filename,
      ]);
    });

    test('Throws an error if deleteFilesFromFileSystem throws an error', async () => {
      const fds = new InMemoryFileDataService([fileDetails1, fileDetails2]);
      const fc = new FileAPIController(
        new ConfigService(),
        fds,
        new LoggerService([]),
      );

      deleteFiles.mockImplementationOnce(async () => {
        const output: Record<string, DeleteFilesJSON> = {};
        output[fileDetails1.filename] = { filename: fileDetails1.filename };
        output[fileDetails2.filename] = { filename: fileDetails2.filename };
        return output;
      });

      const body = [fileDetails1.filename, fileDetails2.filename];

      const req = { body } as unknown as Request;

      const deleteFSSpy = jest.spyOn(fds, 'deleteFiles');
      deleteFSSpy.mockImplementationOnce(async () => {
        throw new Error(testError);
      });

      await expect(() => fc.deleteFiles(req)).rejects.toThrow(
        new HttpException('', HttpStatus.BAD_REQUEST),
      );

      expect(deleteFSSpy).toHaveBeenCalledTimes(1);
      expect(deleteFSSpy).toHaveBeenCalledWith(body);

      expect(deleteFiles).toHaveBeenCalledTimes(1);

      expect(deleteFiles).toHaveBeenCalledWith(fc.savedFilePath, [
        fileDetails1.filename,
        fileDetails2.filename,
      ]);
    });
  });

  describe('parseFilesAndFields', () => {
    test('returns a file and default ops', async () => {
      const fileDataService = new InMemoryFileDataService();
      const fc = new FileAPIController(
        new ConfigService(),
        fileDataService,
        new LoggerService([]),
      );

      const req = {} as unknown as Request;

      const file = { file: file1 };
      parse.mockImplementationOnce((a, b: FormidableParseCallback) => {
        b(null, {}, file);
      });

      const result = await fc.parseFilesAndFields(req, '');

      expect(parse).toHaveBeenCalledTimes(1);
      expect(parse).toHaveBeenCalledWith(req, expect.anything());

      expect(result).toStrictEqual({
        files: [UploadedFile.fromFormidable(file1)],
        ops: { isPrivate: true },
      });
    });

    test('returns a file with ops set', async () => {
      const fileDataService = new InMemoryFileDataService();
      const fc = new FileAPIController(
        new ConfigService(),
        fileDataService,
        new LoggerService([]),
      );

      const req = {} as unknown as Request;

      const file = { file: file1 };
      const fields = {
        ops: JSON.stringify({ isPrivate: false }),
      };
      parse.mockImplementationOnce((a, b: FormidableParseCallback) => {
        b(null, fields, file);
      });

      const result = await fc.parseFilesAndFields(req, '');

      expect(parse).toHaveBeenCalledTimes(1);
      expect(parse).toHaveBeenCalledWith(req, expect.anything());

      expect(result).toStrictEqual({
        files: [UploadedFile.fromFormidable(file1)],
        ops: { isPrivate: false },
      });
    });

    test('returns files', async () => {
      const fileDataService = new InMemoryFileDataService();
      const fc = new FileAPIController(
        new ConfigService(),
        fileDataService,
        new LoggerService([]),
      );

      const req = {} as unknown as Request;

      const file = { file: [file1, file2] };
      parse.mockImplementationOnce((a, b: FormidableParseCallback) => {
        b(null, {}, file);
      });

      const result = await fc.parseFilesAndFields(req, '');

      expect(parse).toHaveBeenCalledTimes(1);
      expect(parse).toHaveBeenCalledWith(req, expect.anything());

      expect(result).toStrictEqual({
        files: [
          UploadedFile.fromFormidable(file1),
          UploadedFile.fromFormidable(file2),
        ],
        ops: { isPrivate: true },
      });
    });

    test('throws an error if parse returns an error', async () => {
      const fileDataService = new InMemoryFileDataService();
      const fc = new FileAPIController(
        new ConfigService(),
        fileDataService,
        new LoggerService([]),
      );

      const req = {} as unknown as Request;

      parse.mockImplementationOnce((a, b: FormidableParseCallback) => {
        b(new Error(testError), {}, {});
      });

      await expect(() => fc.parseFilesAndFields(req, '')).rejects.toThrow(
        testError,
      );

      expect(parse).toHaveBeenCalledTimes(1);
      expect(parse).toHaveBeenCalledWith(req, expect.anything());
    });

    test('Throws an error if the parsed values are malformed', async () => {
      const fileDataService = new InMemoryFileDataService();
      const fc = new FileAPIController(
        new ConfigService(),
        fileDataService,
        new LoggerService([]),
      );

      const req = {} as unknown as Request;

      const malformedFile = { ...file1 };
      delete malformedFile.size;

      const file = { file: malformedFile };
      parse.mockImplementationOnce((a, b: FormidableParseCallback) => {
        b(null, {}, file);
      });

      await expect(() => fc.parseFilesAndFields(req, '')).rejects.toThrow();

      expect(parse).toHaveBeenCalledTimes(1);
      expect(parse).toHaveBeenCalledWith(req, expect.anything());
    });
  });

  describe('parseImageFilesAndFields', () => {
    const image1 = {
      filepath: newFilename1,
      originalFilename: originalFilename1,
      mimetype: 'image/jpeg',
      size: 1024,
    } as formidable.File;

    const image2 = {
      filepath: newFilename2,
      originalFilename: originalFilename2,
      mimetype: 'image/png',
      size: 512,
    } as formidable.File;

    beforeEach(() => {
      parse.mockClear();
    });

    test('returns a file and fields', async () => {
      const req = {} as unknown as Request;

      const file = { image: image1 } as formidable.Files;

      const fields = {
        field1: 'field1',
        field2: 'field2',
      };

      parse.mockImplementationOnce((a, b: FormidableParseCallback) => {
        b(null, fields, file);
      });

      const fileDataService = new InMemoryFileDataService();
      const fc = new FileAPIController(
        new ConfigService(),
        fileDataService,
        new LoggerService([]),
      );
      const result = await fc.parseImageFilesAndFields(req, '');

      expect(parse).toHaveBeenCalledTimes(1);
      expect(parse).toHaveBeenCalledWith(req, expect.anything());

      expect(result).toStrictEqual({
        imageFiles: [UploadedFile.fromFormidable(image1)],
        ops: {},
      });
    });

    test('returns files and fields', async () => {
      const file = { image: [image1, image2] } as formidable.Files;
      const identifier = 'identifier';
      const ops = {
        identifier,
        field1: 'field1',
        field2: 'field2',
      };
      const fields = {
        ops: JSON.stringify([ops]),
      } as unknown as formidable.Fields;

      parse.mockImplementationOnce((a, b: FormidableParseCallback) => {
        b(null, fields, file);
      });

      const fileDataService = new InMemoryFileDataService();
      const fc = new FileAPIController(
        new ConfigService(),
        fileDataService,
        new LoggerService([]),
      );
      const req = {} as unknown as Request;

      const result = await fc.parseImageFilesAndFields(req, '');

      expect(parse).toHaveBeenCalledTimes(1);
      expect(parse).toHaveBeenCalledWith(req, expect.anything());

      expect(result).toStrictEqual({
        imageFiles: [
          UploadedFile.fromFormidable(image1),
          UploadedFile.fromFormidable(image2),
        ],
        ops: {
          identifier: ops,
        },
      });
    });

    test('Returns a single field for an identifier two are provided with the same identifier', async () => {
      const file = { image: [image1, image2] } as formidable.Files;
      const identifier = 'identifier';
      const ops1 = {
        identifier,
        field1: 'field1',
        field2: 'field2',
      };
      const ops2 = {
        identifier,
        field1: 'field3',
        field2: 'field4',
      };
      const fields = {
        ops: JSON.stringify([ops1, ops2]),
      } as unknown as formidable.Fields;

      parse.mockImplementationOnce((a, b: FormidableParseCallback) => {
        b(null, fields, file);
      });

      const fileDataService = new InMemoryFileDataService();
      const fc = new FileAPIController(
        new ConfigService(),
        fileDataService,
        new LoggerService([]),
      );
      const req = {} as unknown as Request;

      const result = await fc.parseImageFilesAndFields(req, '');

      expect(parse).toHaveBeenCalledTimes(1);
      expect(parse).toHaveBeenCalledWith(req, expect.anything());

      expect(result).toStrictEqual({
        imageFiles: [
          UploadedFile.fromFormidable(image1),
          UploadedFile.fromFormidable(image2),
        ],
        ops: {
          identifier: ops2,
        },
      });
    });

    test('Returns a single field if two are provided, but neither have an identifier', async () => {
      const file = { image: [image1, image2] } as formidable.Files;
      const ops1 = {
        field1: 'field1',
        field2: 'field2',
      };
      const ops2 = {
        field1: 'field3',
        field2: 'field4',
      };
      const fields = {
        ops: JSON.stringify([ops1, ops2]),
      } as unknown as formidable.Fields;

      parse.mockImplementationOnce((a, b: FormidableParseCallback) => {
        b(null, fields, file);
      });

      const fileDataService = new InMemoryFileDataService();
      const fc = new FileAPIController(
        new ConfigService(),
        fileDataService,
        new LoggerService([]),
      );
      const req = {} as unknown as Request;

      const result = await fc.parseImageFilesAndFields(req, '');

      expect(parse).toHaveBeenCalledTimes(1);
      expect(parse).toHaveBeenCalledWith(req, expect.anything());

      expect(result).toStrictEqual({
        imageFiles: [
          UploadedFile.fromFormidable(image1),
          UploadedFile.fromFormidable(image2),
        ],
        ops: {
          '': ops2,
        },
      });
    });

    test('Returns two ops two are provided and each has a unique identifier', async () => {
      const file = { image: [image1, image2] } as formidable.Files;
      const ops1 = {
        identifier: 'id1',
        field1: 'field1',
        field2: 'field2',
      };
      const ops2 = {
        identifier: 'id2',
        field1: 'field3',
        field2: 'field4',
      };
      const fields = {
        ops: JSON.stringify([ops1, ops2]),
      } as unknown as formidable.Fields;

      parse.mockImplementationOnce((a, b: FormidableParseCallback) => {
        b(null, fields, file);
      });

      const fileDataService = new InMemoryFileDataService();
      const fc = new FileAPIController(
        new ConfigService(),
        fileDataService,
        new LoggerService([]),
      );
      const req = {} as unknown as Request;

      const result = await fc.parseImageFilesAndFields(req, '');

      expect(parse).toHaveBeenCalledTimes(1);
      expect(parse).toHaveBeenCalledWith(req, expect.anything());

      expect(result).toStrictEqual({
        imageFiles: [
          UploadedFile.fromFormidable(image1),
          UploadedFile.fromFormidable(image2),
        ],
        ops: {
          id1: ops1,
          id2: ops2,
        },
      });
    });

    test('throws an error if parse returns an error', async () => {
      const fileDataService = new InMemoryFileDataService();
      const fc = new FileAPIController(
        new ConfigService(),
        fileDataService,
        new LoggerService([]),
      );

      const req = {} as unknown as Request;

      const image = {
        newFilename: newFilename1,
        originalFilename: originalFilename1,
      } as formidable.File;
      const file = { image } as formidable.Files;

      const err = new Error('Error');

      // Mocking console.error to keep it from polluting the terminal
      const consoleSpy = jest.spyOn(console, 'error');
      consoleSpy.mockImplementationOnce(() => {});

      parse.mockImplementationOnce((a, b: FormidableParseCallback) => {
        b(err, {}, file);
      });

      expect(() => fc.parseImageFilesAndFields(req, '')).rejects.toThrow(err);
    });
  });
});
