import { FileServiceWriter } from '@/src/utils/file_service_writer';
import { FilePurchasePricesService } from './purchase_prices.service.file';
import {
  PurchasePrice,
  PurchasePriceJSON,
} from '@/src/models/vice_bank/purchase_price';

const pp1JSON: PurchasePriceJSON = {
  id: 'id1',
  vbUserId: 'userId1',
  name: 'name1',
  price: 1,
};
const pp2JSON: PurchasePriceJSON = {
  id: 'id2',
  vbUserId: 'userId1',
  name: 'name2',
  price: 2,
};
const pp3JSON: PurchasePriceJSON = {
  id: 'id3',
  vbUserId: 'userId2',
  name: 'name3',
  price: 3,
};

const pp1 = PurchasePrice.fromJSON(pp1JSON);
const pp2 = PurchasePrice.fromJSON(pp2JSON);
const pp3 = PurchasePrice.fromJSON(pp3JSON);

const testError = 'test error 08awruofhsjk';

const logSpy = jest.spyOn(console, 'log');
logSpy.mockImplementation(() => {});
const errorSpy = jest.spyOn(console, 'error');
errorSpy.mockImplementation(() => {});

describe('FilePurchasePricesService', () => {
  describe('purchasePricesString', () => {
    test('returns a stringified JSON array', async () => {
      const fsw = new FileServiceWriter('baseName', 'json');

      const service = new FilePurchasePricesService(fsw, 'path', [
        pp1,
        pp2,
        pp3,
      ]);

      const str = service.purchasePricesString;

      const json = JSON.parse(str);
      expect(json).toEqual([pp1JSON, pp2JSON, pp3JSON]);
    });

    test('returns an empty array if there is no data', async () => {
      const fsw = new FileServiceWriter('baseName', 'json');

      const service = new FilePurchasePricesService(fsw, 'path', []);

      const str = service.purchasePricesString;

      const json = JSON.parse(str);
      expect(json).toEqual([]);
    });
  });

  describe('addPurchasePrice', () => {
    test('adds a users and calls writeToFile', async () => {
      const fsw = new FileServiceWriter('baseName', 'json');

      const service = new FilePurchasePricesService(fsw, 'path');
      const writeToFileSpy = jest.spyOn(service, 'writeToFile');
      writeToFileSpy.mockImplementationOnce(async () => {});

      expect(service.purchasePricesList.length).toBe(0);

      await service.addPurchasePrice(pp1);

      expect(service.purchasePricesList.length).toBe(1);
      expect(writeToFileSpy).toHaveBeenCalledTimes(1);
    });

    test('throws an error if writeToFiles throws an error', async () => {
      const fsw = new FileServiceWriter('baseName', 'json');

      const service = new FilePurchasePricesService(fsw, 'path');

      const testErr = 'Test Error';
      const writeToFileSpy = jest.spyOn(service, 'writeToFile');
      writeToFileSpy.mockImplementationOnce(() => {
        throw new Error(testErr);
      });

      await expect(() => service.addPurchasePrice(pp1)).rejects.toThrow();

      expect(writeToFileSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('updatePurchasePrice', () => {
    test('updates a user and calls writeToFile', async () => {
      const fsw = new FileServiceWriter('baseName', 'json');

      const service = new FilePurchasePricesService(fsw, 'path', [pp1]);
      const writeToFileSpy = jest.spyOn(service, 'writeToFile');
      writeToFileSpy.mockImplementationOnce(async () => {});

      const updatedUser = PurchasePrice.fromJSON({
        ...pp1.toJSON(),
        name: 'new name',
      });

      await service.updatePurchasePrice(updatedUser);

      expect(service.purchasePricesList.length).toBe(1);
      expect(service.purchasePricesList[0]).toBe(updatedUser);
      expect(writeToFileSpy).toHaveBeenCalledTimes(1);
    });

    test('throws an error if writeToFiles throws an error', async () => {
      const fsw = new FileServiceWriter('baseName', 'json');

      const service = new FilePurchasePricesService(fsw, 'path', [pp1]);

      const testErr = 'Test Error';
      const writeToFileSpy = jest.spyOn(service, 'writeToFile');
      writeToFileSpy.mockImplementationOnce(() => {
        throw new Error(testErr);
      });

      const updatedUser = PurchasePrice.fromJSON({
        ...pp1.toJSON(),
        name: 'new name',
      });

      await expect(() =>
        service.updatePurchasePrice(updatedUser),
      ).rejects.toThrow();

      expect(writeToFileSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('deletePurchasePrice', () => {
    test('deletes a user and calls writeToFile', async () => {
      const fsw = new FileServiceWriter('baseName', 'json');

      const service = new FilePurchasePricesService(fsw, 'path', [pp1]);
      const writeToFileSpy = jest.spyOn(service, 'writeToFile');
      writeToFileSpy.mockImplementationOnce(async () => {});

      await service.deletePurchasePrice(pp1.id);

      expect(service.purchasePricesList.length).toBe(0);
      expect(writeToFileSpy).toHaveBeenCalledTimes(1);
    });

    test('throws an error if writeToFiles throws an error', async () => {
      const fsw = new FileServiceWriter('baseName', 'json');

      const service = new FilePurchasePricesService(fsw, 'path', [pp1]);

      const testErr = 'Test Error';
      const writeToFileSpy = jest.spyOn(service, 'writeToFile');
      writeToFileSpy.mockImplementationOnce(() => {
        throw new Error(testErr);
      });

      await expect(() => service.deletePurchasePrice(pp1.id)).rejects.toThrow();

      expect(writeToFileSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('writeToFile', () => {
    test('gets the string, runs FileHandleService.writeToFile', async () => {
      const fsw = new FileServiceWriter('baseName', 'json');
      const wtfSpy = jest.spyOn(fsw, 'writeToFile');
      wtfSpy.mockImplementationOnce(async () => {});

      const svc = new FilePurchasePricesService(fsw, 'path', [pp1]);

      const str = svc.purchasePricesString;

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

      const svc = new FilePurchasePricesService(fsw, 'path', [pp1]);

      const str = svc.purchasePricesString;

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

      const svc = new FilePurchasePricesService(fsw, 'path', [pp1]);
      await svc.backup();

      expect(wbSpy).toHaveBeenCalledTimes(1);
      expect(wbSpy).toHaveBeenCalledWith(
        'path/backup',
        svc.purchasePricesString,
      );
    });

    test('throws an error if writeBackup throws an error', async () => {
      const fsw = new FileServiceWriter('baseName', 'json');

      const svc = new FilePurchasePricesService(fsw, 'path', [pp1]);

      const wbSpy = jest.spyOn(fsw, 'writeBackup');
      wbSpy.mockImplementationOnce(async () => {
        throw new Error(testError);
      });

      await expect(() => svc.backup()).rejects.toThrow(testError);

      expect(wbSpy).toHaveBeenCalledTimes(1);
      expect(wbSpy).toHaveBeenCalledWith(
        'path/backup',
        svc.purchasePricesString,
      );
    });
  });

  describe('init', () => {
    const purchasePath = 'purchase path';

    test('creates a file handle, reads a file, creates blog posts and returns a new FilePurchasePricesService', async () => {
      const fsw = new FileServiceWriter('baseName', 'json');
      const readFileSpy = jest.spyOn(fsw, 'readFile');
      readFileSpy.mockImplementationOnce(async () =>
        JSON.stringify([pp1JSON, pp2JSON, pp3JSON]),
      );

      const svc = await FilePurchasePricesService.init(purchasePath, {
        fileServiceWriter: fsw,
      });

      expect(svc.purchasePricesList.length).toBe(3);

      expect(JSON.parse(JSON.stringify(svc.purchasePricesList))).toEqual([
        pp1.toJSON(),
        pp2.toJSON(),
        pp3.toJSON(),
      ]);
    });

    test('Only includes posts that are valid', async () => {
      const fsw = new FileServiceWriter('baseName', 'json');
      const readFileSpy = jest.spyOn(fsw, 'readFile');
      readFileSpy.mockImplementationOnce(async () =>
        JSON.stringify([pp1JSON, pp2JSON, pp3JSON, {}]),
      );

      const svc = await FilePurchasePricesService.init(purchasePath, {
        fileServiceWriter: fsw,
      });

      expect((await svc).purchasePricesList.length).toBe(3);
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

      const svc = await FilePurchasePricesService.init(purchasePath, {
        fileServiceWriter: fsw,
      });

      expect(rfSpy).toHaveBeenCalledTimes(1);
      expect(rfSpy).toHaveBeenCalledWith(purchasePath);

      expect(svc.purchasePricesList.length).toBe(0);

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

      const svc = await FilePurchasePricesService.init(purchasePath, {
        fileServiceWriter: fsw,
      });

      expect(rfSpy).toHaveBeenCalledTimes(1);
      expect(rfSpy).toHaveBeenCalledWith(purchasePath);

      expect(svc.purchasePricesList.length).toBe(0);

      expect(wbSpy).toHaveBeenCalledTimes(1);
      expect(wbSpy).toHaveBeenCalledWith(purchasePath, invalidData);
      expect(cfSpy).toHaveBeenCalledTimes(1);
    });
  });
});
