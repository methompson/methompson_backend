import { Deposit, DepositJSON } from '@/src/models/vice_bank/deposit';
import { FileDepositService } from './deposit.service.file';
import { FileServiceWriter } from '@/src/utils/file_service_writer';

const deposit1JSON: DepositJSON = {
  id: 'id1',
  vbUserId: 'userId1',
  date: '2021-01-01T00:00:00.000-06:00',
  depositQuantity: 1,
  conversionRate: 1,
  depositConversionName: 'name1',
  conversionUnit: 'minutes',
};
const deposit2JSON: DepositJSON = {
  id: 'id2',
  vbUserId: 'userId1',
  date: '2021-01-12T00:00:00.000-06:00',
  depositQuantity: 1,
  conversionRate: 1,
  depositConversionName: 'name1',
  conversionUnit: 'minutes',
};
const deposit3JSON: DepositJSON = {
  id: 'id3',
  vbUserId: 'userId2',
  date: '2021-02-01T00:00:00.000-06:00',
  depositQuantity: 1,
  conversionRate: 1,
  depositConversionName: 'name2',
  conversionUnit: 'minutes',
};

const deposit1 = Deposit.fromJSON(deposit1JSON);
const deposit2 = Deposit.fromJSON(deposit2JSON);
const deposit3 = Deposit.fromJSON(deposit3JSON);

const testError = 'test error 824uwoherfjs';

const logSpy = jest.spyOn(console, 'log');
logSpy.mockImplementation(() => {});
const errorSpy = jest.spyOn(console, 'error');
errorSpy.mockImplementation(() => {});

