import { Deposit, DepositJSON } from '@/src/models/vice_bank/deposit';
import * as uuid from 'uuid';
import { InMemoryDepositService } from './deposit.service.memory';
import { DateTime } from 'luxon';

jest.mock('uuid', () => {
  const v4 = jest.fn(() => 'uuidv4');

  return {
    v4,
  };
});

const uuidv4 = uuid.v4 as jest.Mock<unknown, unknown[]>;

const deposit1JSON: DepositJSON = {
  id: 'id1',
  vbUserId: 'userId1',
  date: '2024-01-01T00:00:00.000-06:00',
  depositQuantity: 1,
  conversionRate: 1,
  actionName: 'name1',
  conversionUnit: 'minutes',
};
const deposit2JSON: DepositJSON = {
  id: 'id2',
  vbUserId: 'userId1',
  date: '2024-01-12T00:00:00.000-06:00',
  depositQuantity: 1,
  conversionRate: 1,
  actionName: 'name1',
  conversionUnit: 'minutes',
};
const deposit3JSON: DepositJSON = {
  id: 'id3',
  vbUserId: 'userId2',
  date: '2024-02-01T00:00:00.000-06:00',
  depositQuantity: 1,
  conversionRate: 1,
  actionName: 'name2',
  conversionUnit: 'minutes',
};

const deposit1 = Deposit.fromJSON(deposit1JSON);
const deposit2 = Deposit.fromJSON(deposit2JSON);
const deposit3 = Deposit.fromJSON(deposit3JSON);

