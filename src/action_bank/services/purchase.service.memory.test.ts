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
  date: '2021-01-12T00:00:00.000Z',
  purchasedQuantity: 2,
};
const p3JSON: PurchaseJSON = {
  id: 'id3',
  userId: 'userId2',
  purchasePriceId: 'purchasePriceId3',
  date: '2021-01-25T00:00:00.000Z',
  purchasedQuantity: 3,
};

const purchase1 = Purchase.fromJSON(p1JSON);
const purchase2 = Purchase.fromJSON(p2JSON);
const purchase3 = Purchase.fromJSON(p3JSON);

describe('InMemoryPurchaseService', () => {
  describe('purchases', () => {
    test('returns a copy of the purchases', () => {
      const service = new InMemoryPurchaseService([
        purchase1,
        purchase2,
        purchase3,
      ]);

      const purchases = service.purchases;

      expect(purchases).toEqual({
        id1: purchase1,
        id2: purchase2,
        id3: purchase3,
      });
    });

    test('if there are no purchases, it returns an empty object', () => {
      const service = new InMemoryPurchaseService();

      const purchases = service.purchases;

      expect(purchases).toEqual({});
      expect(Object.values(purchases).length).toBe(0);
    });

    test('revising the purchases object does not revise the stored version', () => {
      const service = new InMemoryPurchaseService([
        purchase1,
        purchase2,
        purchase3,
      ]);

      const purchases = service.purchases;

      delete purchases.id1;

      expect(Object.values(purchases).length).toBe(2);

      expect(service.purchases).toEqual({
        id1: purchase1,
        id2: purchase2,
        id3: purchase3,
      });
      expect(Object.values(service.purchases).length).toBe(3);
    });
  });

  describe('purchasesList', () => {
    test('returns an array of purchases sorted by date', () => {
      const service = new InMemoryPurchaseService([
        purchase3,
        purchase2,
        purchase1,
      ]);

      const list = service.purchasesList;

      expect(list.length).toBe(3);
      expect(list).toEqual([purchase1, purchase2, purchase3]);
    });

    test('if there are no purchases, it returns an empty array', () => {
      const service = new InMemoryPurchaseService();

      const list = service.purchasesList;

      expect(list).toEqual([]);
    });

    test('revising the purchasesList array does not revise the stored version', () => {
      const service = new InMemoryPurchaseService([purchase1, purchase2]);

      const list = service.purchasesList;

      list.push(purchase3);

      expect(list.length).toBe(3);
      expect(service.purchasesList).toEqual([purchase1, purchase2]);
      expect(service.purchasesList.length).toBe(2);

      list.pop();
      list.pop();

      expect(list.length).toBe(1);
      expect(service.purchasesList).toEqual([purchase1, purchase2]);
      expect(service.purchasesList.length).toBe(2);
    });
  });

  describe('getPurchases', () => {
    test('returns an array of purchases', async () => {
      const service = new InMemoryPurchaseService([
        purchase1,
        purchase2,
        purchase3,
      ]);

      const result1 = await service.getPurchases({ userId: 'userId1' });
      expect(result1.length).toBe(2);
      expect(result1).toEqual([purchase1, purchase2]);

      const result2 = await service.getPurchases({ userId: 'userId2' });
      expect(result2.length).toBe(1);
      expect(result2).toEqual([purchase3]);
    });

    test('returns paginated purchases if there are more purchases than the pagination', async () => {
      const purchases: Purchase[] = [];

      const baseDate = DateTime.fromISO('2021-02-05T00:00:00.000Z', {
        zone: 'America/Chicago',
      });

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

      const service = new InMemoryPurchaseService([
        purchase1,
        purchase2,
        purchase3,
        ...purchases,
      ]);

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

      expect(result.includes(purchase1)).toBeTruthy();
      expect(result.includes(purchase2)).toBeTruthy();
      expect(result.includes(p4)).toBeTruthy();
      expect(result.includes(p5)).toBeTruthy();
      expect(result.includes(p6)).toBeTruthy();
    });

    test('goes to the proper page if a page and pagination are provided', async () => {
      const purchases: Purchase[] = [];

      const baseDate = DateTime.fromISO('2021-02-05T00:00:00.000Z', {
        zone: 'America/Chicago',
      });

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

      const service = new InMemoryPurchaseService([
        purchase1,
        purchase2,
        purchase3,
        ...purchases,
      ]);

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
      const service = new InMemoryPurchaseService([
        purchase1,
        purchase2,
        purchase3,
      ]);

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
      const service = new InMemoryPurchaseService([
        purchase1,
        purchase2,
        purchase3,
      ]);

      const result = await service.getPurchases({
        userId: 'userId3',
      });

      expect(result.length).toBe(0);
    });

    test('returns a date constrained array of Purchases', async () => {
      const purchases: Purchase[] = [];
      const baseDate = DateTime.fromISO('2021-02-05T00:00:00.000Z', {
        zone: 'America/Chicago',
      });

      if (!baseDate.isValid) {
        throw new Error('Invalid date');
      }

      for (let i = 4; i < 8; i++) {
        const purchase: PurchaseJSON = {
          id: `id${i}`,
          userId: 'userId1',
          purchasePriceId: `purchasePriceId${i}`,
          date: baseDate.plus({ days: i }).toISO(),
          purchasedQuantity: i,
        };

        purchases.push(Purchase.fromJSON(purchase));
      }

      const service = new InMemoryPurchaseService([
        purchase1,
        purchase2,
        purchase3,
        ...purchases,
      ]);

      const purchase4 = purchases[0];
      const purchase5 = purchases[1];
      const purchase6 = purchases[2];
      const purchase7 = purchases[3];

      if (!purchase4 || !purchase5 || !purchase6 || !purchase7) {
        throw new Error('Invalid purchases');
      }

      const result1 = await service.getPurchases({
        userId: 'userId1',
        startDate: '2021-01-01T00:00:00.000Z',
      });

      expect(result1).toEqual([
        purchase1,
        purchase2,
        purchase4,
        purchase5,
        purchase6,
        purchase7,
      ]);

      const result2 = await service.getPurchases({
        userId: 'userId1',
        startDate: '2021-01-13T00:00:00.000Z',
      });

      expect(result2).toEqual([purchase4, purchase5, purchase6, purchase7]);

      const result3 = await service.getPurchases({
        userId: 'userId1',
        endDate: '2021-01-30T00:00:00.000Z',
      });

      expect(result3).toEqual([purchase1, purchase2]);

      const result4 = await service.getPurchases({
        userId: 'userId1',
        startDate: '2021-01-08T00:00:00.000Z',
        endDate: '2021-02-09T00:00:00.000Z',
      });

      expect(result4).toEqual([purchase2, purchase4]);
    });

    test('dates are ignored if they are invalid', async () => {
      const service = new InMemoryPurchaseService([
        purchase1,
        purchase2,
        purchase3,
      ]);

      const result1 = await service.getPurchases({
        userId: 'userId1',
        startDate: 'bad',
      });

      expect(result1).toEqual([purchase1, purchase2]);

      const result2 = await service.getPurchases({
        userId: 'userId1',
        endDate: 'bad',
      });

      expect(result2).toEqual([purchase1, purchase2]);
    });

    test('A good date and a bad date returns the good date', async () => {
      const service = new InMemoryPurchaseService([
        purchase1,
        purchase2,
        purchase3,
      ]);

      // TODO Timezone issue. Reolve by setting the TZ in the DateTime objects

      const result1 = await service.getPurchases({
        userId: 'userId1',
        startDate: '2021-01-10T00:00:00.000Z',
        endDate: 'bad',
      });

      expect(result1).toEqual([purchase2]);

      const result2 = await service.getPurchases({
        userId: 'userId1',
        startDate: 'bad',
        endDate: '2021-01-10T00:00:00.000Z',
      });

      expect(result2).toEqual([purchase1]);
    });
  });

  describe('addPurchase', () => {
    test('adds a purchase to the purchases', async () => {
      const someId = 'someId';
      uuidv4.mockReturnValue(someId);

      const service = new InMemoryPurchaseService();

      expect(service.purchasesList.length).toBe(0);

      const result = await service.addPurchase(purchase1);
      expect(result.toJSON()).toEqual({
        ...purchase1.toJSON(),
        id: someId,
      });
      expect(service.purchasesList.length).toBe(1);
      expect(service.purchasesList[0]).toBe(result);
    });
  });

  describe('updatePurchase', () => {
    test('replaces the purchase with a new purchase and returns the old purchase', async () => {
      const service = new InMemoryPurchaseService([
        purchase1,
        purchase2,
        purchase3,
      ]);

      const newP1 = Purchase.fromJSON({
        ...purchase1.toJSON(),
        purchasedQuantity: 10,
      });

      const result = await service.updatePurchase(newP1);
      expect(result).toBe(purchase1);
      expect(service.purchasesList.length).toBe(3);
      expect(service.purchasesList[0]).toBe(newP1);
    });

    test('throws an error if the purchase does not exist', async () => {
      const service = new InMemoryPurchaseService([
        purchase1,
        purchase2,
        purchase3,
      ]);

      const newP1 = Purchase.fromJSON({
        ...purchase1.toJSON(),
        id: 'invalid id',
      });

      await expect(service.updatePurchase(newP1)).rejects.toThrow(
        `Purchase with ID ${newP1.id} not found`,
      );
    });
  });

  describe('deletePurchase', () => {
    test('deletes the purchase and returns the deleted purchase', async () => {
      const service = new InMemoryPurchaseService([
        purchase1,
        purchase2,
        purchase3,
      ]);

      expect(service.purchasesList.length).toBe(3);

      const result = await service.deletePurchase(purchase1.id);

      expect(result).toBe(purchase1);
      expect(service.purchasesList.length).toBe(2);
      expect(service.purchasesList.includes(purchase1)).toBeFalsy();
    });

    test('throws an error if the purchase does not exist', async () => {
      const service = new InMemoryPurchaseService([
        purchase1,
        purchase2,
        purchase3,
      ]);

      await expect(service.deletePurchase('invalid id')).rejects.toThrow(
        'Purchase with ID invalid id not found',
      );
    });
  });
});