describe('FileDepositService', () => {
  describe('depositsString', () => {
    test('returns a stringified JSON array', async () => {
      const fsw = new FileServiceWriter('baseName', 'json');

      const service = new FileDepositService(fsw, 'path', [
        deposit1,
        deposit2,
        deposit3,
      ]);

      const str = service.depositsString;

      const json = JSON.parse(str);
      expect(json).toEqual([deposit1JSON, deposit2JSON, deposit3JSON]);
    });

    test('returns an empty array if there is no data', async () => {
      const fsw = new FileServiceWriter('baseName', 'json');

      const service = new FileDepositService(fsw, 'path', []);

      const str = service.depositsString;

      const json = JSON.parse(str);
      expect(json).toEqual([]);
    });
  });

  describe('addDeposit', () => {
    test('adds a user and calls writeToFile', async () => {
      const fsw = new FileServiceWriter('baseName', 'json');

      const service = new FileDepositService(fsw, 'path');
      const writeToFileSpy = jest.spyOn(service, 'writeToFile');
      writeToFileSpy.mockImplementationOnce(async () => {});

      expect(service.depositsList.length).toBe(0);

      await service.addDeposit(deposit1);

      expect(service.depositsList.length).toBe(1);
      expect(writeToFileSpy).toHaveBeenCalledTimes(1);
    });

    test('throws an error if writeToFiles throws an error', async () => {
      const fsw = new FileServiceWriter('baseName', 'json');

      const service = new FileDepositService(fsw, 'path');

      const testErr = 'Test Error';
      const writeToFileSpy = jest.spyOn(service, 'writeToFile');
      writeToFileSpy.mockImplementationOnce(() => {
        throw new Error(testErr);
      });

      await expect(() => service.addDeposit(deposit1)).rejects.toThrow();

      expect(writeToFileSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('updateDeposit', () => {
    test('updates a user and calls writeToFile', async () => {
      const fsw = new FileServiceWriter('baseName', 'json');

      const service = new FileDepositService(fsw, 'path', [deposit1]);
      const writeToFileSpy = jest.spyOn(service, 'writeToFile');
      writeToFileSpy.mockImplementationOnce(async () => {});

      const updatedUser = Deposit.fromJSON({
        ...deposit1.toJSON(),
        depositQuantity: 20.0,
      });

      await service.updateDeposit(updatedUser);

      expect(service.depositsList.length).toBe(1);
      expect(service.depositsList[0]).toBe(updatedUser);
      expect(writeToFileSpy).toHaveBeenCalledTimes(1);
    });

    test('throws an error if writeToFiles throws an error', async () => {
      const fsw = new FileServiceWriter('baseName', 'json');

      const service = new FileDepositService(fsw, 'path', [deposit1]);

      const testErr = 'Test Error';
      const writeToFileSpy = jest.spyOn(service, 'writeToFile');
      writeToFileSpy.mockImplementationOnce(() => {
        throw new Error(testErr);
      });

      const updatedUser = Deposit.fromJSON({
        ...deposit1.toJSON(),
        depositQuantity: 20.0,
      });

      await expect(() => service.updateDeposit(updatedUser)).rejects.toThrow();

      expect(writeToFileSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('deleteDeposit', () => {
    test('deletes a user and calls writeToFile', async () => {
      const fsw = new FileServiceWriter('baseName', 'json');

      const service = new FileDepositService(fsw, 'path', [deposit1]);
      const writeToFileSpy = jest.spyOn(service, 'writeToFile');
      writeToFileSpy.mockImplementationOnce(async () => {});

      await service.deleteDeposit(deposit1.id);

      expect(service.depositsList.length).toBe(0);
      expect(writeToFileSpy).toHaveBeenCalledTimes(1);
    });

    test('throws an error if writeToFiles throws an error', async () => {
      const fsw = new FileServiceWriter('baseName', 'json');

      const service = new FileDepositService(fsw, 'path', [deposit1]);

      const testErr = 'Test Error';
      const writeToFileSpy = jest.spyOn(service, 'writeToFile');
      writeToFileSpy.mockImplementationOnce(() => {
        throw new Error(testErr);
      });

      await expect(() => service.deleteDeposit(deposit1.id)).rejects.toThrow();

      expect(writeToFileSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('writeToFile', () => {
    test('gets the string, runs FileHandleService.writeToFile', async () => {
      const fsw = new FileServiceWriter('baseName', 'json');
      const wtfSpy = jest.spyOn(fsw, 'writeToFile');
      wtfSpy.mockImplementationOnce(async () => {});

      const svc = new FileDepositService(fsw, 'path', [deposit1]);

      const str = svc.depositsString;

      await svc.writeToFile();

      expect(wtfSpy).toHaveBeenCalledTimes(1);
      expect(wtfSpy).toHaveBeenCalledWith(str);
    });

    test('Throws an error if FileServiceWriter.writeToFile throws an error', async () => {
      const fsw = new FileServiceWriter('baseName', 'json');
      const wtfSpy = jest.spyOn(fsw, 'writeToFile');
      wtfSpy.mockImplementationOnce(async () => {
        throw new Error(testError);
      });

      const svc = new FileDepositService(fsw, 'path', [deposit1]);
      const str = svc.depositsString;

      await expect(() => svc.writeToFile()).rejects.toThrow(testError);

      expect(wtfSpy).toHaveBeenCalledTimes(1);
      expect(wtfSpy).toHaveBeenCalledWith(str);
    });
  });

  describe('backup', () => {
    test('runs writeBackup with expected values', async () => {
      const fsw = new FileServiceWriter('baseName', 'json');

      const wbSpy = jest.spyOn(fsw, 'writeBackup');
      wbSpy.mockImplementationOnce(async () => {});

      const svc = new FileDepositService(fsw, 'path', [deposit1]);
      await svc.backup();

      expect(wbSpy).toHaveBeenCalledTimes(1);
      expect(wbSpy).toHaveBeenCalledWith('path/backup', svc.depositsString);
    });

    test('throws an error if writeBackup throws an error', async () => {
      const fsw = new FileServiceWriter('baseName', 'json');

      const svc = new FileDepositService(fsw, 'path', [deposit1]);

      const wbSpy = jest.spyOn(fsw, 'writeBackup');
      wbSpy.mockImplementationOnce(async () => {
        throw new Error(testError);
      });

      await expect(() => svc.backup()).rejects.toThrow(testError);

      expect(wbSpy).toHaveBeenCalledTimes(1);
      expect(wbSpy).toHaveBeenCalledWith('path/backup', svc.depositsString);
    });
  });

  describe('init', () => {
    const depositsPath = 'deposits path';

    test('creates a file handle, reads a file, creates blog posts and returns a new FileDepositService', async () => {
      const fsw = new FileServiceWriter('baseName', 'json');
      const readFileSpy = jest.spyOn(fsw, 'readFile');
      readFileSpy.mockImplementationOnce(async () =>
        JSON.stringify([deposit1JSON, deposit2JSON, deposit3JSON]),
      );

      const svc = await FileDepositService.init(depositsPath, {
        fileServiceWriter: fsw,
      });

      expect(svc.depositsList.length).toBe(3);

      expect(JSON.parse(JSON.stringify(svc.depositsList))).toEqual([
        deposit1.toJSON(),
        deposit2.toJSON(),
        deposit3.toJSON(),
      ]);
    });

    test('Only includes posts that are valid', async () => {
      const fsw = new FileServiceWriter('baseName', 'json');
      const readFileSpy = jest.spyOn(fsw, 'readFile');
      readFileSpy.mockImplementationOnce(async () =>
        JSON.stringify([deposit1JSON, deposit2JSON, deposit3JSON, {}]),
      );

      const svc = await FileDepositService.init(depositsPath, {
        fileServiceWriter: fsw,
      });

      expect((await svc).depositsList.length).toBe(3);
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

      const svc = await FileDepositService.init(depositsPath, {
        fileServiceWriter: fsw,
      });

      expect(rfSpy).toHaveBeenCalledTimes(1);
      expect(rfSpy).toHaveBeenCalledWith(depositsPath);

      expect(svc.depositsList.length).toBe(0);

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

      const svc = await FileDepositService.init(depositsPath, {
        fileServiceWriter: fsw,
      });

      expect(rfSpy).toHaveBeenCalledTimes(1);
      expect(rfSpy).toHaveBeenCalledWith(depositsPath);

      expect(svc.depositsList.length).toBe(0);

      expect(wbSpy).toHaveBeenCalledTimes(1);
      expect(wbSpy).toHaveBeenCalledWith(depositsPath, invalidData);
      expect(cfSpy).toHaveBeenCalledTimes(1);
    });
  });
});
