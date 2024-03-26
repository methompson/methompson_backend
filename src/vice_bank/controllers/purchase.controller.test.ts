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
import {
  PurchasePrice,
  PurchasePriceJSON,
} from '@/src/models/vice_bank/purchase_price';
import { InMemoryViceBankUserService } from '@/src/vice_bank/services/vice_bank_user.service.memory';
import { NoAuthModel } from '@/src/models/auth_model';
import { METIncomingMessage } from '@/src/utils/met_incoming_message';

const userId = 'userId';

const purchasedName = 'purchasedName';

const vbUserId1 = 'vbUserId1';
const vbUserId2 = 'vbUserId2';
const vbUserId3 = 'vbUserId3';

const pp1JSON: PurchasePriceJSON = {
  id: 'id1',
  vbUserId: vbUserId1,
  name: 'name1',
  price: 1,
};
const pp2JSON: PurchasePriceJSON = {
  id: 'id2',
  vbUserId: vbUserId1,
  name: 'name2',
  price: 2,
};
const pp3JSON: PurchasePriceJSON = {
  id: 'id3',
  vbUserId: vbUserId2,
  name: 'name3',
  price: 3,
};

const pp1 = PurchasePrice.fromJSON(pp1JSON);
const pp2 = PurchasePrice.fromJSON(pp2JSON);
const pp3 = PurchasePrice.fromJSON(pp3JSON);

const p1JSON: PurchaseJSON = {
  id: 'id1',
  vbUserId: vbUserId1,
  purchasedName,
  purchasePriceId: pp1.id,
  date: '2021-01-01T00:00:00.000-06:00',
  purchasedQuantity: 1,
};
const p2JSON: PurchaseJSON = {
  id: 'id2',
  vbUserId: vbUserId1,
  purchasedName,
  purchasePriceId: pp2.id,
  date: '2021-01-12T00:00:00.000-06:00',
  purchasedQuantity: 2,
};
const p3JSON: PurchaseJSON = {
  id: 'id3',
  vbUserId: vbUserId2,
  purchasedName,
  purchasePriceId: pp3.id,
  date: '2021-01-25T00:00:00.000-06:00',
  purchasedQuantity: 3,
};

const purchase1 = Purchase.fromJSON(p1JSON);
const purchase2 = Purchase.fromJSON(p2JSON);
const purchase3 = Purchase.fromJSON(p3JSON);

