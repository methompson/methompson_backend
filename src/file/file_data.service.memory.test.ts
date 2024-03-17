import { InMemoryFileDataService } from '@/src/file/file_data.service.memory';
import { FileSortOption } from '@/src/file/file_data.service';
import {
  FileDetails,
  FileDetailsMetadata,
  NewFileDetailsJSON,
} from '@/src/models/file_models';

const filepath = 'path/to/file';

const originalFileName1 = 'zyx originalFileName1 0aihsdfnlk';
const filename1 = '16713749-d83c-42c0-b4a8-4a29a04cd171';
const dateAdded1 = new Date(1);
const authorId1 = 'authorId1 ;aoidsl';
const mimetype1 = 'image/jpeg';
const size1 = 1024;
const isPrivate1 = true;
const metadata1: FileDetailsMetadata = {};

const file1 = new FileDetails(
  originalFileName1,
  filename1,
  dateAdded1,
  authorId1,
  mimetype1,
  size1,
  isPrivate1,
  metadata1,
);

const newFile1: NewFileDetailsJSON = {
  filepath,
  fileDetails: file1,
};

const originalFileName2 = 'abc originalFileName2 aspdfiln';
const filename2 = '2b883407-6b52-40f1-b129-e64e857218ef';
const dateAdded2 = new Date(2);
const authorId2 = 'authorId2 awosdln';
const mimetype2 = 'application/json';
const size2 = 2048;
const isPrivate2 = false;
const metadata2: FileDetailsMetadata = {};

const file2 = new FileDetails(
  originalFileName2,
  filename2,
  dateAdded2,
  authorId2,
  mimetype2,
  size2,
  isPrivate2,
  metadata2,
);

const newFile2: NewFileDetailsJSON = {
  filepath,
  fileDetails: file2,
};

