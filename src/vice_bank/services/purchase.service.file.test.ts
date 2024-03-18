import { FilePurchaseService } from './purchase.service.file';
import { Purchase, PurchaseJSON } from '@/src/models/vice_bank/purchase';
import { FileServiceWriter } from '@/src/utils/file_service_writer';

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
  describe('purchasesString', () => {
    test('returns a stringified JSON array', async () => {
      const fsw = new FileServiceWriter('baseName', 'json');

      const service = new FilePurchaseService(fsw, 'path', [
        purchase1,
        purchase2,
        purchase3,
      ]);

      const str = service.purchasesString;

      const json = JSON.parse(str);
      expect(json).toEqual([p1JSON, p2JSON, p3JSON]);
    });

    test('returns an empty array if there is no data', async () => {
      const fsw = new FileServiceWriter('baseName', 'json');

      const service = new FilePurchaseService(fsw, 'path', []);

      const str = service.purchasesString;

      const json = JSON.parse(str);
      expect(json).toEqual([]);
    });
  });

  describe('addPurchase', () => {
    test('adds a users and calls writeToFile', async () => {
      const fsw = new FileServiceWriter('baseName', 'json');

      const service = new FilePurchaseService(fsw, 'path');
      const writeToFileSpy = jest.spyOn(service, 'writeToFile');
      writeToFileSpy.mockImplementationOnce(async () => {});

      expect(service.purchasesList.length).toBe(0);

      await service.addPurchase(purchase1);

      expect(service.purchasesList.length).toBe(1);
      expect(writeToFileSpy).toHaveBeenCalledTimes(1);
    });

    test('throws an error if writeToFiles throws an error', async () => {
      const fsw = new FileServiceWriter('baseName', 'json');

      const service = new FilePurchaseService(fsw, 'path');

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
      const fsw = new FileServiceWriter('baseName', 'json');

      const service = new FilePurchaseService(fsw, 'path', [purchase1]);
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
      const fsw = new FileServiceWriter('baseName', 'json');

      const service = new FilePurchaseService(fsw, 'path', [purchase1]);

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
      const fsw = new FileServiceWriter('baseName', 'json');

      const service = new FilePurchaseService(fsw, 'path', [purchase1]);
      const writeToFileSpy = jest.spyOn(service, 'writeToFile');
      writeToFileSpy.mockImplementationOnce(async () => {});

      await service.deletePurchase(purchase1.id);

      expect(service.purchasesList.length).toBe(0);
      expect(writeToFileSpy).toHaveBeenCalledTimes(1);
    });

    test('throws an error if writeToFiles throws an error', async () => {
      const fsw = new FileServiceWriter('baseName', 'json');

      const service = new FilePurchaseService(fsw, 'path', [purchase1]);

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
    test('gets the string, runs FileHandleService.writeToFile', async () => {
      const fsw = new FileServiceWriter('baseName', 'json');
      const wtfSpy = jest.spyOn(fsw, 'writeToFile');
      wtfSpy.mockImplementationOnce(async () => {});

      const svc = new FilePurchaseService(fsw, 'path', [purchase1]);

      const str = svc.purchasesString;

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

      const svc = new FilePurchaseService(fsw, 'path', [purchase1]);

      await expect(() => svc.writeToFile()).rejects.toThrow(testError);
    });
  });

  describe('backup', () => {
    test('runs writeBackup with expected values', async () => {
      const fsw = new FileServiceWriter('baseName', 'json');

      const wbSpy = jest.spyOn(fsw, 'writeBackup');
      wbSpy.mockImplementationOnce(async () => {});

      const svc = new FilePurchaseService(fsw, 'path', [purchase1]);
      await svc.backup();

      expect(wbSpy).toHaveBeenCalledTimes(1);
      expect(wbSpy).toHaveBeenCalledWith('path/backup', svc.purchasesString);
    });

    test('throws an error if writeBackup throws an error', async () => {
      const fsw = new FileServiceWriter('baseName', 'json');

      const svc = new FilePurchaseService(fsw, 'path', [purchase1]);

      const wbSpy = jest.spyOn(fsw, 'writeBackup');
      wbSpy.mockImplementationOnce(async () => {
        throw new Error(testError);
      });

      await expect(() => svc.backup()).rejects.toThrow(testError);

      expect(wbSpy).toHaveBeenCalledTimes(1);
      expect(wbSpy).toHaveBeenCalledWith('path/backup', svc.purchasesString);
    });
  });

  describe('init', () => {
    const purchasePath = 'purchase path';

    test('creates a file handle, reads a file, creates blog posts and returns a new FilePurchaseService', async () => {
      const fsw = new FileServiceWriter('baseName', 'json');
      const readFileSpy = jest.spyOn(fsw, 'readFile');
      readFileSpy.mockImplementationOnce(async () =>
        JSON.stringify([p1JSON, p2JSON, p3JSON]),
      );

      const svc = await FilePurchaseService.init(purchasePath, {
        fileServiceWriter: fsw,
      });

      expect(svc.purchasesList.length).toBe(3);

      expect(JSON.parse(JSON.stringify(svc.purchasesList))).toEqual([
        purchase1.toJSON(),
        purchase2.toJSON(),
        purchase3.toJSON(),
      ]);
    });

    test('Only includes posts that are valid', async () => {
      const fsw = new FileServiceWriter('baseName', 'json');
      const readFileSpy = jest.spyOn(fsw, 'readFile');
      readFileSpy.mockImplementationOnce(async () =>
        JSON.stringify([p1JSON, p2JSON, p3JSON, {}]),
      );

      const svc = await FilePurchaseService.init(purchasePath, {
        fileServiceWriter: fsw,
      });

      expect((await svc).purchasesList.length).toBe(3);
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

      const svc = await FilePurchaseService.init(purchasePath, {
        fileServiceWriter: fsw,
      });

      expect(rfSpy).toHaveBeenCalledTimes(1);
      expect(rfSpy).toHaveBeenCalledWith(purchasePath);

      expect(svc.purchasesList.length).toBe(0);

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

      const svc = await FilePurchaseService.init(purchasePath, {
        fileServiceWriter: fsw,
      });

      expect(rfSpy).toHaveBeenCalledTimes(1);
      expect(rfSpy).toHaveBeenCalledWith(purchasePath);

      expect(svc.purchasesList.length).toBe(0);

      expect(wbSpy).toHaveBeenCalledTimes(1);
      expect(wbSpy).toHaveBeenCalledWith(purchasePath, invalidData);
      expect(cfSpy).toHaveBeenCalledTimes(1);
    });
  });
});
