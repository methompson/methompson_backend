import { join } from 'path';

import { FileDepositConversionsService } from './deposit_conversions.service.file';
import {
  DepositConversion,
  DepositConversionJSON,
} from '@/src/models/vice_bank/action';
import { FileServiceWriter } from '@/src/utils/file_service_writer';

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

const filePath = 'path/to/file';

describe('FileDepositConversionsService', () => {
  describe('purchasesString', () => {
    test('returns a stringified JSON array', async () => {
      const fsw = new FileServiceWriter('baseName', 'json');

      const service = new FileDepositConversionsService(fsw, filePath, [
        conversion1,
        conversion2,
        conversion3,
      ]);

      const str = service.depositConversionsString;

      const json = JSON.parse(str);
      expect(json).toEqual([conversionJSON1, conversionJSON2, conversionJSON3]);
    });

    test('returns an empty array if there is no data', async () => {
      const fsw = new FileServiceWriter('baseName', 'json');

      const service = new FileDepositConversionsService(fsw, filePath, []);

      const str = service.depositConversionsString;

      const json = JSON.parse(str);
      expect(json).toEqual([]);
    });
  });

  describe('addPurchase', () => {
    test('adds a users and calls writeToFile', async () => {
      const fsw = new FileServiceWriter('baseName', 'json');
      const service = new FileDepositConversionsService(fsw, filePath);
      const writeToFileSpy = jest.spyOn(service, 'writeToFile');
      writeToFileSpy.mockImplementationOnce(async () => {});

      expect(service.depositConversionsList.length).toBe(0);

      await service.addDepositConversion(conversion1);

      expect(service.depositConversionsList.length).toBe(1);
      expect(writeToFileSpy).toHaveBeenCalledTimes(1);
    });

    test('throws an error if writeToFiles throws an error', async () => {
      const fsw = new FileServiceWriter('baseName', 'json');

      const service = new FileDepositConversionsService(fsw, filePath);

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
      const fsw = new FileServiceWriter('baseName', 'json');

      const service = new FileDepositConversionsService(fsw, filePath, [
        conversion1,
      ]);
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
      const fsw = new FileServiceWriter('baseName', 'json');

      const service = new FileDepositConversionsService(fsw, filePath, [
        conversion1,
      ]);

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
      const fsw = new FileServiceWriter('baseName', 'json');

      const service = new FileDepositConversionsService(fsw, filePath, [
        conversion1,
      ]);
      const writeToFileSpy = jest.spyOn(service, 'writeToFile');
      writeToFileSpy.mockImplementationOnce(async () => {});

      await service.deleteDepositConversion(conversion1.id);

      expect(service.depositConversionsList.length).toBe(0);
      expect(writeToFileSpy).toHaveBeenCalledTimes(1);
    });

    test('throws an error if writeToFiles throws an error', async () => {
      const fsw = new FileServiceWriter('baseName', 'json');

      const service = new FileDepositConversionsService(fsw, filePath, [
        conversion1,
      ]);

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
      const fsw = new FileServiceWriter('baseName', 'json');
      const wtfSpy = jest.spyOn(fsw, 'writeToFile');
      wtfSpy.mockImplementationOnce(async () => {});

      const svc = new FileDepositConversionsService(fsw, filePath, [
        conversion1,
      ]);

      const str = svc.depositConversionsString;

      await svc.writeToFile();

      expect(wtfSpy).toHaveBeenCalledTimes(1);
      expect(wtfSpy).toHaveBeenCalledWith(filePath, str);
    });

    test('Throws an error if FileServiceWriter.writeToFile throws an error', async () => {
      const fsw = new FileServiceWriter('baseName', 'json');
      const wtfSpy = jest.spyOn(fsw, 'writeToFile');
      wtfSpy.mockImplementationOnce(async () => {
        throw new Error(testError);
      });

      const svc = new FileDepositConversionsService(fsw, filePath, [
        conversion1,
      ]);

      const str = svc.depositConversionsString;

      await expect(() => svc.writeToFile()).rejects.toThrow(testError);

      expect(wtfSpy).toHaveBeenCalledTimes(1);
      expect(wtfSpy).toHaveBeenCalledWith(filePath, str);
    });
  });

  describe('backup', () => {
    test('runs writeBackup with expected values', async () => {
      const fsw = new FileServiceWriter('baseName', 'json');
      const writeBackupSpy = jest.spyOn(fsw, 'writeBackup');
      writeBackupSpy.mockImplementationOnce(async () => {});

      const svc = new FileDepositConversionsService(fsw, filePath, [
        conversion1,
      ]);

      const str = svc.depositConversionsString;

      await svc.backup();

      expect(writeBackupSpy).toHaveBeenCalledTimes(1);
      expect(writeBackupSpy).toHaveBeenCalledWith(
        join(filePath, 'backup'),
        str,
      );
    });
  });

  describe('init', () => {
    const conversionsPath = 'purchase path';

    test('creates a file handle, reads a file, creates blog posts and returns a new FileDepositConversionsService', async () => {
      const fsw = new FileServiceWriter('baseName', 'json');
      const readFileSpy = jest.spyOn(fsw, 'readFile');
      readFileSpy.mockImplementationOnce(async () =>
        JSON.stringify([conversionJSON1, conversionJSON2, conversionJSON3]),
      );

      const svc = await FileDepositConversionsService.init(conversionsPath, {
        fileServiceWriter: fsw,
      });

      expect(svc.depositConversionsList.length).toBe(3);

      expect(JSON.parse(JSON.stringify(svc.depositConversionsList))).toEqual([
        conversion1.toJSON(),
        conversion2.toJSON(),
        conversion3.toJSON(),
      ]);
    });

    test('Only includes posts that are valid', async () => {
      const fsw = new FileServiceWriter('baseName', 'json');
      const readFileSpy = jest.spyOn(fsw, 'readFile');
      readFileSpy.mockImplementationOnce(async () =>
        JSON.stringify([conversionJSON1, conversionJSON2, conversionJSON3, {}]),
      );

      const svc = await FileDepositConversionsService.init(conversionsPath, {
        fileServiceWriter: fsw,
      });

      expect((await svc).depositConversionsList.length).toBe(3);
    });

    test('returns an empty FilePurhcaseService if readFile throws an error', async () => {
      const fsw = new FileServiceWriter('baseName', 'json');
      const rfSpy = jest.spyOn(fsw, 'readFile');
      rfSpy.mockImplementationOnce(async () => {
        throw new Error(testError);
      });
      const wbSpy = jest.spyOn(fsw, 'writeBackup');
      wbSpy.mockImplementationOnce(async () => {});
      const cfSpy = jest.spyOn(fsw, 'clearFile');
      cfSpy.mockImplementationOnce(async () => {});

      const svc = await FileDepositConversionsService.init(conversionsPath, {
        fileServiceWriter: fsw,
      });

      expect(rfSpy).toHaveBeenCalledTimes(1);
      expect(rfSpy).toHaveBeenCalledWith(conversionsPath);

      expect(svc.depositConversionsList.length).toBe(0);

      expect(wbSpy).toHaveBeenCalledTimes(0);
      expect(cfSpy).toHaveBeenCalledTimes(1);
    });

    test('If the data exists, but it is invalid, a backup is written', async () => {
      const fsw = new FileServiceWriter('baseName', 'json');

      const invalidData = 'invalid data';
      const rfSpy = jest.spyOn(fsw, 'readFile');
      rfSpy.mockImplementationOnce(async () => invalidData);
      const wbSpy = jest.spyOn(fsw, 'writeBackup');
      wbSpy.mockImplementationOnce(async () => {});
      const cfSpy = jest.spyOn(fsw, 'clearFile');
      cfSpy.mockImplementationOnce(async () => {});

      const svc = await FileDepositConversionsService.init(conversionsPath, {
        fileServiceWriter: fsw,
      });

      expect(rfSpy).toHaveBeenCalledTimes(1);
      expect(rfSpy).toHaveBeenCalledWith(conversionsPath);

      expect(svc.depositConversionsList.length).toBe(0);

      expect(wbSpy).toHaveBeenCalledTimes(1);
      expect(wbSpy).toHaveBeenCalledWith(conversionsPath, invalidData);
      expect(cfSpy).toHaveBeenCalledTimes(1);
    });
  });
});
