import { Request } from 'express';
import { HttpException, HttpStatus } from '@nestjs/common';

import {
  PurchasePrice,
  PurchasePriceJSON,
} from '@/src/models/vice_bank/purchase_price';
import { InMemoryPurchasePricesService } from '@/src/vice_bank/services/purchase_prices.service.memory';
import { LoggerService } from '@/src/logger/logger.service';
import { PurchasePricesController } from './purchase_prices.controller';

const pp1JSON: PurchasePriceJSON = {
  id: 'id1',
  vbUserId: 'userId1',
  name: 'name1',
  price: 1,
};
const pp2JSON: PurchasePriceJSON = {
  id: 'id2',
  vbUserId: 'userId1',
  name: 'name2',
  price: 2,
};
const pp3JSON: PurchasePriceJSON = {
  id: 'id3',
  vbUserId: 'userId2',
  name: 'name3',
  price: 3,
};

const pp1 = PurchasePrice.fromJSON(pp1JSON);
const pp2 = PurchasePrice.fromJSON(pp2JSON);
const pp3 = PurchasePrice.fromJSON(pp3JSON);

describe('PurchasePricesController', () => {
  describe('getPurchasePrices', () => {
    test('returns a list of purchase prices', async () => {
      const service = new InMemoryPurchasePricesService([pp1, pp2, pp3]);
      const loggerService = new LoggerService();

      const controller = new PurchasePricesController(service, loggerService);

      const req = {
        query: {
          userId: 'userId1',
        },
      } as unknown as Request;

      const purchasePrices = await controller.getPurchasePrices(req);

      expect(purchasePrices).toEqual({ purchasePrices: [pp1, pp2] });
    });

    test('respects page / pagination if provided', async () => {
      const service = new InMemoryPurchasePricesService([pp1, pp2, pp3]);
      const loggerService = new LoggerService();

      const controller = new PurchasePricesController(service, loggerService);

      const req1 = {
        query: {
          userId: 'userId1',
          page: '1',
          pagination: '1',
        },
      } as unknown as Request;

      const result1 = await controller.getPurchasePrices(req1);

      expect(result1).toEqual({ purchasePrices: [pp1] });

      const req2 = {
        query: {
          userId: 'userId1',
          page: '2',
          pagination: '1',
        },
      } as unknown as Request;

      const result2 = await controller.getPurchasePrices(req2);

      expect(result2).toStrictEqual({ purchasePrices: [pp2] });

      const req3 = {
        query: {
          userId: 'userId1',
          page: '3',
          pagination: '1',
        },
      } as unknown as Request;

      const result3 = await controller.getPurchasePrices(req3);

      expect(result3).toEqual({ purchasePrices: [] });
    });

    test('if there are no purchase prices, it returns an empty list', async () => {
      const service = new InMemoryPurchasePricesService();
      const loggerService = new LoggerService();

      const controller = new PurchasePricesController(service, loggerService);

      const req = {
        query: {
          userId: 'userId1',
        },
      } as unknown as Request;

      const purchasePrices = await controller.getPurchasePrices(req);

      expect(purchasePrices).toEqual({ purchasePrices: [] });
    });

    test('throws an error if the user id is not a string', async () => {
      const service = new InMemoryPurchasePricesService();
      const loggerService = new LoggerService();

      const controller = new PurchasePricesController(service, loggerService);

      const req = {
        query: {
          userId: 123,
        },
      } as unknown as Request;

      expect(() => controller.getPurchasePrices(req)).rejects.toThrow(
        new HttpException('Invalid Input', HttpStatus.BAD_REQUEST),
      );
    });

    test('throws an error if getPurchasePrices throws an error', async () => {
      const service = new InMemoryPurchasePricesService();
      const loggerService = new LoggerService();

      const controller = new PurchasePricesController(service, loggerService);

      const req = {
        query: {
          userId: 'userId1',
        },
      } as unknown as Request;

      jest
        .spyOn(service, 'getPurchasePrices')
        .mockRejectedValue(new Error('Test Error'));

      expect(() => controller.getPurchasePrices(req)).rejects.toThrow(
        new HttpException('Server Error', HttpStatus.INTERNAL_SERVER_ERROR),
      );
    });
  });

  describe('addPurchasePrice', () => {
    test('adds a purchase price', async () => {
      const service = new InMemoryPurchasePricesService();
      const loggerService = new LoggerService();

      const controller = new PurchasePricesController(service, loggerService);

      const req = {
        body: {
          purchasePrice: pp1JSON,
        },
      } as unknown as Request;

      jest.spyOn(service, 'addPurchasePrice').mockResolvedValue(pp1);

      const purchasePrice = await controller.addPurchasePrice(req);

      expect(purchasePrice).toStrictEqual({ purchasePrice: pp1 });
    });

    test('throws an error if the body is not a record', async () => {
      const service = new InMemoryPurchasePricesService();
      const loggerService = new LoggerService();

      const controller = new PurchasePricesController(service, loggerService);

      const req = {} as unknown as Request;

      expect(() => controller.addPurchasePrice(req)).rejects.toThrow(
        new HttpException('Invalid Input', HttpStatus.BAD_REQUEST),
      );
    });

    test('throws an err if the body cannot be parsed', async () => {
      const service = new InMemoryPurchasePricesService();
      const loggerService = new LoggerService();

      const controller = new PurchasePricesController(service, loggerService);

      const req = {
        body: {
          purchasePrice: 'not a purchase price',
        },
      } as unknown as Request;

      expect(() => controller.addPurchasePrice(req)).rejects.toThrow(
        new HttpException('Invalid Input', HttpStatus.BAD_REQUEST),
      );
    });

    test('throws an error if addPurchasePrice throws an error', async () => {
      const service = new InMemoryPurchasePricesService();
      const loggerService = new LoggerService();

      const controller = new PurchasePricesController(service, loggerService);

      const req = {
        body: {
          purchasePrice: pp1JSON,
        },
      } as unknown as Request;

      jest
        .spyOn(service, 'addPurchasePrice')
        .mockRejectedValue(new Error('Test Error'));

      expect(() => controller.addPurchasePrice(req)).rejects.toThrow(
        new HttpException('Server Error', HttpStatus.INTERNAL_SERVER_ERROR),
      );
    });
  });

  describe('updatePurchasePrice', () => {
    test('updates a purchase price', async () => {
      const service = new InMemoryPurchasePricesService([pp1]);
      const loggerService = new LoggerService();

      const controller = new PurchasePricesController(service, loggerService);

      const updatedpp1JSON = {
        ...pp1JSON,
        price: 100,
      };

      const req = {
        body: {
          purchasePrice: updatedpp1JSON,
        },
      } as unknown as Request;

      const purchasePrice = await controller.updatePurchasePrice(req);

      expect(purchasePrice).toStrictEqual({ purchasePrice: pp1 });
      expect(service.purchasePricesList[0]?.toJSON()).toEqual(updatedpp1JSON);
    });

    test('throws an error if the body is not a record', async () => {
      const service = new InMemoryPurchasePricesService();
      const loggerService = new LoggerService();

      const controller = new PurchasePricesController(service, loggerService);

      const req = {} as unknown as Request;

      expect(() => controller.updatePurchasePrice(req)).rejects.toThrow(
        new HttpException('Invalid Input', HttpStatus.BAD_REQUEST),
      );
    });

    test('throws an error if the body cannot be parsed', async () => {
      const service = new InMemoryPurchasePricesService();
      const loggerService = new LoggerService();

      const controller = new PurchasePricesController(service, loggerService);

      const req = {
        body: {
          purchasePrice: 'not a purchase price',
        },
      } as unknown as Request;

      expect(() => controller.updatePurchasePrice(req)).rejects.toThrow(
        new HttpException('Invalid Input', HttpStatus.BAD_REQUEST),
      );
    });

    test('throws an error if updatePurchasePrice throws an error', async () => {
      const service = new InMemoryPurchasePricesService();
      const loggerService = new LoggerService();

      const controller = new PurchasePricesController(service, loggerService);

      const req = {
        body: {
          purchasePrice: pp1JSON,
        },
      } as unknown as Request;

      jest
        .spyOn(service, 'updatePurchasePrice')
        .mockRejectedValue(new Error('Test Error'));

      expect(() => controller.updatePurchasePrice(req)).rejects.toThrow(
        new HttpException('Server Error', HttpStatus.INTERNAL_SERVER_ERROR),
      );
    });
  });

  describe('deletePurchasePrice', () => {
    test('deletes a purchase price', async () => {
      const service = new InMemoryPurchasePricesService([pp1]);
      const loggerService = new LoggerService();

      const controller = new PurchasePricesController(service, loggerService);

      const req = {
        body: {
          purchasePriceId: pp1.id,
        },
      } as unknown as Request;

      const purchasePrice = await controller.deletePurchasePrice(req);

      expect(purchasePrice).toStrictEqual({ purchasePrice: pp1 });
      expect(service.purchasePricesList.length).toBe(0);
    });

    test('throws an error if the body is not a record', async () => {
      const service = new InMemoryPurchasePricesService();
      const loggerService = new LoggerService();

      const controller = new PurchasePricesController(service, loggerService);

      const req = {} as unknown as Request;

      expect(() => controller.deletePurchasePrice(req)).rejects.toThrow(
        new HttpException('Invalid Input', HttpStatus.BAD_REQUEST),
      );
    });

    test('throws an error if purchasePriceId is not a string', async () => {
      const service = new InMemoryPurchasePricesService();
      const loggerService = new LoggerService();

      const controller = new PurchasePricesController(service, loggerService);

      const req = {
        body: {
          purchasePriceId: 123,
        },
      } as unknown as Request;

      expect(() => controller.deletePurchasePrice(req)).rejects.toThrow(
        new HttpException('Invalid Input', HttpStatus.BAD_REQUEST),
      );
    });

    test('throws an error if deletePurchasePrice throws an error', async () => {
      const service = new InMemoryPurchasePricesService();
      const loggerService = new LoggerService();

      const controller = new PurchasePricesController(service, loggerService);

      const req = {
        body: {
          purchasePriceId: pp1.id,
        },
      } as unknown as Request;

      jest
        .spyOn(service, 'deletePurchasePrice')
        .mockRejectedValue(new Error('Test Error'));

      expect(() => controller.deletePurchasePrice(req)).rejects.toThrow(
        new HttpException('Server Error', HttpStatus.INTERNAL_SERVER_ERROR),
      );
    });
  });
});
