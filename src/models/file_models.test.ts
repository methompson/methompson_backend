import { InvalidInputError } from '@/src/errors';
import {
  UploadedFile,
  FileDetailsJSON,
  FileDetailsMetadata,
  FileDetails,
} from '@/src/models/file_models';

const originalFilename = 'originalFilename';
const filename = '5d0b2e97-870e-4184-8f10-08d5d7dd1e2b.ext';
const dateAdded = '2022-06-26T11:42:56.673Z';

describe('file_models', () => {
  let validBaseFileDetails: FileDetailsJSON;

  const authorId = '023ueiowjfaknldsm';
  const id = '04oiejwakdscm,';
  const isPrivate = false;
  const size = 1024;
  const mimetype = 'image/jpeg';
  const metadata: FileDetailsMetadata = {};

  beforeEach(() => {
    validBaseFileDetails = {
      originalFilename,
      filename,
      dateAdded,
      authorId,
      mimetype,
      size,
      isPrivate,
      metadata,
    };
  });

  describe('UploadedFile', () => {
    describe('nameComponents', () => {
      test('returns the extension of a file name', () => {
        expect(
          new UploadedFile('', 'test.ext', 'image/jpeg', 0).nameComponents,
        ).toStrictEqual({
          name: 'test',
          extension: 'ext',
        });
        expect(
          new UploadedFile('', 'file.jpg', 'image/jpeg', 0).nameComponents,
        ).toStrictEqual({
          name: 'file',
          extension: 'jpg',
        });
        expect(
          new UploadedFile('', 'img.png', 'image/jpeg', 0).nameComponents,
        ).toStrictEqual({
          name: 'img',
          extension: 'png',
        });
        expect(
          new UploadedFile('', 'its a file.bmp', 'image/jpeg', 0)
            .nameComponents,
        ).toStrictEqual({
          name: 'its a file',
          extension: 'bmp',
        });
        expect(
          new UploadedFile('', 'something.gif', 'image/jpeg', 0).nameComponents,
        ).toStrictEqual({
          name: 'something',
          extension: 'gif',
        });
        expect(
          new UploadedFile('', 'hello.tiff', 'image/jpeg', 0).nameComponents,
        ).toStrictEqual({
          name: 'hello',
          extension: 'tiff',
        });
        expect(
          new UploadedFile('', 'abcdefg.heic', 'image/jpeg', 0).nameComponents,
        ).toStrictEqual({
          name: 'abcdefg',
          extension: 'heic',
        });
      });

      test('returns a file name with periods in it intact', () => {
        expect(
          new UploadedFile('', 'test.file.name.ext', 'image/jpeg', 0)
            .nameComponents,
        ).toStrictEqual({
          name: 'test.file.name',
          extension: 'ext',
        });
      });

      test('returns an empty string for extension if none exists', () => {
        expect(
          new UploadedFile('', 'test_file_name', 'image/jpeg', 0)
            .nameComponents,
        ).toStrictEqual({
          name: 'test_file_name',
          extension: '',
        });
      });
    });

    describe('sanitizedFilename', () => {
      test('replaces nothing if none of the characters are outside the regex', () => {
        const filename = 'filename013.ext';
        const uf = new UploadedFile('', filename, 'image/jpeg', 0);
        expect(uf.sanitizedFilename).toBe(filename);
      });

      test('replaces invalid characters with underscores', () => {
        const filename = 'filename$name.ext';
        const uf = new UploadedFile('', filename, 'image/jpeg', 0);
        expect(uf.sanitizedFilename).toBe('filename_name.ext');
      });

      test('replaces multiple invalid characters with a single underscores', () => {
        const filename = 'filename$$$$$$name.ext';
        const uf = new UploadedFile('', filename, 'image/jpeg', 0);
        expect(uf.sanitizedFilename).toBe('filename_name.ext');
      });
    });

    describe('sanitizeFilename', () => {
      test('replaces nothing if none of the characters are outside the regex', () => {
        const filename = 'filename013.ext';
        expect(UploadedFile.sanitizeFilename(filename)).toBe(filename);
      });

      test('replaces invalid characters with underscores', () => {
        const filename = 'filename$name.ext';
        expect(UploadedFile.sanitizeFilename(filename)).toBe(
          'filename_name.ext',
        );
      });

      test('replaces multiple invalid characters with a single underscores', () => {
        const filename = 'filename$$$$$$name.ext';
        expect(UploadedFile.sanitizeFilename(filename)).toBe(
          'filename_name.ext',
        );
      });
    });
  });

  describe('FileDetails', () => {
    let validFileDetails: Record<string, unknown> = {};

    beforeEach(() => {
      validFileDetails = {
        ...validBaseFileDetails,
        id,
      };
    });

    describe('toJSON', () => {
      test('returns an object of specific strucutre', () => {
        const details = FileDetails.fromJSON(validFileDetails);

        expect(details.toJSON()).toStrictEqual({
          originalFilename,
          filename,
          dateAdded,
          authorId,
          mimetype,
          size,
          isPrivate,
          metadata,
        });
      });
    });

    describe('fromJSON', () => {
      test('Returns an FileDetails object when the input is valid', () => {
        const details = FileDetails.fromJSON(validFileDetails);

        expect(details.filename).toBe(validFileDetails.filename);
        expect(details.originalFilename).toBe(
          validFileDetails.originalFilename,
        );
        expect(details.dateAdded.toISOString()).toBe(
          validFileDetails.dateAdded,
        );
      });

      test('Returns an FileDetails object when the input is valid, including extras', () => {
        const input = {
          ...validFileDetails,
          test: 'tests',
        };
        const details = FileDetails.fromJSON(input);

        expect(details.filename).toBe(validFileDetails.filename);
        expect(details.originalFilename).toBe(
          validFileDetails.originalFilename,
        );
        expect(details.dateAdded.toISOString()).toBe(
          validFileDetails.dateAdded,
        );
      });

      test('Throws an error when the isPrivate input is invalid', () => {
        let input = { ...validFileDetails };
        expect(() => FileDetails.fromJSON(input)).not.toThrow();

        const pErr = new InvalidInputError(
          'Invalid File Details Input: isPrivate',
        );

        input = { ...validFileDetails };
        delete input.isPrivate;
        expect(() => FileDetails.fromJSON(input)).toThrow(pErr);

        input = { ...validFileDetails };
        input.isPrivate = 0;
        expect(() => FileDetails.fromJSON(input)).toThrow(pErr);

        input = { ...validFileDetails };
        input.isPrivate = null;
        expect(() => FileDetails.fromJSON(input)).toThrow(pErr);

        input = { ...validFileDetails };
        input.isPrivate = {};
        expect(() => FileDetails.fromJSON(input)).toThrow(pErr);

        input = { ...validFileDetails };
        input.isPrivate = 'test';
        expect(() => FileDetails.fromJSON(input)).toThrow(pErr);
      });

      test('Throws an error when the originalFilename input is invalid', () => {
        let input = { ...validFileDetails };
        expect(() => FileDetails.fromJSON(input)).not.toThrow();

        const ofErr = new InvalidInputError(
          'Invalid File Details Input: originalFilename',
        );

        input = { ...validFileDetails };
        delete input.originalFilename;
        expect(() => FileDetails.fromJSON(input)).toThrow(ofErr);

        input = { ...validFileDetails };
        input.originalFilename = 0;
        expect(() => FileDetails.fromJSON(input)).toThrow(ofErr);

        input = { ...validFileDetails };
        input.originalFilename = null;
        expect(() => FileDetails.fromJSON(input)).toThrow(ofErr);

        input = { ...validFileDetails };
        input.originalFilename = [];
        expect(() => FileDetails.fromJSON(input)).toThrow(ofErr);
      });

      test('Throws an error when the size input is invalid', () => {
        let input = { ...validFileDetails };
        expect(() => FileDetails.fromJSON(input)).not.toThrow();

        const sizeErr = new InvalidInputError(
          'Invalid File Details Input: size',
        );

        input = { ...validFileDetails };
        delete input.size;
        expect(() => FileDetails.fromJSON(input)).toThrow(sizeErr);

        input = { ...validFileDetails };
        input.size = false;
        expect(() => FileDetails.fromJSON(input)).toThrow(sizeErr);

        input = { ...validFileDetails };
        input.size = null;
        expect(() => FileDetails.fromJSON(input)).toThrow(sizeErr);

        input = { ...validFileDetails };
        input.size = [];
        expect(() => FileDetails.fromJSON(input)).toThrow(sizeErr);
      });

      test('Throws an error when the dateAdded input is invalid', () => {
        let input = { ...validFileDetails };
        expect(() => FileDetails.fromJSON(input)).not.toThrow();

        const dErr = new InvalidInputError(
          'Invalid File Details Input: dateAdded',
        );

        input = { ...validFileDetails };
        delete input.dateAdded;
        expect(() => FileDetails.fromJSON(input)).toThrow(dErr);

        input = { ...validFileDetails };
        input.dateAdded = 0;
        expect(() => FileDetails.fromJSON(input)).toThrow(dErr);

        input = { ...validFileDetails };
        input.dateAdded = null;
        expect(() => FileDetails.fromJSON(input)).toThrow(dErr);

        input = { ...validFileDetails };
        input.dateAdded = [];
        expect(() => FileDetails.fromJSON(input)).toThrow(dErr);
      });
    });
  });
});
