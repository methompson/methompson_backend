import * as child_process from 'child_process';
import * as uuid from 'uuid';
import * as fsPromises from 'fs/promises';

import { ImageWriter } from '@/src/image/image_writer';
import { ImageResizeOptions } from '@/src/models/image_models';
import { UploadedFile } from '@/src/models/file_models';

type ExecCallback = (
  error: Error | null,
  sdout: string,
  stderr: string,
) => void;

jest.mock('fs/promises', () => {
  const mkdir = jest.fn(async () => {});
  const rm = jest.fn(async () => {});

  return {
    mkdir,
    rm,
  };
});

jest.mock('child_process', () => {
  const exec = jest.fn();

  return { exec };
});

jest.mock('uuid', () => {
  const v4 = jest.fn(() => 'uuidv4');

  return {
    v4,
  };
});

const exec = child_process.exec as unknown as jest.Mock<unknown, unknown[]>;
const rm = fsPromises.rm as unknown as jest.Mock<unknown, unknown[]>;
const uuidv4 = uuid.v4 as jest.Mock<unknown, unknown[]>;

describe('ImageWriter', () => {
  const newFilename1 = 'newFileName1';
  const originalFilename1 = 'originalFileName1';

  const newFilename2 = 'newFileName2';
  const originalFilename2 = 'originalFileName2';

  const testError = 'test error';

  const authorId = 'aoishfdjn023';

  beforeEach(() => {
    uuidv4.mockReset();
    exec.mockReset();
    rm.mockReset();

    exec.mockImplementation((_, a: ExecCallback) => {
      a(null, '', '');
    });
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
      const iw = new ImageWriter('');

      const filename = 'filename';
      const identifier = 'identifier';
      const dimensions = { x: 1024, y: 768 };

      const makeResizeSpy = jest.spyOn(iw, 'makeAndRunResizeScript');
      makeResizeSpy.mockImplementation(async (_) => ({
        filename,
        identifier,
        dimensions,
      }));

      const parsedData = {
        imageFiles: [image1],
        ops: {},
      };

      uuidv4.mockImplementation(() => newFilename1);

      await iw.convertImages(parsedData, authorId);

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
      expect(rm).toHaveBeenCalledTimes(1);
      expect(rm).toHaveBeenCalledWith(image1.filepath);
    });

    test('calls functions with the passed in data, even if there are multiple files', async () => {
      const iw = new ImageWriter('');

      const filename = 'filename';
      const identifier = 'identifier';
      const dimensions = { x: 1024, y: 768 };

      const makeResizeSpy = jest.spyOn(iw, 'makeAndRunResizeScript');
      makeResizeSpy.mockImplementation(async (_) => ({
        filename,
        identifier,
        dimensions,
      }));

      uuidv4.mockImplementationOnce(() => newFilename1);
      uuidv4.mockImplementationOnce(() => newFilename2);

      const parsedData = {
        imageFiles: [image1, image2],
        ops: {},
      };

      await iw.convertImages(parsedData, authorId);

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
      expect(rm).toHaveBeenCalledTimes(2);
      expect(rm).toHaveBeenNthCalledWith(1, image1.filepath);
      expect(rm).toHaveBeenNthCalledWith(2, image2.filepath);
    });

    test('returns NewImageDetails object for each image passed in', async () => {
      const iw = new ImageWriter('');

      const filename = 'filename';
      const identifier = 'identifier';
      const dimensions = { x: 1024, y: 768 };

      const makeResizeSpy = jest.spyOn(iw, 'makeAndRunResizeScript');
      makeResizeSpy.mockImplementation(async (_) => ({
        filename,
        identifier,
        dimensions,
      }));

      uuidv4.mockImplementationOnce(() => newFilename1);
      uuidv4.mockImplementationOnce(() => newFilename2);

      const parsedData = {
        imageFiles: [image1, image2],
        ops: {},
      };

      const results = await iw.convertImages(parsedData, authorId);

      expect(results.length).toBe(2);

      const first = results[0];
      const second = results[1];

      expect(first.originalFilename).toBe(image1.originalFilename);
      expect(second.originalFilename).toBe(image2.originalFilename);
    });

    test('throws an error if makeAndRunResizeScript throws an error', async () => {
      expect.assertions(3);
      const iw = new ImageWriter('');

      const makeResizeSpy = jest.spyOn(iw, 'makeAndRunResizeScript');
      makeResizeSpy.mockImplementation(async (_) => {
        throw new Error(testError);
      });

      const parsedData = {
        imageFiles: [image1],
        ops: {},
      };

      uuidv4.mockImplementation(() => newFilename1);

      try {
        await iw.convertImages(parsedData, authorId);
      } catch (e) {
        expect(e.message).toBe(testError);
        expect(makeResizeSpy).toHaveBeenCalledTimes(2);
        expect(rm).toHaveBeenCalledTimes(0);
      }
    });
  });

  describe('makeAndRunResizeScript', () => {
    test('retrieves a script and runs it based on default inputs', async () => {
      const iw = new ImageWriter('');

      const newFilename = 'newFilename';
      const newFilepath = 'newFilepath';
      const script = `${image1.filepath} - ${image1.originalFilename}`;

      const buildResizeScriptSpy = jest.spyOn(iw, 'buildResizeScript');
      buildResizeScriptSpy.mockImplementation((_, __) => ({
        newFilename,
        newFilepath,
        script,
      }));

      const dimensionSpy = jest.spyOn(iw, 'getFileDimensions');
      dimensionSpy.mockImplementation(async (_) => ({ x: 64, y: 32 }));

      const opts = new ImageResizeOptions('web', image1.originalFilename, {});

      await iw.makeAndRunResizeScript(image1, opts);

      expect(exec).toHaveBeenCalledTimes(1);
      expect(exec).toHaveBeenCalledWith(script, expect.anything());
      expect(dimensionSpy).toHaveBeenCalledTimes(1);
    });

    test('Constructs a set of options based on what is passed into the function', async () => {
      const iw = new ImageWriter('');
      const buildResizeScriptSpy = jest.spyOn(iw, 'buildResizeScript');

      const dimensionSpy = jest.spyOn(iw, 'getFileDimensions');
      dimensionSpy.mockImplementation(async (_) => ({ x: 64, y: 32 }));

      const opts = new ImageResizeOptions('web', newFilename1, {});

      await iw.makeAndRunResizeScript(image1, opts);

      expect(buildResizeScriptSpy).toHaveBeenCalledTimes(1);
      expect(buildResizeScriptSpy).toHaveBeenCalledWith(image1, opts);
    });

    test('throws an error if exec returns an error', async () => {
      expect.assertions(3);

      const iw = new ImageWriter('');

      const newFilename = 'newFilename';
      const newFilepath = 'newFilepath';
      const script = `${image1.filepath} - ${image1.originalFilename}`;

      const buildResizeScriptSpy = jest.spyOn(iw, 'buildResizeScript');
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
        await iw.makeAndRunResizeScript(image1, opts);
      } catch (e) {
        expect(e.message).toBe(testError);
        expect(exec).toHaveBeenCalledTimes(1);
        expect(exec).toHaveBeenCalledWith(script, expect.anything());
      }
    });

    test('throws an error if exec returns a stderr', async () => {
      expect.assertions(3);

      const iw = new ImageWriter('');

      const newFilename = 'newFilename';
      const newFilepath = 'newFilepath';
      const script = `${image1.filepath} - ${image1.originalFilename}`;

      const buildResizeScriptSpy = jest.spyOn(iw, 'buildResizeScript');
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
        await iw.makeAndRunResizeScript(image1, opts);
      } catch (e) {
        expect(e.message).toBe(testError);
        expect(exec).toHaveBeenCalledTimes(1);
        expect(exec).toHaveBeenCalledWith(script, expect.anything());
      }
    });
  });

  describe('getFileDimensions', () => {
    const errMsg = 'image size script failed';
    const invalidValueMsg = 'Image Size returned invalid value';

    test('builds and executes a shell script, then returns the results', async () => {
      const iw = new ImageWriter('');
      const filepath = 'path/to/file.ext';
      const script = `identify -format "%w,%h" ${filepath}`;

      exec.mockImplementationOnce((_, callback: ExecCallback) => {
        callback(null, '640,480', '');
      });

      const result = await iw.getFileDimensions(filepath);

      expect(result).toStrictEqual({ x: 640, y: 480 });
      expect(exec).toHaveBeenCalledTimes(1);
      expect(exec).toHaveBeenCalledWith(script, expect.anything());
    });

    test('Throws an error if err is not null', async () => {
      const iw = new ImageWriter('');
      const filepath = 'path/to/file.ext';

      exec.mockImplementationOnce((_, callback: ExecCallback) => {
        callback(new Error(testError), '', '');
      });

      await expect(() => iw.getFileDimensions(filepath)).rejects.toThrow(
        errMsg,
      );

      expect(exec).toHaveBeenCalledTimes(1);
    });

    test('Throws an error if stderr is not null', async () => {
      const iw = new ImageWriter('');
      const filepath = 'path/to/file.ext';

      exec.mockImplementationOnce((_, callback: ExecCallback) => {
        callback(null, '', testError);
      });

      await expect(() => iw.getFileDimensions(filepath)).rejects.toThrow(
        errMsg,
      );

      expect(exec).toHaveBeenCalledTimes(1);
    });

    test('Throws an error if stdout is not in the appropriate format', async () => {
      const iw = new ImageWriter('');
      const filepath = 'path/to/file.ext';

      exec.mockImplementationOnce((_, callback: ExecCallback) => {
        callback(null, '640', '');
      });

      await expect(() => iw.getFileDimensions(filepath)).rejects.toThrow(
        invalidValueMsg,
      );

      expect(exec).toHaveBeenCalledTimes(1);
    });

    test('Throws an error if x is not number', async () => {
      const iw = new ImageWriter('');
      const filepath = 'path/to/file.ext';

      exec.mockImplementationOnce((_, callback: ExecCallback) => {
        callback(null, 'B,480', '');
      });

      await expect(() => iw.getFileDimensions(filepath)).rejects.toThrow(
        invalidValueMsg,
      );

      expect(exec).toHaveBeenCalledTimes(1);
    });

    test('Throws an error if y is not a number', async () => {
      const iw = new ImageWriter('');
      const filepath = 'path/to/file.ext';

      exec.mockImplementationOnce((_, callback: ExecCallback) => {
        callback(null, '640,A', '');
      });

      await expect(() => iw.getFileDimensions(filepath)).rejects.toThrow(
        invalidValueMsg,
      );

      expect(exec).toHaveBeenCalledTimes(1);
    });
  });

  describe('buildResizeScript', () => {
    test('Constructs a script with defaults', () => {
      const newPath = 'new/path';
      const opt = new ImageResizeOptions('identifier', 'newFileName', {});

      const ic = new ImageWriter(newPath);

      const { newFilename, newFilepath, script } = ic.buildResizeScript(
        image1,
        opt,
      );

      const expectedNewName = ic.getNewFileName(image1, opt);
      const expectedNewFilepath = `${newPath}/${expectedNewName}`;

      expect(newFilename).toBe(expectedNewName);
      expect(newFilepath).toBe(expectedNewFilepath);

      expect(script).toContain(`convert ${image1.filepath} -quality 90`);
      expect(script).toContain(expectedNewFilepath);

      expect(script).not.toContain('-resize');
      expect(script).not.toContain('-strip');
      expect(script).not.toContain('cp ');
    });

    test('constructs a specific script when doNotConvert is set to true', () => {
      const newPath = 'new/path';
      const opt = new ImageResizeOptions('identifier', 'newFileName', {
        retainImage: true,
      });

      const ic = new ImageWriter(newPath);

      const { newFilename, newFilepath, script } = ic.buildResizeScript(
        image1,
        opt,
      );

      const expectedNewName = ic.getNewFileName(image1, opt);
      const expectedNewFilepath = `${newPath}/${expectedNewName}`;

      expect(newFilename).toBe(expectedNewName);
      expect(newFilepath).toBe(expectedNewFilepath);

      expect(script).not.toContain('convert');
      expect(script).toContain(expectedNewFilepath);

      expect(script).not.toContain('-resize');
      expect(script).not.toContain('-strip');
      expect(script).toBe(`cp ${image1.filepath} ${expectedNewFilepath}`);
    });

    test('Adds resize when resize is set to true', () => {
      const newPath = 'new/path';
      const maxSize = 6969;
      const opt = new ImageResizeOptions('identifier', 'newFileName', {
        resize: true,
        maxSize: maxSize,
      });

      const ic = new ImageWriter(newPath);

      const { newFilename, newFilepath, script } = ic.buildResizeScript(
        image1,
        opt,
      );

      const expectedNewName = ic.getNewFileName(image1, opt);
      const expectedNewFilepath = `${newPath}/${expectedNewName}`;

      expect(newFilename).toBe(expectedNewName);
      expect(newFilepath).toBe(expectedNewFilepath);

      expect(script).toContain(`convert ${image1.filepath} -quality 90`);
      expect(script).toContain(expectedNewFilepath);

      expect(script).toContain(`-resize ${maxSize}x${maxSize}`);
      expect(script).not.toContain('-strip');
      expect(script).not.toContain('cp ');
    });

    test('Adds strip when stripMeta is set to true', () => {
      const newPath = 'new/path';
      const opt = new ImageResizeOptions('identifier', 'newFileName', {
        stripMeta: true,
      });

      const ic = new ImageWriter(newPath);

      const { newFilename, newFilepath, script } = ic.buildResizeScript(
        image1,
        opt,
      );

      const expectedNewName = ic.getNewFileName(image1, opt);
      const expectedNewFilepath = `${newPath}/${expectedNewName}`;

      expect(newFilename).toBe(expectedNewName);
      expect(newFilepath).toBe(expectedNewFilepath);

      expect(script).toContain(`convert ${image1.filepath} -quality 90`);
      expect(script).toContain(expectedNewFilepath);

      expect(script).not.toContain('-resize');
      expect(script).toContain('-strip');
      expect(script).not.toContain('cp ');
    });
  });

  describe('getNewFileName', () => {});

  describe('deleteImages', () => {});

  describe('rollBackWrites', () => {});
});
