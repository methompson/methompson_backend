import formidable, { Formidable } from 'formidable';
import { Request } from 'express';
import { ConfigService } from '@nestjs/config';

import { ImageController } from '@/src/image/image.controller';
import { UploadedFile } from '@/src/image/image_data_types';

type FormidableParseCalback = (
  err: any,
  fields: formidable.Fields,
  files: formidable.Files,
) => void;

jest.mock('fs/promises', () => {
  const mkdir = jest.fn(async () => {});

  return {
    mkdir,
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

const errorSpy = jest.spyOn(console, 'error');
errorSpy.mockImplementation(() => {});

const parse = Formidable.prototype.parse as jest.Mock<unknown, unknown[]>;

describe('ImageController', () => {
  const newFilename1 = 'newFileName1';
  const originalFilename1 = 'originalFileName1';

  const newFilename2 = 'newFileName2';
  const originalFilename2 = 'originalFileName2';

  describe('uploadImage', () => {});

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

      parse.mockImplementationOnce((a, b: FormidableParseCalback) => {
        b(null, fields, file);
      });

      const configService = new ConfigService();
      const ic = new ImageController(configService);
      const result = await ic.parseImageFilesAndFields(req, '');

      expect(parse).toHaveBeenCalledTimes(1);
      expect(parse).toHaveBeenCalledWith(req, expect.anything());

      expect(result).toStrictEqual({
        imageFiles: [UploadedFile.fromFormidable(image1)],
        fields,
      });
    });

    test('returns files and fields', async () => {
      const req = {} as unknown as Request;

      const file = { image: [image1, image2] } as formidable.Files;

      const fields = {
        field1: 'field1',
        field2: 'field2',
      };

      parse.mockImplementationOnce((a, b: FormidableParseCalback) => {
        b(null, fields, file);
      });

      const configService = new ConfigService();
      const ic = new ImageController(configService);
      const result = await ic.parseImageFilesAndFields(req, '');

      expect(parse).toHaveBeenCalledTimes(1);
      expect(parse).toHaveBeenCalledWith(req, expect.anything());

      expect(result).toStrictEqual({
        imageFiles: [
          UploadedFile.fromFormidable(image1),
          UploadedFile.fromFormidable(image2),
        ],
        fields,
      });
    });

    test('throws an error if parse returns an error', async () => {
      const configService = new ConfigService();
      const ic = new ImageController(configService);

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

      parse.mockImplementationOnce((a, b: FormidableParseCalback) => {
        b(err, {}, file);
      });

      expect(() => ic.parseImageFilesAndFields(req, '')).rejects.toThrow(err);
    });
  });
});
