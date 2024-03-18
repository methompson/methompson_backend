import * as uuid from 'uuid';
import { FileHandle, mkdir, open } from 'fs/promises';
import { join } from 'path';
import { FileServiceWriter } from './file_service_writer';

jest.mock('fs/promises', () => {
  const mkdir = jest.fn();
  const open = jest.fn();

  return {
    mkdir,
    open,
  };
});

const closeMock = jest.fn();
const readFileMock = jest.fn();
const truncateMock = jest.fn();
const writeMock = jest.fn();

class MockFileHandle {
  close() {}
  readFile() {}
  truncate() {}
  write() {}
}

// function MockFileHandle() {}
MockFileHandle.prototype.close = closeMock;
MockFileHandle.prototype.readFile = readFileMock;
MockFileHandle.prototype.truncate = truncateMock;
MockFileHandle.prototype.write = writeMock;

jest.mock('uuid', () => {
  const v4 = jest.fn(() => 'uuidv4');

  return {
    v4,
  };
});

const mockOpen = open as unknown as jest.Mock;
const mockMkdir = mkdir as unknown as jest.Mock;
const uuidv4 = uuid.v4 as jest.Mock<unknown, unknown[]>;

const logSpy = jest.spyOn(console, 'log');
logSpy.mockImplementation(() => {});
const errorSpy = jest.spyOn(console, 'error');
errorSpy.mockImplementation(() => {});

