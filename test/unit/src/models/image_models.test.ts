import { InvalidInputError } from '@/src/errors/invalid_input_error';
import {
  FileDetails,
  ImageDetails,
  ImageDimensions,
  NewImageDetails,
  UploadedFile,
} from '@/src/models/image_models';

const originalFilename = 'originalFilename';
const dateAdded = '2022-06-26T11:42:56.673Z';

const filename1 = 'filename1';
const identifier1 = 'web';
const dimensions1: Record<string, unknown> = { x: 1024, y: 768 };

const filename2 = 'filename2';
const identifier2 = 'thumb';
const dimensions2: Record<string, unknown> = { x: 64, y: 32 };

describe('image_models', () => {
  let validNewImageDetails: Record<string, unknown> = {};
  let validFile1: Record<string, unknown> = {};
  let validFile2: Record<string, unknown> = {};

  const imageId = '208q9werypfohaijsk';
  const authorId = '023ueiowjfaknldsm';
  const id = '04oiejwakdscm,';
  const isPrivate = false;

  beforeEach(() => {
    validFile1 = {
      filename: filename1,
      identifier: identifier1,
      dimensions: dimensions1,
    };
    validFile2 = {
      filename: filename2,
      identifier: identifier2,
      dimensions: dimensions2,
    };
    validNewImageDetails = {
      imageId,
      files: [validFile1, validFile2],
      originalFilename,
      dateAdded,
      authorId,
      isPrivate,
    };
  });

  describe('UploadedFile', () => {
    describe('nameComponents', () => {
      test('returns the extension of a file name', () => {
        expect(
          new UploadedFile('', 'test.ext', '', 0).nameComponents,
        ).toStrictEqual({
          name: 'test',
          extension: 'ext',
        });
        expect(
          new UploadedFile('', 'file.jpg', '', 0).nameComponents,
        ).toStrictEqual({
          name: 'file',
          extension: 'jpg',
        });
        expect(
          new UploadedFile('', 'img.png', '', 0).nameComponents,
        ).toStrictEqual({
          name: 'img',
          extension: 'png',
        });
        expect(
          new UploadedFile('', 'its a file.bmp', '', 0).nameComponents,
        ).toStrictEqual({
          name: 'its a file',
          extension: 'bmp',
        });
        expect(
          new UploadedFile('', 'something.gif', '', 0).nameComponents,
        ).toStrictEqual({
          name: 'something',
          extension: 'gif',
        });
        expect(
          new UploadedFile('', 'hello.tiff', '', 0).nameComponents,
        ).toStrictEqual({
          name: 'hello',
          extension: 'tiff',
        });
        expect(
          new UploadedFile('', 'abcdefg.heic', '', 0).nameComponents,
        ).toStrictEqual({
          name: 'abcdefg',
          extension: 'heic',
        });
      });

      test('returns a file name with periods in it intact', () => {
        expect(
          new UploadedFile('', 'test.file.name.ext', '', 0).nameComponents,
        ).toStrictEqual({
          name: 'test.file.name',
          extension: 'ext',
        });
      });

      test('returns an empty string for extension if none exists', () => {
        expect(
          new UploadedFile('', 'test_file_name', '', 0).nameComponents,
        ).toStrictEqual({
          name: 'test_file_name',
          extension: '',
        });
      });
    });

    describe('sanitizedFilename', () => {
      test('replaces nothing if none of the characters are outside the regex', () => {
        const filename = 'filename013.ext';
        const uf = new UploadedFile('', filename, '', 0);
        expect(uf.sanitizedFilename).toBe(filename);
      });

      test('replaces invalid characters with underscores', () => {
        const filename = 'filename$name.ext';
        const uf = new UploadedFile('', filename, '', 0);
        expect(uf.sanitizedFilename).toBe('filename_name.ext');
      });

      test('replaces multiple invalid characters with a single underscores', () => {
        const filename = 'filename$$$$$$name.ext';
        const uf = new UploadedFile('', filename, '', 0);
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

  describe('ImageResizeOptions', () => {});

  describe('FileDetails', () => {
    describe('fromJSON', () => {
      test('Returns a fileDetails object given a valid input', () => {
        const fileDetails1 = FileDetails.fromJSON(validFile1);
        expect(fileDetails1.filename).toBe(validFile1.filename);
        expect(fileDetails1.identifier).toBe(validFile1.identifier);
        expect(fileDetails1.dimensions).toBe(validFile1.dimensions);

        const fileDetails2 = FileDetails.fromJSON(validFile2);
        expect(fileDetails2.filename).toBe(validFile2.filename);
        expect(fileDetails2.identifier).toBe(validFile2.identifier);
        expect(fileDetails2.dimensions).toBe(validFile2.dimensions);
      });

      test('toJSON can be fed directly into fromJSON and get the same values', () => {
        const dim: ImageDimensions = dimensions1 as unknown as ImageDimensions;

        const fileDetails1 = new FileDetails(filename1, identifier1, dim);

        const fileDetails2 = FileDetails.fromJSON(fileDetails1.toJSON());

        expect(fileDetails1.toJSON()).toStrictEqual(fileDetails2.toJSON());
      });

      test('Extra values will be ignored', () => {
        const fileDetailsInt = {
          ...validFile1,
          junk: 'junk',
        };

        const fileDetails = FileDetails.fromJSON(fileDetailsInt);
        expect(fileDetails.toJSON()).toStrictEqual(validFile1);
      });

      test('Throws an error if the input is invalid', () => {
        let input = { ...validFile1 };
        expect(() => FileDetails.fromJSON(input)).not.toThrow();

        input = { ...validFile1 };
        delete input.filename;
        expect(() => FileDetails.fromJSON(input)).toThrow(
          new InvalidInputError('Invalid file details input'),
        );

        input = { ...validFile1 };
        delete input.identifier;
        expect(() => FileDetails.fromJSON(input)).toThrow(
          new InvalidInputError('Invalid file details input'),
        );

        input = { ...validFile1 };
        delete input.dimensions;
        expect(() => FileDetails.fromJSON(input)).toThrow(
          new InvalidInputError('Invalid file details input'),
        );

        input = { ...validFile1 };
        input.filename = 1;
        expect(() => FileDetails.fromJSON(input)).toThrow(
          new InvalidInputError('Invalid file details input'),
        );

        input = { ...validFile1 };
        input.identifier = 1;
        expect(() => FileDetails.fromJSON(input)).toThrow(
          new InvalidInputError('Invalid file details input'),
        );

        input = { ...validFile1 };
        input.dimensions = 1;
        expect(() => FileDetails.fromJSON(input)).toThrow(
          new InvalidInputError('Invalid file details input'),
        );

        expect(() => FileDetails.fromJSON([])).toThrow(
          new InvalidInputError('Invalid file details input'),
        );

        expect(() => FileDetails.fromJSON(null)).toThrow(
          new InvalidInputError('Invalid file details input'),
        );

        expect(() => FileDetails.fromJSON('string')).toThrow(
          new InvalidInputError('Invalid file details input'),
        );

        expect(() => FileDetails.fromJSON(1)).toThrow(
          new InvalidInputError('Invalid file details input'),
        );
      });
    });

    describe('isFileDetailsInterface', () => {
      test('returns true if the input is a valid FileDetailsInterface', () => {
        expect(FileDetails.isFileDetailsInterface(validFile1)).toBe(true);
        expect(FileDetails.isFileDetailsInterface(validFile2)).toBe(true);
      });

      test('returns true if the input is a valid FileDetailsInterface with extra data', () => {
        const vf1 = { ...validFile1, test: 'test' };
        expect(FileDetails.isFileDetailsInterface(vf1)).toBe(true);
      });

      test('returns false if any of the data points are the incorrect type or missing', () => {
        let input = { ...validFile1 };
        expect(FileDetails.isFileDetailsInterface(input)).toBe(true);

        input = { ...validFile1 };
        delete input.filename;
        expect(FileDetails.isFileDetailsInterface(input)).toBe(false);

        input = { ...validFile1 };
        input.filename = 1;
        expect(FileDetails.isFileDetailsInterface(input)).toBe(false);

        input = { ...validFile1 };
        delete input.identifier;
        expect(FileDetails.isFileDetailsInterface(input)).toBe(false);

        input = { ...validFile1 };
        input.identifier = 1;
        expect(FileDetails.isFileDetailsInterface(input)).toBe(false);

        input = { ...validFile1 };
        delete input.dimensions;
        expect(FileDetails.isFileDetailsInterface(input)).toBe(false);

        input = { ...validFile1 };
        input.dimensions = 1;
        expect(FileDetails.isFileDetailsInterface(input)).toBe(false);
      });
    });

    describe('isImageDimensions', () => {
      test('returns true if the input is a valid ImageDimensions', () => {
        expect(FileDetails.isImageDimensions(dimensions1)).toBe(true);
        expect(FileDetails.isImageDimensions(dimensions2)).toBe(true);
      });

      test('returns true if the input is a valid ImageDimensions with extra data', () => {
        const dim = { ...dimensions1, test: 'test' };
        expect(FileDetails.isImageDimensions(dim)).toBe(true);
      });

      test('returns false if the input is missing any data or the data is the incorrect type', () => {
        let input = { ...dimensions1 };
        expect(FileDetails.isImageDimensions(input)).toBe(true);

        input = { ...dimensions1 };
        delete input.x;
        expect(FileDetails.isImageDimensions(input)).toBe(false);

        input = { ...dimensions1 };
        input.x = '1';
        expect(FileDetails.isImageDimensions(input)).toBe(false);

        input = { ...dimensions1 };
        delete input.y;
        expect(FileDetails.isImageDimensions(input)).toBe(false);

        input = { ...dimensions1 };
        input.y = '1';
        expect(FileDetails.isImageDimensions(input)).toBe(false);
      });
    });
  });

  describe('NewImageDetails', () => {
    describe('getFileById', () => {
      test('returns a FileDetails object if the id exists', () => {
        const fileDetails = NewImageDetails.fromJSON(validNewImageDetails);

        const file1 = fileDetails.getFileById(identifier1);
        expect(file1.toJSON()).toStrictEqual(validFile1);

        const file2 = fileDetails.getFileById(identifier2);
        expect(file2.toJSON()).toStrictEqual(validFile2);
      });

      test('returns null if the id does not exist', () => {
        const fileDetails = NewImageDetails.fromJSON(validNewImageDetails);
        expect(fileDetails.getFileById('nothing!')).toBe(null);
        expect(fileDetails.getFileById('something')).toBe(null);
        expect(fileDetails.getFileById('junk')).toBe(null);
        expect(fileDetails.getFileById(')()(&*(&!')).toBe(null);
        expect(fileDetails.getFileById('a;oidjsfnl;asihdjl')).toBe(null);
      });
    });

    describe('fromJSON', () => {
      test('returns a NewImageDetails object with inputs', () => {
        const details = NewImageDetails.fromJSON(validNewImageDetails);

        expect(details.originalFilename).toBe(originalFilename);
        expect(details.dateAdded.toISOString()).toBe(dateAdded);

        const file1 = details.getFileById(identifier1);
        expect(file1.toJSON()).toStrictEqual(validFile1);

        const file2 = details.getFileById(identifier2);
        expect(file2.toJSON()).toStrictEqual(validFile2);
      });

      test('Throws an error if the inputs are invalid', () => {
        let input = { ...validNewImageDetails };

        expect(() => NewImageDetails.fromJSON(input)).not.toThrow();

        input = { ...validNewImageDetails };
        delete input.files;
        expect(() => NewImageDetails.fromJSON(input)).toThrow();

        input = { ...validNewImageDetails };
        input.files = 0;
        expect(() => NewImageDetails.fromJSON(input)).toThrow();

        input = { ...validNewImageDetails };
        delete input.originalFilename;
        expect(() => NewImageDetails.fromJSON(input)).toThrow();

        input = { ...validNewImageDetails };
        input.originalFilename = 0;
        expect(() => NewImageDetails.fromJSON(input)).toThrow();

        input = { ...validNewImageDetails };
        delete input.dateAdded;
        expect(() => NewImageDetails.fromJSON(input)).toThrow();

        input = { ...validNewImageDetails };
        input.dateAdded = 0;
        expect(() => NewImageDetails.fromJSON(input)).toThrow();
      });
    });

    describe('isNewImageDetailsInterface', () => {
      test('returns true if valid NewImageDetailsInterface is passed as an argument', () => {
        expect(
          NewImageDetails.isNewImageDetailsInterface(validNewImageDetails),
        ).toBe(true);
      });

      test('returns true if valid NewImageDetailsInterface is passed with extras as an argument', () => {
        const input = {
          ...validNewImageDetails,
          test: 'test',
        };

        expect(NewImageDetails.isNewImageDetailsInterface(input)).toBe(true);
      });

      test('returns false if the input is invalid', () => {
        let input = { ...validNewImageDetails };
        expect(NewImageDetails.isNewImageDetailsInterface(input)).toBe(true);

        input = { ...validNewImageDetails };
        delete input.files;
        expect(NewImageDetails.isNewImageDetailsInterface(input)).toBe(false);

        input = { ...validNewImageDetails };
        delete input.originalFilename;
        expect(NewImageDetails.isNewImageDetailsInterface(input)).toBe(false);

        input = { ...validNewImageDetails };
        delete input.dateAdded;
        expect(NewImageDetails.isNewImageDetailsInterface(input)).toBe(false);

        expect(NewImageDetails.isNewImageDetailsInterface(1)).toBe(false);
        expect(NewImageDetails.isNewImageDetailsInterface('1')).toBe(false);
        expect(NewImageDetails.isNewImageDetailsInterface(true)).toBe(false);
        expect(NewImageDetails.isNewImageDetailsInterface([])).toBe(false);
        expect(NewImageDetails.isNewImageDetailsInterface({})).toBe(false);
        expect(NewImageDetails.isNewImageDetailsInterface(null)).toBe(false);
      });
    });
  });

  describe('ImageDetails', () => {
    let validImageDetails: Record<string, unknown> = {};

    beforeEach(() => {
      validImageDetails = {
        ...validNewImageDetails,
        id,
      };
    });

    describe('toJSON', () => {
      test('returns an object of specific strucutre', () => {
        const details = ImageDetails.fromJSON(validImageDetails);

        expect(details.toJSON()).toStrictEqual({
          id,
          imageId,
          authorId,
          files: [validFile1, validFile2],
          originalFilename,
          dateAdded,
          isPrivate,
        });
      });
    });

    describe('fromNewImageDetails', () => {
      test('returns an ImageDetails object when passed valid inputs', () => {
        const input = NewImageDetails.fromJSON(validNewImageDetails);
        const details = ImageDetails.fromNewImageDetails(id, input);

        expect(details.toJSON()).toStrictEqual({
          ...validNewImageDetails,
          id,
        });
      });
    });

    describe('fromJSON', () => {
      test('Returns an ImageDetails object when the input is valid', () => {
        const details = ImageDetails.fromJSON(validImageDetails);

        expect(details.id).toBe(validImageDetails.id);
        expect(details.imageId).toBe(validImageDetails.imageId);
        expect(details.originalFilename).toBe(
          validImageDetails.originalFilename,
        );
        expect(details.dateAdded.toISOString()).toBe(
          validImageDetails.dateAdded,
        );

        expect(
          details.getFileById(validFile1.identifier as string).toJSON(),
        ).toStrictEqual(validFile1);
        expect(
          details.getFileById(validFile2.identifier as string).toJSON(),
        ).toStrictEqual(validFile2);
      });

      test('Returns an ImageDetails object when the input is valid, including extras', () => {
        const input = {
          ...validImageDetails,
          test: 'tests',
        };
        const details = ImageDetails.fromJSON(input);

        expect(details.id).toBe(validImageDetails.id);
        expect(details.imageId).toBe(validImageDetails.imageId);
        expect(details.originalFilename).toBe(
          validImageDetails.originalFilename,
        );
        expect(details.dateAdded.toISOString()).toBe(
          validImageDetails.dateAdded,
        );

        expect(
          details.getFileById(validFile1.identifier as string).toJSON(),
        ).toStrictEqual(validFile1);
        expect(
          details.getFileById(validFile2.identifier as string).toJSON(),
        ).toStrictEqual(validFile2);
      });

      test('Throws an error when the id input is invalid', () => {
        let input = { ...validImageDetails };
        expect(() => ImageDetails.fromJSON(input)).not.toThrow();

        input = { ...validImageDetails };
        delete input.id;
        expect(() => ImageDetails.fromJSON(input)).toThrow(
          new InvalidInputError('Invalid Image Details Input'),
        );

        input = { ...validImageDetails };
        input.id = 0;
        expect(() => ImageDetails.fromJSON(input)).toThrow(
          new InvalidInputError('Invalid Image Details Input'),
        );

        input = { ...validImageDetails };
        input.id = null;
        expect(() => ImageDetails.fromJSON(input)).toThrow(
          new InvalidInputError('Invalid Image Details Input'),
        );

        input = { ...validImageDetails };
        input.id = [];
        expect(() => ImageDetails.fromJSON(input)).toThrow(
          new InvalidInputError('Invalid Image Details Input'),
        );
      });

      test('Throws an error when the files input is invalid', () => {
        let input = { ...validImageDetails };
        expect(() => ImageDetails.fromJSON(input)).not.toThrow();

        input = { ...validImageDetails };
        delete input.id;
        expect(() => ImageDetails.fromJSON(input)).toThrow(
          new InvalidInputError('Invalid Image Details Input'),
        );

        input = { ...validImageDetails };
        input.files = 0;
        expect(() => ImageDetails.fromJSON(input)).toThrow(
          new InvalidInputError('Invalid Image Details Input'),
        );

        input = { ...validImageDetails };
        input.files = null;
        expect(() => ImageDetails.fromJSON(input)).toThrow(
          new InvalidInputError('Invalid Image Details Input'),
        );

        input = { ...validImageDetails };
        input.files = {};
        expect(() => ImageDetails.fromJSON(input)).toThrow(
          new InvalidInputError('Invalid Image Details Input'),
        );

        input = { ...validImageDetails };
        input.files = 'test';
        expect(() => ImageDetails.fromJSON(input)).toThrow(
          new InvalidInputError('Invalid Image Details Input'),
        );
      });

      test('Throws an error when the originalFilename input is invalid', () => {
        let input = { ...validImageDetails };
        expect(() => ImageDetails.fromJSON(input)).not.toThrow();

        input = { ...validImageDetails };
        delete input.originalFilename;
        expect(() => ImageDetails.fromJSON(input)).toThrow(
          new InvalidInputError('Invalid Image Details Input'),
        );

        input = { ...validImageDetails };
        input.originalFilename = 0;
        expect(() => ImageDetails.fromJSON(input)).toThrow(
          new InvalidInputError('Invalid Image Details Input'),
        );

        input = { ...validImageDetails };
        input.originalFilename = null;
        expect(() => ImageDetails.fromJSON(input)).toThrow(
          new InvalidInputError('Invalid Image Details Input'),
        );

        input = { ...validImageDetails };
        input.originalFilename = [];
        expect(() => ImageDetails.fromJSON(input)).toThrow(
          new InvalidInputError('Invalid Image Details Input'),
        );
      });

      test('Throws an error when the dateAdded input is invalid', () => {
        let input = { ...validImageDetails };
        expect(() => ImageDetails.fromJSON(input)).not.toThrow();

        input = { ...validImageDetails };
        delete input.dateAdded;
        expect(() => ImageDetails.fromJSON(input)).toThrow(
          new InvalidInputError('Invalid Image Details Input'),
        );

        input = { ...validImageDetails };
        input.dateAdded = 0;
        expect(() => ImageDetails.fromJSON(input)).toThrow(
          new InvalidInputError('Invalid Image Details Input'),
        );

        input = { ...validImageDetails };
        input.dateAdded = null;
        expect(() => ImageDetails.fromJSON(input)).toThrow(
          new InvalidInputError('Invalid Image Details Input'),
        );

        input = { ...validImageDetails };
        input.dateAdded = [];
        expect(() => ImageDetails.fromJSON(input)).toThrow(
          new InvalidInputError('Invalid Image Details Input'),
        );
      });
    });

    describe('isImageDetailsInterface', () => {
      test('Returns true if a valid ImageDetailsInterface is passed as an argument', () => {
        expect(ImageDetails.isImageDetailsInterface(validImageDetails)).toBe(
          true,
        );

        const moreDetails = { ...validImageDetails };
        moreDetails.files = [];

        expect(ImageDetails.isImageDetailsInterface(moreDetails)).toBe(true);
      });

      test('Returns true if a valid ImageDetailsInterface with extra data is passed as an argument', () => {
        const imageDetails = {
          ...validImageDetails,
          test: 'test',
        };

        expect(ImageDetails.isImageDetailsInterface(imageDetails)).toBe(true);
      });

      test('Returns false if the input is invalid', () => {
        let imageDetails = { ...validImageDetails };
        expect(ImageDetails.isImageDetailsInterface(imageDetails)).toBe(true);

        imageDetails = { ...validImageDetails };
        delete imageDetails.id;
        expect(ImageDetails.isImageDetailsInterface(imageDetails)).toBe(false);

        imageDetails = { ...validImageDetails };
        delete imageDetails.files;
        expect(ImageDetails.isImageDetailsInterface(imageDetails)).toBe(false);

        imageDetails = { ...validImageDetails };
        delete imageDetails.originalFilename;
        expect(ImageDetails.isImageDetailsInterface(imageDetails)).toBe(false);

        imageDetails = { ...validImageDetails };
        delete imageDetails.dateAdded;
        expect(ImageDetails.isImageDetailsInterface(imageDetails)).toBe(false);

        expect(ImageDetails.isImageDetailsInterface(1)).toBe(false);
        expect(ImageDetails.isImageDetailsInterface('1')).toBe(false);
        expect(ImageDetails.isImageDetailsInterface(true)).toBe(false);
        expect(ImageDetails.isImageDetailsInterface([])).toBe(false);
        expect(ImageDetails.isImageDetailsInterface({})).toBe(false);
        expect(ImageDetails.isImageDetailsInterface(null)).toBe(false);
      });
    });
  });
});
