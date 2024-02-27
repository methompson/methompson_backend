import { Purchase, PurchaseJSON } from '@/src/models/action_bank/purchase';
import * as uuid from 'uuid';
import { InMemoryPurchaseService } from './purchase.service.memory';
import { DateTime } from 'luxon';

jest.mock('uuid', () => {
  const v4 = jest.fn(() => 'uuidv4');

  return {
    v4,
  };
});

const uuidv4 = uuid.v4 as jest.Mock<unknown, unknown[]>;

const p1JSON: PurchaseJSON = {
  id: 'id1',
  userId: 'userId1',
  purchasePriceId: 'purchasePriceId1',
  date: '2021-01-01T00:00:00.000Z',
  purchasedQuantity: 1,
};
const p2JSON: PurchaseJSON = {
  id: 'id2',
  userId: 'userId1',
  purchasePriceId: 'purchasePriceId2',
  date: '2021-01-16T00:00:00.000Z',
  purchasedQuantity: 2,
};
const p3JSON: PurchaseJSON = {
  id: 'id3',
  userId: 'userId2',
  purchasePriceId: 'purchasePriceId3',
  date: '2021-01-25T00:00:00.000Z',
  purchasedQuantity: 3,
};

const p1 = Purchase.fromJSON(p1JSON);
const p2 = Purchase.fromJSON(p2JSON);
const p3 = Purchase.fromJSON(p3JSON);