describe('FileServiceWriter', () => {
  beforeEach(() => {
    closeMock.mockReset();
    readFileMock.mockReset();
    truncateMock.mockReset();
    writeMock.mockReset();
    mockMkdir.mockReset();
    mockOpen.mockReset();

    uuidv4.mockClear();
  });

  const testError = 'test error puoiawhlfjbv';
  const baseName = 'baseName';
  const fileExtension = 'fileExtension';

  const filePath = 'path/to/file';

  const content = JSON.stringify({ test: 'test' });

  describe('writeToFile', () => {
    test('gets the string, runs truncate and writes to the file handle', async () => {
      const mockFileHandle = new MockFileHandle() as unknown as FileHandle;
      mockOpen.mockImplementationOnce(async () => mockFileHandle);

      const svc = new FileServiceWriter(baseName, fileExtension);

      await svc.writeToFile(filePath, content, { fileHandle: mockFileHandle });

      expect(mockFileHandle.truncate).toHaveBeenCalledTimes(1);
      expect(mockFileHandle.truncate).toHaveBeenCalledWith(0);

      expect(mockFileHandle.write).toHaveBeenCalledTimes(1);
      expect(mockFileHandle.write).toHaveBeenCalledWith(content, 0);

      expect(mockFileHandle.close).toHaveBeenCalledTimes(1);
    });

    test('Throws an error if truncate throws an error', async () => {
      const mockFileHandle = new MockFileHandle() as unknown as FileHandle;
      mockOpen.mockImplementationOnce(async () => mockFileHandle);

      const svc = new FileServiceWriter(baseName, fileExtension);

      truncateMock.mockImplementationOnce(async () => {
        throw new Error(testError);
      });

      await expect(() =>
        svc.writeToFile(filePath, content, { fileHandle: mockFileHandle }),
      ).rejects.toThrow();

      expect(mockFileHandle.truncate).toHaveBeenCalledTimes(1);
      expect(mockFileHandle.truncate).toHaveBeenCalledWith(0);

      expect(mockFileHandle.write).toHaveBeenCalledTimes(0);
      expect(mockFileHandle.close).toHaveBeenCalledTimes(0);
    });

    test('Throws an error if write throws an error', async () => {
      const mockFileHandle = new MockFileHandle() as unknown as FileHandle;
      mockOpen.mockImplementationOnce(async () => mockFileHandle);

      const svc = new FileServiceWriter(baseName, fileExtension);

      writeMock.mockImplementationOnce(async () => {
        throw new Error(testError);
      });

      await expect(() =>
        svc.writeToFile(filePath, content, { fileHandle: mockFileHandle }),
      ).rejects.toThrow();

      expect(mockFileHandle.truncate).toHaveBeenCalledTimes(1);
      expect(mockFileHandle.truncate).toHaveBeenCalledWith(0);

      expect(mockFileHandle.write).toHaveBeenCalledTimes(1);
      expect(mockFileHandle.write).toHaveBeenCalledWith(content, 0);

      expect(mockFileHandle.close).toHaveBeenCalledTimes(0);
    });

    test('Throws an error if close throws an error', async () => {
      const mockFileHandle = new MockFileHandle() as unknown as FileHandle;
      mockOpen.mockImplementationOnce(async () => mockFileHandle);

      const svc = new FileServiceWriter(baseName, fileExtension);

      closeMock.mockImplementationOnce(async () => {
        throw new Error(testError);
      });

      await expect(() =>
        svc.writeToFile(filePath, content, { fileHandle: mockFileHandle }),
      ).rejects.toThrow();

      expect(mockFileHandle.truncate).toHaveBeenCalledTimes(1);
      expect(mockFileHandle.truncate).toHaveBeenCalledWith(0);

      expect(mockFileHandle.write).toHaveBeenCalledTimes(1);
      expect(mockFileHandle.write).toHaveBeenCalledWith(content, 0);

      expect(mockFileHandle.close).toHaveBeenCalledTimes(1);
    });
  });

  describe('readFile', () => {
    test('reads the data from the fileHandle and returns it as a string', async () => {
      const fh = new MockFileHandle();

      const readFileSpy = jest.fn();
      readFileSpy.mockImplementationOnce(async () => ({
        toString: () => content,
      }));

      fh.readFile = readFileSpy;

      const svc = new FileServiceWriter(baseName, fileExtension);
      const result = await svc.readFile(
        'testPath',
        fh as unknown as FileHandle,
      );

      expect(result).toBe(content);
      expect(fh.readFile).toHaveBeenCalledTimes(1);
    });

    test('If the raw data buffer is a zero length buffer, returns an empty string', async () => {
      const fh = new MockFileHandle();

      const readFileSpy = jest.fn();
      readFileSpy.mockImplementationOnce(async () => ({
        toString: () => '',
      }));

      fh.readFile = readFileSpy;

      const svc = new FileServiceWriter(baseName, fileExtension);
      const result = await svc.readFile(
        'testPath',
        fh as unknown as FileHandle,
      );

      expect(result).toBe('');
      expect(fh.readFile).toHaveBeenCalledTimes(1);
    });
  });

  describe('makeFileHandle', () => {
    const path = 'path/to/file';
    const name = 'name.ext';

    test('calls mkdir and open', async () => {
      const mockFileHandle = new MockFileHandle();
      mockOpen.mockImplementationOnce(async () => mockFileHandle);

      const svc = new FileServiceWriter(baseName, fileExtension);
      const result = await svc.makeFileHandle(path, name);

      expect(result).toBe(mockFileHandle);

      expect(mockMkdir).toHaveBeenCalledTimes(1);
      expect(mockMkdir).toHaveBeenCalledWith(path, { recursive: true });

      expect(mockOpen).toHaveBeenCalledTimes(1);
      expect(mockOpen).toHaveBeenCalledWith(join(path, name), 'a+');
    });

    test('uses the default file name if not provided', async () => {
      const mockFileHandle = new MockFileHandle();
      mockOpen.mockImplementationOnce(async () => mockFileHandle);

      const svc = new FileServiceWriter(baseName, fileExtension);
      const result = await svc.makeFileHandle(path);

      expect(result).toBe(mockFileHandle);

      expect(mockMkdir).toHaveBeenCalledTimes(1);
      expect(mockMkdir).toHaveBeenCalledWith(path, { recursive: true });

      expect(mockOpen).toHaveBeenCalledTimes(1);
      expect(mockOpen).toHaveBeenCalledWith(
        join(path, `${baseName}.${fileExtension}`),
        'a+',
      );
    });

    test('throws an error if mkdir throws an error', async () => {
      mockMkdir.mockImplementationOnce(() => {
        throw new Error(testError);
      });

      const svc = new FileServiceWriter(baseName, fileExtension);

      await expect(() => svc.makeFileHandle(path, name)).rejects.toThrow(
        testError,
      );

      expect(mockMkdir).toHaveBeenCalledTimes(1);
      expect(mockMkdir).toHaveBeenCalledWith(path, { recursive: true });

      expect(mockOpen).toHaveBeenCalledTimes(0);
    });

    test('throws an error if open throws an error', async () => {
      mockOpen.mockImplementationOnce(() => {
        throw new Error(testError);
      });
      const mockFileHandle = new MockFileHandle();
      mockOpen.mockImplementationOnce(async () => mockFileHandle);

      const svc = new FileServiceWriter(baseName, fileExtension);

      await expect(() => svc.makeFileHandle(path, name)).rejects.toThrow(
        testError,
      );

      expect(mockMkdir).toHaveBeenCalledTimes(1);
      expect(mockMkdir).toHaveBeenCalledWith(path, { recursive: true });

      expect(mockOpen).toHaveBeenCalledTimes(1);
      expect(mockOpen).toHaveBeenCalledWith(join(path, name), 'a+');
    });
  });

  describe('writeBackup', () => {
    const path = 'path/to/file';
    const name = 'name.ext';

    test('runs functions with expected values', async () => {
      const svc = new FileServiceWriter(baseName, fileExtension);

      const mockFileHandle = new MockFileHandle() as unknown as FileHandle;
      const makeFileHandleSpy = jest.spyOn(svc, 'makeFileHandle');
      makeFileHandleSpy.mockImplementationOnce(async () => mockFileHandle);

      const writeSpy = jest.spyOn(svc, 'writeToFile');
      writeSpy.mockImplementationOnce(async () => {});

      await svc.writeBackup(path, content);

      expect(writeSpy).toHaveBeenCalledTimes(1);
      expect(writeSpy).toHaveBeenCalledWith(filePath, content, {
        fileHandle: undefined,
        name: expect.stringContaining('backup'),
      });
    });

    test('runs functions with passed in fileHandle', async () => {
      const svc = new FileServiceWriter(baseName, fileExtension);

      const mockFileHandle = new MockFileHandle() as unknown as FileHandle;
      const makeFileHandleSpy = jest.spyOn(svc, 'makeFileHandle');

      const writeSpy = jest.spyOn(svc, 'writeToFile');
      writeSpy.mockImplementationOnce(async () => {});

      await svc.writeBackup(path, content, {
        name,
        fh: mockFileHandle as unknown as FileHandle,
      });

      expect(makeFileHandleSpy).toHaveBeenCalledTimes(0);

      expect(writeSpy).toHaveBeenCalledTimes(1);
      expect(writeSpy).toHaveBeenCalledWith(filePath, content, {
        fileHandle: mockFileHandle,
        name,
      });
    });

    test('runs functions with passed in name', async () => {
      const svc = new FileServiceWriter(baseName, fileExtension);

      const writeSpy = jest.spyOn(svc, 'writeToFile');
      writeSpy.mockImplementationOnce(async () => {});

      await svc.writeBackup(path, content, { name });

      expect(writeSpy).toHaveBeenCalledTimes(1);
      expect(writeSpy).toHaveBeenCalledWith(filePath, content, {
        fileHandle: undefined,
        name,
      });
    });

    test('throws an error if makeFileHandle throws an error', async () => {
      const svc = new FileServiceWriter(baseName, fileExtension);

      const makeFileHandleSpy = jest.spyOn(svc, 'makeFileHandle');

      makeFileHandleSpy.mockImplementationOnce(async () => {
        throw new Error(testError);
      });

      await expect(() =>
        svc.writeBackup(path, content, { name }),
      ).rejects.toThrow();

      expect(makeFileHandleSpy).toHaveBeenCalledTimes(1);
      expect(makeFileHandleSpy).toHaveBeenCalledWith(path, name);
    });

    test('throws an error if writeToFile throws an error', async () => {
      const svc = new FileServiceWriter(baseName, fileExtension);

      const mockFileHandle = new MockFileHandle() as unknown as FileHandle;
      const makeFileHandleSpy = jest.spyOn(svc, 'makeFileHandle');
      makeFileHandleSpy.mockImplementationOnce(async () => mockFileHandle);

      const writeSpy = jest.spyOn(svc, 'writeToFile');
      writeSpy.mockImplementationOnce(async () => {
        throw new Error(testError);
      });

      await expect(() => svc.writeBackup(path, content)).rejects.toThrow(
        testError,
      );

      expect(writeSpy).toHaveBeenCalledTimes(1);
      expect(writeSpy).toHaveBeenCalledWith(filePath, content, {
        fileHandle: undefined,
        name: expect.stringContaining('backup'),
      });
    });
  });

  describe('clearFile', () => {
    test('gets a file handle, runs truncate, write and close on it', async () => {
      const svc = new FileServiceWriter(baseName, fileExtension);
      const mockFileHandle = new MockFileHandle() as unknown as FileHandle;

      const makeFileHandleSpy = jest.spyOn(svc, 'makeFileHandle');
      makeFileHandleSpy.mockImplementationOnce(async () => mockFileHandle);

      const truncateSpy = jest.spyOn(mockFileHandle, 'truncate');
      truncateSpy.mockImplementationOnce(async () => {});
      const writeSpy = jest.spyOn(mockFileHandle, 'write');
      writeSpy.mockImplementationOnce(async () => ({
        bytesWritten: 0,
        buffer: '',
      }));
      const closeSpy = jest.spyOn(mockFileHandle, 'close');
      closeSpy.mockImplementationOnce(async () => {});

      await svc.clearFile(filePath);

      expect(makeFileHandleSpy).toHaveBeenCalledTimes(1);
      expect(makeFileHandleSpy).toHaveBeenCalledWith(filePath, svc.filename);

      expect(truncateSpy).toHaveBeenCalledTimes(1);
      expect(truncateSpy).toHaveBeenCalledWith(0);

      expect(writeSpy).toHaveBeenCalledTimes(1);
      expect(writeSpy).toHaveBeenCalledWith('[]', 0);

      expect(closeSpy).toHaveBeenCalledTimes(1);
    });

    test('throws an error if makeFileHandle throws an error', async () => {
      const svc = new FileServiceWriter(baseName, fileExtension);
      const mockFileHandle = new MockFileHandle() as unknown as FileHandle;

      const makeFileHandleSpy = jest.spyOn(svc, 'makeFileHandle');
      makeFileHandleSpy.mockImplementationOnce(async () => {
        throw new Error(testError);
      });

      const truncateSpy = jest.spyOn(mockFileHandle, 'truncate');
      const writeSpy = jest.spyOn(mockFileHandle, 'write');
      const closeSpy = jest.spyOn(mockFileHandle, 'close');

      await expect(() => svc.clearFile(filePath)).rejects.toThrow(testError);

      expect(makeFileHandleSpy).toHaveBeenCalledTimes(1);
      expect(makeFileHandleSpy).toHaveBeenCalledWith(filePath, svc.filename);

      expect(truncateSpy).toHaveBeenCalledTimes(0);
      expect(writeSpy).toHaveBeenCalledTimes(0);
      expect(closeSpy).toHaveBeenCalledTimes(0);
    });

    test('throws an error if truncate throws an error', async () => {
      const svc = new FileServiceWriter(baseName, fileExtension);
      const mockFileHandle = new MockFileHandle() as unknown as FileHandle;

      const makeFileHandleSpy = jest.spyOn(svc, 'makeFileHandle');
      makeFileHandleSpy.mockImplementationOnce(async () => mockFileHandle);

      const truncateSpy = jest.spyOn(mockFileHandle, 'truncate');
      truncateSpy.mockImplementationOnce(async () => {
        throw new Error(testError);
      });

      const writeSpy = jest.spyOn(mockFileHandle, 'write');
      const closeSpy = jest.spyOn(mockFileHandle, 'close');

      await expect(() => svc.clearFile(filePath)).rejects.toThrow(testError);

      expect(makeFileHandleSpy).toHaveBeenCalledTimes(1);
      expect(makeFileHandleSpy).toHaveBeenCalledWith(filePath, svc.filename);

      expect(truncateSpy).toHaveBeenCalledTimes(1);
      expect(truncateSpy).toHaveBeenCalledWith(0);

      expect(writeSpy).toHaveBeenCalledTimes(0);
      expect(closeSpy).toHaveBeenCalledTimes(0);
    });

    test('throws an error if write throws an error', async () => {
      const svc = new FileServiceWriter(baseName, fileExtension);
      const mockFileHandle = new MockFileHandle() as unknown as FileHandle;

      const makeFileHandleSpy = jest.spyOn(svc, 'makeFileHandle');
      makeFileHandleSpy.mockImplementationOnce(async () => mockFileHandle);

      const truncateSpy = jest.spyOn(mockFileHandle, 'truncate');
      truncateSpy.mockImplementationOnce(async () => {});
      const writeSpy = jest.spyOn(mockFileHandle, 'write');
      writeSpy.mockImplementationOnce(async () => {
        throw new Error(testError);
      });
      const closeSpy = jest.spyOn(mockFileHandle, 'close');

      await expect(() => svc.clearFile(filePath)).rejects.toThrow(testError);

      expect(makeFileHandleSpy).toHaveBeenCalledTimes(1);
      expect(makeFileHandleSpy).toHaveBeenCalledWith(filePath, svc.filename);

      expect(truncateSpy).toHaveBeenCalledTimes(1);
      expect(truncateSpy).toHaveBeenCalledWith(0);

      expect(writeSpy).toHaveBeenCalledTimes(1);
      expect(writeSpy).toHaveBeenCalledWith('[]', 0);

      expect(closeSpy).toHaveBeenCalledTimes(0);
    });
  });
});
