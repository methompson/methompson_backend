import { describe } from '@jest/globals';

import { ImageResizeOptions, ImageType } from '@/src/models/image_models';

describe('Image Models', () => {
  describe('ImageReseizeOptions', () => {
    describe('newMimetype', () => {
      test('returns png mimetype as new image type', () => {
        const iro = new ImageResizeOptions('', { newFormat: ImageType.png });
        expect(iro.newMimetype).toBe('image/png');
      });

      test('returns jpeg mimetype as new image type', () => {
        const iro = new ImageResizeOptions('', { newFormat: ImageType.jpeg });
        expect(iro.newMimetype).toBe('image/jpeg');
      });

      test('returns gif mimetype as new image type', () => {
        const iro = new ImageResizeOptions('', { newFormat: ImageType.gif });
        expect(iro.newMimetype).toBe('image/gif');
      });

      test('returns heic mimetype as new image type', () => {
        const iro = new ImageResizeOptions('', { newFormat: ImageType.heic });
        expect(iro.newMimetype).toBe('image/heic');
      });

      test('returns bmp mimetype as new image type', () => {
        const iro = new ImageResizeOptions('', { newFormat: ImageType.bmp });
        expect(iro.newMimetype).toBe('image/bmp');
      });

      test('returns tiff mimetype as new image type', () => {
        const iro = new ImageResizeOptions('', { newFormat: ImageType.tiff });
        expect(iro.newMimetype).toBe('image/tiff');
      });

      test('returns undefined if nothing is provided', () => {
        const iro = new ImageResizeOptions('', {});
        expect(iro.newMimetype).toBeUndefined();
      });
    });

    describe('imageFormatPrefix', () => {
      test('returns a png image format prefix based on input', () => {
        const iro = new ImageResizeOptions('', { newFormat: ImageType.png });
        expect(iro.imageFormatPrefix).toBe('png');
      });

      test('returns a jpeg image format prefix based on input', () => {
        const iro = new ImageResizeOptions('', { newFormat: ImageType.jpeg });
        expect(iro.imageFormatPrefix).toBe('jpeg');
      });

      test('returns a gif image format prefix based on input', () => {
        const iro = new ImageResizeOptions('', { newFormat: ImageType.gif });
        expect(iro.imageFormatPrefix).toBe('gif');
      });

      test('returns a heic image format prefix based on input', () => {
        const iro = new ImageResizeOptions('', { newFormat: ImageType.heic });
        expect(iro.imageFormatPrefix).toBe('heic');
      });

      test('returns a bmp image format prefix based on input', () => {
        const iro = new ImageResizeOptions('', { newFormat: ImageType.bmp });
        expect(iro.imageFormatPrefix).toBe('bmp3');
      });

      test('returns a tiff image format prefix based on input', () => {
        const iro = new ImageResizeOptions('', { newFormat: ImageType.tiff });
        expect(iro.imageFormatPrefix).toBe('tiff');
      });

      test('returns an empty string if no new format is provided', () => {
        const iro = new ImageResizeOptions('', {});
        expect(iro.imageFormatPrefix).toBe('');
      });
    });

    describe('fromWebFields', () => {
      test('Default values', () => {
        const iro = ImageResizeOptions.fromWebFields({});
        expect(iro.doNotConvert).toBe(false);
        expect(iro.newFormat).toBeUndefined();
        expect(iro.resize).toBe(true);
        expect(iro.stripMeta).toBe(false);
        expect(iro.maxSize).toBeUndefined();
        expect(iro.identifier).toBe('');
        expect(iro.isPrivate).toBe(true);
      });

      test('Returns an ImageResizeOptions object with isPrivate set with a bool', () => {
        let iro: ImageResizeOptions;

        iro = ImageResizeOptions.fromWebFields({
          isPrivate: true,
        });

        expect(iro.isPrivate).toBe(true);

        iro = ImageResizeOptions.fromWebFields({
          isPrivate: false,
        });

        expect(iro.isPrivate).toBe(false);
      });

      test('Returns an ImageResizeOptions object with isPrivate set with a string', () => {
        let iro: ImageResizeOptions;

        iro = ImageResizeOptions.fromWebFields({
          isPrivate: 'true',
        });

        expect(iro.isPrivate).toBe(true);

        iro = ImageResizeOptions.fromWebFields({
          isPrivate: 'false',
        });

        expect(iro.isPrivate).toBe(false);
      });

      test('Returns an ImageResizeOptions object with identifier set', () => {
        const iro = ImageResizeOptions.fromWebFields({
          identifier: 'test',
        });

        expect(iro.identifier).toBe('test');
      });

      test('Returns an ImageResizeOptions object with identifier not set', () => {
        const iro = ImageResizeOptions.fromWebFields({
          identifier: true,
        });

        expect(iro.identifier).toBe('');
      });

      test('Returns an ImageResizeOptions object with retainImage set to true', () => {
        const iro1 = ImageResizeOptions.fromWebFields({
          retainImage: true,
        });
        expect(iro1.doNotConvert).toBe(true);
        const iro2 = ImageResizeOptions.fromWebFields({
          retainImage: 'true',
        });
        expect(iro2.doNotConvert).toBe(true);
      });

      test('Returns an ImageResizeOptions object with retainImage set to false', () => {
        expect(
          ImageResizeOptions.fromWebFields({ retainImage: false }).doNotConvert,
        ).toBe(false);
        expect(
          ImageResizeOptions.fromWebFields({ retainImage: 'false' })
            .doNotConvert,
        ).toBe(false);
        expect(
          ImageResizeOptions.fromWebFields({ retainImage: '' }).doNotConvert,
        ).toBe(false);
      });

      test('Returns an ImageResizeOptions object with maxSize set', () => {
        expect(
          ImageResizeOptions.fromWebFields({ maxSize: 1024 }).maxSize,
        ).toBe(1024);
        expect(
          ImageResizeOptions.fromWebFields({ maxSize: '1024' }).maxSize,
        ).toBe(1024);
      });

      test('Returns an ImageResizeOptions object with maxSize not set', () => {
        expect(
          ImageResizeOptions.fromWebFields({ maxSize: '' }).maxSize,
        ).toBeUndefined();
      });

      test('Returns an ImageResizeOptions object with newFormat set', () => {
        expect(
          ImageResizeOptions.fromWebFields({ newFormat: 'jpeg' }).newFormat,
        ).toBe(ImageType.jpeg);

        expect(
          ImageResizeOptions.fromWebFields({ newFormat: 'jpg' }).newFormat,
        ).toBe(ImageType.jpeg);

        expect(
          ImageResizeOptions.fromWebFields({ newFormat: 'png' }).newFormat,
        ).toBe(ImageType.png);

        expect(
          ImageResizeOptions.fromWebFields({ newFormat: 'gif' }).newFormat,
        ).toBe(ImageType.gif);

        expect(
          ImageResizeOptions.fromWebFields({ newFormat: 'heic' }).newFormat,
        ).toBe(ImageType.heic);

        expect(
          ImageResizeOptions.fromWebFields({ newFormat: 'bmp' }).newFormat,
        ).toBe(ImageType.bmp);

        expect(
          ImageResizeOptions.fromWebFields({ newFormat: 'tiff' }).newFormat,
        ).toBe(ImageType.tiff);
      });

      test('Returns an ImageResizeOptions object with newFormat not set', () => {
        expect(
          ImageResizeOptions.fromWebFields({ newFormat: 'jg' }).newFormat,
        ).toBeUndefined();
        expect(
          ImageResizeOptions.fromWebFields({ newFormat: 'pg' }).newFormat,
        ).toBeUndefined();
        expect(
          ImageResizeOptions.fromWebFields({ newFormat: 'bp' }).newFormat,
        ).toBeUndefined();
        expect(
          ImageResizeOptions.fromWebFields({ newFormat: 'bmp3' }).newFormat,
        ).toBeUndefined();
        expect(
          ImageResizeOptions.fromWebFields({ newFormat: 'pdf' }).newFormat,
        ).toBeUndefined();
        expect(
          ImageResizeOptions.fromWebFields({ newFormat: 'aic' }).newFormat,
        ).toBeUndefined();
        expect(
          ImageResizeOptions.fromWebFields({ newFormat: 'tif' }).newFormat,
        ).toBeUndefined();
        expect(
          ImageResizeOptions.fromWebFields({ newFormat: 'jpge' }).newFormat,
        ).toBeUndefined();
        expect(
          ImageResizeOptions.fromWebFields({ newFormat: 'jpe' }).newFormat,
        ).toBeUndefined();
        expect(
          ImageResizeOptions.fromWebFields({ newFormat: 'ping' }).newFormat,
        ).toBeUndefined();
        expect(
          ImageResizeOptions.fromWebFields({ newFormat: 'jif' }).newFormat,
        ).toBeUndefined();
      });

      test('Returns an ImageResizeObject with stripMeta set', () => {
        expect(
          ImageResizeOptions.fromWebFields({ stripMeta: 'true' }).stripMeta,
        ).toBe(true);
        expect(
          ImageResizeOptions.fromWebFields({ stripMeta: true }).stripMeta,
        ).toBe(true);

        expect(
          ImageResizeOptions.fromWebFields({ stripMeta: 'false' }).stripMeta,
        ).toBe(false);
        expect(
          ImageResizeOptions.fromWebFields({ stripMeta: '' }).stripMeta,
        ).toBe(false);
        expect(
          ImageResizeOptions.fromWebFields({ stripMeta: false }).stripMeta,
        ).toBe(false);
        expect(
          ImageResizeOptions.fromWebFields({ stripMeta: null }).stripMeta,
        ).toBe(false);
      });

      test('Returns an ImageResizeObject with resize set', () => {
        expect(
          ImageResizeOptions.fromWebFields({ resize: 'false' }).resize,
        ).toBe(false);
        expect(ImageResizeOptions.fromWebFields({ resize: false }).resize).toBe(
          false,
        );

        expect(
          ImageResizeOptions.fromWebFields({ resize: 'true' }).resize,
        ).toBe(true);
        expect(ImageResizeOptions.fromWebFields({ resize: '' }).resize).toBe(
          true,
        );
        expect(ImageResizeOptions.fromWebFields({ resize: true }).resize).toBe(
          true,
        );
        expect(ImageResizeOptions.fromWebFields({ resize: null }).resize).toBe(
          true,
        );
      });
    });

    describe('getImageTypeFromString', () => {
      test('Returns image formats for proper inputs', () => {
        expect(ImageResizeOptions.getImageTypeFromString('jpg')).toBe(
          ImageType.jpeg,
        );
        expect(ImageResizeOptions.getImageTypeFromString('jpeg')).toBe(
          ImageType.jpeg,
        );
        expect(ImageResizeOptions.getImageTypeFromString('png')).toBe(
          ImageType.png,
        );
        expect(ImageResizeOptions.getImageTypeFromString('gif')).toBe(
          ImageType.gif,
        );
        expect(ImageResizeOptions.getImageTypeFromString('heic')).toBe(
          ImageType.heic,
        );
        expect(ImageResizeOptions.getImageTypeFromString('bmp')).toBe(
          ImageType.bmp,
        );
        expect(ImageResizeOptions.getImageTypeFromString('tiff')).toBe(
          ImageType.tiff,
        );
      });

      test('non-string returns null', () => {
        expect(ImageResizeOptions.getImageTypeFromString(true)).toBeUndefined();
        expect(ImageResizeOptions.getImageTypeFromString(null)).toBeUndefined();
        expect(ImageResizeOptions.getImageTypeFromString(1)).toBeUndefined();
        expect(ImageResizeOptions.getImageTypeFromString([])).toBeUndefined();
        expect(ImageResizeOptions.getImageTypeFromString({})).toBeUndefined();
      });

      test('string values apart from the above return null', () => {
        expect(ImageResizeOptions.getImageTypeFromString('jg')).toBeUndefined();
        expect(ImageResizeOptions.getImageTypeFromString('pg')).toBeUndefined();
        expect(ImageResizeOptions.getImageTypeFromString('bp')).toBeUndefined();
        expect(
          ImageResizeOptions.getImageTypeFromString('bmp3'),
        ).toBeUndefined();
        expect(
          ImageResizeOptions.getImageTypeFromString('pdf'),
        ).toBeUndefined();
        expect(
          ImageResizeOptions.getImageTypeFromString('aic'),
        ).toBeUndefined();
        expect(
          ImageResizeOptions.getImageTypeFromString('tif'),
        ).toBeUndefined();
        expect(
          ImageResizeOptions.getImageTypeFromString('jpge'),
        ).toBeUndefined();
        expect(
          ImageResizeOptions.getImageTypeFromString('jpe'),
        ).toBeUndefined();
        expect(
          ImageResizeOptions.getImageTypeFromString('ping'),
        ).toBeUndefined();
        expect(
          ImageResizeOptions.getImageTypeFromString('jif'),
        ).toBeUndefined();
      });
    });
  });
});
