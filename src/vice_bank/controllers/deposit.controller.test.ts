import { Request } from 'express';

import { Deposit, DepositJSON } from '@/src/models/vice_bank/deposit';
import { InMemoryDepositService } from '@/src/vice_bank/services/deposit.service.memory';
import { LoggerService } from '@/src/logger/logger.service';
import { DepositController } from './deposit.controller';
import { HttpException, HttpStatus } from '@nestjs/common';
import {
  ViceBankUser,
  ViceBankUserJSON,
} from '@/src/models/vice_bank/vice_bank_user';
import { InMemoryViceBankUserService } from '@/src/vice_bank/services/vice_bank_user.service.memory';
import { METIncomingMessage } from '@/src/utils/met_incoming_message';
import { NoAuthModel } from '@/src/models/auth_model';

const userId = 'userId';

const deposit1JSON: DepositJSON = {
  id: 'id1',
  vbUserId: 'id1',
  date: '2021-01-01T00:00:00.000-06:00',
  depositQuantity: 1,
  conversionRate: 1,
  actionName: 'name1',
  conversionUnit: 'minutes',
};
const deposit2JSON: DepositJSON = {
  id: 'id2',
  vbUserId: 'id1',
  date: '2021-01-12T00:00:00.000-06:00',
  depositQuantity: 1,
  conversionRate: 1,
  actionName: 'name1',
  conversionUnit: 'minutes',
};
const deposit3JSON: DepositJSON = {
  id: 'id3',
  vbUserId: 'userId2',
  date: '2021-02-01T00:00:00.000-06:00',
  depositQuantity: 1,
  conversionRate: 1,
  actionName: 'name2',
  conversionUnit: 'minutes',
};

const deposit1 = Deposit.fromJSON(deposit1JSON);
const deposit2 = Deposit.fromJSON(deposit2JSON);
const deposit3 = Deposit.fromJSON(deposit3JSON);

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

