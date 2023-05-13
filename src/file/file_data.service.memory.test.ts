import { InMemoryFileDataService } from '@/src/file/file_data.service.memory';
import { FileSortOption } from '@/src/file/file_data.service';
import {
  FileDetails,
  FileDetailsMetadata,
  NewFileDetails,
} from '@/src/models/file_models';

const filepath = 'path/to/file';

const originalFileName1 = 'zyx originalFileName1 0aihsdfnlk';
const filename1 = '16713749-d83c-42c0-b4a8-4a29a04cd171';
const dateAdded1 = new Date(1);
const authorId1 = 'authorId1 ;aoidsl';
const mimetype1 = 'image/jpeg';
const size1 = 1024;
const isPriave1 = true;
const metadata1: FileDetailsMetadata = {};

const newFile1 = new NewFileDetails(
  filepath,
  originalFileName1,
  filename1,
  dateAdded1,
  authorId1,
  mimetype1,
  size1,
  isPriave1,
  metadata1,
);

const originalFileName2 = 'abc originalFileName2 aspdfiln';
const filename2 = '2b883407-6b52-40f1-b129-e64e857218ef';
const dateAdded2 = new Date(2);
const authorId2 = 'authorId2 awosdln';
const mimetype2 = 'application/json';
const size2 = 2048;
const isPriave2 = false;
const metadata2: FileDetailsMetadata = {};

const newFile2 = new NewFileDetails(
  filepath,
  originalFileName2,
  filename2,
  dateAdded2,
  authorId2,
  mimetype2,
  size2,
  isPriave2,
  metadata2,
);

const id1 = 'ca1fafe9-7fab-4401-82dc-2b3f3f8cd1e1';
const id2 = 'f829b909-0b29-401f-9a77-fb3a6e19e012';

describe('InMemoryFileDataService', () => {
  describe('addFiles', () => {
    test('adds a file to the files record', async () => {
      const fds = new InMemoryFileDataService();

      expect(fds.filesList.length).toBe(0);
      fds.addFiles([newFile1]);

      expect(fds.filesList.length).toBe(1);

      const result = fds.filesList[0];

      expect(result.baseDetails()).toMatchObject(newFile1.baseDetails());
    });

    test('adds multiple files to the files record', async () => {
      const fds = new InMemoryFileDataService();

      expect(fds.filesList.length).toBe(0);
      fds.addFiles([newFile1, newFile2]);

      expect(fds.filesList.length).toBe(2);

      const result1 = fds.filesList.find(
        (el) => el.originalFilename === originalFileName1,
      );

      expect(result1.baseDetails()).toMatchObject(newFile1.baseDetails());

      const result2 = fds.filesList.find(
        (el) => el.originalFilename === originalFileName2,
      );

      expect(result2.baseDetails()).toMatchObject(newFile2.baseDetails());
    });
  });

  describe('getFileList', () => {
    test('Returns a list of files sorted by name', async () => {
      const fds = new InMemoryFileDataService();
      fds.addFiles([newFile1, newFile2]);
      expect(fds.filesList.length).toBe(2);

      const files = await fds.getFileList();
      expect(files.length).toBe(2);

      const result1 = files[0];
      const result2 = files[1];

      expect(result1.baseDetails()).toMatchObject(newFile2.baseDetails());
      expect(result2.baseDetails()).toMatchObject(newFile1.baseDetails());
    });

    test('Returns a list of files sorted by dateAdded when dateAdded option is added', async () => {
      const fds = new InMemoryFileDataService();
      fds.addFiles([newFile1, newFile2]);
      expect(fds.filesList.length).toBe(2);

      const files = await fds.getFileList({
        page: 1,
        pagination: 20,
        sortBy: FileSortOption.DateAdded,
      });
      expect(files.length).toBe(2);

      const result1 = files.find((el) => el.filename === newFile1.filename);
      const result2 = files.find((el) => el.filename === newFile2.filename);

      expect(result1.baseDetails()).toMatchObject(newFile1.baseDetails());
      expect(result2.baseDetails()).toMatchObject(newFile2.baseDetails());
    });

    test('Returns an empty array when no files exist', async () => {
      const fds = new InMemoryFileDataService();
      expect(fds.filesList.length).toBe(0);

      const files = await fds.getFileList({ page: 1, pagination: 2 });
      expect(files).toStrictEqual([]);
    });
  });

  describe('getFileByName', () => {
    test('Returns the file if its filename exists', async () => {
      const file1 = FileDetails.fromNewFileDetails(id1, newFile1);
      const file2 = FileDetails.fromNewFileDetails(id2, newFile2);

      const fds = new InMemoryFileDataService([file1, file2]);

      const result1 = await fds.getFileByName(file1.filename);
      expect(result1.toJSON()).toStrictEqual(file1.toJSON());

      const result2 = await fds.getFileByName(file2.filename);
      expect(result2.toJSON()).toStrictEqual(file2.toJSON());
    });

    test('Throws an error if its id does not exist', async () => {
      const file1 = FileDetails.fromNewFileDetails(id1, newFile1);
      const file2 = FileDetails.fromNewFileDetails(id2, newFile2);

      const fds = new InMemoryFileDataService([file1, file2]);

      expect(() => fds.getFileByName('abc')).rejects.toThrow();
    });
  });

  describe('deleteFile', () => {
    test('Deletes a file form the files object', async () => {
      const file1 = FileDetails.fromNewFileDetails(id1, newFile1);
      const file2 = FileDetails.fromNewFileDetails(id2, newFile2);

      const fds = new InMemoryFileDataService([file1, file2]);
      expect(fds.filesList.length).toBe(2);

      const result = await fds.deleteFiles([file1.filename]);

      expect(fds.filesList.length).toBe(1);

      expect(result[file1.filename].fileDetails.toJSON()).toStrictEqual(
        file1.toJSON(),
      );
      expect(result[file1.filename].filename).toBe(file1.filename);
      expect(result[file1.filename].error).toBeUndefined();
    });

    test('Deletes multiple files from the files object', async () => {
      const file1 = FileDetails.fromNewFileDetails(id1, newFile1);
      const file2 = FileDetails.fromNewFileDetails(id2, newFile2);

      const fds = new InMemoryFileDataService([file1, file2]);
      expect(fds.filesList.length).toBe(2);

      const result = await fds.deleteFiles([file1.filename, file2.filename]);

      expect(fds.filesList.length).toBe(0);

      expect(result[file1.filename].fileDetails.toJSON()).toStrictEqual(
        file1.toJSON(),
      );
      expect(result[file1.filename].filename).toBe(file1.filename);
      expect(result[file1.filename].error).toBeUndefined();
      expect(result[file2.filename].fileDetails.toJSON()).toStrictEqual(
        file2.toJSON(),
      );
      expect(result[file2.filename].filename).toBe(file2.filename);
      expect(result[file2.filename].error).toBeUndefined();
    });

    test('Provides error information for all files not deleted', async () => {
      const file1 = FileDetails.fromNewFileDetails(id1, newFile1);
      const file2 = FileDetails.fromNewFileDetails(id2, newFile2);

      const fds = new InMemoryFileDataService([file1, file2]);
      expect(fds.filesList.length).toBe(2);

      const filename = 'test filename';
      const result = await fds.deleteFiles([filename]);
      expect(result[filename].filename).toBe(filename);
      expect(result[filename].fileDetails).toBe(null);
      expect(result[filename].error).toBe('File Does Not Exist In Database');
    });
  });
});
