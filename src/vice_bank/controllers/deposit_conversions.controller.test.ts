import { Request } from 'express';

import { Action, ActionJSON } from '@/src/models/vice_bank/action';
import { LoggerService } from '@/src/logger/logger.service';
import { InMemoryDepositConversionsService } from '@/src/vice_bank/services/deposit_conversions.service.memory';
import { DepositConversionsController } from './deposit_conversions.controller';
import { HttpException, HttpStatus } from '@nestjs/common';

const actionJSON1: ActionJSON = {
  id: 'id1',
  vbUserId: 'userId1',
  name: 'name1',
  conversionUnit: 'conversionUnit1',
  depositsPer: 1,
  tokensPer: 1,
  minDeposit: 1,
};
const actionJSON2: ActionJSON = {
  id: 'id2',
  vbUserId: 'userId1',
  name: 'name2',
  conversionUnit: 'conversionUnit2',
  depositsPer: 2,
  tokensPer: 2,
  minDeposit: 2,
};
const actionJSON3: ActionJSON = {
  id: 'id3',
  vbUserId: 'userId3',
  name: 'name3',
  conversionUnit: 'conversionUnit3',
  depositsPer: 3,
  tokensPer: 3,
  minDeposit: 3,
};

const action1 = Action.fromJSON(actionJSON1);
const action2 = Action.fromJSON(actionJSON2);
const action3 = Action.fromJSON(actionJSON3);

