import { Request } from 'express';

import { Deposit, DepositJSON } from '@/src/models/vice_bank/deposit';
import { InMemoryDepositService } from '@/src/vice_bank/services/deposit.service.memory';
import { LoggerService } from '@/src/logger/logger.service';
import { DepositController } from './deposit.controller';
import { HttpException, HttpStatus } from '@nestjs/common';

const deposit1JSON: DepositJSON = {
  id: 'id1',
  userId: 'userId1',
  date: '2021-01-01T00:00:00.000-06:00',
  depositQuantity: 1,
  conversionRate: 1,
  depositConversionName: 'name1',
};
const deposit2JSON: DepositJSON = {
  id: 'id2',
  userId: 'userId1',
  date: '2021-01-12T00:00:00.000-06:00',
  depositQuantity: 1,
  conversionRate: 1,
  depositConversionName: 'name1',
};
const deposit3JSON: DepositJSON = {
  id: 'id3',
  userId: 'userId2',
  date: '2021-02-01T00:00:00.000-06:00',
  depositQuantity: 1,
  conversionRate: 1,
  depositConversionName: 'name2',
};

const deposit1 = Deposit.fromJSON(deposit1JSON);
const deposit2 = Deposit.fromJSON(deposit2JSON);
const deposit3 = Deposit.fromJSON(deposit3JSON);

describe('Deposit Controller', () => {
  describe('getDeposits', () => {
    test('gets deposits from the DepositService', async () => {
      const service = new InMemoryDepositService([
        deposit1,
        deposit2,
        deposit3,
      ]);
      const logger = new LoggerService();

      const controller = new DepositController(service, logger);

      const req = {
        query: {
          userId: 'userId1',
        },
      } as unknown as Request;

      const deposits = await controller.getDeposits(req);

      expect(deposits).toEqual([deposit1, deposit2]);
    });

    test('start date and end date get passed to the DepositService', async () => {
      const service = new InMemoryDepositService([
        deposit1,
        deposit2,
        deposit3,
      ]);
      const logger = new LoggerService();

      const controller = new DepositController(service, logger);

      const req = {
        query: {
          userId: 'userId1',
          startDate: '2021-01-01',
          endDate: '2021-01-10',
        },
      } as unknown as Request;

      const getSpy = jest.spyOn(service, 'getDeposits');

      const deposits = await controller.getDeposits(req);

      expect(deposits).toEqual([deposit1]);

      expect(getSpy).toHaveBeenCalledTimes(1);
      expect(getSpy).toHaveBeenCalledWith({
        page: 1,
        pagination: 10,
        userId: 'userId1',
        startDate: '2021-01-01',
        endDate: '2021-01-10',
        depositConversionId: undefined,
      });
    });

    test('throws an error if the query is invalid', async () => {
      const service = new InMemoryDepositService();
      const logger = new LoggerService();

      const controller = new DepositController(service, logger);

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

      const controller = new DepositController(service, logger);

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

      const controller = new DepositController(service, logger);

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

      const controller = new DepositController(service, logger);

      const req = {
        body: {
          deposit: deposit1JSON,
        },
      } as unknown as Request;

      jest.spyOn(service, 'addDeposit').mockResolvedValue(deposit1);

      const deposit = await controller.addDeposit(req);

      expect(deposit).toEqual(deposit1);
    });

    test('throws an error if the body is invalid', async () => {
      const service = new InMemoryDepositService();
      const logger = new LoggerService();

      const controller = new DepositController(service, logger);

      const req = {} as unknown as Request;

      expect(() => controller.addDeposit(req)).rejects.toThrow(
        new HttpException('Invalid Input', HttpStatus.BAD_REQUEST),
      );
    });

    test('throws an error if the body cannot be parsed', async () => {
      const service = new InMemoryDepositService();
      const logger = new LoggerService();

      const controller = new DepositController(service, logger);

      const req = {
        body: {
          deposit: {},
        },
      } as unknown as Request;

      expect(() => controller.addDeposit(req)).rejects.toThrow(
        new HttpException('Invalid Input', HttpStatus.BAD_REQUEST),
      );
    });

    test('throws an error if addDeposit throws an error', async () => {
      const service = new InMemoryDepositService();
      const logger = new LoggerService();

      const controller = new DepositController(service, logger);

      const req = {
        body: {
          deposit: deposit1JSON,
        },
      } as unknown as Request;

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

      const controller = new DepositController(service, logger);

      const updatedDeposit = { ...deposit1JSON, depositQuantity: 2 };

      const req = {
        body: {
          deposit: updatedDeposit,
        },
      } as unknown as Request;

      const result = await controller.updateDeposit(req);

      expect(result).toEqual(deposit1);
      expect(service.depositsList[0]?.toJSON()).toEqual(updatedDeposit);
    });

    test('throws an error if the body is invalid', async () => {
      const service = new InMemoryDepositService([deposit1]);
      const logger = new LoggerService();

      const controller = new DepositController(service, logger);

      const req = {} as unknown as Request;

      expect(() => controller.updateDeposit(req)).rejects.toThrow(
        new HttpException('Invalid Input', HttpStatus.BAD_REQUEST),
      );
    });

    test('throws an error if the body cannot be parsed', async () => {
      const service = new InMemoryDepositService([deposit1]);
      const logger = new LoggerService();

      const controller = new DepositController(service, logger);

      const req = {
        body: {
          deposit: {},
        },
      } as unknown as Request;

      expect(() => controller.updateDeposit(req)).rejects.toThrow(
        new HttpException('Invalid Input', HttpStatus.BAD_REQUEST),
      );
    });

    test('throws an error if updateDeposit throws an error', async () => {
      const service = new InMemoryDepositService([deposit1]);
      const logger = new LoggerService();

      const controller = new DepositController(service, logger);

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

      const controller = new DepositController(service, logger);

      const req = {
        body: {
          depositId: deposit1.id,
        },
      } as unknown as Request;

      const result = await controller.deleteDeposit(req);

      expect(result).toEqual(deposit1);
      expect(service.depositsList).toEqual([]);
    });

    test('throws an error if the body is invalid', async () => {
      const service = new InMemoryDepositService([deposit1]);
      const logger = new LoggerService();

      const controller = new DepositController(service, logger);

      const req = {} as unknown as Request;

      expect(() => controller.deleteDeposit(req)).rejects.toThrow(
        new HttpException('Invalid Input', HttpStatus.BAD_REQUEST),
      );
    });

    test('throws an error if the deposit id is not a string', async () => {
      const service = new InMemoryDepositService([deposit1]);
      const logger = new LoggerService();

      const controller = new DepositController(service, logger);

      const req = {
        body: {
          depositId: 123,
        },
      } as unknown as Request;

      expect(() => controller.deleteDeposit(req)).rejects.toThrow(
        new HttpException('Invalid Input', HttpStatus.BAD_REQUEST),
      );
    });

    test('throws an error if deleteDeposit throws an error', async () => {
      const service = new InMemoryDepositService([deposit1]);
      const logger = new LoggerService();

      const controller = new DepositController(service, logger);

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
