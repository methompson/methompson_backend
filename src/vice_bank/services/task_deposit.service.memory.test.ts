import { DateTime } from 'luxon';

import {
  TaskDeposit,
  TaskDepositJSON,
} from '@/src/models/vice_bank/task_deposit';
import { InMemoryTaskDepositService } from './task_deposit.service.memory';
import { Frequency } from '@/src/vice_bank/types';

const task1Id = 'taskId1';
const task2Id = 'taskId2';

const vbUserId1 = 'vbUserId1';
const vbUserId2 = 'vbUserId2';

const td1JSON: TaskDepositJSON = {
  id: 'id1',
  vbUserId: vbUserId1,
  date: '2024-01-01T01:02:03.000-06:00',
  taskName: 'taskName1',
  taskId: task1Id,
  conversionRate: 1,
  frequency: 'daily',
  tokensEarned: 1,
};
const td2JSON: TaskDepositJSON = {
  id: 'id2',
  vbUserId: vbUserId1,
  date: '2024-01-12T00:00:00.000-06:00',
  taskName: 'taskName1',
  taskId: task1Id,
  conversionRate: 1,
  frequency: 'daily',
  tokensEarned: 1,
};
const td3JSON: TaskDepositJSON = {
  id: 'id3',
  vbUserId: vbUserId2,
  date: '2024-02-01T00:00:00.000-06:00',
  taskName: 'taskName2',
  taskId: task2Id,
  conversionRate: 1,
  frequency: 'daily',
  tokensEarned: 1,
};

const td1 = TaskDeposit.fromJSON(td1JSON);
const td2 = TaskDeposit.fromJSON(td2JSON);
const td3 = TaskDeposit.fromJSON(td3JSON);

