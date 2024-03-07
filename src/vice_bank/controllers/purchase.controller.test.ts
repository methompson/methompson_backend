import { HttpException, HttpStatus } from '@nestjs/common';
import { Request } from 'express';

import { Purchase, PurchaseJSON } from '@/src/models/vice_bank/purchase';
import { LoggerService } from '@/src/logger/logger.service';
import { InMemoryPurchaseService } from '@/src/vice_bank/services/purchase.service.memory';
import { PurchaseController } from './purchase.controller';

const p1JSON: PurchaseJSON = {
  id: 'id1',
  userId: 'userId1',
  purchasePriceId: 'purchasePriceId1',
  date: '2021-01-01T00:00:00.000-06:00',
  purchasedQuantity: 1,
};
const p2JSON: PurchaseJSON = {
  id: 'id2',
  userId: 'userId1',
  purchasePriceId: 'purchasePriceId2',
  date: '2021-01-12T00:00:00.000-06:00',
  purchasedQuantity: 2,
};
const p3JSON: PurchaseJSON = {
  id: 'id3',
  userId: 'userId2',
  purchasePriceId: 'purchasePriceId3',
  date: '2021-01-25T00:00:00.000-06:00',
  purchasedQuantity: 3,
};

const purchase1 = Purchase.fromJSON(p1JSON);
const purchase2 = Purchase.fromJSON(p2JSON);
const purchase3 = Purchase.fromJSON(p3JSON);