describe('DepositConversionsController', () => {
  describe('getDepositConversions', () => {
    test('gets deposit conversions from the DepositConversionsService', async () => {
      const service = new InMemoryDepositConversionsService([
        action1,
        action2,
        action3,
      ]);
      const loggerService = new LoggerService();

      const controller = new DepositConversionsController(
        service,
        loggerService,
      );

      const req = {
        query: {
          userId: 'userId1',
        },
      } as unknown as Request;

      const conversions = await controller.getDepositConversions(req);
      expect(conversions).toEqual({
        depositConversions: [action1, action2],
      });
    });

    test('throws an error if the userId is not a string', async () => {
      const service = new InMemoryDepositConversionsService();
      const loggerService = new LoggerService();

      const controller = new DepositConversionsController(
        service,
        loggerService,
      );

      const req1 = {
        query: {
          userId: 1,
        },
      } as unknown as Request;

      await expect(controller.getDepositConversions(req1)).rejects.toThrow(
        new HttpException('Invalid Input', HttpStatus.BAD_REQUEST),
      );

      const req2 = {
        query: {
          userId: true,
        },
      } as unknown as Request;

      await expect(controller.getDepositConversions(req2)).rejects.toThrow(
        new HttpException('Invalid Input', HttpStatus.BAD_REQUEST),
      );
    });

    test('throws an error if getDepositConversions throws an error', async () => {
      const service = new InMemoryDepositConversionsService();
      const loggerService = new LoggerService();

      const controller = new DepositConversionsController(
        service,
        loggerService,
      );

      const req = {
        query: {
          userId: 'userId1',
        },
      } as unknown as Request;

      jest
        .spyOn(service, 'getDepositConversions')
        .mockRejectedValue(new Error('Error'));

      await expect(controller.getDepositConversions(req)).rejects.toThrow(
        new HttpException('Server Error', HttpStatus.INTERNAL_SERVER_ERROR),
      );
    });
  });

  describe('addDepositConversion', () => {
    test('adds a deposit conversion using the DepositConversionsService', async () => {
      const service = new InMemoryDepositConversionsService();
      const loggerService = new LoggerService();

      const controller = new DepositConversionsController(
        service,
        loggerService,
      );

      const req = {
        body: {
          depositConversion: actionJSON1,
        },
      } as unknown as Request;

      jest.spyOn(service, 'addDepositConversion').mockResolvedValue(action1);

      const conversion = await controller.addDepositConversion(req);
      expect(conversion).toStrictEqual({ depositConversion: action1 });
    });

    test('throws an error if the body is not a record', async () => {
      const service = new InMemoryDepositConversionsService();
      const loggerService = new LoggerService();

      const controller = new DepositConversionsController(
        service,
        loggerService,
      );

      const req = {} as unknown as Request;

      await expect(controller.addDepositConversion(req)).rejects.toThrow(
        new HttpException('Invalid Input', HttpStatus.BAD_REQUEST),
      );
    });

    test('throws an error if the body cannot be parsed', async () => {
      const service = new InMemoryDepositConversionsService();
      const loggerService = new LoggerService();

      const controller = new DepositConversionsController(
        service,
        loggerService,
      );

      const req = {
        body: {},
      } as unknown as Request;

      await expect(controller.addDepositConversion(req)).rejects.toThrow(
        new HttpException('Invalid Input', HttpStatus.BAD_REQUEST),
      );
    });

    test('throws an error if addDepositConversion throws an error', async () => {
      const service = new InMemoryDepositConversionsService();
      const loggerService = new LoggerService();

      const controller = new DepositConversionsController(
        service,
        loggerService,
      );

      const req = {
        body: {
          depositConversion: actionJSON1,
        },
      } as unknown as Request;

      jest
        .spyOn(service, 'addDepositConversion')
        .mockRejectedValue(new Error('Error'));

      await expect(controller.addDepositConversion(req)).rejects.toThrow(
        new HttpException('Server Error', HttpStatus.INTERNAL_SERVER_ERROR),
      );
    });
  });

  describe('updateDepositConversion', () => {
    test('updates a deposit conversion using the DepositConversionsService', async () => {
      const service = new InMemoryDepositConversionsService([action1]);
      const loggerService = new LoggerService();

      const controller = new DepositConversionsController(
        service,
        loggerService,
      );

      const depositConversionUpdate = {
        ...actionJSON1,
        name: 'newName',
      };

      const req = {
        body: {
          depositConversion: depositConversionUpdate,
        },
      } as unknown as Request;

      const result = await controller.updateDepositConversion(req);
      expect(result).toStrictEqual({ depositConversion: action1 });
      expect(service.depositConversionsList[0]?.toJSON()).toEqual(
        depositConversionUpdate,
      );
    });

    test('throws an error if the body is not a record', async () => {
      const service = new InMemoryDepositConversionsService();
      const loggerService = new LoggerService();

      const controller = new DepositConversionsController(
        service,
        loggerService,
      );

      const req = {} as unknown as Request;

      await expect(controller.updateDepositConversion(req)).rejects.toThrow(
        new HttpException('Invalid Input', HttpStatus.BAD_REQUEST),
      );
    });

    test('throws an error if the body cannot be parsed', async () => {
      const service = new InMemoryDepositConversionsService();
      const loggerService = new LoggerService();

      const controller = new DepositConversionsController(
        service,
        loggerService,
      );

      const req = {
        body: {},
      } as unknown as Request;

      await expect(controller.updateDepositConversion(req)).rejects.toThrow(
        new HttpException('Invalid Input', HttpStatus.BAD_REQUEST),
      );
    });

    test('throws an error if updateDepositConversion throws an error', async () => {
      const service = new InMemoryDepositConversionsService([action1]);
      const loggerService = new LoggerService();

      const controller = new DepositConversionsController(
        service,
        loggerService,
      );

      const req = {
        body: {
          depositConversion: actionJSON1,
        },
      } as unknown as Request;

      jest
        .spyOn(service, 'updateDepositConversion')
        .mockRejectedValue(new Error('Error'));

      await expect(controller.updateDepositConversion(req)).rejects.toThrow(
        new HttpException('Server Error', HttpStatus.INTERNAL_SERVER_ERROR),
      );
    });
  });

  describe('deleteDepositConversion', () => {
    test('deletes a deposit conversion using the DepositConversionsService', async () => {
      const service = new InMemoryDepositConversionsService([action1]);
      const loggerService = new LoggerService();

      const controller = new DepositConversionsController(
        service,
        loggerService,
      );

      const req = {
        body: {
          depositConversionId: action1.id,
        },
      } as unknown as Request;

      const result = await controller.deleteDepositConversion(req);
      expect(result).toStrictEqual({ depositConversion: action1 });
      expect(service.depositConversionsList.length).toBe(0);
    });

    test('throws an error if the userId is not a string', async () => {
      const service = new InMemoryDepositConversionsService();
      const loggerService = new LoggerService();

      const controller = new DepositConversionsController(
        service,
        loggerService,
      );

      const req1 = {
        body: {
          depositConversionId: 1,
        },
      } as unknown as Request;

      await expect(controller.deleteDepositConversion(req1)).rejects.toThrow(
        new HttpException('Invalid Input', HttpStatus.BAD_REQUEST),
      );

      const req2 = {
        body: {
          depositConversionId: true,
        },
      } as unknown as Request;

      await expect(controller.deleteDepositConversion(req2)).rejects.toThrow(
        new HttpException('Invalid Input', HttpStatus.BAD_REQUEST),
      );
    });

    test('throws an error if deleteDepositConversion throws an error', async () => {
      const service = new InMemoryDepositConversionsService([action1]);
      const loggerService = new LoggerService();

      const controller = new DepositConversionsController(
        service,
        loggerService,
      );

      const req = {
        body: {
          depositConversionId: action1.id,
        },
      } as unknown as Request;

      jest
        .spyOn(service, 'deleteDepositConversion')
        .mockRejectedValue(new Error('Error'));

      await expect(controller.deleteDepositConversion(req)).rejects.toThrow(
        new HttpException('Server Error', HttpStatus.INTERNAL_SERVER_ERROR),
      );
    });
  });
});
