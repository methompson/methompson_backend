import { HttpException, HttpStatus } from '@nestjs/common';
import { Request } from 'express';

import { Purchase, PurchaseJSON } from '@/src/models/vice_bank/purchase';
import { LoggerService } from '@/src/logger/logger.service';
import { InMemoryPurchaseService } from '@/src/vice_bank/services/purchase.service.memory';
import { PurchaseController } from './purchase.controller';
import {
  ViceBankUser,
  ViceBankUserJSON,
} from '@/src/models/vice_bank/vice_bank_user';
import { InMemoryViceBankUserService } from '@/src/vice_bank/services/vice_bank_user.service.memory';
import { NoAuthModel } from '@/src/models/auth_model';
import { METIncomingMessage } from '@/src/utils/met_incoming_message';

const userId = 'userId';

const purchasedName = 'purchasedName';

const p1JSON: PurchaseJSON = {
  id: 'id1',
  vbUserId: 'id1',
  purchasedName,
  purchasePriceId: 'purchasePriceId1',
  date: '2021-01-01T00:00:00.000-06:00',
  purchasedQuantity: 1,
};
const p2JSON: PurchaseJSON = {
  id: 'id2',
  vbUserId: 'id1',
  purchasedName,
  purchasePriceId: 'purchasePriceId2',
  date: '2021-01-12T00:00:00.000-06:00',
  purchasedQuantity: 2,
};
const p3JSON: PurchaseJSON = {
  id: 'id3',
  vbUserId: 'id2',
  purchasedName,
  purchasePriceId: 'purchasePriceId3',
  date: '2021-01-25T00:00:00.000-06:00',
  purchasedQuantity: 3,
};

const purchase1 = Purchase.fromJSON(p1JSON);
const purchase2 = Purchase.fromJSON(p2JSON);
const purchase3 = Purchase.fromJSON(p3JSON);

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