describe('Purchase Controller', () => {
  describe('getPurchases', () => {
    test('gets purchases from the PurchaseService', async () => {
      const service = new InMemoryPurchaseService([
        purchase1,
        purchase2,
        purchase3,
      ]);
      const logger = new LoggerService();

      const controller = new PurchaseController(service, logger);

      const request = {
        query: {
          userId: 'userId1',
        },
      } as unknown as Request;

      const getSpy = jest.spyOn(service, 'getPurchases');

      const result = await controller.getPurchases(request);

      expect(result).toEqual([purchase1, purchase2]);
      expect(getSpy).toHaveBeenCalledTimes(1);
      expect(getSpy).toHaveBeenCalledWith({
        page: 1,
        pagination: 10,
        userId: 'userId1',
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

      const controller = new PurchaseController(service, logger);

      const request1 = {
        query: {
          userId: 'userId1',
          startDate: '2021-01-01',
          endDate: '2021-01-05',
        },
      } as unknown as Request;

      const getSpy = jest.spyOn(service, 'getPurchases');

      const result1 = await controller.getPurchases(request1);

      expect(result1).toEqual([purchase1]);

      expect(getSpy).toHaveBeenCalledTimes(1);
      expect(getSpy).toHaveBeenCalledWith({
        page: 1,
        pagination: 10,
        userId: 'userId1',
        startDate: '2021-01-01',
        endDate: '2021-01-05',
        purchasePriceId: undefined,
      });

      const request2 = {
        query: {
          userId: 'userId1',
          startDate: '2021-01-05',
          endDate: '2021-01-20',
        },
      } as unknown as Request;
      const result2 = await controller.getPurchases(request2);

      expect(result2).toEqual([purchase2]);
    });

    test('throws an error if the query is invalid', async () => {
      const service = new InMemoryPurchaseService([
        purchase1,
        purchase2,
        purchase3,
      ]);
      const logger = new LoggerService();

      const controller = new PurchaseController(service, logger);

      const request = {
        query: 'invalid',
      } as unknown as Request;

      expect(() => controller.getPurchases(request)).rejects.toThrow(
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

      const controller = new PurchaseController(service, logger);

      const request = {
        query: {
          userId: 1,
        },
      } as unknown as Request;

      expect(() => controller.getPurchases(request)).rejects.toThrow(
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

      const controller = new PurchaseController(service, logger);

      const request = {
        query: {
          userId: 'userId1',
        },
      } as unknown as Request;

      jest
        .spyOn(service, 'getPurchases')
        .mockRejectedValueOnce(new Error('Test Error'));

      expect(() => controller.getPurchases(request)).rejects.toThrow(
        new HttpException('Server Error', HttpStatus.INTERNAL_SERVER_ERROR),
      );
    });
  });

  describe('addPurchase', () => {
    test('adds a purchase to the PurchaseService', async () => {
      const service = new InMemoryPurchaseService();
      const logger = new LoggerService();

      const controller = new PurchaseController(service, logger);

      const request = {
        body: {
          purchase: p1JSON,
        },
      } as unknown as Request;

      const addSpy = jest.spyOn(service, 'addPurchase');
      addSpy.mockResolvedValue(purchase1);

      const result = await controller.addPurchase(request);

      expect(result).toEqual(purchase1);
      expect(addSpy).toHaveBeenCalledTimes(1);
    });

    test('throws an error if the body is invalid', async () => {
      const service = new InMemoryPurchaseService([
        purchase1,
        purchase2,
        purchase3,
      ]);
      const logger = new LoggerService();

      const controller = new PurchaseController(service, logger);

      const request = {
        body: 'invalid',
      } as unknown as Request;

      expect(() => controller.addPurchase(request)).rejects.toThrow(
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

      const controller = new PurchaseController(service, logger);

      const request = {
        body: {
          purchase: 'invalid',
        },
      } as unknown as Request;

      expect(() => controller.addPurchase(request)).rejects.toThrow(
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

      const controller = new PurchaseController(service, logger);

      const request = {
        body: {
          purchase: p1JSON,
        },
      } as unknown as Request;

      jest
        .spyOn(service, 'addPurchase')
        .mockRejectedValueOnce(new Error('Test Error'));

      expect(() => controller.addPurchase(request)).rejects.toThrow(
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

      const controller = new PurchaseController(service, logger);

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

      expect(result).toBe(purchase1);
      expect(updateSpy).toHaveBeenCalledTimes(1);
    });

    test('throws an error if the body is invalid', async () => {
      const service = new InMemoryPurchaseService([
        purchase1,
        purchase2,
        purchase3,
      ]);
      const logger = new LoggerService();

      const controller = new PurchaseController(service, logger);

      const request = {
        body: 'invalid',
      } as unknown as Request;

      expect(() => controller.updatePurchase(request)).rejects.toThrow(
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

      const controller = new PurchaseController(service, logger);

      const request = {
        body: {
          purchase: 'invalid',
        },
      } as unknown as Request;

      expect(() => controller.updatePurchase(request)).rejects.toThrow(
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

      const controller = new PurchaseController(service, logger);

      const request = {
        body: {
          purchase: p1JSON,
        },
      } as unknown as Request;

      jest
        .spyOn(service, 'updatePurchase')
        .mockRejectedValueOnce(new Error('Test Error'));

      expect(() => controller.updatePurchase(request)).rejects.toThrow(
        new HttpException('Server Error', HttpStatus.INTERNAL_SERVER_ERROR),
      );
    });
  });

  describe('deletePurchase', () => {
    test('deletes a purchase from the PurchaseService', async () => {
      const service = new InMemoryPurchaseService([purchase1]);
      const logger = new LoggerService();

      const controller = new PurchaseController(service, logger);

      const request = {
        body: {
          purchaseId: purchase1.id,
        },
      } as unknown as Request;

      const deleteSpy = jest.spyOn(service, 'deletePurchase');

      const result = await controller.deletePurchase(request);

      expect(result).toBe(purchase1);
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

      const controller = new PurchaseController(service, logger);

      const request = {
        body: 'invalid',
      } as unknown as Request;

      expect(() => controller.deletePurchase(request)).rejects.toThrow(
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

      const controller = new PurchaseController(service, logger);

      const request = {
        body: {
          purchaseId: 1,
        },
      } as unknown as Request;

      expect(() => controller.deletePurchase(request)).rejects.toThrow(
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

      const controller = new PurchaseController(service, logger);

      const request = {
        body: {
          purchaseId: purchase1.id,
        },
      } as unknown as Request;

      jest
        .spyOn(service, 'deletePurchase')
        .mockRejectedValueOnce(new Error('Test Error'));

      expect(() => controller.deletePurchase(request)).rejects.toThrow(
        new HttpException('Server Error', HttpStatus.INTERNAL_SERVER_ERROR),
      );
    });
  });
});
