import { UploadedFile } from '@/src/image/image_data_types';

describe('image_data_types', () => {
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
});
