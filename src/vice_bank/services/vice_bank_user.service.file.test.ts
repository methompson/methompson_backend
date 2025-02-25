import { join } from 'path';

import {
  ViceBankUser,
  ViceBankUserJSON,
} from '@/src/vice_bank/models/vice_bank_user';
import { FileViceBankUserService } from './vice_bank_user.service.file';
import { FileServiceWriter } from '@/src/utils/file_service_writer';

const userId = 'userId';

const user1JSON: ViceBankUserJSON = {
  id: 'id1',
  userId,
  name: 'name1',
  currentTokens: 1,
};
const user2JSON: ViceBankUserJSON = {
  id: 'id2',
  userId,
  name: 'name2',
  currentTokens: 2,
};
const user3JSON: ViceBankUserJSON = {
  id: 'id3',
  userId,
  name: 'name3',
  currentTokens: 3,
};

const user1 = ViceBankUser.fromJSON(user1JSON);
const user2 = ViceBankUser.fromJSON(user2JSON);
const user3 = ViceBankUser.fromJSON(user3JSON);

const testError = 'test error 42tawrgv';

const logSpy = jest.spyOn(console, 'log');
logSpy.mockImplementation(() => {});
const errorSpy = jest.spyOn(console, 'error');
errorSpy.mockImplementation(() => {});

const filePath = 'path/to/file';