describe('Deposit Controller', () => {
  let vbService = new InMemoryViceBankUserService([user1, user2, user3]);

  beforeEach(() => {
    vbService = new InMemoryViceBankUserService([user1, user2, user3]);
  });

  describe('getDeposits', () => {
    test('gets deposits from the DepositService', async () => {
      const service = new InMemoryDepositService([
        deposit1,
        deposit2,
        deposit3,
      ]);
      const logger = new LoggerService();

      const controller = new DepositController(service, vbService, logger);

      const req = {
        query: {
          userId: 'id1',
        },
      } as unknown as Request;

      const deposits = await controller.getDeposits(req);

      expect(deposits).toEqual({ deposits: [deposit1, deposit2] });
    });

    test('start date and end date get passed to the DepositService', async () => {
      const service = new InMemoryDepositService([
        deposit1,
        deposit2,
        deposit3,
      ]);
      const logger = new LoggerService();

      const controller = new DepositController(service, vbService, logger);

      const req = {
        query: {
          userId: 'id1',
          startDate: '2021-01-01',
          endDate: '2021-01-10',
        },
      } as unknown as Request;

      const getSpy = jest.spyOn(service, 'getDeposits');

      const deposits = await controller.getDeposits(req);

      expect(deposits).toEqual({ deposits: [deposit1] });

      expect(getSpy).toHaveBeenCalledTimes(1);
      expect(getSpy).toHaveBeenCalledWith({
        page: 1,
        pagination: 10,
        userId: 'id1',
        startDate: '2021-01-01',
        endDate: '2021-01-10',
        depositConversionId: undefined,
      });
    });

    test('throws an error if the query is invalid', async () => {
      const service = new InMemoryDepositService();
      const logger = new LoggerService();

      const controller = new DepositController(service, vbService, logger);

      const req = {
        query: 'bad',
      } as unknown as Request;

      await expect(() => controller.getDeposits(req)).rejects.toThrow(
        new HttpException('Invalid Input', HttpStatus.BAD_REQUEST),
      );
    });

    test('throws an error if the user id is invalid', async () => {
      const service = new InMemoryDepositService();
      const logger = new LoggerService();

      const controller = new DepositController(service, vbService, logger);

      const req = {
        query: {
          userId: 123,
        },
      } as unknown as Request;

      await expect(() => controller.getDeposits(req)).rejects.toThrow(
        new HttpException('Invalid Input', HttpStatus.BAD_REQUEST),
      );
    });

    test('throws an error if getDeposits throws an error', async () => {
      const service = new InMemoryDepositService();
      const logger = new LoggerService();

      const controller = new DepositController(service, vbService, logger);

      const req = {
        query: {
          userId: 'userId1',
        },
      } as unknown as Request;

      jest.spyOn(service, 'getDeposits').mockRejectedValue(new Error('bad'));

      await expect(() => controller.getDeposits(req)).rejects.toThrow(
        new HttpException('Server Error', HttpStatus.INTERNAL_SERVER_ERROR),
      );
    });
  });

  describe('addDeposit', () => {
    test('adds a deposit to the DepositService', async () => {
      const service = new InMemoryDepositService();
      const logger = new LoggerService();

      const controller = new DepositController(service, vbService, logger);

      const authModel = new NoAuthModel();
      jest.spyOn(authModel, 'userId', 'get').mockReturnValue('userId');

      const req = {
        authModel,
        body: {
          deposit: deposit1JSON,
        },
      } as unknown as METIncomingMessage;

      jest.spyOn(service, 'addDeposit').mockResolvedValue(deposit1);

      const deposit = await controller.addDeposit(req);

      expect(deposit).toEqual({ deposit: deposit1, currentTokens: 2 });
    });

    test('throws an error if the body is invalid', async () => {
      const service = new InMemoryDepositService();
      const logger = new LoggerService();

      const controller = new DepositController(service, vbService, logger);

      const authModel = new NoAuthModel();
      jest.spyOn(authModel, 'userId', 'get').mockReturnValue('userId');

      const req = {
        authModel,
      } as unknown as METIncomingMessage;

      await expect(() => controller.addDeposit(req)).rejects.toThrow(
        new HttpException('Invalid Input', HttpStatus.BAD_REQUEST),
      );
    });

    test('throws an error if the body cannot be parsed', async () => {
      const service = new InMemoryDepositService();
      const logger = new LoggerService();

      const controller = new DepositController(service, vbService, logger);

      const authModel = new NoAuthModel();
      jest.spyOn(authModel, 'userId', 'get').mockReturnValue('userId');

      const req = {
        authModel,
        body: {
          deposit: {},
        },
      } as unknown as METIncomingMessage;

      await expect(() => controller.addDeposit(req)).rejects.toThrow(
        new HttpException('Invalid Input', HttpStatus.BAD_REQUEST),
      );
    });

    test('throws an error if addDeposit throws an error', async () => {
      const service = new InMemoryDepositService();
      const logger = new LoggerService();

      const controller = new DepositController(service, vbService, logger);

      const authModel = new NoAuthModel();
      jest.spyOn(authModel, 'userId', 'get').mockReturnValue('userId');

      const req = {
        authModel,
        body: {
          deposit: deposit1JSON,
        },
      } as unknown as METIncomingMessage;

      jest.spyOn(service, 'addDeposit').mockRejectedValue(new Error('bad'));

      await expect(() => controller.addDeposit(req)).rejects.toThrow(
        new HttpException('Server Error', HttpStatus.INTERNAL_SERVER_ERROR),
      );
    });
  });

  describe('updateDeposit', () => {
    test('updates a deposit in the DepositService', async () => {
      const service = new InMemoryDepositService([deposit1]);
      const logger = new LoggerService();

      const controller = new DepositController(service, vbService, logger);

      const updatedDeposit = { ...deposit1JSON, depositQuantity: 2 };

      const req = {
        body: {
          deposit: updatedDeposit,
        },
      } as unknown as Request;

      const result = await controller.updateDeposit(req);

      expect(result).toEqual({ deposit: deposit1 });
      expect(service.depositsList[0]?.toJSON()).toEqual(updatedDeposit);
    });

    test('throws an error if the body is invalid', async () => {
      const service = new InMemoryDepositService([deposit1]);
      const logger = new LoggerService();

      const controller = new DepositController(service, vbService, logger);

      const req = {} as unknown as Request;

      await expect(() => controller.updateDeposit(req)).rejects.toThrow(
        new HttpException('Invalid Input', HttpStatus.BAD_REQUEST),
      );
    });

    test('throws an error if the body cannot be parsed', async () => {
      const service = new InMemoryDepositService([deposit1]);
      const logger = new LoggerService();

      const controller = new DepositController(service, vbService, logger);

      const req = {
        body: {
          deposit: {},
        },
      } as unknown as Request;

      await expect(() => controller.updateDeposit(req)).rejects.toThrow(
        new HttpException('Invalid Input', HttpStatus.BAD_REQUEST),
      );
    });

    test('throws an error if updateDeposit throws an error', async () => {
      const service = new InMemoryDepositService([deposit1]);
      const logger = new LoggerService();

      const controller = new DepositController(service, vbService, logger);

      const req = {
        body: {
          deposit: deposit1JSON,
        },
      } as unknown as Request;

      jest.spyOn(service, 'updateDeposit').mockRejectedValue(new Error('bad'));

      await expect(() => controller.updateDeposit(req)).rejects.toThrow(
        new HttpException('Server Error', HttpStatus.INTERNAL_SERVER_ERROR),
      );
    });
  });

  describe('deleteDeposit', () => {
    test('deletes a deposit from the DepositService', async () => {
      const service = new InMemoryDepositService([deposit1]);
      const logger = new LoggerService();

      const controller = new DepositController(service, vbService, logger);

      const req = {
        body: {
          depositId: deposit1.id,
        },
      } as unknown as Request;

      const result = await controller.deleteDeposit(req);

      expect(result).toEqual({ deposit: deposit1 });
      expect(service.depositsList).toEqual([]);
    });

    test('throws an error if the body is invalid', async () => {
      const service = new InMemoryDepositService([deposit1]);
      const logger = new LoggerService();

      const controller = new DepositController(service, vbService, logger);

      const req = {} as unknown as Request;

      await expect(() => controller.deleteDeposit(req)).rejects.toThrow(
        new HttpException('Invalid Input', HttpStatus.BAD_REQUEST),
      );
    });

    test('throws an error if the deposit id is not a string', async () => {
      const service = new InMemoryDepositService([deposit1]);
      const logger = new LoggerService();

      const controller = new DepositController(service, vbService, logger);

      const req = {
        body: {
          depositId: 123,
        },
      } as unknown as Request;

      await expect(() => controller.deleteDeposit(req)).rejects.toThrow(
        new HttpException('Invalid Input', HttpStatus.BAD_REQUEST),
      );
    });

    test('throws an error if deleteDeposit throws an error', async () => {
      const service = new InMemoryDepositService([deposit1]);
      const logger = new LoggerService();

      const controller = new DepositController(service, vbService, logger);

      const req = {
        body: {
          depositId: deposit1.id,
        },
      } as unknown as Request;

      jest.spyOn(service, 'deleteDeposit').mockRejectedValue(new Error('bad'));

      await expect(() => controller.deleteDeposit(req)).rejects.toThrow(
        new HttpException('Server Error', HttpStatus.INTERNAL_SERVER_ERROR),
      );
    });
  });
});
