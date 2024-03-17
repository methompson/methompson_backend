import * as uuid from 'uuid';
import { mkdir, open } from 'fs/promises';
import { join } from 'path';

import {
  FILE_NAME,
  FileDepositConversionsService,
} from './deposit_conversions.service.file';
import {
  DepositConversion,
  DepositConversionJSON,
} from '@/src/models/vice_bank/deposit_conversion';

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

const conversionJSON1: DepositConversionJSON = {
  id: 'id1',
  vbUserId: 'userId1',
  name: 'name1',
  conversionUnit: 'conversionUnit1',
  depositsPer: 1,
  tokensPer: 1,
  minDeposit: 1,
};
const conversionJSON2: DepositConversionJSON = {
  id: 'id2',
  vbUserId: 'userId1',
  name: 'name2',
  conversionUnit: 'conversionUnit2',
  depositsPer: 2,
  tokensPer: 2,
  minDeposit: 2,
};
const conversionJSON3: DepositConversionJSON = {
  id: 'id3',
  vbUserId: 'userId3',
  name: 'name3',
  conversionUnit: 'conversionUnit3',
  depositsPer: 3,
  tokensPer: 3,
  minDeposit: 3,
};

const conversion1 = DepositConversion.fromJSON(conversionJSON1);
const conversion2 = DepositConversion.fromJSON(conversionJSON2);
const conversion3 = DepositConversion.fromJSON(conversionJSON3);

const testError = 'test error aiorwhsfjldn';

const logSpy = jest.spyOn(console, 'log');
logSpy.mockImplementation(() => {});
const errorSpy = jest.spyOn(console, 'error');
errorSpy.mockImplementation(() => {});