describe('FileViceBankUserService', () => {
  describe('viceBankUsersString', () => {
    test('returns a stringified JSON array of users', async () => {
      const fsw = new FileServiceWriter('baseName', 'json');

      const service = new FileViceBankUserService(fsw, filePath, [
        user1,
        user2,
        user3,
      ]);

      const users = service.viceBankUsersString;

      const usersJson = JSON.parse(users);
      expect(usersJson).toEqual([user1JSON, user2JSON, user3JSON]);
    });

    test('returns an empty array if there are no users', async () => {
      const fsw = new FileServiceWriter('baseName', 'json');

      const service = new FileViceBankUserService(fsw, filePath);

      const users = service.viceBankUsersString;

      expect(users).toBe('[]');
    });
  });

  describe('addViceBankUser', () => {
    test('adds a users and calls writeToFile', async () => {
      const fsw = new FileServiceWriter('baseName', 'json');

      const service = new FileViceBankUserService(fsw, filePath);
      const writeToFileSpy = jest.spyOn(service, 'writeToFile');
      writeToFileSpy.mockImplementationOnce(async () => {});

      expect(service.viceBankUsersList.length).toBe(0);

      await service.addViceBankUser(user1);

      expect(service.viceBankUsersList.length).toBe(1);
      expect(writeToFileSpy).toHaveBeenCalledTimes(1);
    });

    test('throws an error if writeToFiles throws an error', async () => {
      const fsw = new FileServiceWriter('baseName', 'json');

      const service = new FileViceBankUserService(fsw, filePath);

      const testErr = 'Test Error';
      const writeToFileSpy = jest.spyOn(service, 'writeToFile');
      writeToFileSpy.mockImplementationOnce(() => {
        throw new Error(testErr);
      });

      await expect(() => service.addViceBankUser(user1)).rejects.toThrow();

      expect(writeToFileSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('updateViceBankUser', () => {
    test('updates a user and calls writeToFile', async () => {
      const fsw = new FileServiceWriter('baseName', 'json');

      const service = new FileViceBankUserService(fsw, filePath, [user1]);
      const writeToFileSpy = jest.spyOn(service, 'writeToFile');
      writeToFileSpy.mockImplementationOnce(async () => {});

      const updatedUser = ViceBankUser.fromJSON({
        ...user1.toJSON(),
        name: 'new name',
      });

      await service.updateViceBankUser(updatedUser);

      expect(service.viceBankUsersList.length).toBe(1);
      expect(service.viceBankUsersList[0]).toBe(updatedUser);
      expect(writeToFileSpy).toHaveBeenCalledTimes(1);
    });

    test('throws an error if writeToFiles throws an error', async () => {
      const fsw = new FileServiceWriter('baseName', 'json');

      const service = new FileViceBankUserService(fsw, filePath, [user1]);

      const testErr = 'Test Error';
      const writeToFileSpy = jest.spyOn(service, 'writeToFile');
      writeToFileSpy.mockImplementationOnce(() => {
        throw new Error(testErr);
      });

      const updatedUser = ViceBankUser.fromJSON({
        ...user1.toJSON(),
        name: 'new name',
      });

      await expect(() =>
        service.updateViceBankUser(updatedUser),
      ).rejects.toThrow();

      expect(writeToFileSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('deleteViceBankUser', () => {
    test('deletes a user and calls writeToFile', async () => {
      const fsw = new FileServiceWriter('baseName', 'json');

      const service = new FileViceBankUserService(fsw, filePath, [user1]);
      const writeToFileSpy = jest.spyOn(service, 'writeToFile');
      writeToFileSpy.mockImplementationOnce(async () => {});

      await service.deleteViceBankUser(user1.id);

      expect(service.viceBankUsersList.length).toBe(0);
      expect(writeToFileSpy).toHaveBeenCalledTimes(1);
    });

    test('throws an error if writeToFiles throws an error', async () => {
      const fsw = new FileServiceWriter('baseName', 'json');

      const service = new FileViceBankUserService(fsw, filePath, [user1]);

      const testErr = 'Test Error';
      const writeToFileSpy = jest.spyOn(service, 'writeToFile');
      writeToFileSpy.mockImplementationOnce(() => {
        throw new Error(testErr);
      });

      await expect(() =>
        service.deleteViceBankUser(user1.id),
      ).rejects.toThrow();

      expect(writeToFileSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('writeToFile', () => {
    test('gets the string, runs FileHandleService.writeToFile', async () => {
      const fsw = new FileServiceWriter('baseName', 'json');
      const wtfSpy = jest.spyOn(fsw, 'writeToFile');
      wtfSpy.mockImplementationOnce(async () => {});

      const svc = new FileViceBankUserService(fsw, filePath, [user1]);

      const str = svc.viceBankUsersString;

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

      const svc = new FileViceBankUserService(fsw, filePath, [user1]);

      await expect(() => svc.writeToFile()).rejects.toThrow(testError);
    });
  });

  describe('backup', () => {
    test('runs writeBackup with expected values', async () => {
      const fsw = new FileServiceWriter('baseName', 'json');

      const wbSpy = jest.spyOn(fsw, 'writeBackup');
      wbSpy.mockImplementationOnce(async () => {});

      const svc = new FileViceBankUserService(fsw, filePath, [user1]);
      await svc.backup();

      expect(wbSpy).toHaveBeenCalledTimes(1);
      expect(wbSpy).toHaveBeenCalledWith(
        join(filePath, 'backup'),
        svc.viceBankUsersString,
      );
    });

    test('throws an error if writeBackup throws an error', async () => {
      const fsw = new FileServiceWriter('baseName', 'json');

      const svc = new FileViceBankUserService(fsw, filePath, [user1]);

      const wbSpy = jest.spyOn(fsw, 'writeBackup');
      wbSpy.mockImplementationOnce(async () => {
        throw new Error(testError);
      });

      await expect(() => svc.backup()).rejects.toThrow(testError);

      expect(wbSpy).toHaveBeenCalledTimes(1);
      expect(wbSpy).toHaveBeenCalledWith(
        join(filePath, 'backup'),
        svc.viceBankUsersString,
      );
    });
  });

  describe('init', () => {
    const purchasePath = 'purchase path';

    test('creates a file handle, reads a file, creates ViceBankUser objects and returns a new FileViceBankUserService', async () => {
      const fsw = new FileServiceWriter('baseName', 'json');
      const readFileSpy = jest.spyOn(fsw, 'readFile');
      readFileSpy.mockImplementationOnce(async () =>
        JSON.stringify([user1JSON, user2JSON, user3JSON]),
      );

      const svc = await FileViceBankUserService.init(purchasePath, {
        fileServiceWriter: fsw,
      });

      expect(svc.viceBankUsersList.length).toBe(3);

      expect(JSON.parse(JSON.stringify(svc.viceBankUsersList))).toEqual([
        user1.toJSON(),
        user2.toJSON(),
        user3.toJSON(),
      ]);
    });

    test('Only includes users that are valid', async () => {
      const fsw = new FileServiceWriter('baseName', 'json');
      const readFileSpy = jest.spyOn(fsw, 'readFile');
      readFileSpy.mockImplementationOnce(async () =>
        JSON.stringify([user1JSON, user2JSON, user3JSON, {}]),
      );

      const svc = await FileViceBankUserService.init(purchasePath, {
        fileServiceWriter: fsw,
      });

      expect((await svc).viceBankUsersList.length).toBe(3);
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

      const svc = await FileViceBankUserService.init(purchasePath, {
        fileServiceWriter: fsw,
      });

      expect(rfSpy).toHaveBeenCalledTimes(1);
      expect(rfSpy).toHaveBeenCalledWith(purchasePath);

      expect(svc.viceBankUsersList.length).toBe(0);

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

      const svc = await FileViceBankUserService.init(purchasePath, {
        fileServiceWriter: fsw,
      });

      expect(rfSpy).toHaveBeenCalledTimes(1);
      expect(rfSpy).toHaveBeenCalledWith(purchasePath);

      expect(svc.viceBankUsersList.length).toBe(0);

      expect(wbSpy).toHaveBeenCalledTimes(1);
      expect(wbSpy).toHaveBeenCalledWith(purchasePath, invalidData);
      expect(cfSpy).toHaveBeenCalledTimes(1);
    });
  });
});