describe('InMemoryTaskDepositService', () => {
  describe('taskDeposits', () => {
    test('returns a copy of the deposits', () => {
      const svc = new InMemoryTaskDepositService([td1, td2, td3]);

      const deposits = svc.taskDeposits;

      expect(deposits).toEqual({ id1: td1, id2: td2, id3: td3 });
    });

    test('if there are no Deposits, it returns an empty object', () => {
      const svc = new InMemoryTaskDepositService();

      const deposits = svc.taskDeposits;

      expect(deposits).toEqual({});
    });

    test('revising the Deposits object does not revise the stored version', () => {
      const svc = new InMemoryTaskDepositService([td1, td2, td3]);

      const deposits = svc.taskDeposits;
      delete deposits.id1;

      expect(deposits).toEqual({ id2: td2, id3: td3 });
      expect(svc.taskDeposits).toEqual({ id1: td1, id2: td2, id3: td3 });
    });
  });

  describe('taskDepositsList', () => {
    test('returns an array of Deposits sorted by date', () => {
      const svc = new InMemoryTaskDepositService([td1, td2, td3]);

      const deposits = svc.taskDepositsList;

      expect(deposits).toEqual([td1, td2, td3]);
    });

    test('if there are no Deposits, it returns an empty array', () => {
      const svc = new InMemoryTaskDepositService();

      expect(svc.taskDepositsList).toEqual([]);
    });

    test('revising the DepositsList array does not revise the stored version', () => {
      const svc = new InMemoryTaskDepositService([td1, td2, td3]);

      const deposits = svc.taskDepositsList;
      deposits.pop();

      expect(deposits).toEqual([td1, td2]);
      expect(svc.taskDepositsList).toEqual([td1, td2, td3]);
    });
  });

  describe('getTaskDeposits', () => {
    test('returns an array of Deposits', async () => {
      const svc = new InMemoryTaskDepositService([td1, td2, td3]);

      const result1 = await svc.getTaskDeposits({ userId: 'vbUserId1' });

      expect(result1).toEqual([td1, td2]);

      const result2 = await svc.getTaskDeposits({ userId: 'vbUserId2' });

      expect(result2).toEqual([td3]);
    });

    test('returns paginated Deposits if there are more Deposits than the pagination', async () => {
      const deposits: TaskDeposit[] = [];
      const baseDate = DateTime.fromISO('2024-02-05T00:00:00.000Z', {
        zone: 'America/Chicago',
      });

      if (!baseDate.isValid) {
        throw new Error('Invalid date');
      }

      for (let i = 4; i < 15; i++) {
        const deposit: TaskDepositJSON = {
          id: `id${i}`,
          vbUserId: 'vbUserId1',
          date: baseDate.plus({ days: i }).toISO(),
          taskName: 'taskName1',
          taskId: 'taskId1',
          conversionRate: 1,
          frequency: 'daily',
          tokensEarned: i,
        };

        deposits.push(TaskDeposit.fromJSON(deposit));
      }

      const svc = new InMemoryTaskDepositService([td1, td2, td3, ...deposits]);

      const deposit4 = deposits[0];
      const deposit5 = deposits[1];
      const deposit6 = deposits[2];

      expect(deposit4).toBeDefined();
      expect(deposit5).toBeDefined();
      expect(deposit6).toBeDefined();

      if (!deposit4 || !deposit5 || !deposit6) {
        throw new Error('Invalid deposits');
      }

      const result = await svc.getTaskDeposits({
        userId: 'vbUserId1',
        page: 1,
        pagination: 5,
      });

      expect(result.length).toBe(5);
      expect(result.includes(td1)).toBeTruthy();
      expect(result.includes(td2)).toBeTruthy();
      expect(result.includes(deposit4)).toBeTruthy();
      expect(result.includes(deposit5)).toBeTruthy();
      expect(result.includes(deposit6)).toBeTruthy();
    });

    test('goes to the proper page if a page and pagination are provided', async () => {
      const deposits: TaskDeposit[] = [];
      const baseDate = DateTime.fromISO('2024-02-05T00:00:00.000Z', {
        zone: 'America/Chicago',
      });

      if (!baseDate.isValid) {
        throw new Error('Invalid date');
      }

      for (let i = 4; i < 15; i++) {
        const deposit: TaskDepositJSON = {
          id: `id${i}`,
          vbUserId: 'vbUserId1',
          date: baseDate.plus({ days: i }).toISO(),
          taskName: 'taskName1',
          taskId: 'taskId1',
          conversionRate: 1,
          frequency: 'daily',
          tokensEarned: i,
        };

        deposits.push(TaskDeposit.fromJSON(deposit));
      }

      const svc = new InMemoryTaskDepositService([td1, td2, td3, ...deposits]);

      const deposit7 = deposits[3];
      const deposit8 = deposits[4];
      const deposit9 = deposits[5];
      const td10 = deposits[6];
      const td11 = deposits[7];

      const result = await svc.getTaskDeposits({
        userId: 'vbUserId1',
        page: 2,
        pagination: 5,
      });

      if (!deposit7 || !deposit8 || !deposit9 || !td10 || !td11) {
        throw new Error('Invalid deposits');
      }

      expect(result.length).toBe(5);
      expect(result.includes(deposit7)).toBeTruthy();
      expect(result.includes(deposit8)).toBeTruthy();
      expect(result.includes(deposit9)).toBeTruthy();
      expect(result.includes(td10)).toBeTruthy();
      expect(result.includes(td11)).toBeTruthy();
    });

    test('returns an empty array if the page is beyond the range of Deposits', async () => {
      const deposits: TaskDeposit[] = [];
      const baseDate = DateTime.fromISO('2024-02-05T00:00:00.000Z', {
        zone: 'America/Chicago',
      });

      if (!baseDate.isValid) {
        throw new Error('Invalid date');
      }

      for (let i = 4; i < 15; i++) {
        const deposit: TaskDepositJSON = {
          id: `id${i}`,
          vbUserId: 'vbUserId1',
          date: baseDate.plus({ days: i }).toISO(),
          taskName: 'taskName1',
          taskId: 'taskId1',
          conversionRate: 1,
          frequency: 'daily',
          tokensEarned: i,
        };

        deposits.push(TaskDeposit.fromJSON(deposit));
      }

      const svc = new InMemoryTaskDepositService([td1, td2, td3, ...deposits]);

      const result = await svc.getTaskDeposits({
        userId: 'vbUserId1',
        page: 3,
        pagination: 10,
      });

      expect(result.length).toBe(0);
    });

    test('returns an empty array if there are no Deposits', async () => {
      const svc = new InMemoryTaskDepositService();
      const result = await svc.getTaskDeposits({ userId: 'vbUserId1' });

      expect(result.length).toBe(0);
    });

    test('returns a date constrained array of Deposits', async () => {
      const deposits: TaskDeposit[] = [];
      const baseDate = DateTime.fromISO('2024-02-05T00:00:00.000Z', {
        zone: 'America/Chicago',
      });

      if (!baseDate.isValid) {
        throw new Error('Invalid date');
      }

      for (let i = 4; i < 8; i++) {
        const deposit: TaskDepositJSON = {
          id: `id${i}`,
          vbUserId: 'vbUserId1',
          date: baseDate.plus({ days: i }).toISO(),
          taskName: 'taskName1',
          taskId: 'taskId1',
          conversionRate: 1,
          frequency: 'daily',
          tokensEarned: i,
        };

        deposits.push(TaskDeposit.fromJSON(deposit));
      }

      const svc = new InMemoryTaskDepositService([td1, td2, td3, ...deposits]);

      const deposit4 = deposits[0];
      const deposit5 = deposits[1];
      const deposit6 = deposits[2];
      const deposit7 = deposits[3];

      if (!deposit4 || !deposit5 || !deposit6 || !deposit7) {
        throw new Error('Invalid deposits');
      }

      const result1 = await svc.getTaskDeposits({
        userId: 'vbUserId1',
        startDate: '2024-01-01T00:00:00.000Z',
      });

      expect(result1).toEqual([
        td1,
        td2,
        deposit4,
        deposit5,
        deposit6,
        deposit7,
      ]);

      const result2 = await svc.getTaskDeposits({
        userId: 'vbUserId1',
        startDate: '2024-01-13T00:00:00.000Z',
      });

      expect(result2).toEqual([deposit4, deposit5, deposit6, deposit7]);

      const result3 = await svc.getTaskDeposits({
        userId: 'vbUserId1',
        endDate: '2024-01-30T00:00:00.000Z',
      });

      expect(result3).toEqual([td1, td2]);

      const result4 = await svc.getTaskDeposits({
        userId: 'vbUserId1',
        startDate: '2024-01-08T00:00:00.000Z',
        endDate: '2024-02-09T00:00:00.000Z',
      });

      expect(result4).toEqual([td2, deposit4]);
    });

    test('returns no values if the start and end dates are the same', async () => {
      const svc = new InMemoryTaskDepositService([td1, td2, td3]);

      const result = await svc.getTaskDeposits({
        userId: 'vbUserId1',
        startDate: '2024-01-01T00:00:00.000Z',
        endDate: '2024-01-01T00:00:00.000Z',
      });

      expect(result).toEqual([]);
    });

    test('returns a value if the start and end dates are the same', async () => {
      const svc = new InMemoryTaskDepositService([td1, td2, td3]);

      const result = await svc.getTaskDeposits({
        userId: 'vbUserId1',
        startDate: '2024-01-01T00:00:00.000Z',
        endDate: '2024-01-02T00:00:00.000Z',
      });

      expect(result).toEqual([td1]);
    });

    test('dates are ignored if they are invalid', async () => {
      const service = new InMemoryTaskDepositService([td1, td2, td3]);

      const result1 = await service.getTaskDeposits({
        userId: 'vbUserId1',
        startDate: 'bad',
      });

      expect(result1).toEqual([td1, td2]);

      const result2 = await service.getTaskDeposits({
        userId: 'vbUserId1',
        endDate: 'bad',
      });

      expect(result2).toEqual([td1, td2]);
    });

    test('A good date and a bad date returns the good date', async () => {
      const service = new InMemoryTaskDepositService([td1, td2, td3]);

      // TODO Timezone issue. Resolve by setting the TZ in the DateTime objects

      const result1 = await service.getTaskDeposits({
        userId: 'vbUserId1',
        startDate: '2024-01-10T00:00:00.000Z',
        endDate: 'bad',
      });

      expect(result1).toEqual([td2]);

      const result2 = await service.getTaskDeposits({
        userId: 'vbUserId1',
        startDate: 'bad',
        endDate: '2024-01-10T00:00:00.000Z',
      });

      expect(result2).toEqual([td1]);
    });
  });

  describe('getDepositsForFrequency', () => {
    test('Returns an empty list of deposits if there are no other deposits during that frequency', async () => {
      const svc = new InMemoryTaskDepositService();
      const result = await svc.getDepositsForFrequency(td1, Frequency.Daily);

      expect(result).toEqual([]);
    });

    test('returns a list of Weekly task deposits if any deposits exist on the same day', async () => {
      const deposit1 = TaskDeposit.fromJSON({
        ...td1JSON,
        id: 'nid1',
        date: '2024-01-02',
      });
      const deposit2 = TaskDeposit.fromJSON({
        ...td1JSON,
        id: 'nid2',
        date: '2024-01-03',
      });
      const deposit3 = TaskDeposit.fromJSON({
        ...td1JSON,
        id: 'nid3',
        date: '2024-01-04',
      });
      const deposit4 = TaskDeposit.fromJSON({
        ...td1JSON,
        id: 'nid4',
        date: '2024-01-12',
      });

      const svc = new InMemoryTaskDepositService([
        deposit1,
        deposit2,
        deposit3,
        deposit4,
      ]);

      const result = await svc.getDepositsForFrequency(td1, Frequency.Weekly);

      expect(result).toEqual([deposit1, deposit2, deposit3]);
    });

    test('returns a list of monthly task deposits if any deposits exist on the same day', async () => {
      const deposit1 = TaskDeposit.fromJSON({
        ...td1JSON,
        id: 'nid1',
        date: '2024-01-01',
      });
      const deposit2 = TaskDeposit.fromJSON({
        ...td1JSON,
        id: 'nid2',
        date: '2024-01-15',
      });
      const deposit3 = TaskDeposit.fromJSON({
        ...td1JSON,
        id: 'nid3',
        date: '2024-01-31T12:59:59.999-06:00',
      });
      const deposit4 = TaskDeposit.fromJSON({
        ...td1JSON,
        id: 'nid4',
        date: '2024-02-01',
      });

      const svc = new InMemoryTaskDepositService([
        deposit1,
        deposit2,
        deposit3,
        deposit4,
      ]);

      const result = await svc.getDepositsForFrequency(td1, Frequency.Monthly);

      expect(result).toEqual([deposit1, deposit2, deposit3]);
    });

    test('returns a list of daily task deposits if any deposits exist during the same week', async () => {
      const deposit1 = TaskDeposit.fromJSON({ ...td1JSON, id: 'nid1' });
      const deposit2 = TaskDeposit.fromJSON({ ...td1JSON, id: 'nid2' });
      const deposit3 = TaskDeposit.fromJSON({ ...td1JSON, id: 'nid3' });
      const deposit4 = TaskDeposit.fromJSON({ ...td1JSON, id: 'nid4' });

      const svc = new InMemoryTaskDepositService([
        deposit1,
        deposit2,
        deposit3,
        deposit4,
        td2,
      ]);

      const result = await svc.getDepositsForFrequency(td1, Frequency.Daily);

      expect(result).toEqual([deposit1, deposit2, deposit3, deposit4]);
    });
  });

  describe('addTaskDeposit', () => {});

  describe('updateTaskDeposit', () => {});

  describe('deleteTaskDeposit', () => {});
});
