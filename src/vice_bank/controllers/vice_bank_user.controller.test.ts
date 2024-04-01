import {
  ViceBankUser,
  ViceBankUserJSON,
} from '@/src/models/vice_bank/vice_bank_user';
import { InMemoryViceBankUserService } from '@/src/vice_bank/services/vice_bank_user.service.memory';
import { ViceBankUserController } from './vice_bank_user.controller';
import { LoggerService } from '@/src/logger/logger.service';
import { HttpException, HttpStatus } from '@nestjs/common';
import type { METIncomingMessage } from '@/src/utils/met_incoming_message';
import { AuthModel } from '@/src/models/auth_model';

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

const authModel = new AuthModel({
  sub: userId,
});

describe('ViceBankUserController', () => {
  describe('getUsers', () => {
    test('gets users from the viceBankUserService', async () => {
      const service = new InMemoryViceBankUserService([user1, user2, user3]);
      const loggerService = new LoggerService();

      const controller = new ViceBankUserController(service, loggerService);

      const req = {
        authModel,
        query: {
          page: '1',
          pagination: '10',
        },
      } as unknown as METIncomingMessage;

      const users = await controller.getUsers(req);
      expect(users).toEqual({ users: [user1, user2, user3] });
    });

    test("uses page and pagination if it's in the request", async () => {
      const service = new InMemoryViceBankUserService([user1, user2, user3]);
      const loggerService = new LoggerService();

      const controller = new ViceBankUserController(service, loggerService);

      const req1 = {
        authModel,
        query: {
          page: '1',
          pagination: '2',
        },
      } as unknown as METIncomingMessage;

      const result1 = await controller.getUsers(req1);
      expect(result1).toEqual({ users: [user1, user2] });

      const req2 = {
        authModel,
        query: {
          page: '2',
          pagination: '2',
        },
      } as unknown as METIncomingMessage;

      const result2 = await controller.getUsers(req2);
      expect(result2).toEqual({ users: [user3] });

      const req3 = {
        authModel,
        query: {
          page: '3',
          pagination: '2',
        },
      } as unknown as METIncomingMessage;

      const result3 = await controller.getUsers(req3);
      expect(result3).toEqual({ users: [] });
    });

    test('throws an error if the viceBankUserService throws an error', async () => {
      const service = new InMemoryViceBankUserService([user1, user2, user3]);
      const loggerService = new LoggerService();

      const controller = new ViceBankUserController(service, loggerService);

      const req = {
        authModel,
        query: {
          page: '1',
          pagination: '10',
        },
      } as unknown as METIncomingMessage;

      jest
        .spyOn(service, 'getViceBankUsers')
        .mockRejectedValue(new Error('testError'));

      await expect(() => controller.getUsers(req)).rejects.toThrow(
        new HttpException('Server Error', HttpStatus.INTERNAL_SERVER_ERROR),
      );
    });
  });

  describe('getUser', () => {
    test('gets a user from the viceBankUserService', async () => {
      const service = new InMemoryViceBankUserService([user1, user2, user3]);
      const loggerService = new LoggerService();

      const controller = new ViceBankUserController(service, loggerService);

      const req = {
        authModel,
        params: {
          userId: user1.id,
        },
      } as unknown as METIncomingMessage;

      const user = await controller.getUser(req);
      expect(user).toEqual({ user: user1 });
    });

    test('throws an error if the viceBankUserService throws an error', async () => {
      const service = new InMemoryViceBankUserService([user1, user2, user3]);
      const loggerService = new LoggerService();

      const controller = new ViceBankUserController(service, loggerService);

      const req = {
        authModel,
        params: {
          userId: user1.id,
        },
      } as unknown as METIncomingMessage;

      jest
        .spyOn(service, 'getViceBankUser')
        .mockRejectedValue(new Error('testError'));

      await expect(() => controller.getUser(req)).rejects.toThrow(
        new HttpException('Server Error', HttpStatus.INTERNAL_SERVER_ERROR),
      );
    });

    test('throws an error if the user is not found', async () => {
      const service = new InMemoryViceBankUserService([]);
      const loggerService = new LoggerService();

      const controller = new ViceBankUserController(service, loggerService);

      const req = {
        authModel,
        params: {
          userId: user1.id,
        },
      } as unknown as METIncomingMessage;

      await expect(() => controller.getUser(req)).rejects.toThrow('Not Found');
    });
  });

  describe('addUser', () => {
    test('adds a user and returns the user with the new id', async () => {
      const service = new InMemoryViceBankUserService([]);
      const loggerService = new LoggerService();

      const controller = new ViceBankUserController(service, loggerService);

      const req = {
        authModel,
        body: {
          user: { ...user1JSON },
        },
      } as unknown as METIncomingMessage;

      jest.spyOn(service, 'addViceBankUser').mockResolvedValue(user1);

      const result = await controller.addUser(req);
      expect(result).toEqual({ user: user1 });
    });

    test('throws an error if the viceBankUserService throws an error', async () => {
      const service = new InMemoryViceBankUserService([]);
      const loggerService = new LoggerService();

      const controller = new ViceBankUserController(service, loggerService);

      const req = {
        authModel,
        body: {
          user: { ...user1JSON },
        },
      } as unknown as METIncomingMessage;

      jest
        .spyOn(service, 'addViceBankUser')
        .mockRejectedValue(new Error('testError'));

      await expect(() => controller.addUser(req)).rejects.toThrow(
        new HttpException('Server Error', HttpStatus.INTERNAL_SERVER_ERROR),
      );
    });

    test('throws an error if the body is invalid', async () => {
      const service = new InMemoryViceBankUserService([]);
      const loggerService = new LoggerService();

      const controller = new ViceBankUserController(service, loggerService);

      const req = {
        authModel,
      } as unknown as METIncomingMessage;

      await expect(() => controller.addUser(req)).rejects.toThrow(
        new HttpException('Invalid Input', HttpStatus.BAD_REQUEST),
      );
    });

    test('throws an error if the user input is invalid', async () => {
      const service = new InMemoryViceBankUserService([]);
      const loggerService = new LoggerService();

      const controller = new ViceBankUserController(service, loggerService);

      const req = {
        authModel,
        body: {
          user: {},
        },
      } as unknown as METIncomingMessage;

      await expect(() => controller.addUser(req)).rejects.toThrow(
        new HttpException('Invalid Input', HttpStatus.BAD_REQUEST),
      );
    });
  });

  describe('updateUser', () => {
    test('updates a user and returns the old user', async () => {
      const service = new InMemoryViceBankUserService([user1]);
      const loggerService = new LoggerService();

      const controller = new ViceBankUserController(service, loggerService);

      const user1Update = {
        ...user1.toJSON(),
        name: 'new name',
      };

      const req = {
        authModel,
        body: {
          user: { ...user1Update },
        },
      } as unknown as METIncomingMessage;

      const result = await controller.updateUser(req);

      expect(result).toEqual({ user: user1 });
      expect(service.viceBankUsersList[0]?.toJSON()).toEqual(user1Update);
    });

    test('throws an error if the viceBankUserService throws an error', async () => {
      const service = new InMemoryViceBankUserService([user1]);
      const loggerService = new LoggerService();

      const controller = new ViceBankUserController(service, loggerService);

      const user1Update = {
        ...user1.toJSON(),
        name: 'new name',
      };

      const req = {
        authModel,
        body: {
          user: { ...user1Update },
        },
      } as unknown as METIncomingMessage;

      jest
        .spyOn(service, 'updateViceBankUser')
        .mockRejectedValue(new Error('testError'));

      await expect(() => controller.updateUser(req)).rejects.toThrow(
        new HttpException('Server Error', HttpStatus.INTERNAL_SERVER_ERROR),
      );
    });

    test('throws an error if the body is invalid', async () => {
      const service = new InMemoryViceBankUserService([user1]);
      const loggerService = new LoggerService();

      const controller = new ViceBankUserController(service, loggerService);

      const req = {
        authModel,
      } as unknown as METIncomingMessage;

      await expect(() => controller.updateUser(req)).rejects.toThrow(
        new HttpException('Invalid Input', HttpStatus.BAD_REQUEST),
      );
    });

    test('throws an error if the user input is invalid', async () => {
      const service = new InMemoryViceBankUserService([user1]);
      const loggerService = new LoggerService();

      const controller = new ViceBankUserController(service, loggerService);

      const req = {
        authModel,
        body: {
          user: {},
        },
      } as unknown as METIncomingMessage;

      await expect(() => controller.updateUser(req)).rejects.toThrow(
        new HttpException('Invalid Input', HttpStatus.BAD_REQUEST),
      );
    });
  });

  describe('deleteUser', () => {
    test('deletes a user and returns the deleted user', async () => {
      const service = new InMemoryViceBankUserService([user1]);
      const loggerService = new LoggerService();

      const controller = new ViceBankUserController(service, loggerService);

      const req = {
        authModel,
        body: {
          viceBankUserId: user1.id,
        },
      } as unknown as METIncomingMessage;

      const result = await controller.deleteUser(req);
      expect(result).toEqual({ user: user1 });
      expect(service.viceBankUsersList.length).toBe(0);
    });

    test('throws an error if the viceBankUserService throws an error', async () => {
      const service = new InMemoryViceBankUserService([user1]);
      const loggerService = new LoggerService();

      const controller = new ViceBankUserController(service, loggerService);

      const req = {
        authModel,
        body: {
          viceBankUserId: user1.id,
        },
      } as unknown as METIncomingMessage;

      jest
        .spyOn(service, 'deleteViceBankUser')
        .mockRejectedValue(new Error('testError'));

      await expect(() => controller.deleteUser(req)).rejects.toThrow(
        new HttpException('Server Error', HttpStatus.INTERNAL_SERVER_ERROR),
      );
    });

    test('throws an error if the user is not found', async () => {
      const service = new InMemoryViceBankUserService([]);
      const loggerService = new LoggerService();

      const controller = new ViceBankUserController(service, loggerService);

      const req = {
        authModel,
        body: {
          viceBankUserId: user1.id,
        },
      } as unknown as METIncomingMessage;

      await expect(() => controller.deleteUser(req)).rejects.toThrow(
        new HttpException('Server Error', HttpStatus.INTERNAL_SERVER_ERROR),
      );
    });

    test('throws an error if the body is invalid', async () => {
      const service = new InMemoryViceBankUserService([]);
      const loggerService = new LoggerService();

      const controller = new ViceBankUserController(service, loggerService);

      const req = {
        authModel,
      } as unknown as METIncomingMessage;

      await expect(() => controller.deleteUser(req)).rejects.toThrow(
        new HttpException('Invalid Input', HttpStatus.BAD_REQUEST),
      );
    });
  });
});
