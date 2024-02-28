import {
  ActionBankUser,
  ActionBankUserJSON,
} from '@/src/models/action_bank/action_bank_user';
import { InMemoryActionBankUserService } from '@/src/action_bank/services/action_bank_user.service.memory';
import { ActionBankUserController } from './action_bank_user.controller';
import { ConsoleLoggerInstanceService } from '@/src/logger/logger.console.service';
import { LoggerService } from '@/src/logger/logger.service';
import { Request } from 'express';

const user1JSON: ActionBankUserJSON = {
  id: 'id1',
  name: 'name1',
  currentTokens: 1,
};
const user2JSON: ActionBankUserJSON = {
  id: 'id2',
  name: 'name2',
  currentTokens: 2,
};
const user3JSON: ActionBankUserJSON = {
  id: 'id3',
  name: 'name3',
  currentTokens: 3,
};

const user1 = ActionBankUser.fromJSON(user1JSON);
const user2 = ActionBankUser.fromJSON(user2JSON);
const user3 = ActionBankUser.fromJSON(user3JSON);

describe('ActionBankUserController', () => {
  describe('getUsers', () => {
    test('gets users from the actionBankUserService', async () => {
      const service = new InMemoryActionBankUserService([user1, user2, user3]);
      const loggerService = new LoggerService([
        new ConsoleLoggerInstanceService(),
      ]);

      const controller = new ActionBankUserController(service, loggerService);

      const req = {
        query: {
          page: '1',
          pagination: '10',
        },
      } as unknown as Request;

      const users = await controller.getUsers(req);
      expect(users).toEqual([user1, user2, user3]);
    });

    test("uses page and pagination if it's in the request", async () => {
      const service = new InMemoryActionBankUserService([user1, user2, user3]);
      const loggerService = new LoggerService([
        new ConsoleLoggerInstanceService(),
      ]);

      const controller = new ActionBankUserController(service, loggerService);

      const req1 = {
        query: {
          page: '1',
          pagination: '2',
        },
      } as unknown as Request;

      const result1 = await controller.getUsers(req1);
      expect(result1).toEqual([user1, user2]);

      const req2 = {
        query: {
          page: '2',
          pagination: '2',
        },
      } as unknown as Request;

      const result2 = await controller.getUsers(req2);
      expect(result2).toEqual([user3]);

      const req3 = {
        query: {
          page: '3',
          pagination: '2',
        },
      } as unknown as Request;

      const result3 = await controller.getUsers(req3);
      expect(result3).toEqual([]);
    });

    test('throws an error if the actionBankUserService throws an error', async () => {
      const service = new InMemoryActionBankUserService([user1, user2, user3]);
      const loggerService = new LoggerService([
        new ConsoleLoggerInstanceService(),
      ]);

      const controller = new ActionBankUserController(service, loggerService);

      const req = {
        query: {
          page: '1',
          pagination: '10',
        },
      } as unknown as Request;

      jest
        .spyOn(service, 'getActionBankUsers')
        .mockRejectedValue(new Error('testError'));

      await expect(() => controller.getUsers(req)).rejects.toThrow(
        'Server Error',
      );
    });
  });

  describe('getUser', () => {
    test('gets a user from the actionBankUserService', async () => {
      const service = new InMemoryActionBankUserService([user1, user2, user3]);
      const loggerService = new LoggerService([
        new ConsoleLoggerInstanceService(),
      ]);

      const controller = new ActionBankUserController(service, loggerService);

      const req = {
        params: {
          userId: user1.id,
        },
      } as unknown as Request;

      const user = await controller.getUser(req);
      expect(user).toEqual(user1);
    });

    test('throws an error if the actionBankUserService throws an error', async () => {
      const service = new InMemoryActionBankUserService([user1, user2, user3]);
      const loggerService = new LoggerService([
        new ConsoleLoggerInstanceService(),
      ]);

      const controller = new ActionBankUserController(service, loggerService);

      const req = {
        params: {
          userId: user1.id,
        },
      } as unknown as Request;

      jest
        .spyOn(service, 'getActionBankUsers')
        .mockRejectedValue(new Error('testError'));

      await expect(() => controller.getUser(req)).rejects.toThrow(
        'Server Error',
      );
    });

    test('throws an error if more than one user is found', async () => {
      const service = new InMemoryActionBankUserService([user1, user2, user3]);
      const loggerService = new LoggerService([
        new ConsoleLoggerInstanceService(),
      ]);

      const controller = new ActionBankUserController(service, loggerService);

      const req = {
        params: {
          userId: user1.id,
        },
      } as unknown as Request;

      jest
        .spyOn(service, 'getActionBankUsers')
        .mockResolvedValue([user1, user2]);

      await expect(() => controller.getUser(req)).rejects.toThrow(
        'Server Error',
      );
    });

    test('throws an error if the user is not found', async () => {
      const service = new InMemoryActionBankUserService([]);
      const loggerService = new LoggerService([
        new ConsoleLoggerInstanceService(),
      ]);

      const controller = new ActionBankUserController(service, loggerService);

      const req = {
        params: {
          userId: user1.id,
        },
      } as unknown as Request;

      await expect(() => controller.getUser(req)).rejects.toThrow('Not Found');
    });
  });

  describe('addUser', () => {
    test('adds a user and returns the user with the new id', async () => {
      const service = new InMemoryActionBankUserService([]);
      const loggerService = new LoggerService([
        new ConsoleLoggerInstanceService(),
      ]);

      const controller = new ActionBankUserController(service, loggerService);

      const req = {
        body: {
          user: { ...user1JSON },
        },
      } as unknown as Request;

      jest.spyOn(service, 'addActionBankUser').mockResolvedValue(user1);

      const result = await controller.addUser(req);
      expect(result).toBe(user1);
    });

    test('throws an error if the actionBankUserService throws an error', async () => {
      const service = new InMemoryActionBankUserService([]);
      const loggerService = new LoggerService([
        new ConsoleLoggerInstanceService(),
      ]);

      const controller = new ActionBankUserController(service, loggerService);

      const req = {
        body: {
          user: { ...user1JSON },
        },
      } as unknown as Request;

      jest
        .spyOn(service, 'addActionBankUser')
        .mockRejectedValue(new Error('testError'));

      expect(() => controller.addUser(req)).rejects.toThrow('Server Error');
    });

    test('throws an error if the body is invalid', async () => {
      const service = new InMemoryActionBankUserService([]);
      const loggerService = new LoggerService([
        new ConsoleLoggerInstanceService(),
      ]);

      const controller = new ActionBankUserController(service, loggerService);

      const req = {} as unknown as Request;

      await expect(() => controller.addUser(req)).rejects.toThrow(
        'Invalid Input',
      );
    });

    test('throws an error if the user input is invalid', async () => {
      const service = new InMemoryActionBankUserService([]);
      const loggerService = new LoggerService([
        new ConsoleLoggerInstanceService(),
      ]);

      const controller = new ActionBankUserController(service, loggerService);

      const req = {
        body: {
          user: {},
        },
      } as unknown as Request;

      await expect(() => controller.addUser(req)).rejects.toThrow(
        'Invalid Input',
      );
    });
  });

  describe('updateUser', () => {
    test('updates a user and returns the old user', async () => {
      const service = new InMemoryActionBankUserService([user1]);
      const loggerService = new LoggerService([
        new ConsoleLoggerInstanceService(),
      ]);

      const controller = new ActionBankUserController(service, loggerService);

      const user1Update = {
        ...user1.toJSON(),
        name: 'new name',
      };

      const req = {
        body: {
          user: { ...user1Update },
        },
      } as unknown as Request;

      const result = await controller.updateUser(req);

      expect(result).toBe(user1);
      expect(service.actionBankUsersList[0]?.toJSON()).toEqual(user1Update);
    });

    test('throws an error if the actionBankUserService throws an error', async () => {
      const service = new InMemoryActionBankUserService([user1]);
      const loggerService = new LoggerService([
        new ConsoleLoggerInstanceService(),
      ]);

      const controller = new ActionBankUserController(service, loggerService);

      const user1Update = {
        ...user1.toJSON(),
        name: 'new name',
      };

      const req = {
        body: {
          user: { ...user1Update },
        },
      } as unknown as Request;

      jest
        .spyOn(service, 'updateActionBankUser')
        .mockRejectedValue(new Error('testError'));

      expect(() => controller.updateUser(req)).rejects.toThrow('Server Error');
    });

    test('throws an error if the body is invalid', async () => {
      const service = new InMemoryActionBankUserService([user1]);
      const loggerService = new LoggerService([
        new ConsoleLoggerInstanceService(),
      ]);

      const controller = new ActionBankUserController(service, loggerService);

      const req = {} as unknown as Request;

      await expect(() => controller.updateUser(req)).rejects.toThrow(
        'Invalid Input',
      );
    });

    test('throws an error if the user input is invalid', async () => {
      const service = new InMemoryActionBankUserService([user1]);
      const loggerService = new LoggerService([
        new ConsoleLoggerInstanceService(),
      ]);

      const controller = new ActionBankUserController(service, loggerService);

      const req = {
        body: {
          user: {},
        },
      } as unknown as Request;

      await expect(() => controller.updateUser(req)).rejects.toThrow(
        'Invalid Input',
      );
    });
  });

  describe('deleteUser', () => {
    test('deletes a user and returns the deleted user', async () => {
      const service = new InMemoryActionBankUserService([user1]);
      const loggerService = new LoggerService([
        new ConsoleLoggerInstanceService(),
      ]);

      const controller = new ActionBankUserController(service, loggerService);

      const req = {
        body: {
          userId: user1.id,
        },
      } as unknown as Request;

      const result = await controller.deleteUser(req);
      expect(result).toBe(user1);
      expect(service.actionBankUsersList.length).toBe(0);
    });

    test('throws an error if the actionBankUserService throws an error', async () => {
      const service = new InMemoryActionBankUserService([user1]);
      const loggerService = new LoggerService([
        new ConsoleLoggerInstanceService(),
      ]);

      const controller = new ActionBankUserController(service, loggerService);

      const req = {
        body: {
          userId: user1.id,
        },
      } as unknown as Request;

      jest
        .spyOn(service, 'deleteActionBankUser')
        .mockRejectedValue(new Error('testError'));

      expect(() => controller.deleteUser(req)).rejects.toThrow('Server Error');
    });

    test('throws an error if the user is not found', async () => {
      const service = new InMemoryActionBankUserService([]);
      const loggerService = new LoggerService([
        new ConsoleLoggerInstanceService(),
      ]);

      const controller = new ActionBankUserController(service, loggerService);

      const req = {
        body: {
          userId: user1.id,
        },
      } as unknown as Request;

      await expect(() => controller.deleteUser(req)).rejects.toThrow(
        'Server Error',
      );
    });

    test('throws an error if the body is invalid', async () => {
      const service = new InMemoryActionBankUserService([]);
      const loggerService = new LoggerService([
        new ConsoleLoggerInstanceService(),
      ]);

      const controller = new ActionBankUserController(service, loggerService);

      const req = {} as unknown as Request;

      await expect(() => controller.deleteUser(req)).rejects.toThrow(
        'Invalid Input',
      );
    });
  });
});
