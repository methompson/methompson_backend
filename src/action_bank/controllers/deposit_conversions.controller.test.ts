import { Request } from 'express';

import {
  DepositConversion,
  DepositConversionJSON,
} from '@/src/models/action_bank/deposit_conversion';
import { LoggerService } from '@/src/logger/logger.service';
import { InMemoryDepositConversionsService } from '@/src/action_bank/services/deposit_conversions.service.memory';
import { DepositConversionsController } from './deposit_conversions.controller';
import { HttpException, HttpStatus } from '@nestjs/common';

const conversionJSON1: DepositConversionJSON = {
  id: 'id1',
  userId: 'userId1',
  name: 'name1',
  rateName: 'rateName1',
  depositsPer: 1,
  tokensPer: 1,
  minDeposit: 1,
  maxDeposit: 1,
};
const conversionJSON2: DepositConversionJSON = {
  id: 'id2',
  userId: 'userId1',
  name: 'name2',
  rateName: 'rateName2',
  depositsPer: 2,
  tokensPer: 2,
  minDeposit: 2,
  maxDeposit: 2,
};
const conversionJSON3: DepositConversionJSON = {
  id: 'id3',
  userId: 'userId3',
  name: 'name3',
  rateName: 'rateName3',
  depositsPer: 3,
  tokensPer: 3,
  minDeposit: 3,
  maxDeposit: 3,
};

const conversion1 = DepositConversion.fromJSON(conversionJSON1);
const conversion2 = DepositConversion.fromJSON(conversionJSON2);
const conversion3 = DepositConversion.fromJSON(conversionJSON3);

describe('DepositConversionsController', () => {
  describe('getDepositConversions', () => {
    test('gets deposit conversions from the DepositConversionsService', async () => {
      const service = new InMemoryDepositConversionsService([
        conversion1,
        conversion2,
        conversion3,
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
      expect(conversions).toEqual([conversion1, conversion2]);
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
          depositConversion: conversionJSON1,
        },
      } as unknown as Request;

      jest
        .spyOn(service, 'addDepositConversion')
        .mockResolvedValue(conversion1);

      const conversion = await controller.addDepositConversion(req);
      expect(conversion).toBe(conversion1);
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
          depositConversion: conversionJSON1,
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
      const service = new InMemoryDepositConversionsService([conversion1]);
      const loggerService = new LoggerService();

      const controller = new DepositConversionsController(
        service,
        loggerService,
      );

      const depositConversionUpdate = {
        ...conversionJSON1,
        name: 'newName',
      };

      const req = {
        body: {
          depositConversion: depositConversionUpdate,
        },
      } as unknown as Request;

      const result = await controller.updateDepositConversion(req);
      expect(result).toBe(conversion1);
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
      const service = new InMemoryDepositConversionsService([conversion1]);
      const loggerService = new LoggerService();

      const controller = new DepositConversionsController(
        service,
        loggerService,
      );

      const req = {
        body: {
          depositConversion: conversionJSON1,
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
      const service = new InMemoryDepositConversionsService([conversion1]);
      const loggerService = new LoggerService();

      const controller = new DepositConversionsController(
        service,
        loggerService,
      );

      const req = {
        body: {
          depositConversionId: conversion1.id,
        },
      } as unknown as Request;

      const result = await controller.deleteDepositConversion(req);
      expect(result).toBe(conversion1);
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
      const service = new InMemoryDepositConversionsService([conversion1]);
      const loggerService = new LoggerService();

      const controller = new DepositConversionsController(
        service,
        loggerService,
      );

      const req = {
        body: {
          depositConversionId: conversion1.id,
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
