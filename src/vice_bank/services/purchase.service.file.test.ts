import * as uuid from 'uuid';
import { mkdir, open } from 'fs/promises';
import { join } from 'path';

import { FILE_NAME, FilePurchaseService } from './purchase.service.file';
import { Purchase, PurchaseJSON } from '@/src/models/vice_bank/purchase';

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

const purchasedName = 'purchasedName';

const p1JSON: PurchaseJSON = {
  id: 'id1',
  vbUserId: 'userId1',
  purchasePriceId: 'purchasePriceId1',
  purchasedName,
  date: '2021-01-01T00:00:00.000-06:00',
  purchasedQuantity: 1,
};
const p2JSON: PurchaseJSON = {
  id: 'id2',
  vbUserId: 'userId1',
  purchasePriceId: 'purchasePriceId2',
  purchasedName,
  date: '2021-01-12T00:00:00.000-06:00',
  purchasedQuantity: 2,
};
const p3JSON: PurchaseJSON = {
  id: 'id3',
  vbUserId: 'userId2',
  purchasePriceId: 'purchasePriceId3',
  purchasedName,
  date: '2021-01-25T00:00:00.000-06:00',
  purchasedQuantity: 3,
};

const purchase1 = Purchase.fromJSON(p1JSON);
const purchase2 = Purchase.fromJSON(p2JSON);
const purchase3 = Purchase.fromJSON(p3JSON);

const testError = 'test error 028u4efowjsdln';

const logSpy = jest.spyOn(console, 'log');
logSpy.mockImplementation(() => {});
const errorSpy = jest.spyOn(console, 'error');
errorSpy.mockImplementation(() => {});

