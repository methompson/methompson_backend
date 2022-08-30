import * as child_process from 'child_process';
import * as uuid from 'uuid';

import { ImageWriter } from '@/src/image/image_writer';
import { ImageResizeOptions, UploadedFile } from '@/src/models/image_models';

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

  const authorId = 'aoishfdjn023';

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
    test('calls functions with the passed in data when no ops are passed in', async () => {
      const ic = new ImageWriter('');

      const filename = 'filename';
      const identifier = 'identifier';
      const dimensions = { x: 1024, y: 768 };

      const makeResizeSpy = jest.spyOn(ic, 'makeAndRunResizeScript');
      makeResizeSpy.mockImplementation(async (_) => ({
        filename,
        identifier,
        dimensions,
      }));
      const makeDeleteSpy = jest.spyOn(ic, 'makeAndRunDeleteScript');
      makeDeleteSpy.mockImplementation(async (_) => {});

      const parsedData = {
        imageFiles: [image1],
        ops: {},
      };

      uuidv4.mockImplementation(() => newFilename1);

      await ic.convertImages(parsedData, authorId);

      expect(uuidv4).toHaveBeenCalledTimes(1);

      expect(makeResizeSpy).toHaveBeenCalledTimes(2);
      expect(makeResizeSpy).toHaveBeenNthCalledWith(
        1,
        image1,
        ImageResizeOptions.fromWebFields(newFilename1, {}),
      );
      expect(makeResizeSpy).toHaveBeenNthCalledWith(
        2,
        image1,
        ImageResizeOptions.fromWebFields(newFilename1, {
          identifier: 'thumb',
          resize: true,
          maxSize: 128,
          stripMeta: true,
        }),
      );
      expect(makeDeleteSpy).toHaveBeenCalledTimes(1);
      expect(makeDeleteSpy).toHaveBeenCalledWith(image1);
    });

    test('calls functions with the passed in data, even if there are multiple files', async () => {
      const ic = new ImageWriter('');

      const filename = 'filename';
      const identifier = 'identifier';
      const dimensions = { x: 1024, y: 768 };

      const makeResizeSpy = jest.spyOn(ic, 'makeAndRunResizeScript');
      makeResizeSpy.mockImplementation(async (_) => ({
        filename,
        identifier,
        dimensions,
      }));
      const makeDeleteSpy = jest.spyOn(ic, 'makeAndRunDeleteScript');
      makeDeleteSpy.mockImplementation(async (_) => {});

      uuidv4.mockImplementationOnce(() => newFilename1);
      uuidv4.mockImplementationOnce(() => newFilename2);

      const parsedData = {
        imageFiles: [image1, image2],
        ops: {},
      };

      await ic.convertImages(parsedData, authorId);

      expect(uuidv4).toHaveBeenCalledTimes(2);

      expect(makeResizeSpy).toHaveBeenCalledTimes(4);
      expect(makeResizeSpy).toHaveBeenNthCalledWith(
        1,
        image1,
        ImageResizeOptions.fromWebFields(newFilename1, {}),
      );
      expect(makeResizeSpy).toHaveBeenNthCalledWith(
        2,
        image1,
        ImageResizeOptions.fromWebFields(newFilename1, {
          identifier: 'thumb',
          resize: true,
          maxSize: 128,
          stripMeta: true,
        }),
      );
      expect(makeResizeSpy).toHaveBeenNthCalledWith(
        3,
        image2,
        ImageResizeOptions.fromWebFields(newFilename2, {}),
      );
      expect(makeResizeSpy).toHaveBeenNthCalledWith(
        4,
        image2,
        ImageResizeOptions.fromWebFields(newFilename2, {
          identifier: 'thumb',
          resize: true,
          maxSize: 128,
          stripMeta: true,
        }),
      );
      expect(makeDeleteSpy).toHaveBeenCalledTimes(2);
      expect(makeDeleteSpy).toHaveBeenNthCalledWith(1, image1);
      expect(makeDeleteSpy).toHaveBeenNthCalledWith(2, image2);
    });

    test('returns NewImageDetails object for each image passed in', async () => {
      const ic = new ImageWriter('');

      const filename = 'filename';
      const identifier = 'identifier';
      const dimensions = { x: 1024, y: 768 };

      const makeResizeSpy = jest.spyOn(ic, 'makeAndRunResizeScript');
      makeResizeSpy.mockImplementation(async (_) => ({
        filename,
        identifier,
        dimensions,
      }));
      const makeDeleteSpy = jest.spyOn(ic, 'makeAndRunDeleteScript');
      makeDeleteSpy.mockImplementation(async (_) => {});

      uuidv4.mockImplementationOnce(() => newFilename1);
      uuidv4.mockImplementationOnce(() => newFilename2);

      const parsedData = {
        imageFiles: [image1, image2],
        ops: {},
      };

      const results = await ic.convertImages(parsedData, authorId);

      expect(results.length).toBe(2);

      const first = results[0];
      const second = results[1];

      expect(first.originalFilename).toBe(image1.originalFilename);
      expect(second.originalFilename).toBe(image2.originalFilename);
    });

    test('throws an error if makeAndRunResizeScript throws an error', async () => {
      expect.assertions(3);
      const ic = new ImageWriter('');

      const makeResizeSpy = jest.spyOn(ic, 'makeAndRunResizeScript');
      makeResizeSpy.mockImplementation(async (_) => {
        throw new Error(testError);
      });
      const makeDeleteSpy = jest.spyOn(ic, 'makeAndRunDeleteScript');

      const parsedData = {
        imageFiles: [image1],
        ops: {},
      };

      uuidv4.mockImplementation(() => newFilename1);

      try {
        await ic.convertImages(parsedData, authorId);
      } catch (e) {
        expect(e.message).toBe(testError);
        expect(makeResizeSpy).toHaveBeenCalledTimes(2);
        expect(makeDeleteSpy).toHaveBeenCalledTimes(0);
      }
    });
  });

  describe('makeAndRunResizeScript', () => {
    test('retrieves a script and runs it based on default inputs', async () => {
      const ic = new ImageWriter('');

      const newFilename = 'newFilename';
      const newFilepath = 'newFilepath';
      const script = `${image1.filepath} - ${image1.originalFilename}`;

      const buildResizeScriptSpy = jest.spyOn(ic, 'buildResizeScript');
      buildResizeScriptSpy.mockImplementation((_, __) => ({
        newFilename,
        newFilepath,
        script,
      }));

      const dimensionSpy = jest.spyOn(ic, 'getFileDimensions');
      dimensionSpy.mockImplementation(async (_) => ({ x: 64, y: 32 }));

      const opts = new ImageResizeOptions('web', image1.originalFilename, {});

      await ic.makeAndRunResizeScript(image1, opts);

      expect(exec).toHaveBeenCalledTimes(1);
      expect(exec).toHaveBeenCalledWith(script, expect.anything());
      expect(dimensionSpy).toHaveBeenCalledTimes(1);
    });

    test('Constructs a set of options based on what is passed into the function', async () => {
      const ic = new ImageWriter('');
      const buildResizeScriptSpy = jest.spyOn(ic, 'buildResizeScript');

      const dimensionSpy = jest.spyOn(ic, 'getFileDimensions');
      dimensionSpy.mockImplementation(async (_) => ({ x: 64, y: 32 }));

      const opts = new ImageResizeOptions('web', newFilename1, {});

      await ic.makeAndRunResizeScript(image1, opts);

      expect(buildResizeScriptSpy).toHaveBeenCalledTimes(1);
      expect(buildResizeScriptSpy).toHaveBeenCalledWith(image1, opts);
    });

    test('throws an error if exec returns an error', async () => {
      expect.assertions(3);

      const ic = new ImageWriter('');

      const newFilename = 'newFilename';
      const newFilepath = 'newFilepath';
      const script = `${image1.filepath} - ${image1.originalFilename}`;

      const buildResizeScriptSpy = jest.spyOn(ic, 'buildResizeScript');
      buildResizeScriptSpy.mockImplementation((_, __) => ({
        newFilename,
        newFilepath,
        script,
      }));

      const opts = new ImageResizeOptions('web', image1.originalFilename, {});

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

      const newFilename = 'newFilename';
      const newFilepath = 'newFilepath';
      const script = `${image1.filepath} - ${image1.originalFilename}`;

      const buildResizeScriptSpy = jest.spyOn(ic, 'buildResizeScript');
      buildResizeScriptSpy.mockImplementation((_, __) => ({
        newFilename,
        newFilepath,
        script,
      }));

      const opts = new ImageResizeOptions('web', image1.originalFilename, {});

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
