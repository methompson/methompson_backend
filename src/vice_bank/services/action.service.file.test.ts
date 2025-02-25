import { join } from 'path';

import { FileActionService } from './action.service.file';
import { Action, ActionJSON } from '@/src/vice_bank/models/action';
import { Deposit, DepositJSON } from '@/src/vice_bank/models/deposit';
import { FileServiceWriter } from '@/src/utils/file_service_writer';

const vbUserId1 = 'vbUserId1';
const vbUserId2 = 'vbUserId2';

const actionJSON1: ActionJSON = {
  id: 'id1',
  vbUserId: vbUserId1,
  name: 'name1',
  conversionUnit: 'conversionUnit1',
  depositsPer: 1,
  tokensPer: 1,
  minDeposit: 1,
};
const actionJSON2: ActionJSON = {
  id: 'id2',
  vbUserId: vbUserId1,
  name: 'name2',
  conversionUnit: 'conversionUnit2',
  depositsPer: 2,
  tokensPer: 2,
  minDeposit: 2,
};
const actionJSON3: ActionJSON = {
  id: 'id3',
  vbUserId: vbUserId2,
  name: 'name3',
  conversionUnit: 'conversionUnit3',
  depositsPer: 3,
  tokensPer: 3,
  minDeposit: 3,
};

const action1 = Action.fromJSON(actionJSON1);
const action2 = Action.fromJSON(actionJSON2);
const action3 = Action.fromJSON(actionJSON3);

const deposit1JSON: DepositJSON = {
  id: 'id1',
  vbUserId: vbUserId1,
  date: '2024-01-01T00:00:00.000-06:00',
  depositQuantity: 1,
  conversionRate: 1,
  actionId: action1.id,
  actionName: action1.name,
  conversionUnit: 'minutes',
};
const deposit2JSON: DepositJSON = {
  id: 'id2',
  vbUserId: vbUserId1,
  date: '2024-01-12T00:00:00.000-06:00',
  depositQuantity: 1,
  conversionRate: 1,
  actionId: action1.id,
  actionName: action1.name,
  conversionUnit: 'minutes',
};
const deposit3JSON: DepositJSON = {
  id: 'id3',
  vbUserId: vbUserId2,
  date: '2024-02-01T00:00:00.000-06:00',
  depositQuantity: 1,
  conversionRate: 1,
  actionId: action3.id,
  actionName: action3.name,
  conversionUnit: 'minutes',
};

const deposit1 = Deposit.fromJSON(deposit1JSON);
const deposit2 = Deposit.fromJSON(deposit2JSON);
const deposit3 = Deposit.fromJSON(deposit3JSON);

const testError = 'test error aiorwhsfjldn';

const logSpy = jest.spyOn(console, 'log');
logSpy.mockImplementation(() => {});
const errorSpy = jest.spyOn(console, 'error');
errorSpy.mockImplementation(() => {});

const filePath = 'path/to/file';

