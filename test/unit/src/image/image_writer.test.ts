import * as child_process from 'child_process';
import { Stats } from 'fs';
import * as uuid from 'uuid';
import * as path from 'path';

import { ImageWriter } from '@/src/image/image_writer';
import { NewFileDetailsJSON, UploadedFile } from '@/src/models/file_models';
import { ImageResizeOptions } from '@/src/models/image_models';
import { FileSystemService } from '@/src/file/file_system_service';

type ExecCallback = (
  error: Error | null,
  sdout: string,
  stderr: string,
) => void;

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

jest.mock('path', () => {
  const join = jest.fn();

  return {
    join,
  };
});

const exec = child_process.exec as unknown as jest.Mock<unknown, unknown[]>;
const uuidv4 = uuid.v4 as jest.Mock<unknown, unknown[]>;
const join = path.join as jest.Mock<unknown, unknown[]>;

describe('ImageWriter', () => {
  const newFilename1 = 'newFileName1';
  const originalFilename1 = 'originalFileName1';

  const newFilename2 = 'newFileName2';
  const originalFilename2 = 'originalFileName2';

  const testError = 'test error';

  const authorId = 'aoishfdjn023';

  const savedImagePath = 'path/to/files/';

  beforeEach(() => {
    uuidv4.mockReset();
    uuidv4.mockClear();
    exec.mockReset();
    exec.mockClear();
    join.mockReset();
    join.mockClear();

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

  const now = new Date();

  const newFileDetailsJSON1: NewFileDetailsJSON = {
    originalFilename: originalFilename1,
    filename: newFilename1,
    dateAdded: now.toISOString(),
    authorId,
    mimetype: image1.mimetype,
    size: image1.size,
    isPrivate: false,
    filepath: image1.filepath,
    metadata: {},
  };

  const newFileDetailsJSON2: NewFileDetailsJSON = {
    originalFilename: originalFilename2,
    filename: newFilename2,
    dateAdded: now.toISOString(),
    authorId,
    mimetype: image2.mimetype,
    size: image2.size,
    isPrivate: false,
    filepath: image2.filepath,
    metadata: {},
  };

  const newFilepath = 'newFilepath';

  describe('convertImages', () => {
    test('calls functions with the passed in data when no ops are passed in', async () => {
      const iw = new ImageWriter('');

      const makeResizeSpy = jest.spyOn(iw, 'makeAndRunResizeScript');
      makeResizeSpy.mockImplementation(async (_) => newFileDetailsJSON1);

      const parsedData = {
        imageFiles: [image1],
        ops: {},
      };

      uuidv4.mockImplementation(() => newFilename1);

      await iw.convertImages(parsedData, authorId);

      expect(makeResizeSpy).toHaveBeenCalledTimes(1);
      expect(makeResizeSpy).toHaveBeenCalledWith(
        newFilename1,
        image1,
        ImageResizeOptions.fromWebFields({ retainImage: true }),
        authorId,
        true,
      );
    });

    test('calls functions with the passed in data, even if there are multiple files', async () => {
      const iw = new ImageWriter('');

      const makeResizeSpy = jest.spyOn(iw, 'makeAndRunResizeScript');
      makeResizeSpy.mockImplementation(async (_) => newFileDetailsJSON1);

      const parsedData = {
        imageFiles: [image1, image2],
        ops: {},
      };

      uuidv4.mockImplementationOnce(() => newFilename1);
      uuidv4.mockImplementationOnce(() => newFilename2);

      const op = ImageResizeOptions.fromWebFields({ retainImage: true });

      await iw.convertImages(parsedData, authorId);

      expect(makeResizeSpy).toHaveBeenCalledTimes(2);
      expect(makeResizeSpy).toHaveBeenNthCalledWith(
        1,
        newFilename1,
        image1,
        op,
        authorId,
        true,
      );
      expect(makeResizeSpy).toHaveBeenNthCalledWith(
        2,
        newFilename2,
        image2,
        op,
        authorId,
        true,
      );
    });

    test('returns NewImageDetails object for each image passed in', async () => {
      const iw = new ImageWriter('');

      const makeResizeSpy = jest.spyOn(iw, 'makeAndRunResizeScript');
      makeResizeSpy.mockImplementationOnce(async (_) => newFileDetailsJSON1);
      makeResizeSpy.mockImplementationOnce(async (_) => newFileDetailsJSON2);

      const parsedData = {
        imageFiles: [image1, image2],
        ops: {},
      };

      uuidv4.mockImplementation(() => newFilename1);

      const results = await iw.convertImages(parsedData, authorId);

      expect(results.length).toBe(2);

      const first = results[0];
      const second = results[1];

      expect(first.originalFilename).toBe(image1.originalFilename);
      expect(second.originalFilename).toBe(image2.originalFilename);
    });

    test('throws an error if makeAndRunResizeScript throws an error and runs rollBackWrites', async () => {
      const iw = new ImageWriter(savedImagePath);

      const makeResizeSpy = jest.spyOn(iw, 'makeAndRunResizeScript');
      makeResizeSpy.mockImplementation(async (_) => {
        throw new Error(testError);
      });

      const rollBackSpy = jest.spyOn(iw, 'rollBackWrites');
      rollBackSpy.mockImplementationOnce(async () => {});

      join.mockImplementationOnce((...paths) => {
        if (paths[1] !== newFilename1 && paths[1] !== newFilename2) {
          throw new Error('Invalid Path');
        }

        return `${paths[0]}${paths[1]}`;
      });

      const parsedData = {
        imageFiles: [image1],
        ops: {},
      };

      uuidv4.mockImplementation(() => newFilename1);

      await expect(() =>
        iw.convertImages(parsedData, authorId),
      ).rejects.toThrow(new RegExp(`Error converting images.*${newFilename1}`));

      expect(makeResizeSpy).toHaveBeenCalledTimes(1);
      expect(rollBackSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('makeAndRunResizeScript', () => {
    test('retrieves a script and runs it based on default inputs', async () => {
      const iw = new ImageWriter('');

      const script = `${image1.filepath} - ${image1.originalFilename}`;

      const buildResizeScriptSpy = jest.spyOn(iw, 'buildResizeScript');
      buildResizeScriptSpy.mockImplementation((_, __) => ({
        newFilename: newFilename1,
        newFilepath,
        script,
      }));

      const dimensionSpy = jest.spyOn(iw, 'getFileDimensions');
      dimensionSpy.mockImplementation(async (_) => ({ x: 64, y: 32 }));

      const opts = new ImageResizeOptions('web', {});

      const fss = new FileSystemService();
      const getInfoSpy = jest.spyOn(fss, 'getFileInfo');
      getInfoSpy.mockImplementationOnce(
        async () =>
          ({
            size: 1024,
          } as Stats),
      );

      await iw.makeAndRunResizeScript(
        newFilename1,
        image1,
        opts,
        authorId,
        true,
        fss,
      );

      expect(exec).toHaveBeenCalledTimes(1);
      expect(exec).toHaveBeenCalledWith(script, expect.anything());

      expect(dimensionSpy).toHaveBeenCalledTimes(1);
    });

    test('Constructs a set of options based on what is passed into the function', async () => {
      const iw = new ImageWriter('');
      const buildResizeScriptSpy = jest.spyOn(iw, 'buildResizeScript');

      const dimensionSpy = jest.spyOn(iw, 'getFileDimensions');
      dimensionSpy.mockImplementation(async (_) => ({ x: 64, y: 32 }));

      const fss = new FileSystemService();
      const getInfoSpy = jest.spyOn(fss, 'getFileInfo');
      getInfoSpy.mockImplementationOnce(
        async () =>
          ({
            size: 1024,
          } as Stats),
      );

      uuidv4.mockImplementationOnce(() => newFilename1);

      const opts = new ImageResizeOptions('web', {});
      await iw.makeAndRunResizeScript(
        newFilename1,
        image1,
        opts,
        authorId,
        true,
        fss,
      );
      expect(buildResizeScriptSpy).toHaveBeenCalledTimes(1);
      expect(buildResizeScriptSpy).toHaveBeenCalledWith(
        image1,
        opts,
        newFilename1,
      );
    });

    test('throws an error if exec returns an error', async () => {
      expect.assertions(3);

      const iw = new ImageWriter('');

      const script = `${image1.filepath} - ${image1.originalFilename}`;

      const buildResizeScriptSpy = jest.spyOn(iw, 'buildResizeScript');
      buildResizeScriptSpy.mockImplementation((_, __) => ({
        newFilename: newFilename1,
        newFilepath,
        script,
      }));

      const opts = new ImageResizeOptions('web', {});

      exec.mockImplementation((_, result: ExecCallback) => {
        result(new Error(testError), '', '');
      });

      try {
        await iw.makeAndRunResizeScript(
          newFilename1,
          image1,
          opts,
          authorId,
          true,
        );
      } catch (e) {
        expect(e.message).toBe(testError);
        expect(exec).toHaveBeenCalledTimes(1);
        expect(exec).toHaveBeenCalledWith(script, expect.anything());
      }
    });

    test('throws an error if exec returns a stderr', async () => {
      expect.assertions(3);

      const iw = new ImageWriter('');

      const script = `${image1.filepath} - ${image1.originalFilename}`;

      const buildResizeScriptSpy = jest.spyOn(iw, 'buildResizeScript');
      buildResizeScriptSpy.mockImplementation((_, __) => ({
        newFilename: newFilename1,
        newFilepath,
        script,
      }));

      const opts = new ImageResizeOptions('web', {});

      exec.mockImplementation((_, result: ExecCallback) => {
        result(null, '', testError);
      });

      try {
        await iw.makeAndRunResizeScript(
          newFilename1,
          image1,
          opts,
          authorId,
          true,
        );
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
    const newPath = 'new/path';

    test('Constructs a script with defaults', () => {
      const opt = new ImageResizeOptions('identifier', {});

      const iw = new ImageWriter(newPath);
      const { newFilename, newFilepath, script } = iw.buildResizeScript(
        image1,
        opt,
        newFilename1,
      );

      const expectedNewName = newFilename1;
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
      const opt = new ImageResizeOptions('identifier', {
        retainImage: true,
      });

      const ic = new ImageWriter(newPath);

      const { newFilename, newFilepath, script } = ic.buildResizeScript(
        image1,
        opt,
        newFilename1,
      );

      const expectedNewName = newFilename1;
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
      const maxSize = 6969;
      const opt = new ImageResizeOptions('identifier', {
        resize: true,
        maxSize: maxSize,
      });

      const ic = new ImageWriter(newPath);

      const { newFilename, newFilepath, script } = ic.buildResizeScript(
        image1,
        opt,
        newFilename1,
      );

      const expectedNewName = newFilename1;
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
      const opt = new ImageResizeOptions('identifier', {
        stripMeta: true,
      });

      const ic = new ImageWriter(newPath);

      const { newFilename, newFilepath, script } = ic.buildResizeScript(
        image1,
        opt,
        newFilename1,
      );

      const expectedNewName = newFilename1;
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

  describe('rollBackWrites', () => {
    const filepath1 = 'path/to/file1';
    const filepath2 = 'path/to/file2';
    const filepath3 = 'path/to/file3';
    const filepath4 = 'path/to/file4';

    test('runs deleteFile for all files provided', async () => {
      const fss = new FileSystemService();
      const deleteSpy = jest.spyOn(fss, 'deleteFile');
      deleteSpy.mockImplementation(async () => {});

      const iw = new ImageWriter('');
      await iw.rollBackWrites(
        [filepath1, filepath2, filepath3, filepath4],
        fss,
      );

      expect(deleteSpy).toHaveBeenCalledTimes(4);
    });

    test('throws an error if any deletions fail', async () => {
      const fss = new FileSystemService();
      const deleteSpy = jest.spyOn(fss, 'deleteFile');
      deleteSpy.mockImplementation(async (i) => {
        if (i === filepath3) {
          throw new Error(testError);
        }
      });

      const iw = new ImageWriter('');
      await expect(() =>
        iw.rollBackWrites([filepath1, filepath2, filepath3, filepath4], fss),
      ).rejects.toThrow(new RegExp(`Unable to delete files:.*${testError}`));

      expect(deleteSpy).toHaveBeenCalledTimes(4);
    });
  });
});