describe('InMemoryPurchaseService', () => {
  describe('purchases', () => {
    test('returns a copy of the purchases', () => {
      const service = new InMemoryPurchaseService([p1, p2, p3]);

      const purchases = service.purchases;

      expect(purchases).toEqual({
        id1: p1,
        id2: p2,
        id3: p3,
      });
    });

    test('if there are no purchases, it returns an empty object', () => {
      const service = new InMemoryPurchaseService();

      const purchases = service.purchases;

      expect(purchases).toEqual({});
      expect(Object.values(purchases).length).toBe(0);
    });

    test('revising the purchases object does not revise the stored version', () => {
      const service = new InMemoryPurchaseService([p1, p2, p3]);

      const purchases = service.purchases;

      delete purchases.id1;

      expect(Object.values(purchases).length).toBe(2);

      expect(service.purchases).toEqual({
        id1: p1,
        id2: p2,
        id3: p3,
      });
      expect(Object.values(service.purchases).length).toBe(3);
    });
  });

  describe('purchasesList', () => {
    test('returns an array of purchases sorted by date', () => {
      const service = new InMemoryPurchaseService([p3, p2, p1]);

      const list = service.purchasesList;

      expect(list.length).toBe(3);
      expect(list).toEqual([p1, p2, p3]);
    });

    test('if there are no purchases, it returns an empty array', () => {
      const service = new InMemoryPurchaseService();

      const list = service.purchasesList;

      expect(list).toEqual([]);
    });

    test('revising the purchasesList array does not revise the stored version', () => {
      const service = new InMemoryPurchaseService([p1, p2]);

      const list = service.purchasesList;

      list.push(p3);

      expect(list.length).toBe(3);
      expect(service.purchasesList).toEqual([p1, p2]);
      expect(service.purchasesList.length).toBe(2);

      list.pop();
      list.pop();

      expect(list.length).toBe(1);
      expect(service.purchasesList).toEqual([p1, p2]);
      expect(service.purchasesList.length).toBe(2);
    });
  });

  describe('getPurchases', () => {
    test('returns an array of purchases', async () => {
      const service = new InMemoryPurchaseService([p1, p2, p3]);

      const result1 = await service.getPurchases({ userId: 'userId1' });
      expect(result1.length).toBe(2);
      expect(result1).toEqual([p1, p2]);

      const result2 = await service.getPurchases({ userId: 'userId2' });
      expect(result2.length).toBe(1);
      expect(result2).toEqual([p3]);
    });

    test('returns paginated purchases if there are more purchases than the pagination', async () => {
      const purchases: Purchase[] = [];

      const baseDate = DateTime.fromISO('2021-02-05T00:00:00.000Z');

      if (!baseDate.isValid) {
        throw new Error('Invalid date');
      }

      for (let i = 4; i < 10; i++) {
        const pJSON: PurchaseJSON = {
          id: `id${i}`,
          userId: 'userId1',
          purchasePriceId: `purchasePriceId${i}`,
          date: baseDate.plus({ days: i }).toISO(),
          purchasedQuantity: i,
        };
        purchases.push(Purchase.fromJSON(pJSON));
      }

      const service = new InMemoryPurchaseService([p1, p2, p3, ...purchases]);

      const p4 = purchases[0];
      const p5 = purchases[1];
      const p6 = purchases[2];

      expect(p4).toBeDefined();
      expect(p5).toBeDefined();
      expect(p6).toBeDefined();

      const result = await service.getPurchases({
        userId: 'userId1',
        page: 1,
        pagination: 5,
      });

      expect(result.length).toBe(5);

      if (!p4 || !p5 || !p6) {
        throw new Error('Invalid purchases');
      }

      expect(result.includes(p1)).toBeTruthy();
      expect(result.includes(p2)).toBeTruthy();
      expect(result.includes(p4)).toBeTruthy();
      expect(result.includes(p5)).toBeTruthy();
      expect(result.includes(p6)).toBeTruthy();
    });

    test('goes to the proper page if a page and pagination are provided', async () => {
      const purchases: Purchase[] = [];

      const baseDate = DateTime.fromISO('2021-02-05T00:00:00.000Z');

      if (!baseDate.isValid) {
        throw new Error('Invalid date');
      }

      for (let i = 4; i < 10; i++) {
        const pJSON: PurchaseJSON = {
          id: `id${i}`,
          userId: 'userId1',
          purchasePriceId: `purchasePriceId${i}`,
          date: baseDate.plus({ days: i }).toISO(),
          purchasedQuantity: i,
        };
        purchases.push(Purchase.fromJSON(pJSON));
      }

      const service = new InMemoryPurchaseService([p1, p2, p3, ...purchases]);

      const p7 = purchases[3];
      const p8 = purchases[4];
      const p9 = purchases[5];

      expect(p7).toBeDefined();
      expect(p8).toBeDefined();
      expect(p9).toBeDefined();

      const result = await service.getPurchases({
        userId: 'userId1',
        page: 2,
        pagination: 5,
      });

      if (!p7 || !p8 || !p9) {
        throw new Error('Invalid purchases');
      }

      expect(result.length).toBe(3);
      expect(result.includes(p7)).toBeTruthy();
      expect(result.includes(p8)).toBeTruthy();
      expect(result.includes(p9)).toBeTruthy();
    });

    test('returns an empty array if the page is beyond the range of purchases', async () => {
      const service = new InMemoryPurchaseService([p1, p2, p3]);

      const result = await service.getPurchases({
        userId: 'userId1',
        page: 2,
        pagination: 5,
      });

      expect(result.length).toBe(0);
    });

    test('returns an empty array if there are no purchases', async () => {
      const service = new InMemoryPurchaseService();

      const result = await service.getPurchases({
        userId: 'userId1',
      });

      expect(result.length).toBe(0);
    });

    test('returns an empty array if the user has no purchases', async () => {
      const service = new InMemoryPurchaseService([p1, p2, p3]);

      const result = await service.getPurchases({
        userId: 'userId3',
      });

      expect(result.length).toBe(0);
    });
  });

  describe('addPurchase', () => {
    test('adds a purchase to the purchases', async () => {
      const someId = 'someId';
      uuidv4.mockReturnValue(someId);

      const service = new InMemoryPurchaseService();

      expect(service.purchasesList.length).toBe(0);

      const result = await service.addPurchase(p1);
      expect(result.toJSON()).toEqual({
        ...p1.toJSON(),
        id: someId,
      });
      expect(service.purchasesList.length).toBe(1);
      expect(service.purchasesList[0]).toBe(result);
    });
  });

  describe('updatePurchase', () => {
    test('replaces the purchase with a new purchase and returns the old purchase', async () => {
      const service = new InMemoryPurchaseService([p1, p2, p3]);

      const newP1 = Purchase.fromJSON({
        ...p1.toJSON(),
        purchasedQuantity: 10,
      });

      const result = await service.updatePurchase(newP1);
      expect(result).toBe(p1);
      expect(service.purchasesList.length).toBe(3);
      expect(service.purchasesList[0]).toBe(newP1);
    });

    test('throws an error if the purchase does not exist', async () => {
      const service = new InMemoryPurchaseService([p1, p2, p3]);

      const newP1 = Purchase.fromJSON({
        ...p1.toJSON(),
        id: 'invalid id',
      });

      await expect(service.updatePurchase(newP1)).rejects.toThrow(
        `Purchase with ID ${newP1.id} not found`,
      );
    });
  });

  describe('deletePurchase', () => {
    test('deletes the purchase and returns the deleted purchase', async () => {
      const service = new InMemoryPurchaseService([p1, p2, p3]);

      expect(service.purchasesList.length).toBe(3);

      const result = await service.deletePurchase(p1.id);

      expect(result).toBe(p1);
      expect(service.purchasesList.length).toBe(2);
      expect(service.purchasesList.includes(p1)).toBeFalsy();
    });

    test('throws an error if the purchase does not exist', async () => {
      const service = new InMemoryPurchaseService([p1, p2, p3]);

      await expect(service.deletePurchase('invalid id')).rejects.toThrow(
        'Purchase with ID invalid id not found',
      );
    });
  });
});