describe('Purchase Controller', () => {
  let vbService = new InMemoryViceBankUserService([user1, user2, user3]);

  beforeEach(() => {
    vbService = new InMemoryViceBankUserService([user1, user2, user3]);
  });

  describe('getPurchases', () => {
    test('gets purchases from the PurchaseService', async () => {
      const service = new InMemoryPurchaseService([
        purchase1,
        purchase2,
        purchase3,
      ]);
      const logger = new LoggerService();

      const controller = new PurchaseController(service, vbService, logger);

      const request = {
        query: {
          userId: 'id1',
        },
      } as unknown as Request;

      const getSpy = jest.spyOn(service, 'getPurchases');

      const result = await controller.getPurchases(request);

      expect(result).toEqual({ purchases: [purchase1, purchase2] });
      expect(getSpy).toHaveBeenCalledTimes(1);
      expect(getSpy).toHaveBeenCalledWith({
        page: 1,
        pagination: 10,
        userId: 'id1',
        startDate: undefined,
        endDate: undefined,
        purchasePriceId: undefined,
      });
    });

    test('start date and end date get passed to the PurchaseService', async () => {
      const service = new InMemoryPurchaseService([
        purchase1,
        purchase2,
        purchase3,
      ]);
      const logger = new LoggerService();

      const controller = new PurchaseController(service, vbService, logger);

      const request1 = {
        query: {
          userId: 'id1',
          startDate: '2021-01-01',
          endDate: '2021-01-05',
        },
      } as unknown as Request;

      const getSpy = jest.spyOn(service, 'getPurchases');

      const result1 = await controller.getPurchases(request1);

      expect(result1).toEqual({ purchases: [purchase1] });

      expect(getSpy).toHaveBeenCalledTimes(1);
      expect(getSpy).toHaveBeenCalledWith({
        page: 1,
        pagination: 10,
        userId: 'id1',
        startDate: '2021-01-01',
        endDate: '2021-01-05',
        purchasePriceId: undefined,
      });

      const request2 = {
        query: {
          userId: 'id1',
          startDate: '2021-01-05',
          endDate: '2021-01-20',
        },
      } as unknown as Request;
      const result2 = await controller.getPurchases(request2);

      expect(result2).toEqual({ purchases: [purchase2] });
    });

    test('throws an error if the query is invalid', async () => {
      const service = new InMemoryPurchaseService([
        purchase1,
        purchase2,
        purchase3,
      ]);
      const logger = new LoggerService();

      const controller = new PurchaseController(service, vbService, logger);

      const request = {
        query: 'invalid',
      } as unknown as Request;

      await expect(() => controller.getPurchases(request)).rejects.toThrow(
        new HttpException('Invalid Input', HttpStatus.BAD_REQUEST),
      );
    });

    test('throws an error if the user id is not a string', async () => {
      const service = new InMemoryPurchaseService([
        purchase1,
        purchase2,
        purchase3,
      ]);
      const logger = new LoggerService();

      const controller = new PurchaseController(service, vbService, logger);

      const request = {
        query: {
          userId: 1,
        },
      } as unknown as Request;

      await expect(() => controller.getPurchases(request)).rejects.toThrow(
        new HttpException('Invalid Input', HttpStatus.BAD_REQUEST),
      );
    });

    test('throws an error if getPurchases throws an error', async () => {
      const service = new InMemoryPurchaseService([
        purchase1,
        purchase2,
        purchase3,
      ]);
      const logger = new LoggerService();

      const controller = new PurchaseController(service, vbService, logger);

      const request = {
        query: {
          userId: 'id1',
        },
      } as unknown as Request;

      jest
        .spyOn(service, 'getPurchases')
        .mockRejectedValueOnce(new Error('Test Error'));

      await expect(() => controller.getPurchases(request)).rejects.toThrow(
        new HttpException('Server Error', HttpStatus.INTERNAL_SERVER_ERROR),
      );
    });
  });

  describe('addPurchase', () => {
    test('adds a purchase to the PurchaseService', async () => {
      const service = new InMemoryPurchaseService();
      const logger = new LoggerService();

      const controller = new PurchaseController(service, vbService, logger);
      const authModel = new NoAuthModel();
      jest.spyOn(authModel, 'userId', 'get').mockReturnValue('userId');

      const request = {
        authModel,
        body: {
          purchase: p1JSON,
        },
      } as unknown as METIncomingMessage;

      const addSpy = jest.spyOn(service, 'addPurchase');
      addSpy.mockResolvedValue(purchase1);

      const result = await controller.addPurchase(request);

      expect(result).toEqual({ purchase: purchase1, currentTokens: 0 });
      expect(addSpy).toHaveBeenCalledTimes(1);
    });

    test('throws an error if the body is invalid', async () => {
      const service = new InMemoryPurchaseService([
        purchase1,
        purchase2,
        purchase3,
      ]);
      const logger = new LoggerService();

      const controller = new PurchaseController(service, vbService, logger);
      const authModel = new NoAuthModel();
      jest.spyOn(authModel, 'userId', 'get').mockReturnValue('userId');

      const request = {
        authModel,
        body: 'invalid',
      } as unknown as METIncomingMessage;

      await expect(() => controller.addPurchase(request)).rejects.toThrow(
        new HttpException('Invalid Input', HttpStatus.BAD_REQUEST),
      );
    });

    test('throws an error if the body cannot be parsed', async () => {
      const service = new InMemoryPurchaseService([
        purchase1,
        purchase2,
        purchase3,
      ]);
      const logger = new LoggerService();

      const controller = new PurchaseController(service, vbService, logger);
      const authModel = new NoAuthModel();
      jest.spyOn(authModel, 'userId', 'get').mockReturnValue('userId');

      const request = {
        authModel,
        body: {
          purchase: 'invalid',
        },
      } as unknown as METIncomingMessage;

      await expect(() => controller.addPurchase(request)).rejects.toThrow(
        new HttpException('Invalid Input', HttpStatus.BAD_REQUEST),
      );
    });

    test('throws an error if addPurchase throws an error', async () => {
      const service = new InMemoryPurchaseService([
        purchase1,
        purchase2,
        purchase3,
      ]);
      const logger = new LoggerService();

      const controller = new PurchaseController(service, vbService, logger);
      const authModel = new NoAuthModel();
      jest.spyOn(authModel, 'userId', 'get').mockReturnValue('userId');

      const request = {
        authModel,
        body: {
          purchase: p1JSON,
        },
      } as unknown as METIncomingMessage;

      jest
        .spyOn(service, 'addPurchase')
        .mockRejectedValueOnce(new Error('Test Error'));

      await expect(() => controller.addPurchase(request)).rejects.toThrow(
        new HttpException('Server Error', HttpStatus.INTERNAL_SERVER_ERROR),
      );
    });
  });

  describe('updatePurchase', () => {
    test('updates a purchase in the PurchaseService', async () => {
      const service = new InMemoryPurchaseService([
        purchase1,
        purchase2,
        purchase3,
      ]);
      const logger = new LoggerService();

      const controller = new PurchaseController(service, vbService, logger);

      const updatedPurchase = {
        ...p1JSON,
        purchasedQuantity: 100,
      };

      const request = {
        body: {
          purchase: updatedPurchase,
        },
      } as unknown as Request;

      const updateSpy = jest.spyOn(service, 'updatePurchase');

      const result = await controller.updatePurchase(request);

      expect(result).toEqual({ purchase: purchase1 });
      expect(updateSpy).toHaveBeenCalledTimes(1);
    });

    test('throws an error if the body is invalid', async () => {
      const service = new InMemoryPurchaseService([
        purchase1,
        purchase2,
        purchase3,
      ]);
      const logger = new LoggerService();

      const controller = new PurchaseController(service, vbService, logger);

      const request = {
        body: 'invalid',
      } as unknown as Request;

      await expect(() => controller.updatePurchase(request)).rejects.toThrow(
        new HttpException('Invalid Input', HttpStatus.BAD_REQUEST),
      );
    });

    test('throws an error if the body cannot be parsed', async () => {
      const service = new InMemoryPurchaseService([
        purchase1,
        purchase2,
        purchase3,
      ]);
      const logger = new LoggerService();

      const controller = new PurchaseController(service, vbService, logger);

      const request = {
        body: {
          purchase: 'invalid',
        },
      } as unknown as Request;

      await expect(() => controller.updatePurchase(request)).rejects.toThrow(
        new HttpException('Invalid Input', HttpStatus.BAD_REQUEST),
      );
    });

    test('throws an error if updatePurchase throws an error', async () => {
      const service = new InMemoryPurchaseService([
        purchase1,
        purchase2,
        purchase3,
      ]);
      const logger = new LoggerService();

      const controller = new PurchaseController(service, vbService, logger);

      const request = {
        body: {
          purchase: p1JSON,
        },
      } as unknown as Request;

      jest
        .spyOn(service, 'updatePurchase')
        .mockRejectedValueOnce(new Error('Test Error'));

      await expect(() => controller.updatePurchase(request)).rejects.toThrow(
        new HttpException('Server Error', HttpStatus.INTERNAL_SERVER_ERROR),
      );
    });
  });

  describe('deletePurchase', () => {
    test('deletes a purchase from the PurchaseService', async () => {
      const service = new InMemoryPurchaseService([purchase1]);
      const logger = new LoggerService();

      const controller = new PurchaseController(service, vbService, logger);

      const request = {
        body: {
          purchaseId: purchase1.id,
        },
      } as unknown as Request;

      const deleteSpy = jest.spyOn(service, 'deletePurchase');

      const result = await controller.deletePurchase(request);

      expect(result).toEqual({ purchase: purchase1 });
      expect(service.purchasesList.length).toBe(0);
      expect(deleteSpy).toHaveBeenCalledTimes(1);
    });

    test('throws an error if the body is invalid', async () => {
      const service = new InMemoryPurchaseService([
        purchase1,
        purchase2,
        purchase3,
      ]);
      const logger = new LoggerService();

      const controller = new PurchaseController(service, vbService, logger);

      const request = {
        body: 'invalid',
      } as unknown as Request;

      await expect(() => controller.deletePurchase(request)).rejects.toThrow(
        new HttpException('Invalid Input', HttpStatus.BAD_REQUEST),
      );
    });

    test('throws an error if the body cannot be parsed', async () => {
      const service = new InMemoryPurchaseService([
        purchase1,
        purchase2,
        purchase3,
      ]);
      const logger = new LoggerService();

      const controller = new PurchaseController(service, vbService, logger);

      const request = {
        body: {
          purchaseId: 1,
        },
      } as unknown as Request;

      await expect(() => controller.deletePurchase(request)).rejects.toThrow(
        new HttpException('Invalid Input', HttpStatus.BAD_REQUEST),
      );
    });

    test('throws an error if deletePurchase throws an error', async () => {
      const service = new InMemoryPurchaseService([
        purchase1,
        purchase2,
        purchase3,
      ]);
      const logger = new LoggerService();

      const controller = new PurchaseController(service, vbService, logger);

      const request = {
        body: {
          purchaseId: purchase1.id,
        },
      } as unknown as Request;

      jest
        .spyOn(service, 'deletePurchase')
        .mockRejectedValueOnce(new Error('Test Error'));

      await expect(() => controller.deletePurchase(request)).rejects.toThrow(
        new HttpException('Server Error', HttpStatus.INTERNAL_SERVER_ERROR),
      );
    });
  });
});