describe('FileDepositConversionsService', () => {
  const makeFileHandleSpy = jest.spyOn(
    FileDepositConversionsService,
    'makeFileHandle',
  );
  const writeBackupSpy = jest.spyOn(
    FileDepositConversionsService,
    'writeBackup',
  );

  beforeEach(() => {
    closeMock.mockReset();
    readFileMock.mockReset();
    truncateMock.mockReset();
    writeMock.mockReset();
    mockMkdir.mockReset();
    mockOpen.mockReset();

    uuidv4.mockClear();

    makeFileHandleSpy.mockClear();
    writeBackupSpy.mockClear();
  });

  describe('purchasesString', () => {
    test('returns a stringified JSON array', async () => {
      mockOpen.mockImplementationOnce(async () => new MockFileHandle());

      const service = new FileDepositConversionsService(
        await open(''),
        'path',
        [conversion1, conversion2, conversion3],
      );

      const str = service.depositConversionsString;

      const json = JSON.parse(str);
      expect(json).toEqual([conversionJSON1, conversionJSON2, conversionJSON3]);
    });

    test('returns an empty array if there is no data', async () => {
      mockOpen.mockImplementationOnce(async () => new MockFileHandle());

      const service = new FileDepositConversionsService(
        await open(''),
        'path',
        [],
      );

      const str = service.depositConversionsString;

      const json = JSON.parse(str);
      expect(json).toEqual([]);
    });
  });

  describe('addPurchase', () => {
    test('adds a users and calls writeToFile', async () => {
      mockOpen.mockImplementationOnce(async () => new MockFileHandle());

      const service = new FileDepositConversionsService(await open(''), 'path');
      const writeToFileSpy = jest.spyOn(service, 'writeToFile');
      writeToFileSpy.mockImplementationOnce(async () => {});

      expect(service.depositConversionsList.length).toBe(0);

      await service.addDepositConversion(conversion1);

      expect(service.depositConversionsList.length).toBe(1);
      expect(writeToFileSpy).toHaveBeenCalledTimes(1);
    });

    test('throws an error if writeToFiles throws an error', async () => {
      mockOpen.mockImplementationOnce(async () => new MockFileHandle());

      const service = new FileDepositConversionsService(await open(''), 'path');

      const testErr = 'Test Error';
      const writeToFileSpy = jest.spyOn(service, 'writeToFile');
      writeToFileSpy.mockImplementationOnce(() => {
        throw new Error(testErr);
      });

      await expect(() =>
        service.addDepositConversion(conversion1),
      ).rejects.toThrow();

      expect(writeToFileSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('updatePurchase', () => {
    test('updates a user and calls writeToFile', async () => {
      mockOpen.mockImplementationOnce(async () => new MockFileHandle());

      const service = new FileDepositConversionsService(
        await open(''),
        'path',
        [conversion1],
      );
      const writeToFileSpy = jest.spyOn(service, 'writeToFile');
      writeToFileSpy.mockImplementationOnce(async () => {});

      const updatedUser = DepositConversion.fromJSON({
        ...conversion1.toJSON(),
        name: 'new name',
      });

      await service.updateDepositConversion(updatedUser);

      expect(service.depositConversionsList.length).toBe(1);
      expect(service.depositConversionsList[0]).toBe(updatedUser);
      expect(writeToFileSpy).toHaveBeenCalledTimes(1);
    });

    test('throws an error if writeToFiles throws an error', async () => {
      mockOpen.mockImplementationOnce(async () => new MockFileHandle());

      const service = new FileDepositConversionsService(
        await open(''),
        'path',
        [conversion1],
      );

      const testErr = 'Test Error';
      const writeToFileSpy = jest.spyOn(service, 'writeToFile');
      writeToFileSpy.mockImplementationOnce(() => {
        throw new Error(testErr);
      });

      const updatedUser = DepositConversion.fromJSON({
        ...conversion1.toJSON(),
        name: 'new name',
      });

      await expect(() =>
        service.updateDepositConversion(updatedUser),
      ).rejects.toThrow();

      expect(writeToFileSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('deletePurchase', () => {
    test('deletes a user and calls writeToFile', async () => {
      mockOpen.mockImplementationOnce(async () => new MockFileHandle());

      const service = new FileDepositConversionsService(
        await open(''),
        'path',
        [conversion1],
      );
      const writeToFileSpy = jest.spyOn(service, 'writeToFile');
      writeToFileSpy.mockImplementationOnce(async () => {});

      await service.deleteDepositConversion(conversion1.id);

      expect(service.depositConversionsList.length).toBe(0);
      expect(writeToFileSpy).toHaveBeenCalledTimes(1);
    });

    test('throws an error if writeToFiles throws an error', async () => {
      mockOpen.mockImplementationOnce(async () => new MockFileHandle());

      const service = new FileDepositConversionsService(
        await open(''),
        'path',
        [conversion1],
      );

      const testErr = 'Test Error';
      const writeToFileSpy = jest.spyOn(service, 'writeToFile');
      writeToFileSpy.mockImplementationOnce(() => {
        throw new Error(testErr);
      });

      await expect(() =>
        service.deleteDepositConversion(conversion1.id),
      ).rejects.toThrow();

      expect(writeToFileSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('writeToFile', () => {
    test('gets the string, runs truncate and writes to the file handle', async () => {
      const mockFileHandle = new MockFileHandle();
      mockOpen.mockImplementationOnce(async () => mockFileHandle);

      const svc = new FileDepositConversionsService(await open(''), 'path', [
        conversion1,
      ]);

      const str = svc.depositConversionsString;

      await svc.writeToFile();

      expect(mockFileHandle.truncate).toHaveBeenCalledTimes(1);
      expect(mockFileHandle.truncate).toHaveBeenCalledWith(0);

      expect(mockFileHandle.write).toHaveBeenCalledTimes(1);
      expect(mockFileHandle.write).toHaveBeenCalledWith(str, 0);
    });

    test('Throws an error if truncate throws an error', async () => {
      const mockFileHandle = new MockFileHandle();
      mockOpen.mockImplementationOnce(async () => mockFileHandle);

      truncateMock.mockImplementationOnce(async () => {
        throw new Error(testError);
      });

      const svc = new FileDepositConversionsService(await open(''), 'path', [
        conversion1,
      ]);

      await expect(() => svc.writeToFile()).rejects.toThrow(testError);

      expect(mockFileHandle.truncate).toHaveBeenCalledTimes(1);
      expect(mockFileHandle.truncate).toHaveBeenCalledWith(0);

      expect(mockFileHandle.write).toHaveBeenCalledTimes(0);
    });

    test('Throws an error if write throws an error', async () => {
      const mockFileHandle = new MockFileHandle();
      mockOpen.mockImplementationOnce(async () => mockFileHandle);

      writeMock.mockImplementationOnce(async () => {
        throw new Error(testError);
      });

      const svc = new FileDepositConversionsService(await open(''), 'path', [
        conversion1,
      ]);

      const str = svc.depositConversionsString;

      await expect(() => svc.writeToFile()).rejects.toThrow(testError);

      expect(mockFileHandle.truncate).toHaveBeenCalledTimes(1);
      expect(mockFileHandle.truncate).toHaveBeenCalledWith(0);

      expect(mockFileHandle.write).toHaveBeenCalledTimes(1);
      expect(mockFileHandle.write).toHaveBeenCalledWith(str, 0);
    });
  });

  describe('backup', () => {
    test('runs writeBackup with expected values', async () => {
      const mockFileHandle1 = new MockFileHandle();
      const mockFileHandle2 = new MockFileHandle();
      mockOpen.mockImplementationOnce(async () => mockFileHandle1);
      mockOpen.mockImplementationOnce(async () => mockFileHandle2);

      const svc = new FileDepositConversionsService(await open(''), 'path', [
        conversion1,
      ]);
      await svc.backup();

      expect(makeFileHandleSpy).toHaveBeenCalledTimes(1);
      expect(makeFileHandleSpy).toHaveBeenCalledWith(
        'path/backup',
        expect.stringContaining('deposit_conversions_data_backup'),
      );

      expect(truncateMock).toHaveBeenCalledTimes(1);
      expect(truncateMock).toHaveBeenCalledWith(0);

      expect(writeMock).toHaveBeenCalledTimes(1);
      expect(writeMock).toHaveBeenCalledWith(svc.depositConversionsString, 0);

      expect(closeMock).toHaveBeenCalledTimes(1);
    });

    test('throws an error if makeFileHandle throws an error', async () => {
      const mockFileHandle1 = new MockFileHandle();
      mockOpen.mockImplementationOnce(async () => mockFileHandle1);

      const svc = new FileDepositConversionsService(await open(''), 'path', [
        conversion1,
      ]);

      makeFileHandleSpy.mockImplementationOnce(async () => {
        throw new Error(testError);
      });

      await expect(() => svc.backup()).rejects.toThrow(testError);

      expect(makeFileHandleSpy).toHaveBeenCalledTimes(1);
      expect(makeFileHandleSpy).toHaveBeenCalledWith(
        'path/backup',
        expect.stringContaining('deposit_conversions_data_backup'),
      );

      expect(truncateMock).toHaveBeenCalledTimes(0);
      expect(writeMock).toHaveBeenCalledTimes(0);
      expect(closeMock).toHaveBeenCalledTimes(0);
    });

    test('throws an error if truncate throws an error', async () => {
      const mockFileHandle1 = new MockFileHandle();
      const mockFileHandle2 = new MockFileHandle();
      mockOpen.mockImplementationOnce(async () => mockFileHandle1);
      mockOpen.mockImplementationOnce(async () => mockFileHandle2);

      const svc = new FileDepositConversionsService(await open(''), 'path', [
        conversion1,
      ]);

      truncateMock.mockImplementationOnce(async () => {
        throw new Error(testError);
      });

      await expect(() => svc.backup()).rejects.toThrow(testError);

      expect(makeFileHandleSpy).toHaveBeenCalledTimes(1);
      expect(makeFileHandleSpy).toHaveBeenCalledWith(
        'path/backup',
        expect.stringContaining('deposit_conversions_data_backup'),
      );

      expect(truncateMock).toHaveBeenCalledTimes(1);
      expect(truncateMock).toHaveBeenCalledWith(0);

      expect(writeMock).toHaveBeenCalledTimes(0);

      expect(closeMock).toHaveBeenCalledTimes(0);
    });

    test('throws an error if write throws an error', async () => {
      const mockFileHandle1 = new MockFileHandle();
      const mockFileHandle2 = new MockFileHandle();
      mockOpen.mockImplementationOnce(async () => mockFileHandle1);
      mockOpen.mockImplementationOnce(async () => mockFileHandle2);

      const svc = new FileDepositConversionsService(await open(''), 'path', [
        conversion1,
      ]);

      writeMock.mockImplementationOnce(async () => {
        throw new Error(testError);
      });

      await expect(() => svc.backup()).rejects.toThrow(testError);

      expect(makeFileHandleSpy).toHaveBeenCalledTimes(1);
      expect(makeFileHandleSpy).toHaveBeenCalledWith(
        'path/backup',
        expect.stringContaining('deposit_conversions_data_backup'),
      );

      expect(truncateMock).toHaveBeenCalledTimes(1);
      expect(truncateMock).toHaveBeenCalledWith(0);

      expect(writeMock).toHaveBeenCalledTimes(1);
      expect(writeMock).toHaveBeenCalledWith(svc.depositConversionsString, 0);

      expect(closeMock).toHaveBeenCalledTimes(0);
    });

    test('throws an error if close throws an error', async () => {
      const mockFileHandle1 = new MockFileHandle();
      const mockFileHandle2 = new MockFileHandle();
      mockOpen.mockImplementationOnce(async () => mockFileHandle1);
      mockOpen.mockImplementationOnce(async () => mockFileHandle2);

      const svc = new FileDepositConversionsService(await open(''), 'path', [
        conversion1,
      ]);

      closeMock.mockImplementationOnce(async () => {
        throw new Error(testError);
      });

      await expect(() => svc.backup()).rejects.toThrow(testError);

      expect(makeFileHandleSpy).toHaveBeenCalledTimes(1);
      expect(makeFileHandleSpy).toHaveBeenCalledWith(
        'path/backup',
        expect.stringContaining('deposit_conversions_data_backup'),
      );

      expect(truncateMock).toHaveBeenCalledTimes(1);
      expect(truncateMock).toHaveBeenCalledWith(0);

      expect(writeMock).toHaveBeenCalledTimes(1);
      expect(writeMock).toHaveBeenCalledWith(svc.depositConversionsString, 0);

      expect(closeMock).toHaveBeenCalledTimes(1);
    });
  });

  describe('makeFileHandle', () => {
    const path = 'path/to/file';
    const name = 'name.ext';

    test('calls mkdir and open', async () => {
      const mockFileHandle = new MockFileHandle();
      mockOpen.mockImplementationOnce(async () => mockFileHandle);

      const result = await FileDepositConversionsService.makeFileHandle(
        path,
        name,
      );

      expect(result).toBe(mockFileHandle);

      expect(mockMkdir).toHaveBeenCalledTimes(1);
      expect(mockMkdir).toHaveBeenCalledWith(path, { recursive: true });

      expect(mockOpen).toHaveBeenCalledTimes(1);
      expect(mockOpen).toHaveBeenCalledWith(join(path, name), 'a+');
    });

    test('uses the default file name if not provided', async () => {
      const mockFileHandle = new MockFileHandle();
      mockOpen.mockImplementationOnce(async () => mockFileHandle);

      const result = await FileDepositConversionsService.makeFileHandle(path);

      expect(result).toBe(mockFileHandle);

      expect(mockMkdir).toHaveBeenCalledTimes(1);
      expect(mockMkdir).toHaveBeenCalledWith(path, { recursive: true });

      expect(mockOpen).toHaveBeenCalledTimes(1);
      expect(mockOpen).toHaveBeenCalledWith(join(path, FILE_NAME), 'a+');
    });

    test('throws an error if mkdir throws an error', async () => {
      mockMkdir.mockImplementationOnce(() => {
        throw new Error(testError);
      });

      await expect(() =>
        FileDepositConversionsService.makeFileHandle(path, name),
      ).rejects.toThrow(testError);

      expect(mockMkdir).toHaveBeenCalledTimes(1);
      expect(mockMkdir).toHaveBeenCalledWith(path, { recursive: true });

      expect(mockOpen).toHaveBeenCalledTimes(0);
    });

    test('throws an error if open throws an error', async () => {
      mockOpen.mockImplementationOnce(() => {
        throw new Error(testError);
      });

      await expect(() =>
        FileDepositConversionsService.makeFileHandle(path, name),
      ).rejects.toThrow(testError);

      expect(mockMkdir).toHaveBeenCalledTimes(1);
      expect(mockMkdir).toHaveBeenCalledWith(path, { recursive: true });

      expect(mockOpen).toHaveBeenCalledTimes(1);
      expect(mockOpen).toHaveBeenCalledWith(join(path, name), 'a+');
    });
  });

  describe('writeBackup', () => {
    const stringData = 'string data';
    const backupPath = 'backupPath';
    const filename = 'name';

    test('runs functions with expected values', async () => {
      const mockFileHandle = new MockFileHandle();
      mockOpen.mockImplementationOnce(async () => mockFileHandle);

      await FileDepositConversionsService.writeBackup(
        backupPath,
        stringData,
        'name',
      );

      expect(makeFileHandleSpy).toHaveBeenCalledTimes(1);
      expect(makeFileHandleSpy).toHaveBeenCalledWith(backupPath, filename);

      expect(truncateMock).toHaveBeenCalledTimes(1);
      expect(truncateMock).toHaveBeenCalledWith(0);

      expect(writeMock).toHaveBeenCalledTimes(1);
      expect(writeMock).toHaveBeenCalledWith(stringData, 0);

      expect(closeMock).toHaveBeenCalledTimes(1);
    });

    test('throws an error if makeFileHandle throws an error', async () => {
      makeFileHandleSpy.mockImplementationOnce(async () => {
        throw new Error(testError);
      });

      await expect(() =>
        FileDepositConversionsService.writeBackup(
          backupPath,
          stringData,
          'name',
        ),
      ).rejects.toThrow();

      expect(makeFileHandleSpy).toHaveBeenCalledTimes(1);
      expect(makeFileHandleSpy).toHaveBeenCalledWith(backupPath, filename);

      expect(truncateMock).toHaveBeenCalledTimes(0);
      expect(writeMock).toHaveBeenCalledTimes(0);
      expect(closeMock).toHaveBeenCalledTimes(0);
    });

    test('throws an error if truncate throws an error', async () => {
      const mockFileHandle = new MockFileHandle();
      mockOpen.mockImplementationOnce(async () => mockFileHandle);

      truncateMock.mockImplementationOnce(async () => {
        throw new Error(testError);
      });

      await expect(() =>
        FileDepositConversionsService.writeBackup(
          backupPath,
          stringData,
          'name',
        ),
      ).rejects.toThrow(testError);

      expect(makeFileHandleSpy).toHaveBeenCalledTimes(1);
      expect(makeFileHandleSpy).toHaveBeenCalledWith(backupPath, filename);

      expect(truncateMock).toHaveBeenCalledTimes(1);
      expect(truncateMock).toHaveBeenCalledWith(0);

      expect(writeMock).toHaveBeenCalledTimes(0);

      expect(closeMock).toHaveBeenCalledTimes(0);
    });

    test('throws an error if write throws an error', async () => {
      const mockFileHandle = new MockFileHandle();
      mockOpen.mockImplementationOnce(async () => mockFileHandle);

      writeMock.mockImplementationOnce(async () => {
        throw new Error(testError);
      });

      await expect(() =>
        FileDepositConversionsService.writeBackup(
          backupPath,
          stringData,
          'name',
        ),
      ).rejects.toThrow(testError);

      expect(makeFileHandleSpy).toHaveBeenCalledTimes(1);
      expect(makeFileHandleSpy).toHaveBeenCalledWith(backupPath, filename);

      expect(truncateMock).toHaveBeenCalledTimes(1);
      expect(truncateMock).toHaveBeenCalledWith(0);

      expect(writeMock).toHaveBeenCalledTimes(1);
      expect(writeMock).toHaveBeenCalledWith(stringData, 0);

      expect(closeMock).toHaveBeenCalledTimes(0);
    });

    test('throws an error if close throws an error', async () => {
      const mockFileHandle = new MockFileHandle();
      mockOpen.mockImplementationOnce(async () => mockFileHandle);

      closeMock.mockImplementationOnce(async () => {
        throw new Error(testError);
      });

      await expect(() =>
        FileDepositConversionsService.writeBackup(
          backupPath,
          stringData,
          'name',
        ),
      ).rejects.toThrow(testError);

      expect(makeFileHandleSpy).toHaveBeenCalledTimes(1);
      expect(makeFileHandleSpy).toHaveBeenCalledWith(backupPath, filename);

      expect(truncateMock).toHaveBeenCalledTimes(1);
      expect(truncateMock).toHaveBeenCalledWith(0);

      expect(writeMock).toHaveBeenCalledTimes(1);
      expect(writeMock).toHaveBeenCalledWith(stringData, 0);

      expect(closeMock).toHaveBeenCalledTimes(1);
    });
  });

  describe('init', () => {
    const blogPath = 'blog path';

    test('creates a file handle, reads a file, creates blog posts and returns a new FileDepositConversionsService', async () => {
      const mockFileHandle = new MockFileHandle();
      mockOpen.mockImplementationOnce(async () => mockFileHandle);

      const buf = Buffer.from(
        JSON.stringify([conversion1, conversion2, conversion3]),
        'utf-8',
      );

      readFileMock.mockImplementationOnce(async () => buf);

      const svc = await FileDepositConversionsService.init(blogPath);

      expect(readFileMock).toHaveBeenCalledTimes(1);
      expect(makeFileHandleSpy).toHaveBeenCalledTimes(1);

      expect((await svc).depositConversionsList.length).toBe(3);

      expect(truncateMock).toHaveBeenCalledTimes(0);
      expect(writeMock).toHaveBeenCalledTimes(0);
    });

    test('Only includes posts that are valid', async () => {
      const mockFileHandle = new MockFileHandle();
      mockOpen.mockImplementationOnce(async () => mockFileHandle);

      const buf = Buffer.from(
        JSON.stringify([conversion1, conversion2, conversion3, {}]),
        'utf-8',
      );

      readFileMock.mockImplementationOnce(async () => buf);

      const svc = await FileDepositConversionsService.init(blogPath);

      expect(readFileMock).toHaveBeenCalledTimes(1);
      expect(makeFileHandleSpy).toHaveBeenCalledTimes(1);

      expect((await svc).depositConversionsList.length).toBe(3);

      expect(truncateMock).toHaveBeenCalledTimes(0);
      expect(writeMock).toHaveBeenCalledTimes(0);
    });

    test('If the raw data buffer is a zero length string, truncate and write are called', async () => {
      const mockFileHandle = new MockFileHandle();
      mockOpen.mockImplementationOnce(async () => mockFileHandle);

      const buf = Buffer.from('', 'utf-8');

      readFileMock.mockImplementationOnce(async () => buf);

      const svc = await FileDepositConversionsService.init(blogPath);

      expect(readFileMock).toHaveBeenCalledTimes(1);
      expect(makeFileHandleSpy).toHaveBeenCalledTimes(1);

      expect((await svc).depositConversionsList.length).toBe(0);
    });

    test('If the raw data buffer is a non-zero length non-JSON string, truncate and write are called and a backup is made', async () => {
      const mockFileHandle = new MockFileHandle();
      mockOpen.mockImplementationOnce(async () => mockFileHandle);

      const buf = Buffer.from('bad data', 'utf-8');

      readFileMock.mockImplementationOnce(async () => buf);
      writeBackupSpy.mockImplementationOnce(async () => {});

      const svc = await FileDepositConversionsService.init(blogPath);

      expect(readFileMock).toHaveBeenCalledTimes(1);
      expect(makeFileHandleSpy).toHaveBeenCalledTimes(1);
      expect(writeBackupSpy).toHaveBeenCalledTimes(1);

      expect((await svc).depositConversionsList.length).toBe(0);

      expect(truncateMock).toHaveBeenCalledTimes(1);
      expect(truncateMock).toHaveBeenCalledWith(0);

      expect(writeMock).toHaveBeenCalledTimes(1);
      expect(writeMock).toHaveBeenCalledWith('[]', 0);
    });

    test('throws an error if makeFileHandle throws an error', async () => {
      makeFileHandleSpy.mockImplementationOnce(async () => {
        throw new Error(testError);
      });

      await expect(() =>
        FileDepositConversionsService.init(blogPath),
      ).rejects.toThrow(testError);

      expect(makeFileHandleSpy).toHaveBeenCalledTimes(1);

      expect(readFileMock).toHaveBeenCalledTimes(0);
      expect(writeBackupSpy).toHaveBeenCalledTimes(0);
      expect(truncateMock).toHaveBeenCalledTimes(0);
      expect(writeMock).toHaveBeenCalledTimes(0);
    });

    test('throws an error if readFile throws an error', async () => {
      const mockFileHandle = new MockFileHandle();
      mockOpen.mockImplementationOnce(async () => mockFileHandle);

      readFileMock.mockImplementationOnce(() => {
        throw new Error(testError);
      });

      await expect(() =>
        FileDepositConversionsService.init(blogPath),
      ).rejects.toThrow(testError);

      expect(makeFileHandleSpy).toHaveBeenCalledTimes(1);
      expect(readFileMock).toHaveBeenCalledTimes(1);

      expect(writeBackupSpy).toHaveBeenCalledTimes(0);
      expect(truncateMock).toHaveBeenCalledTimes(0);
      expect(writeMock).toHaveBeenCalledTimes(0);
    });

    test('throws an error if writeBackup throws an error', async () => {
      const mockFileHandle = new MockFileHandle();
      mockOpen.mockImplementationOnce(async () => mockFileHandle);

      const buf = Buffer.from('bad data', 'utf-8');

      readFileMock.mockImplementationOnce(async () => buf);
      writeBackupSpy.mockImplementationOnce(async () => {
        throw new Error(testError);
      });

      await expect(() =>
        FileDepositConversionsService.init(blogPath),
      ).rejects.toThrow(testError);

      expect(makeFileHandleSpy).toHaveBeenCalledTimes(1);
      expect(readFileMock).toHaveBeenCalledTimes(1);
      expect(writeBackupSpy).toHaveBeenCalledTimes(1);

      expect(truncateMock).toHaveBeenCalledTimes(0);
      expect(writeMock).toHaveBeenCalledTimes(0);
    });

    test('throws an error if truncate throws an error', async () => {
      const mockFileHandle = new MockFileHandle();
      mockOpen.mockImplementationOnce(async () => mockFileHandle);

      const buf = Buffer.from('bad data', 'utf-8');

      readFileMock.mockImplementationOnce(async () => buf);
      writeBackupSpy.mockImplementationOnce(async () => {});

      truncateMock.mockImplementationOnce(async () => {
        throw new Error(testError);
      });

      await expect(() =>
        FileDepositConversionsService.init(blogPath),
      ).rejects.toThrow(testError);

      expect(makeFileHandleSpy).toHaveBeenCalledTimes(1);
      expect(readFileMock).toHaveBeenCalledTimes(1);
      expect(writeBackupSpy).toHaveBeenCalledTimes(1);
      expect(truncateMock).toHaveBeenCalledTimes(1);

      expect(writeMock).toHaveBeenCalledTimes(0);
    });

    test('throws an error if write throws an error', async () => {
      const mockFileHandle = new MockFileHandle();
      mockOpen.mockImplementationOnce(async () => mockFileHandle);

      const buf = Buffer.from('bad data', 'utf-8');

      readFileMock.mockImplementationOnce(async () => buf);
      writeBackupSpy.mockImplementationOnce(async () => {});

      writeMock.mockImplementationOnce(async () => {
        throw new Error(testError);
      });

      await expect(() =>
        FileDepositConversionsService.init(blogPath),
      ).rejects.toThrow(testError);

      expect(makeFileHandleSpy).toHaveBeenCalledTimes(1);
      expect(readFileMock).toHaveBeenCalledTimes(1);
      expect(writeBackupSpy).toHaveBeenCalledTimes(1);
      expect(truncateMock).toHaveBeenCalledTimes(1);
      expect(writeMock).toHaveBeenCalledTimes(1);
    });
  });
});