describe('FileActionService', () => {
  describe('actionsString', () => {
    test('returns a stringified JSON array', async () => {
      const fsw = new FileServiceWriter('baseName', 'json');

      const service = new FileActionService(fsw, filePath, {
        actions: [action1, action2, action3],
        deposits: [deposit1, deposit2, deposit3],
      });

      const str = service.actionsString;

      const json = JSON.parse(str);
      expect(json).toEqual({
        actions: [actionJSON1, actionJSON2, actionJSON3],
        deposits: [deposit1JSON, deposit2JSON, deposit3JSON],
      });
    });

    test('returns an empty array if there is no data', async () => {
      const fsw = new FileServiceWriter('baseName', 'json');

      const service = new FileActionService(fsw, filePath, { actions: [] });

      const str = service.actionsString;

      const json = JSON.parse(str);
      expect(json).toEqual({ actions: [], deposits: [] });
    });
  });

  describe('addAction', () => {
    test('adds a users and calls writeToFile', async () => {
      const fsw = new FileServiceWriter('baseName', 'json');
      const service = new FileActionService(fsw, filePath);
      const writeToFileSpy = jest.spyOn(service, 'writeToFile');
      writeToFileSpy.mockImplementationOnce(async () => {});

      expect(service.actionsList.length).toBe(0);

      await service.addAction(action1);

      expect(service.actionsList.length).toBe(1);
      expect(writeToFileSpy).toHaveBeenCalledTimes(1);
    });

    test('throws an error if writeToFiles throws an error', async () => {
      const fsw = new FileServiceWriter('baseName', 'json');

      const service = new FileActionService(fsw, filePath);

      const testErr = 'Test Error';
      const writeToFileSpy = jest.spyOn(service, 'writeToFile');
      writeToFileSpy.mockImplementationOnce(() => {
        throw new Error(testErr);
      });

      await expect(() => service.addAction(action1)).rejects.toThrow();

      expect(writeToFileSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('updateAction', () => {
    test('updates a user and calls writeToFile', async () => {
      const fsw = new FileServiceWriter('baseName', 'json');

      const service = new FileActionService(fsw, filePath, {
        actions: [action1],
      });
      const writeToFileSpy = jest.spyOn(service, 'writeToFile');
      writeToFileSpy.mockImplementationOnce(async () => {});

      const updatedUser = Action.fromJSON({
        ...action1.toJSON(),
        name: 'new name',
      });

      await service.updateAction(updatedUser);

      expect(service.actionsList.length).toBe(1);
      expect(service.actionsList[0]).toBe(updatedUser);
      expect(writeToFileSpy).toHaveBeenCalledTimes(1);
    });

    test('throws an error if writeToFiles throws an error', async () => {
      const fsw = new FileServiceWriter('baseName', 'json');

      const service = new FileActionService(fsw, filePath, {
        actions: [action1],
      });

      const testErr = 'Test Error';
      const writeToFileSpy = jest.spyOn(service, 'writeToFile');
      writeToFileSpy.mockImplementationOnce(() => {
        throw new Error(testErr);
      });

      const updatedUser = Action.fromJSON({
        ...action1.toJSON(),
        name: 'new name',
      });

      await expect(() => service.updateAction(updatedUser)).rejects.toThrow();

      expect(writeToFileSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('deleteAction', () => {
    test('deletes a user and calls writeToFile', async () => {
      const fsw = new FileServiceWriter('baseName', 'json');

      const service = new FileActionService(fsw, filePath, {
        actions: [action1],
      });
      const writeToFileSpy = jest.spyOn(service, 'writeToFile');
      writeToFileSpy.mockImplementationOnce(async () => {});

      await service.deleteAction(action1.id);

      expect(service.actionsList.length).toBe(0);
      expect(writeToFileSpy).toHaveBeenCalledTimes(1);
    });

    test('throws an error if writeToFiles throws an error', async () => {
      const fsw = new FileServiceWriter('baseName', 'json');

      const service = new FileActionService(fsw, filePath, {
        actions: [action1],
      });

      const testErr = 'Test Error';
      const writeToFileSpy = jest.spyOn(service, 'writeToFile');
      writeToFileSpy.mockImplementationOnce(() => {
        throw new Error(testErr);
      });

      await expect(() => service.deleteAction(action1.id)).rejects.toThrow();

      expect(writeToFileSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('writeToFile', () => {
    test('gets the string, runs truncate and writes to the file handle', async () => {
      const fsw = new FileServiceWriter('baseName', 'json');
      const wtfSpy = jest.spyOn(fsw, 'writeToFile');
      wtfSpy.mockImplementationOnce(async () => {});

      const svc = new FileActionService(fsw, filePath, { actions: [action1] });

      const str = svc.actionsString;

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

      const svc = new FileActionService(fsw, filePath, { actions: [action1] });

      const str = svc.actionsString;

      await expect(() => svc.writeToFile()).rejects.toThrow(testError);

      expect(wtfSpy).toHaveBeenCalledTimes(1);
      expect(wtfSpy).toHaveBeenCalledWith(filePath, str);
    });
  });

  describe('addDeposit', () => {
    test('adds a user and calls writeToFile', async () => {
      const fsw = new FileServiceWriter('baseName', 'json');

      const service = new FileActionService(fsw, filePath);
      const writeToFileSpy = jest.spyOn(service, 'writeToFile');
      writeToFileSpy.mockImplementationOnce(async () => {});

      expect(service.depositsList.length).toBe(0);

      await service.addDeposit(deposit1);

      expect(service.depositsList.length).toBe(1);
      expect(writeToFileSpy).toHaveBeenCalledTimes(1);
    });

    test('throws an error if writeToFiles throws an error', async () => {
      const fsw = new FileServiceWriter('baseName', 'json');

      const service = new FileActionService(fsw, filePath);

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

      const service = new FileActionService(fsw, filePath, {
        deposits: [deposit1],
      });
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

      const service = new FileActionService(fsw, filePath, {
        deposits: [deposit1],
      });

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

      const service = new FileActionService(fsw, filePath, {
        deposits: [deposit1],
      });
      const writeToFileSpy = jest.spyOn(service, 'writeToFile');
      writeToFileSpy.mockImplementationOnce(async () => {});

      await service.deleteDeposit(deposit1.id);

      expect(service.depositsList.length).toBe(0);
      expect(writeToFileSpy).toHaveBeenCalledTimes(1);
    });

    test('throws an error if writeToFiles throws an error', async () => {
      const fsw = new FileServiceWriter('baseName', 'json');

      const service = new FileActionService(fsw, filePath, {
        deposits: [deposit1],
      });

      const testErr = 'Test Error';
      const writeToFileSpy = jest.spyOn(service, 'writeToFile');
      writeToFileSpy.mockImplementationOnce(() => {
        throw new Error(testErr);
      });

      await expect(() => service.deleteDeposit(deposit1.id)).rejects.toThrow();

      expect(writeToFileSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('backup', () => {
    test('runs writeBackup with expected values', async () => {
      const fsw = new FileServiceWriter('baseName', 'json');
      const writeBackupSpy = jest.spyOn(fsw, 'writeBackup');
      writeBackupSpy.mockImplementationOnce(async () => {});

      const svc = new FileActionService(fsw, filePath, {
        actions: [action1],
        deposits: [deposit1],
      });

      const str = svc.actionsString;

      await svc.backup();

      expect(writeBackupSpy).toHaveBeenCalledTimes(1);
      expect(writeBackupSpy).toHaveBeenCalledWith(
        join(filePath, 'backup'),
        str,
      );
    });

    test('throws an error if writeBackup throws an error', async () => {
      const fsw = new FileServiceWriter('baseName', 'json');

      const svc = new FileActionService(fsw, filePath, {
        deposits: [deposit1],
      });

      const wbSpy = jest.spyOn(fsw, 'writeBackup');
      wbSpy.mockImplementationOnce(async () => {
        throw new Error(testError);
      });

      await expect(() => svc.backup()).rejects.toThrow(testError);

      expect(wbSpy).toHaveBeenCalledTimes(1);
      expect(wbSpy).toHaveBeenCalledWith(
        join(filePath, 'backup'),
        svc.actionsString,
      );
    });
  });

  describe('init', () => {
    const conversionsPath = 'purchase path';

    test('creates a file handle, reads a file, creates deposits and actions and returns a new FileActionService', async () => {
      const fsw = new FileServiceWriter('baseName', 'json');
      const readFileSpy = jest.spyOn(fsw, 'readFile');
      readFileSpy.mockImplementationOnce(async () =>
        JSON.stringify({
          actions: [actionJSON1, actionJSON2, actionJSON3],
          deposits: [deposit1JSON, deposit2JSON, deposit3JSON],
        }),
      );

      const svc = await FileActionService.init(conversionsPath, {
        fileServiceWriter: fsw,
      });

      expect(svc.actionsList.length).toBe(3);

      expect(JSON.parse(JSON.stringify(svc.actionsList))).toEqual([
        action1.toJSON(),
        action2.toJSON(),
        action3.toJSON(),
      ]);

      expect(svc.depositsList.length).toBe(3);

      expect(JSON.parse(JSON.stringify(svc.depositsList))).toEqual([
        deposit1.toJSON(),
        deposit2.toJSON(),
        deposit3.toJSON(),
      ]);
    });

    test('actionString can be piped into init and get the same data', async () => {
      const fsw = new FileServiceWriter('baseName', 'json');

      const svc1 = new FileActionService(fsw, filePath, {
        actions: [action1, action2, action3],
        deposits: [deposit1, deposit2, deposit3],
      });

      const readFileSpy = jest.spyOn(fsw, 'readFile');
      readFileSpy.mockImplementationOnce(async () => svc1.actionsString);

      const svc2 = await FileActionService.init(conversionsPath, {
        fileServiceWriter: fsw,
      });

      expect(JSON.parse(JSON.stringify(svc1.actionsString))).toEqual(
        JSON.parse(JSON.stringify(svc2.actionsString)),
      );
    });

    test('Only includes posts that are valid', async () => {
      const fsw = new FileServiceWriter('baseName', 'json');
      const readFileSpy = jest.spyOn(fsw, 'readFile');
      readFileSpy.mockImplementationOnce(async () =>
        JSON.stringify({
          actions: [actionJSON1, actionJSON2, actionJSON3, {}],
          deposits: [deposit1JSON, deposit2JSON, deposit3JSON, {}],
        }),
      );

      const svc = await FileActionService.init(conversionsPath, {
        fileServiceWriter: fsw,
      });

      expect((await svc).actionsList.length).toBe(3);
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

      const svc = await FileActionService.init(conversionsPath, {
        fileServiceWriter: fsw,
      });

      expect(rfSpy).toHaveBeenCalledTimes(1);
      expect(rfSpy).toHaveBeenCalledWith(conversionsPath);

      expect(svc.actionsList.length).toBe(0);

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

      const svc = await FileActionService.init(conversionsPath, {
        fileServiceWriter: fsw,
      });

      const backupPath = join(conversionsPath, 'backup');

      expect(rfSpy).toHaveBeenCalledTimes(1);
      expect(rfSpy).toHaveBeenCalledWith(conversionsPath);

      expect(svc.actionsList.length).toBe(0);

      expect(wbSpy).toHaveBeenCalledTimes(1);
      expect(wbSpy).toHaveBeenCalledWith(backupPath, invalidData);
      expect(cfSpy).toHaveBeenCalledTimes(1);
    });
  });
});
