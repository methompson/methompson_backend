import {
  PurchasePrice,
  PurchasePriceJSON,
} from '@/src/models/action_bank/purchase_price';
import * as uuid from 'uuid';
import { InMemoryPurchasePricesService } from './purchase_prices.service.memory';
import { isNullOrUndefined } from '@/src/utils/type_guards';

jest.mock('uuid', () => {
  const v4 = jest.fn(() => 'uuidv4');

  return {
    v4,
  };
});

const uuidv4 = uuid.v4 as jest.Mock<unknown, unknown[]>;

const pp1JSON: PurchasePriceJSON = {
  id: 'id1',
  userId: 'userId1',
  name: 'name1',
  price: 1,
};
const pp2JSON: PurchasePriceJSON = {
  id: 'id2',
  userId: 'userId1',
  name: 'name2',
  price: 2,
};
const pp3JSON: PurchasePriceJSON = {
  id: 'id3',
  userId: 'userId2',
  name: 'name3',
  price: 3,
};

const pp1 = PurchasePrice.fromJSON(pp1JSON);
const pp2 = PurchasePrice.fromJSON(pp2JSON);
const pp3 = PurchasePrice.fromJSON(pp3JSON);

describe('InMemoryPurchasePricesService', () => {
  describe('purchasePrices', () => {
    test('returns a copy of the purchasePrices', () => {
      const service = new InMemoryPurchasePricesService([pp1, pp2, pp3]);

      const purchasePrices = service.purchasePrices;

      expect(purchasePrices).toEqual({
        id1: pp1,
        id2: pp2,
        id3: pp3,
      });
    });

    test('if there are no purchasePrices, it returns an empty object', () => {
      const service = new InMemoryPurchasePricesService();

      const purchasePrices = service.purchasePrices;

      expect(purchasePrices).toEqual({});
      expect(Object.values(purchasePrices).length).toBe(0);
    });

    test('revising the purchasePrices object does not revise the stored version', () => {
      const service = new InMemoryPurchasePricesService([pp1, pp2, pp3]);

      const purchasePrices = service.purchasePrices;

      delete purchasePrices.id1;

      expect(Object.values(purchasePrices).length).toBe(2);

      expect(service.purchasePrices).toEqual({
        id1: pp1,
        id2: pp2,
        id3: pp3,
      });
      expect(Object.values(service.purchasePrices).length).toBe(3);
    });
  });

  describe('purchasePricesList', () => {
    test('returns an array of purchasePrices sorted by name', () => {
      const service = new InMemoryPurchasePricesService([pp3, pp2, pp1]);

      const list = service.purchasePricesList;

      expect(list).toEqual([pp1, pp2, pp3]);
    });

    test('if there are no purchasePrices, it returns an empty array', () => {
      const service = new InMemoryPurchasePricesService();

      const list = service.purchasePricesList;

      expect(list).toEqual([]);
    });

    test('revising the purchasePricesList array does not revise the stored version', () => {
      const service = new InMemoryPurchasePricesService([pp1, pp2]);

      const list = service.purchasePricesList;

      expect(list.length).toBe(2);

      list.push(pp3);
      expect(list.length).toBe(3);
      expect(service.purchasePricesList.length).toBe(2);
      expect(service.purchasePricesList).toEqual([pp1, pp2]);

      list.pop();
      list.pop();

      expect(list.length).toBe(1);

      expect(service.purchasePricesList.length).toBe(2);
      expect(service.purchasePricesList).toEqual([pp1, pp2]);
    });
  });

  describe('getPurchasePrices', () => {
    test('returns an array of purchasePrices', async () => {
      const service = new InMemoryPurchasePricesService([pp1, pp2, pp3]);

      const purchasePrices1 = await service.getPurchasePrices({
        userId: 'userId1',
      });

      expect(purchasePrices1).toEqual([pp1, pp2]);
      expect(purchasePrices1.length).toBe(2);

      const purchasePrices2 = await service.getPurchasePrices({
        userId: 'userId2',
      });

      expect(purchasePrices2).toEqual([pp3]);
      expect(purchasePrices2.length).toBe(1);
    });

    test('returns paginated purchasePrices if there are more purchasePrices than the pagination', async () => {
      const pps: PurchasePrice[] = [];
      for (let i = 4; i < 10; i++) {
        const ppJson: PurchasePriceJSON = {
          id: `id${i}`,
          userId: 'userId1',
          name: `name${i}`,
          price: i,
        };
        pps.push(PurchasePrice.fromJSON(ppJson));
      }

      const service = new InMemoryPurchasePricesService([
        pp1,
        pp2,
        pp3,
        ...pps,
      ]);

      const pp4 = pps[0];
      const pp5 = pps[1];
      const pp6 = pps[2];

      expect(isNullOrUndefined(pp4)).toBeFalsy();
      expect(isNullOrUndefined(pp5)).toBeFalsy();
      expect(isNullOrUndefined(pp6)).toBeFalsy();

      const result = await service.getPurchasePrices({
        userId: 'userId1',
        pagination: 5,
      });

      expect(result.length).toBe(5);
      expect(result.includes(pp1)).toBeTruthy();
      expect(result.includes(pp2)).toBeTruthy();
      expect(result.includes(pp4)).toBeTruthy();
      expect(result.includes(pp5)).toBeTruthy();
      expect(result.includes(pp6)).toBeTruthy();
    });

    test('goes to the proper page if a page and pagination are provided', async () => {
      const pps: PurchasePrice[] = [];
      for (let i = 4; i < 10; i++) {
        const ppJson: PurchasePriceJSON = {
          id: `id${i}`,
          userId: 'userId1',
          name: `name${i}`,
          price: i,
        };
        pps.push(PurchasePrice.fromJSON(ppJson));
      }

      const service = new InMemoryPurchasePricesService([
        pp1,
        pp2,
        pp3,
        ...pps,
      ]);

      const pp7 = pps[3];
      const pp8 = pps[4];
      const pp9 = pps[5];

      expect(isNullOrUndefined(pp7)).toBeFalsy();
      expect(isNullOrUndefined(pp8)).toBeFalsy();
      expect(isNullOrUndefined(pp9)).toBeFalsy();

      const result = await service.getPurchasePrices({
        userId: 'userId1',
        pagination: 5,
        page: 2,
      });

      expect(result.length).toBe(3);
      expect(result.includes(pp7)).toBeTruthy();
      expect(result.includes(pp8)).toBeTruthy();
      expect(result.includes(pp9)).toBeTruthy();
    });

    test('returns an empty array if the page is beyond the range of purchasePrices', async () => {
      const service = new InMemoryPurchasePricesService([pp1, pp2, pp3]);

      const resultA = await service.getPurchasePrices({
        userId: 'userId1',
        page: 1,
      });
      expect(resultA.length).toBe(2);

      const resultB = await service.getPurchasePrices({
        userId: 'userId1',
        page: 2,
      });
      expect(resultB.length).toBe(0);
    });

    test('returns an empty array if there are no purchasePrices', async () => {
      const service = new InMemoryPurchasePricesService();

      const result = await service.getPurchasePrices({
        userId: 'userId1',
      });

      expect(result.length).toBe(0);
    });

    test('returns an empty array if the user has no purchasePrices', async () => {
      const service = new InMemoryPurchasePricesService([pp1, pp2, pp3]);

      const result = await service.getPurchasePrices({
        userId: 'userId3',
      });

      expect(result.length).toBe(0);
    });
  });

  describe('addPurchasePrice', () => {
    test('adds a purchasePrice to the purchasePrices', async () => {
      const someId = 'someId';
      uuidv4.mockImplementationOnce(() => someId);

      const service = new InMemoryPurchasePricesService();
      expect(service.purchasePricesList.length).toBe(0);

      const newPP = PurchasePrice.fromJSON(pp1);

      const result = await service.addPurchasePrice(newPP);

      expect(result.toJSON()).toEqual({
        ...pp1.toJSON(),
        id: someId,
      });

      expect(service.purchasePricesList[0]).toEqual(result);
      expect(service.purchasePricesList.length).toBe(1);
    });
  });

  describe('updatePurchasePrice', () => {
    test('replaces the purchasePrice with a new purchasePrice and returns the old purchasePrice', async () => {
      const service = new InMemoryPurchasePricesService([pp1, pp2, pp3]);

      const newPP = PurchasePrice.fromJSON({
        ...pp1.toJSON(),
        price: 100,
      });

      const result = await service.updatePurchasePrice(newPP);

      expect(result).toBe(pp1);
      expect(service.purchasePricesList[0]).toBe(newPP);
      expect(service.purchasePricesList.length).toBe(3);
    });

    test('throws an error if the purchasePrice does not exist', async () => {
      const service = new InMemoryPurchasePricesService([pp1, pp2, pp3]);

      const newPP = PurchasePrice.fromJSON({
        ...pp1.toJSON(),
        id: 'invalid id',
      });

      await expect(() => service.updatePurchasePrice(newPP)).rejects.toThrow(
        `Purchase Price with ID ${newPP.id} not found`,
      );
    });
  });

  describe('deletePurchasePrice', () => {
    test('deletes the purchasePrice and returns the deleted purchasePrice', async () => {
      const service = new InMemoryPurchasePricesService([pp1, pp2, pp3]);

      expect(service.purchasePricesList.length).toBe(3);
      expect(service.purchasePricesList.includes(pp2)).toBeTruthy();

      const result = await service.deletePurchasePrice(pp2.id);

      expect(result).toBe(pp2);
      expect(service.purchasePricesList.length).toBe(2);
      expect(service.purchasePricesList.includes(pp2)).toBeFalsy();
    });

    test('throws an error if the purchasePrice does not exist', async () => {
      const service = new InMemoryPurchasePricesService([pp1, pp2, pp3]);

      const badId = 'invalid id';
      await expect(() => service.deletePurchasePrice(badId)).rejects.toThrow(
        `Purchase Price with ID ${badId} not found`,
      );
    });
  });
});