describe('InMemoryFileDataService', () => {
  describe('addFiles', () => {
    test('adds a file to the files record', async () => {
      const fds = new InMemoryFileDataService();

      expect(fds.filesList.length).toBe(0);
      fds.addFiles([newFile1]);

      expect(fds.filesList.length).toBe(1);

      const result = fds.filesList[0];

      expect(result?.toJSON()).toMatchObject(newFile1.fileDetails.toJSON());
    });

    test('adds multiple files to the files record', async () => {
      const fds = new InMemoryFileDataService();

      expect(fds.filesList.length).toBe(0);
      fds.addFiles([newFile1, newFile2]);

      expect(fds.filesList.length).toBe(2);

      const result1 = fds.filesList.find(
        (el) => el.filename === originalFileName1,
      );

      expect(result1?.toJSON()).toMatchObject(newFile1.fileDetails.toJSON());

      const result2 = fds.filesList.find(
        (el) => el.filename === originalFileName2,
      );

      expect(result2?.toJSON()).toMatchObject(newFile2.fileDetails.toJSON());
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

      expect(result1?.toJSON()).toMatchObject(newFile2.fileDetails.toJSON());
      expect(result2?.toJSON()).toMatchObject(newFile1.fileDetails.toJSON());
    });

    test('Returns a list of files sorted by dateAdded when dateAdded option is added', async () => {
      const fds = new InMemoryFileDataService();
      fds.addFiles([newFile1, newFile2]);
      expect(fds.filesList.length).toBe(2);

      const files = await fds.getFileList({
        page: 1,
        pagination: 20,
        sortBy: FileSortOption.Chrono,
      });
      expect(files.length).toBe(2);

      const result1 = files.find((el) => el.id === newFile1.fileDetails.id);
      const result2 = files.find((el) => el.id === newFile2.fileDetails.id);

      expect(result1?.toJSON()).toMatchObject(newFile1.fileDetails.toJSON());
      expect(result2?.toJSON()).toMatchObject(newFile2.fileDetails.toJSON());
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
      const fds = new InMemoryFileDataService([file1, file2]);

      const result1 = await fds.getFileByName(file1.id);
      expect(result1.toJSON()).toStrictEqual(file1.toJSON());

      const result2 = await fds.getFileByName(file2.id);
      expect(result2.toJSON()).toStrictEqual(file2.toJSON());
    });

    test('Throws an error if its id does not exist', async () => {
      const fds = new InMemoryFileDataService([file1, file2]);

      await expect(() => fds.getFileByName('abc')).rejects.toThrow();
    });
  });

  describe('updateFile', () => {
    test('Updates a filename in the files object', async () => {
      const file1Copy = FileDetails.fromJSON(file1.toJSON());
      const fds = new InMemoryFileDataService([file1Copy]);

      expect(fds.files[file1Copy.id]?.filename).toBe(originalFileName1);

      const newFilename = 'new filename';

      await fds.updateFile({
        id: file1Copy.id,
        filename: newFilename,
      });

      expect(fds.files[file1Copy.id]?.filename).toBe(newFilename);
    });

    test('Updates isPrivate in the files object', async () => {
      const file1Copy = FileDetails.fromJSON(file1.toJSON());
      const fds = new InMemoryFileDataService([file1Copy]);

      expect(fds.files[file1Copy.id]?.isPrivate).toBe(isPrivate1);

      const newIsPrivate = !isPrivate1;

      await fds.updateFile({
        id: file1Copy.id,
        isPrivate: newIsPrivate,
      });

      expect(fds.files[file1Copy.id]?.isPrivate).toBe(newIsPrivate);
    });

    test('Returns the result', async () => {
      const file1Copy = FileDetails.fromJSON(file1.toJSON());
      const fds = new InMemoryFileDataService([file1Copy]);

      expect(fds.files[file1Copy.id]?.isPrivate).toBe(isPrivate1);
      expect(fds.files[file1Copy.id]?.filename).toBe(originalFileName1);

      const newFilename = 'new filename';
      const newIsPrivate = !isPrivate1;

      const result = await fds.updateFile({
        id: file1Copy.id,
        filename: newFilename,
        isPrivate: newIsPrivate,
      });

      expect(result.toJSON()).toStrictEqual({
        ...file1Copy.toJSON(),
        filename: newFilename,
        isPrivate: newIsPrivate,
      });
    });
  });

  describe('deleteFile', () => {
    test('Deletes a file form the files object', async () => {
      const file1 = newFile1.fileDetails;
      const file2 = newFile2.fileDetails;

      const fds = new InMemoryFileDataService([file1, file2]);
      expect(fds.filesList.length).toBe(2);

      const result = await fds.deleteFiles([file1.id]);

      expect(fds.filesList.length).toBe(1);

      expect(result[file1.id]?.fileDetails?.toJSON()).toStrictEqual(
        file1.toJSON(),
      );
      expect(result[file1.id]?.filename).toBe(file1.id);
      expect(result[file1.id]?.error).toBeUndefined();
    });

    test('Deletes multiple files from the files object', async () => {
      const file1 = newFile1.fileDetails;
      const file2 = newFile2.fileDetails;

      const fds = new InMemoryFileDataService([file1, file2]);
      expect(fds.filesList.length).toBe(2);

      const result = await fds.deleteFiles([file1.id, file2.id]);

      expect(fds.filesList.length).toBe(0);

      expect(result[file1.id]?.fileDetails?.toJSON()).toStrictEqual(
        file1.toJSON(),
      );
      expect(result[file1.id]?.filename).toBe(file1.id);
      expect(result[file1.id]?.error).toBeUndefined();
      expect(result[file2.id]?.fileDetails?.toJSON()).toStrictEqual(
        file2.toJSON(),
      );
      expect(result[file2.id]?.filename).toBe(file2.id);
      expect(result[file2.id]?.error).toBeUndefined();
    });

    test('Provides error information for all files not deleted', async () => {
      const file1 = newFile1.fileDetails;
      const file2 = newFile2.fileDetails;

      const fds = new InMemoryFileDataService([file1, file2]);
      expect(fds.filesList.length).toBe(2);

      const filename = 'test filename';
      const result = await fds.deleteFiles([filename]);
      expect(result[filename]?.filename).toBe(filename);
      expect(result[filename]?.fileDetails).toBeUndefined();
      expect(result[filename]?.error).toBe('File Does Not Exist In Database');
    });
  });
});