const user1JSON: ViceBankUserJSON = {
  id: vbUserId1,
  userId,
  name: 'name1',
  currentTokens: 1,
};
const user2JSON: ViceBankUserJSON = {
  id: vbUserId2,
  userId,
  name: 'name2',
  currentTokens: 2,
};
const user3JSON: ViceBankUserJSON = {
  id: vbUserId3,
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
      const service = new InMemoryPurchaseService({
        purchases: [purchase1, purchase2, purchase3],
      });
      const logger = new LoggerService();

      const controller = new PurchaseController(service, vbService, logger);

      const request = {
        query: {
          userId: vbUserId1,
        },
      } as unknown as Request;

      const getSpy = jest.spyOn(service, 'getPurchases');

      const result = await controller.getPurchases(request);

      expect(result).toEqual({ purchases: [p1JSON, p2JSON] });
      expect(getSpy).toHaveBeenCalledTimes(1);
      expect(getSpy).toHaveBeenCalledWith({
        page: 1,
        pagination: 10,
        userId: vbUserId1,
        startDate: undefined,
        endDate: undefined,
        purchasePriceId: undefined,
      });
    });

    test('start date and end date get passed to the PurchaseService', async () => {
      const service = new InMemoryPurchaseService({
        purchases: [purchase1, purchase2, purchase3],
      });
      const logger = new LoggerService();

      const controller = new PurchaseController(service, vbService, logger);

      const request1 = {
        query: {
          userId: vbUserId1,
          startDate: '2021-01-01',
          endDate: '2021-01-05',
        },
      } as unknown as Request;

      const getSpy = jest.spyOn(service, 'getPurchases');

      const result1 = await controller.getPurchases(request1);

      expect(result1).toEqual({ purchases: [p1JSON] });

      expect(getSpy).toHaveBeenCalledTimes(1);
      expect(getSpy).toHaveBeenCalledWith({
        page: 1,
        pagination: 10,
        userId: vbUserId1,
        startDate: '2021-01-01',
        endDate: '2021-01-05',
        purchasePriceId: undefined,
      });

      const request2 = {
        query: {
          userId: vbUserId1,
          startDate: '2021-01-05',
          endDate: '2021-01-20',
        },
      } as unknown as Request;
      const result2 = await controller.getPurchases(request2);

      expect(result2).toEqual({ purchases: [p2JSON] });
    });

    test('throws an error if the query is invalid', async () => {
      const service = new InMemoryPurchaseService({
        purchases: [purchase1, purchase2, purchase3],
      });
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
      const service = new InMemoryPurchaseService({
        purchases: [purchase1, purchase2, purchase3],
      });
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
      const service = new InMemoryPurchaseService({
        purchases: [purchase1, purchase2, purchase3],
      });
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
      jest.spyOn(authModel, 'userId', 'get').mockReturnValue(userId);

      const request = {
        authModel,
        body: {
          purchase: p1JSON,
        },
      } as unknown as METIncomingMessage;

      const addSpy = jest.spyOn(service, 'addPurchase');
      addSpy.mockResolvedValue(purchase1);

      const result = await controller.addPurchase(request);

      expect(result).toEqual({
        purchase: purchase1.toJSON(),
        currentTokens: 0,
      });
      expect(addSpy).toHaveBeenCalledTimes(1);
    });

    test('throws an error if the body is invalid', async () => {
      const service = new InMemoryPurchaseService({
        purchases: [purchase1, purchase2, purchase3],
      });
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
      const service = new InMemoryPurchaseService({
        purchases: [purchase1, purchase2, purchase3],
      });
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
      const service = new InMemoryPurchaseService({
        purchases: [purchase1, purchase2, purchase3],
      });
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
      const service = new InMemoryPurchaseService({
        purchases: [purchase1, purchase2, purchase3],
        purchasePrices: [pp1, pp2, pp3],
      });
      const logger = new LoggerService();

      const controller = new PurchaseController(service, vbService, logger);

      const updatedPurchase = {
        ...p1JSON,
        purchasedQuantity: 100,
      };

      const getUserSpy = jest.spyOn(vbService, 'getViceBankUser');
      const updateUserSpy = jest.spyOn(vbService, 'updateViceBankUser');

      const request = {
        body: {
          purchase: updatedPurchase,
        },
      } as unknown as Request;

      const currentTokens =
        user1.currentTokens +
        updatedPurchase.purchasedQuantity * pp1.price -
        purchase1.purchasedQuantity * pp1.price;

      const updateSpy = jest.spyOn(service, 'updatePurchase');

      const result = await controller.updatePurchase(request);

      expect(result).toEqual({
        purchase: updatedPurchase,
        oldPurchase: purchase1.toJSON(),
        currentTokens,
      });
      expect(updateSpy).toHaveBeenCalledTimes(1);

      expect(getUserSpy).toHaveBeenCalledTimes(1);
      expect(getUserSpy).toHaveBeenCalledWith(vbUserId1);

      expect(updateUserSpy).toHaveBeenCalledTimes(1);
      expect(updateUserSpy).toHaveBeenCalledWith(
        user1.copyWith({ currentTokens }),
      );
    });

    test('throws an error if the body is invalid', async () => {
      const service = new InMemoryPurchaseService({
        purchases: [purchase1, purchase2, purchase3],
      });
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
      const service = new InMemoryPurchaseService({
        purchases: [purchase1, purchase2, purchase3],
      });
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
      const service = new InMemoryPurchaseService({
        purchases: [purchase1, purchase2, purchase3],
      });
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
      const service = new InMemoryPurchaseService({
        purchases: [purchase1],
        purchasePrices: [pp1, pp2, pp3],
      });
      const logger = new LoggerService();

      const controller = new PurchaseController(service, vbService, logger);

      const getUserSpy = jest.spyOn(vbService, 'getViceBankUser');
      const updateUserSpy = jest.spyOn(vbService, 'updateViceBankUser');

      const request = {
        body: {
          purchaseId: purchase1.id,
        },
      } as unknown as Request;

      const deleteSpy = jest.spyOn(service, 'deletePurchase');

      const result = await controller.deletePurchase(request);

      const currentTokens =
        user1.currentTokens + purchase1.purchasedQuantity * pp1.price * -1;

      expect(result).toEqual({ purchase: purchase1.toJSON(), currentTokens });
      expect(service.purchasesList.length).toBe(0);
      expect(deleteSpy).toHaveBeenCalledTimes(1);

      expect(getUserSpy).toHaveBeenCalledTimes(1);
      expect(getUserSpy).toHaveBeenCalledWith(vbUserId1);

      expect(updateUserSpy).toHaveBeenCalledTimes(1);
      expect(updateUserSpy).toHaveBeenCalledWith(
        user1.copyWith({ currentTokens }),
      );
    });

    test('throws an error if the body is invalid', async () => {
      const service = new InMemoryPurchaseService({
        purchases: [purchase1, purchase2, purchase3],
      });
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
      const service = new InMemoryPurchaseService({
        purchases: [purchase1, purchase2, purchase3],
      });
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
      const service = new InMemoryPurchaseService({
        purchases: [purchase1, purchase2, purchase3],
      });
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

  describe('getPurchasePrices', () => {
    test('returns a list of purchase prices', async () => {
      const service = new InMemoryPurchaseService({
        purchasePrices: [pp1, pp2, pp3],
      });
      const loggerService = new LoggerService();

      const controller = new PurchaseController(
        service,
        vbService,
        loggerService,
      );

      const req = {
        query: {
          userId: vbUserId1,
        },
      } as unknown as Request;

      const purchasePrices = await controller.getPurchasePrices(req);

      expect(purchasePrices).toEqual({ purchasePrices: [pp1, pp2] });
    });

    test('respects page / pagination if provided', async () => {
      const service = new InMemoryPurchaseService({
        purchasePrices: [pp1, pp2, pp3],
      });
      const loggerService = new LoggerService();

      const controller = new PurchaseController(
        service,
        vbService,
        loggerService,
      );

      const req1 = {
        query: {
          userId: vbUserId1,
          page: '1',
          pagination: '1',
        },
      } as unknown as Request;

      const result1 = await controller.getPurchasePrices(req1);

      expect(result1).toEqual({ purchasePrices: [pp1] });

      const req2 = {
        query: {
          userId: vbUserId1,
          page: '2',
          pagination: '1',
        },
      } as unknown as Request;

      const result2 = await controller.getPurchasePrices(req2);

      expect(result2).toStrictEqual({ purchasePrices: [pp2] });

      const req3 = {
        query: {
          userId: vbUserId1,
          page: '3',
          pagination: '1',
        },
      } as unknown as Request;

      const result3 = await controller.getPurchasePrices(req3);

      expect(result3).toEqual({ purchasePrices: [] });
    });

    test('if there are no purchase prices, it returns an empty list', async () => {
      const service = new InMemoryPurchaseService();
      const loggerService = new LoggerService();

      const controller = new PurchaseController(
        service,
        vbService,
        loggerService,
      );

      const req = {
        query: {
          userId: 'userId1',
        },
      } as unknown as Request;

      const purchasePrices = await controller.getPurchasePrices(req);

      expect(purchasePrices).toEqual({ purchasePrices: [] });
    });

    test('throws an error if the user id is not a string', async () => {
      const service = new InMemoryPurchaseService();
      const loggerService = new LoggerService();

      const controller = new PurchaseController(
        service,
        vbService,
        loggerService,
      );

      const req = {
        query: {
          userId: 123,
        },
      } as unknown as Request;

      await expect(() => controller.getPurchasePrices(req)).rejects.toThrow(
        new HttpException('Invalid Input', HttpStatus.BAD_REQUEST),
      );
    });

    test('throws an error if getPurchasePrices throws an error', async () => {
      const service = new InMemoryPurchaseService();
      const loggerService = new LoggerService();

      const controller = new PurchaseController(
        service,
        vbService,
        loggerService,
      );

      const req = {
        query: {
          userId: 'userId1',
        },
      } as unknown as Request;

      jest
        .spyOn(service, 'getPurchasePrices')
        .mockRejectedValue(new Error('Test Error'));

      await expect(() => controller.getPurchasePrices(req)).rejects.toThrow(
        new HttpException('Server Error', HttpStatus.INTERNAL_SERVER_ERROR),
      );
    });
  });

  describe('addPurchasePrice', () => {
    test('adds a purchase price', async () => {
      const service = new InMemoryPurchaseService();
      const loggerService = new LoggerService();

      const controller = new PurchaseController(
        service,
        vbService,
        loggerService,
      );

      const req = {
        body: {
          purchasePrice: pp1JSON,
        },
      } as unknown as Request;

      jest.spyOn(service, 'addPurchasePrice').mockResolvedValue(pp1);

      const purchasePrice = await controller.addPurchasePrice(req);

      expect(purchasePrice).toStrictEqual({ purchasePrice: pp1JSON });
    });

    test('throws an error if the body is not a record', async () => {
      const service = new InMemoryPurchaseService();
      const loggerService = new LoggerService();

      const controller = new PurchaseController(
        service,
        vbService,
        loggerService,
      );

      const req = {} as unknown as Request;

      await expect(() => controller.addPurchasePrice(req)).rejects.toThrow(
        new HttpException('Invalid Input', HttpStatus.BAD_REQUEST),
      );
    });

    test('throws an err if the body cannot be parsed', async () => {
      const service = new InMemoryPurchaseService();
      const loggerService = new LoggerService();

      const controller = new PurchaseController(
        service,
        vbService,
        loggerService,
      );

      const req = {
        body: {
          purchasePrice: 'not a purchase price',
        },
      } as unknown as Request;

      await expect(() => controller.addPurchasePrice(req)).rejects.toThrow(
        new HttpException('Invalid Input', HttpStatus.BAD_REQUEST),
      );
    });

    test('throws an error if addPurchasePrice throws an error', async () => {
      const service = new InMemoryPurchaseService();
      const loggerService = new LoggerService();

      const controller = new PurchaseController(
        service,
        vbService,
        loggerService,
      );

      const req = {
        body: {
          purchasePrice: pp1JSON,
        },
      } as unknown as Request;

      jest
        .spyOn(service, 'addPurchasePrice')
        .mockRejectedValue(new Error('Test Error'));

      await expect(() => controller.addPurchasePrice(req)).rejects.toThrow(
        new HttpException('Server Error', HttpStatus.INTERNAL_SERVER_ERROR),
      );
    });
  });

  describe('updatePurchasePrice', () => {
    test('updates a purchase price', async () => {
      const service = new InMemoryPurchaseService({ purchasePrices: [pp1] });
      const loggerService = new LoggerService();

      const controller = new PurchaseController(
        service,
        vbService,
        loggerService,
      );

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

      expect(purchasePrice).toStrictEqual({ purchasePrice: pp1JSON });
      expect(service.purchasePricesList[0]?.toJSON()).toEqual(updatedpp1JSON);
    });

    test('throws an error if the body is not a record', async () => {
      const service = new InMemoryPurchaseService();
      const loggerService = new LoggerService();

      const controller = new PurchaseController(
        service,
        vbService,
        loggerService,
      );

      const req = {} as unknown as Request;

      await expect(() => controller.updatePurchasePrice(req)).rejects.toThrow(
        new HttpException('Invalid Input', HttpStatus.BAD_REQUEST),
      );
    });

    test('throws an error if the body cannot be parsed', async () => {
      const service = new InMemoryPurchaseService();
      const loggerService = new LoggerService();

      const controller = new PurchaseController(
        service,
        vbService,
        loggerService,
      );

      const req = {
        body: {
          purchasePrice: 'not a purchase price',
        },
      } as unknown as Request;

      await expect(() => controller.updatePurchasePrice(req)).rejects.toThrow(
        new HttpException('Invalid Input', HttpStatus.BAD_REQUEST),
      );
    });

    test('throws an error if updatePurchasePrice throws an error', async () => {
      const service = new InMemoryPurchaseService();
      const loggerService = new LoggerService();

      const controller = new PurchaseController(
        service,
        vbService,
        loggerService,
      );

      const req = {
        body: {
          purchasePrice: pp1JSON,
        },
      } as unknown as Request;

      jest
        .spyOn(service, 'updatePurchasePrice')
        .mockRejectedValue(new Error('Test Error'));

      await expect(() => controller.updatePurchasePrice(req)).rejects.toThrow(
        new HttpException('Server Error', HttpStatus.INTERNAL_SERVER_ERROR),
      );
    });
  });

  describe('deletePurchasePrice', () => {
    test('deletes a purchase price', async () => {
      const service = new InMemoryPurchaseService({ purchasePrices: [pp1] });
      const loggerService = new LoggerService();

      const controller = new PurchaseController(
        service,
        vbService,
        loggerService,
      );

      const req = {
        body: {
          purchasePriceId: pp1.id,
        },
      } as unknown as Request;

      const purchasePrice = await controller.deletePurchasePrice(req);

      expect(purchasePrice).toStrictEqual({ purchasePrice: pp1JSON });
      expect(service.purchasePricesList.length).toBe(0);
    });

    test('throws an error if the body is not a record', async () => {
      const service = new InMemoryPurchaseService();
      const loggerService = new LoggerService();

      const controller = new PurchaseController(
        service,
        vbService,
        loggerService,
      );

      const req = {} as unknown as Request;

      await expect(() => controller.deletePurchasePrice(req)).rejects.toThrow(
        new HttpException('Invalid Input', HttpStatus.BAD_REQUEST),
      );
    });

    test('throws an error if purchasePriceId is not a string', async () => {
      const service = new InMemoryPurchaseService();
      const loggerService = new LoggerService();

      const controller = new PurchaseController(
        service,
        vbService,
        loggerService,
      );

      const req = {
        body: {
          purchasePriceId: 123,
        },
      } as unknown as Request;

      await expect(() => controller.deletePurchasePrice(req)).rejects.toThrow(
        new HttpException('Invalid Input', HttpStatus.BAD_REQUEST),
      );
    });

    test('throws an error if deletePurchasePrice throws an error', async () => {
      const service = new InMemoryPurchaseService();
      const loggerService = new LoggerService();

      const controller = new PurchaseController(
        service,
        vbService,
        loggerService,
      );

      const req = {
        body: {
          purchasePriceId: pp1.id,
        },
      } as unknown as Request;

      jest
        .spyOn(service, 'deletePurchasePrice')
        .mockRejectedValue(new Error('Test Error'));

      await expect(() => controller.deletePurchasePrice(req)).rejects.toThrow(
        new HttpException('Server Error', HttpStatus.INTERNAL_SERVER_ERROR),
      );
    });
  });
});
