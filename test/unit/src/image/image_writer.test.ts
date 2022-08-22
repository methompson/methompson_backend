import * as child_process from 'child_process';
import * as uuid from 'uuid';

import { ImageWriter } from '@/src/image/image_writer';
import { ImageResizeOptions, UploadedFile } from '@/src/image/image_data_types';

type ExecCallback = (
  error: Error | null,
  sdout: string,
  stderr: string,
) => void;

jest.mock('fs/promises', () => {
  const mkdir = jest.fn(async () => {});

  return {
    mkdir,
  };
});

jest.mock('child_process', () => {
  const exec = jest.fn((_, a: ExecCallback) => {
    a(null, '', '');
  });

  return { exec };
});

jest.mock('uuid', () => {
  const v4 = jest.fn(() => 'uuidv4');

  return {
    v4,
  };
});

const exec = child_process.exec as unknown as jest.Mock<unknown, unknown[]>;
const uuidv4 = uuid.v4 as jest.Mock<unknown, unknown[]>;

describe('ImageWriter', () => {
  const newFilename1 = 'newFileName1';
  const originalFilename1 = 'originalFileName1';

  const newFilename2 = 'newFileName2';
  const originalFilename2 = 'originalFileName2';

  const testError = 'test error';

  beforeEach(() => {
    uuidv4.mockClear();
    exec.mockClear();
  });

  const image1 = new UploadedFile(
    '/path/to/file',
    originalFilename1,
    'image/jpeg',
    1024,
  );

  const image2 = new UploadedFile(
    '/some/other/path',
    originalFilename2,
    'image/png',
    2048,
  );

  describe('convertImages', () => {
    test('calls functions with the passed in data', async () => {
      const ic = new ImageWriter('');

      const makeResizeSpy = jest.spyOn(ic, 'makeAndRunResizeScript');
      makeResizeSpy.mockImplementationOnce(async (_) => {});
      const makeThumbnailSpy = jest.spyOn(ic, 'makeAndRunThumbnailScript');
      makeThumbnailSpy.mockImplementationOnce(async (_) => {});
      const makeDeleteSpy = jest.spyOn(ic, 'makeAndRunDeleteScript');
      makeDeleteSpy.mockImplementationOnce(async (_) => {});

      const parsedData = {
        imageFiles: [image1],
        fields: {},
      };

      uuidv4.mockImplementation(() => newFilename1);

      await ic.convertImages(parsedData);

      expect(uuidv4).toHaveBeenCalledTimes(1);

      expect(makeResizeSpy).toHaveBeenCalledTimes(1);
      expect(makeResizeSpy).toHaveBeenCalledWith(
        image1,
        ImageResizeOptions.fromWebFields(newFilename1, {}),
      );
      expect(makeThumbnailSpy).toHaveBeenCalledTimes(1);
      expect(makeThumbnailSpy).toHaveBeenCalledWith(image1, newFilename1);
      expect(makeDeleteSpy).toHaveBeenCalledTimes(1);
      expect(makeDeleteSpy).toHaveBeenCalledWith(image1);
    });

    test('calls functions with the passed in data, even if there are multiple files', async () => {
      const ic = new ImageWriter('');

      const makeResizeSpy = jest.spyOn(ic, 'makeAndRunResizeScript');
      makeResizeSpy.mockImplementation(async (_) => {});
      const makeThumbnailSpy = jest.spyOn(ic, 'makeAndRunThumbnailScript');
      makeThumbnailSpy.mockImplementation(async (_) => {});
      const makeDeleteSpy = jest.spyOn(ic, 'makeAndRunDeleteScript');
      makeDeleteSpy.mockImplementation(async (_) => {});

      uuidv4.mockImplementationOnce(() => newFilename1);
      uuidv4.mockImplementationOnce(() => newFilename2);

      const parsedData = {
        imageFiles: [image1, image2],
        fields: {},
      };

      await ic.convertImages(parsedData);

      expect(uuidv4).toHaveBeenCalledTimes(2);

      expect(makeResizeSpy).toHaveBeenCalledTimes(2);
      expect(makeResizeSpy).toHaveBeenNthCalledWith(
        1,
        image1,
        ImageResizeOptions.fromWebFields(newFilename1, {}),
      );
      expect(makeResizeSpy).toHaveBeenNthCalledWith(
        2,
        image2,
        ImageResizeOptions.fromWebFields(newFilename2, {}),
      );
      expect(makeThumbnailSpy).toHaveBeenCalledTimes(2);
      expect(makeThumbnailSpy).toHaveBeenNthCalledWith(1, image1, newFilename1);
      expect(makeThumbnailSpy).toHaveBeenNthCalledWith(2, image2, newFilename2);
      expect(makeDeleteSpy).toHaveBeenCalledTimes(2);
      expect(makeDeleteSpy).toHaveBeenNthCalledWith(1, image1);
      expect(makeDeleteSpy).toHaveBeenNthCalledWith(2, image2);
    });

    test('throws an error if makeAndRunResizeScript throws an error', async () => {
      expect.assertions(4);
      const ic = new ImageWriter('');

      const makeResizeSpy = jest.spyOn(ic, 'makeAndRunResizeScript');
      makeResizeSpy.mockImplementation(async (_) => {
        throw new Error(testError);
      });
      const makeThumbnailSpy = jest.spyOn(ic, 'makeAndRunThumbnailScript');
      const makeDeleteSpy = jest.spyOn(ic, 'makeAndRunDeleteScript');

      const parsedData = {
        imageFiles: [image1],
        fields: {},
      };

      uuidv4.mockImplementation(() => newFilename1);

      try {
        await ic.convertImages(parsedData);
      } catch (e) {
        expect(e.message).toBe(testError);
        expect(makeResizeSpy).toHaveBeenCalledTimes(1);
        expect(makeThumbnailSpy).toHaveBeenCalledTimes(0);
        expect(makeDeleteSpy).toHaveBeenCalledTimes(0);
      }
    });
  });

  describe('makeAndRunResizeScript', () => {
    test('retrieves a script and runs it based on default inputs', async () => {
      const ic = new ImageWriter('');
      const script = `${image1.filepath} - ${image1.originalFilename}`;
      const buildResizeScriptSpy = jest.spyOn(ic, 'buildResizeScript');
      buildResizeScriptSpy.mockImplementation((_, __) => script);

      const opts = new ImageResizeOptions(image1.originalFilename, {});

      ic.makeAndRunResizeScript(image1, opts);

      expect(exec).toHaveBeenCalledTimes(1);
      expect(exec).toHaveBeenCalledWith(script, expect.anything());
    });

    test('Constructs a set of options based on what is passed into the function', async () => {
      const ic = new ImageWriter('');
      const buildResizeScriptSpy = jest.spyOn(ic, 'buildResizeScript');

      const opts = new ImageResizeOptions(newFilename1, {});

      ic.makeAndRunResizeScript(image1, opts);

      expect(buildResizeScriptSpy).toHaveBeenCalledTimes(1);
      expect(buildResizeScriptSpy).toHaveBeenCalledWith(image1, opts);
    });

    test('throws an error if exec returns an error', async () => {
      expect.assertions(3);

      const ic = new ImageWriter('');
      const script = `${image1.filepath} - ${image1.originalFilename}`;
      const buildResizeScriptSpy = jest.spyOn(ic, 'buildResizeScript');
      buildResizeScriptSpy.mockImplementation((_, __) => script);

      const opts = new ImageResizeOptions(image1.originalFilename, {});

      exec.mockImplementation((_, result: ExecCallback) => {
        result(new Error(testError), '', '');
      });

      try {
        await ic.makeAndRunResizeScript(image1, opts);
      } catch (e) {
        expect(e.message).toBe(testError);
        expect(exec).toHaveBeenCalledTimes(1);
        expect(exec).toHaveBeenCalledWith(script, expect.anything());
      }
    });

    test('throws an error if exec returns a stderr', async () => {
      expect.assertions(3);

      const ic = new ImageWriter('');
      const script = `${image1.filepath} - ${image1.originalFilename}`;
      const buildResizeScriptSpy = jest.spyOn(ic, 'buildResizeScript');
      buildResizeScriptSpy.mockImplementation((_, __) => script);

      const opts = new ImageResizeOptions(image1.originalFilename, {});

      exec.mockImplementation((_, result: ExecCallback) => {
        result(null, '', testError);
      });

      try {
        await ic.makeAndRunResizeScript(image1, opts);
      } catch (e) {
        expect(e.message).toBe(testError);
        expect(exec).toHaveBeenCalledTimes(1);
        expect(exec).toHaveBeenCalledWith(script, expect.anything());
      }
    });
  });
});