describe('FilePurchaseService', () => {
  const makeFileHandleSpy = jest.spyOn(FilePurchaseService, 'makeFileHandle');
  const writeBackupSpy = jest.spyOn(FilePurchaseService, 'writeBackup');

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

      const service = new FilePurchaseService(await open(''), 'path', [
        purchase1,
        purchase2,
        purchase3,
      ]);

      const str = service.purchasesString;

      const json = JSON.parse(str);
      expect(json).toEqual([p1JSON, p2JSON, p3JSON]);
    });

    test('returns an empty array if there is no data', async () => {
      mockOpen.mockImplementationOnce(async () => new MockFileHandle());

      const service = new FilePurchaseService(await open(''), 'path', []);

      const str = service.purchasesString;

      const json = JSON.parse(str);
      expect(json).toEqual([]);
    });
  });

  describe('addPurchase', () => {
    test('adds a users and calls writeToFile', async () => {
      mockOpen.mockImplementationOnce(async () => new MockFileHandle());

      const service = new FilePurchaseService(await open(''), 'path');
      const writeToFileSpy = jest.spyOn(service, 'writeToFile');
      writeToFileSpy.mockImplementationOnce(async () => {});

      expect(service.purchasesList.length).toBe(0);

      await service.addPurchase(purchase1);

      expect(service.purchasesList.length).toBe(1);
      expect(writeToFileSpy).toHaveBeenCalledTimes(1);
    });

    test('throws an error if writeToFiles throws an error', async () => {
      mockOpen.mockImplementationOnce(async () => new MockFileHandle());

      const service = new FilePurchaseService(await open(''), 'path');

      const testErr = 'Test Error';
      const writeToFileSpy = jest.spyOn(service, 'writeToFile');
      writeToFileSpy.mockImplementationOnce(() => {
        throw new Error(testErr);
      });

      await expect(() => service.addPurchase(purchase1)).rejects.toThrow();

      expect(writeToFileSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('updatePurchase', () => {
    test('updates a user and calls writeToFile', async () => {
      mockOpen.mockImplementationOnce(async () => new MockFileHandle());

      const service = new FilePurchaseService(await open(''), 'path', [
        purchase1,
      ]);
      const writeToFileSpy = jest.spyOn(service, 'writeToFile');
      writeToFileSpy.mockImplementationOnce(async () => {});

      const updatedUser = Purchase.fromJSON({
        ...purchase1.toJSON(),
        purchasedQuantity: 20.0,
      });

      await service.updatePurchase(updatedUser);

      expect(service.purchasesList.length).toBe(1);
      expect(service.purchasesList[0]).toBe(updatedUser);
      expect(writeToFileSpy).toHaveBeenCalledTimes(1);
    });

    test('throws an error if writeToFiles throws an error', async () => {
      mockOpen.mockImplementationOnce(async () => new MockFileHandle());

      const service = new FilePurchaseService(await open(''), 'path', [
        purchase1,
      ]);

      const testErr = 'Test Error';
      const writeToFileSpy = jest.spyOn(service, 'writeToFile');
      writeToFileSpy.mockImplementationOnce(() => {
        throw new Error(testErr);
      });

      const updatedUser = Purchase.fromJSON({
        ...purchase1.toJSON(),
        purchasedQuantity: 20.0,
      });

      await expect(() => service.updatePurchase(updatedUser)).rejects.toThrow();

      expect(writeToFileSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('deletePurchase', () => {
    test('deletes a user and calls writeToFile', async () => {
      mockOpen.mockImplementationOnce(async () => new MockFileHandle());

      const service = new FilePurchaseService(await open(''), 'path', [
        purchase1,
      ]);
      const writeToFileSpy = jest.spyOn(service, 'writeToFile');
      writeToFileSpy.mockImplementationOnce(async () => {});

      await service.deletePurchase(purchase1.id);

      expect(service.purchasesList.length).toBe(0);
      expect(writeToFileSpy).toHaveBeenCalledTimes(1);
    });

    test('throws an error if writeToFiles throws an error', async () => {
      mockOpen.mockImplementationOnce(async () => new MockFileHandle());

      const service = new FilePurchaseService(await open(''), 'path', [
        purchase1,
      ]);

      const testErr = 'Test Error';
      const writeToFileSpy = jest.spyOn(service, 'writeToFile');
      writeToFileSpy.mockImplementationOnce(() => {
        throw new Error(testErr);
      });

      await expect(() =>
        service.deletePurchase(purchase1.id),
      ).rejects.toThrow();

      expect(writeToFileSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('writeToFile', () => {
    test('gets the string, runs truncate and writes to the file handle', async () => {
      const mockFileHandle = new MockFileHandle();
      mockOpen.mockImplementationOnce(async () => mockFileHandle);

      const svc = new FilePurchaseService(await open(''), 'path', [purchase1]);

      const str = svc.purchasesString;

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

      const svc = new FilePurchaseService(await open(''), 'path', [purchase1]);

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

      const svc = new FilePurchaseService(await open(''), 'path', [purchase1]);

      const str = svc.purchasesString;

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

      const svc = new FilePurchaseService(await open(''), 'path', [purchase1]);
      await svc.backup();

      expect(makeFileHandleSpy).toHaveBeenCalledTimes(1);
      expect(makeFileHandleSpy).toHaveBeenCalledWith(
        'path/backup',
        expect.stringContaining('purchase_data_backup'),
      );

      expect(truncateMock).toHaveBeenCalledTimes(1);
      expect(truncateMock).toHaveBeenCalledWith(0);

      expect(writeMock).toHaveBeenCalledTimes(1);
      expect(writeMock).toHaveBeenCalledWith(svc.purchasesString, 0);

      expect(closeMock).toHaveBeenCalledTimes(1);
    });

    test('throws an error if makeFileHandle throws an error', async () => {
      const mockFileHandle1 = new MockFileHandle();
      mockOpen.mockImplementationOnce(async () => mockFileHandle1);

      const svc = new FilePurchaseService(await open(''), 'path', [purchase1]);

      makeFileHandleSpy.mockImplementationOnce(async () => {
        throw new Error(testError);
      });

      await expect(() => svc.backup()).rejects.toThrow(testError);

      expect(makeFileHandleSpy).toHaveBeenCalledTimes(1);
      expect(makeFileHandleSpy).toHaveBeenCalledWith(
        'path/backup',
        expect.stringContaining('purchase_data_backup'),
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

      const svc = new FilePurchaseService(await open(''), 'path', [purchase1]);

      truncateMock.mockImplementationOnce(async () => {
        throw new Error(testError);
      });

      await expect(() => svc.backup()).rejects.toThrow(testError);

      expect(makeFileHandleSpy).toHaveBeenCalledTimes(1);
      expect(makeFileHandleSpy).toHaveBeenCalledWith(
        'path/backup',
        expect.stringContaining('purchase_data_backup'),
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

      const svc = new FilePurchaseService(await open(''), 'path', [purchase1]);

      writeMock.mockImplementationOnce(async () => {
        throw new Error(testError);
      });

      await expect(() => svc.backup()).rejects.toThrow(testError);

      expect(makeFileHandleSpy).toHaveBeenCalledTimes(1);
      expect(makeFileHandleSpy).toHaveBeenCalledWith(
        'path/backup',
        expect.stringContaining('purchase_data_backup'),
      );

      expect(truncateMock).toHaveBeenCalledTimes(1);
      expect(truncateMock).toHaveBeenCalledWith(0);

      expect(writeMock).toHaveBeenCalledTimes(1);
      expect(writeMock).toHaveBeenCalledWith(svc.purchasesString, 0);

      expect(closeMock).toHaveBeenCalledTimes(0);
    });

    test('throws an error if close throws an error', async () => {
      const mockFileHandle1 = new MockFileHandle();
      const mockFileHandle2 = new MockFileHandle();
      mockOpen.mockImplementationOnce(async () => mockFileHandle1);
      mockOpen.mockImplementationOnce(async () => mockFileHandle2);

      const svc = new FilePurchaseService(await open(''), 'path', [purchase1]);

      closeMock.mockImplementationOnce(async () => {
        throw new Error(testError);
      });

      await expect(() => svc.backup()).rejects.toThrow(testError);

      expect(makeFileHandleSpy).toHaveBeenCalledTimes(1);
      expect(makeFileHandleSpy).toHaveBeenCalledWith(
        'path/backup',
        expect.stringContaining('purchase_data_backup'),
      );

      expect(truncateMock).toHaveBeenCalledTimes(1);
      expect(truncateMock).toHaveBeenCalledWith(0);

      expect(writeMock).toHaveBeenCalledTimes(1);
      expect(writeMock).toHaveBeenCalledWith(svc.purchasesString, 0);

      expect(closeMock).toHaveBeenCalledTimes(1);
    });
  });

  describe('makeFileHandle', () => {
    const path = 'path/to/file';
    const name = 'name.ext';

    test('calls mkdir and open', async () => {
      const mockFileHandle = new MockFileHandle();
      mockOpen.mockImplementationOnce(async () => mockFileHandle);

      const result = await FilePurchaseService.makeFileHandle(path, name);

      expect(result).toBe(mockFileHandle);

      expect(mockMkdir).toHaveBeenCalledTimes(1);
      expect(mockMkdir).toHaveBeenCalledWith(path, { recursive: true });

      expect(mockOpen).toHaveBeenCalledTimes(1);
      expect(mockOpen).toHaveBeenCalledWith(join(path, name), 'a+');
    });

    test('uses the default file name if not provided', async () => {
      const mockFileHandle = new MockFileHandle();
      mockOpen.mockImplementationOnce(async () => mockFileHandle);

      const result = await FilePurchaseService.makeFileHandle(path);

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
        FilePurchaseService.makeFileHandle(path, name),
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
        FilePurchaseService.makeFileHandle(path, name),
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

      await FilePurchaseService.writeBackup(backupPath, stringData, 'name');

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
        FilePurchaseService.writeBackup(backupPath, stringData, 'name'),
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
        FilePurchaseService.writeBackup(backupPath, stringData, 'name'),
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
        FilePurchaseService.writeBackup(backupPath, stringData, 'name'),
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
        FilePurchaseService.writeBackup(backupPath, stringData, 'name'),
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

    test('creates a file handle, reads a file, creates blog posts and returns a new FilePurchaseService', async () => {
      const mockFileHandle = new MockFileHandle();
      mockOpen.mockImplementationOnce(async () => mockFileHandle);

      const buf = Buffer.from(
        JSON.stringify([purchase1, purchase2, purchase3]),
        'utf-8',
      );

      readFileMock.mockImplementationOnce(async () => buf);

      const svc = await FilePurchaseService.init(blogPath);

      expect(readFileMock).toHaveBeenCalledTimes(1);
      expect(makeFileHandleSpy).toHaveBeenCalledTimes(1);

      expect((await svc).purchasesList.length).toBe(3);

      expect(truncateMock).toHaveBeenCalledTimes(0);
      expect(writeMock).toHaveBeenCalledTimes(0);
    });

    test('Only includes posts that are valid', async () => {
      const mockFileHandle = new MockFileHandle();
      mockOpen.mockImplementationOnce(async () => mockFileHandle);

      const buf = Buffer.from(
        JSON.stringify([purchase1, purchase2, purchase3, {}]),
        'utf-8',
      );

      readFileMock.mockImplementationOnce(async () => buf);

      const svc = await FilePurchaseService.init(blogPath);

      expect(readFileMock).toHaveBeenCalledTimes(1);
      expect(makeFileHandleSpy).toHaveBeenCalledTimes(1);

      expect((await svc).purchasesList.length).toBe(3);

      expect(truncateMock).toHaveBeenCalledTimes(0);
      expect(writeMock).toHaveBeenCalledTimes(0);
    });

    test('If the raw data buffer is a zero length string, truncate and write are called', async () => {
      const mockFileHandle = new MockFileHandle();
      mockOpen.mockImplementationOnce(async () => mockFileHandle);

      const buf = Buffer.from('', 'utf-8');

      readFileMock.mockImplementationOnce(async () => buf);

      const svc = await FilePurchaseService.init(blogPath);

      expect(readFileMock).toHaveBeenCalledTimes(1);
      expect(makeFileHandleSpy).toHaveBeenCalledTimes(1);

      expect((await svc).purchasesList.length).toBe(0);
    });

    test('If the raw data buffer is a non-zero length non-JSON string, truncate and write are called and a backup is made', async () => {
      const mockFileHandle = new MockFileHandle();
      mockOpen.mockImplementationOnce(async () => mockFileHandle);

      const buf = Buffer.from('bad data', 'utf-8');

      readFileMock.mockImplementationOnce(async () => buf);
      writeBackupSpy.mockImplementationOnce(async () => {});

      const svc = await FilePurchaseService.init(blogPath);

      expect(readFileMock).toHaveBeenCalledTimes(1);
      expect(makeFileHandleSpy).toHaveBeenCalledTimes(1);
      expect(writeBackupSpy).toHaveBeenCalledTimes(1);

      expect((await svc).purchasesList.length).toBe(0);

      expect(truncateMock).toHaveBeenCalledTimes(1);
      expect(truncateMock).toHaveBeenCalledWith(0);

      expect(writeMock).toHaveBeenCalledTimes(1);
      expect(writeMock).toHaveBeenCalledWith('[]', 0);
    });

    test('throws an error if makeFileHandle throws an error', async () => {
      makeFileHandleSpy.mockImplementationOnce(async () => {
        throw new Error(testError);
      });

      await expect(() => FilePurchaseService.init(blogPath)).rejects.toThrow(
        testError,
      );

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

      await expect(() => FilePurchaseService.init(blogPath)).rejects.toThrow(
        testError,
      );

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

      await expect(() => FilePurchaseService.init(blogPath)).rejects.toThrow(
        testError,
      );

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

      await expect(() => FilePurchaseService.init(blogPath)).rejects.toThrow(
        testError,
      );

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

      await expect(() => FilePurchaseService.init(blogPath)).rejects.toThrow(
        testError,
      );

      expect(makeFileHandleSpy).toHaveBeenCalledTimes(1);
      expect(readFileMock).toHaveBeenCalledTimes(1);
      expect(writeBackupSpy).toHaveBeenCalledTimes(1);
      expect(truncateMock).toHaveBeenCalledTimes(1);
      expect(writeMock).toHaveBeenCalledTimes(1);
    });
  });
});