describe('InMemoryDepositService', () => {
  describe('deposits', () => {
    test('returns a copy of the Deposits', () => {
      const service = new InMemoryDepositService([
        deposit1,
        deposit2,
        deposit3,
      ]);

      const deposits = service.deposits;

      expect(deposits).toEqual({
        id1: deposit1,
        id2: deposit2,
        id3: deposit3,
      });
    });

    test('if there are no Deposits, it returns an empty object', () => {
      const service = new InMemoryDepositService();

      const deposits = service.deposits;

      expect(deposits).toEqual({});
      expect(Object.values(deposits).length).toBe(0);
    });

    test('revising the Deposits object does not revise the stored version', () => {
      const service = new InMemoryDepositService([
        deposit1,
        deposit2,
        deposit3,
      ]);

      const deposits = service.deposits;

      delete deposits.id1;

      expect(Object.values(deposits).length).toBe(2);
      expect(service.deposits).toEqual({
        id1: deposit1,
        id2: deposit2,
        id3: deposit3,
      });
      expect(Object.values(service.deposits).length).toBe(3);
    });
  });

  describe('depositsList', () => {
    test('returns an array of Deposits', () => {
      const service = new InMemoryDepositService([
        deposit1,
        deposit2,
        deposit3,
      ]);

      const depositsList = service.depositsList;

      expect(depositsList).toEqual([deposit1, deposit2, deposit3]);
    });

    test('if there are no Deposits, it returns an empty array', () => {
      const service = new InMemoryDepositService();

      const depositsList = service.depositsList;

      expect(depositsList).toEqual([]);
    });

    test('revising the DepositsList array does not revise the stored version', () => {
      const service = new InMemoryDepositService([deposit1, deposit2]);

      const depositsList = service.depositsList;

      depositsList.push(deposit3);

      expect(depositsList.length).toBe(3);
      expect(service.depositsList).toEqual([deposit1, deposit2]);
      expect(service.depositsList.length).toBe(2);

      depositsList.pop();
      depositsList.pop();

      expect(depositsList.length).toBe(1);
      expect(service.depositsList).toEqual([deposit1, deposit2]);
      expect(service.depositsList.length).toBe(2);
    });
  });

  describe('getDeposits', () => {
    test('returns an array of Deposits', async () => {
      const service = new InMemoryDepositService([
        deposit1,
        deposit2,
        deposit3,
      ]);

      const result1 = await service.getDeposits({
        userId: 'userId1',
      });

      expect(result1).toEqual([deposit1, deposit2]);

      const result2 = await service.getDeposits({
        userId: 'userId2',
      });
      expect(result2).toEqual([deposit3]);
    });

    test('returns paginated Deposits if there are more Deposits than the pagination', async () => {
      const deposits: Deposit[] = [];
      const baseDate = DateTime.fromISO('2024-02-05T00:00:00.000Z', {
        zone: 'America/Chicago',
      });

      if (!baseDate.isValid) {
        throw new Error('Invalid date');
      }

      for (let i = 4; i < 15; i++) {
        const deposit: DepositJSON = {
          id: `id${i}`,
          vbUserId: 'userId1',
          date: baseDate.plus({ days: i }).toISO(),
          depositQuantity: i,
          conversionRate: i,
          actionName: `name${i}`,
          conversionUnit: 'minutes',
        };

        deposits.push(Deposit.fromJSON(deposit));
      }

      const service = new InMemoryDepositService([
        deposit1,
        deposit2,
        deposit3,
        ...deposits,
      ]);

      const deposit4 = deposits[0];
      const deposit5 = deposits[1];
      const deposit6 = deposits[2];

      expect(deposit4).toBeDefined();
      expect(deposit5).toBeDefined();
      expect(deposit6).toBeDefined();

      if (!deposit4 || !deposit5 || !deposit6) {
        throw new Error('Invalid deposits');
      }

      const result = await service.getDeposits({
        userId: 'userId1',
        page: 1,
        pagination: 5,
      });

      expect(result.length).toBe(5);
      expect(result.includes(deposit1)).toBeTruthy();
      expect(result.includes(deposit2)).toBeTruthy();
      expect(result.includes(deposit4)).toBeTruthy();
      expect(result.includes(deposit5)).toBeTruthy();
      expect(result.includes(deposit6)).toBeTruthy();
    });

    test('goes to the proper page if a page and pagination are provided', async () => {
      const deposits: Deposit[] = [];
      const baseDate = DateTime.fromISO('2024-02-05T00:00:00.000-06:00', {
        zone: 'America/Chicago',
      });

      if (!baseDate.isValid) {
        throw new Error('Invalid date');
      }

      for (let i = 4; i < 15; i++) {
        const deposit: DepositJSON = {
          id: `id${i}`,
          vbUserId: 'userId1',
          date: baseDate.plus({ days: i }).toISO(),
          depositQuantity: i,
          conversionRate: i,
          actionName: `name${i}`,
          conversionUnit: 'minutes',
        };

        deposits.push(Deposit.fromJSON(deposit));
      }

      const service = new InMemoryDepositService([
        deposit1,
        deposit2,
        deposit3,
        ...deposits,
      ]);

      const deposit7 = deposits[3];
      const deposit8 = deposits[4];
      const deposit9 = deposits[5];
      const deposit10 = deposits[6];
      const deposit11 = deposits[7];

      const result = await service.getDeposits({
        userId: 'userId1',
        page: 2,
        pagination: 5,
      });

      if (!deposit7 || !deposit8 || !deposit9 || !deposit10 || !deposit11) {
        throw new Error('Invalid deposits');
      }

      expect(result.length).toBe(5);
      expect(result.includes(deposit7)).toBeTruthy();
      expect(result.includes(deposit8)).toBeTruthy();
      expect(result.includes(deposit9)).toBeTruthy();
      expect(result.includes(deposit10)).toBeTruthy();
      expect(result.includes(deposit11)).toBeTruthy();
    });

    test('returns an empty array if the page is beyond the range of Deposits', async () => {
      const deposits: Deposit[] = [];
      const baseDate = DateTime.fromISO('2024-02-05T00:00:00.000Z', {
        zone: 'America/Chicago',
      });

      if (!baseDate.isValid) {
        throw new Error('Invalid date');
      }

      for (let i = 4; i < 15; i++) {
        const deposit: DepositJSON = {
          id: `id${i}`,
          vbUserId: 'userId1',
          date: baseDate.plus({ days: i }).toISO(),
          depositQuantity: i,
          conversionRate: i,
          actionName: `name${i}`,
          conversionUnit: 'minutes',
        };

        deposits.push(Deposit.fromJSON(deposit));
      }

      const service = new InMemoryDepositService([
        deposit1,
        deposit2,
        deposit3,
        ...deposits,
      ]);

      const result = await service.getDeposits({
        userId: 'userId1',
        page: 3,
        pagination: 10,
      });

      expect(result.length).toBe(0);
    });

    test('returns an empty array if there are no Deposits', async () => {
      const service = new InMemoryDepositService();
      const reuslt = await service.getDeposits({
        userId: 'userId1',
      });

      expect(reuslt.length).toBe(0);
    });

    test('returns an empty array if the user has no Deposits', async () => {
      const service = new InMemoryDepositService([
        deposit1,
        deposit2,
        deposit3,
      ]);

      const result = await service.getDeposits({
        userId: 'userId3',
      });

      expect(result.length).toBe(0);
    });

    test('returns a date constrained array of Deposits', async () => {
      const deposits: Deposit[] = [];
      const baseDate = DateTime.fromISO('2024-02-05T00:00:00.000Z', {
        zone: 'America/Chicago',
      });

      if (!baseDate.isValid) {
        throw new Error('Invalid date');
      }

      for (let i = 4; i < 8; i++) {
        const deposit: DepositJSON = {
          id: `id${i}`,
          vbUserId: 'userId1',
          date: baseDate.plus({ days: i }).toISO(),
          depositQuantity: i,
          conversionRate: i,
          actionName: `name${i}`,
          conversionUnit: 'minutes',
        };

        deposits.push(Deposit.fromJSON(deposit));
      }

      const service = new InMemoryDepositService([
        deposit1,
        deposit2,
        deposit3,
        ...deposits,
      ]);

      const deposit4 = deposits[0];
      const deposit5 = deposits[1];
      const deposit6 = deposits[2];
      const deposit7 = deposits[3];

      if (!deposit4 || !deposit5 || !deposit6 || !deposit7) {
        throw new Error('Invalid deposits');
      }

      const result1 = await service.getDeposits({
        userId: 'userId1',
        startDate: '2024-01-01T00:00:00.000Z',
      });

      expect(result1).toEqual([
        deposit1,
        deposit2,
        deposit4,
        deposit5,
        deposit6,
        deposit7,
      ]);

      const result2 = await service.getDeposits({
        userId: 'userId1',
        startDate: '2024-01-13T00:00:00.000Z',
      });

      expect(result2).toEqual([deposit4, deposit5, deposit6, deposit7]);

      const result3 = await service.getDeposits({
        userId: 'userId1',
        endDate: '2024-01-30T00:00:00.000Z',
      });

      expect(result3).toEqual([deposit1, deposit2]);

      const result4 = await service.getDeposits({
        userId: 'userId1',
        startDate: '2024-01-08T00:00:00.000Z',
        endDate: '2024-02-09T00:00:00.000Z',
      });

      expect(result4).toEqual([deposit2, deposit4]);
    });

    test('dates are ignored if they are invalid', async () => {
      const service = new InMemoryDepositService([
        deposit1,
        deposit2,
        deposit3,
      ]);

      const result1 = await service.getDeposits({
        userId: 'userId1',
        startDate: 'bad',
      });

      expect(result1).toEqual([deposit1, deposit2]);

      const result2 = await service.getDeposits({
        userId: 'userId1',
        endDate: 'bad',
      });

      expect(result2).toEqual([deposit1, deposit2]);
    });

    test('A good date and a bad date returns the good date', async () => {
      const service = new InMemoryDepositService([
        deposit1,
        deposit2,
        deposit3,
      ]);

      // TODO Timezone issue. Resolve by setting the TZ in the DateTime objects

      const result1 = await service.getDeposits({
        userId: 'userId1',
        startDate: '2024-01-10T00:00:00.000Z',
        endDate: 'bad',
      });

      expect(result1).toEqual([deposit2]);

      const result2 = await service.getDeposits({
        userId: 'userId1',
        startDate: 'bad',
        endDate: '2024-01-10T00:00:00.000Z',
      });

      expect(result2).toEqual([deposit1]);
    });
  });

  describe('addDeposit', () => {
    test('adds a Deposit to the Deposits', async () => {
      const someId = 'someId';
      uuidv4.mockImplementationOnce(() => someId);

      const service = new InMemoryDepositService();
      expect(service.depositsList.length).toBe(0);

      const result = await service.addDeposit(deposit1);

      expect(result.toJSON()).toEqual({
        ...deposit1.toJSON(),
        id: someId,
      });
      expect(service.depositsList.length).toBe(1);
      expect(service.depositsList[0]).toBe(result);
    });
  });

  describe('updateDeposit', () => {
    test('replaces the Deposit with a new Deposit and returns the old Deposit', async () => {
      const service = new InMemoryDepositService([
        deposit1,
        deposit2,
        deposit3,
      ]);

      const newDeposit = Deposit.fromJSON({
        ...deposit1.toJSON(),
        depositQuantity: 100,
      });

      const result = await service.updateDeposit(newDeposit);

      expect(result).toEqual(deposit1);
      expect(service.depositsList.length).toBe(3);
      expect(service.depositsList[0]).toBe(newDeposit);
    });

    test('throws an error if the Deposit does not exist', async () => {
      const service = new InMemoryDepositService([
        deposit1,
        deposit2,
        deposit3,
      ]);

      const newDeposit = Deposit.fromJSON({
        ...deposit1.toJSON(),
        id: 'invalid id',
      });

      await expect(() => service.updateDeposit(newDeposit)).rejects.toThrow(
        `Deposit with ID ${newDeposit.id} not found`,
      );
    });
  });

  describe('deleteDeposit', () => {
    test('deletes the Deposit and returns the deleted Deposit', async () => {
      const service = new InMemoryDepositService([
        deposit1,
        deposit2,
        deposit3,
      ]);

      expect(service.depositsList.length).toBe(3);

      const result = await service.deleteDeposit(deposit1.id);

      expect(result).toEqual(deposit1);
      expect(service.depositsList.length).toBe(2);
      expect(service.depositsList.includes(deposit1)).toBeFalsy();
    });

    test('throws an error if the Deposit does not exist', async () => {
      const service = new InMemoryDepositService([
        deposit1,
        deposit2,
        deposit3,
      ]);

      const depositId = 'invalid id';

      await expect(() => service.deleteDeposit(depositId)).rejects.toThrow(
        `Deposit with ID ${depositId} not found`,
      );
    });
  });
});
