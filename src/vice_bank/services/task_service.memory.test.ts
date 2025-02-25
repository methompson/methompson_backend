import { DateTime } from 'luxon';
import * as uuid from 'uuid';

import {
  TaskDeposit,
  TaskDepositJSON,
} from '@/src/vice_bank/models/task_deposit';
import { InMemoryTaskService } from './task_service.memory';
import { Frequency } from '@/src/vice_bank/types';
import { Task, TaskJSON } from '@/src/vice_bank/models/task';

jest.mock('uuid', () => {
  const v4 = jest.fn(() => 'uuidv4');

  return {
    v4,
  };
});

const uuidv4 = uuid.v4 as jest.Mock<unknown, unknown[]>;

const task1Id = 'taskId1';
const task2Id = 'taskId2';

const vbUserId1 = 'vbUserId1';
const vbUserId2 = 'vbUserId2';

const task1JSON: TaskJSON = {
  id: task1Id,
  vbUserId: vbUserId1,
  name: 'taskName1',
  frequency: 'daily',
  tokensPer: 1,
};

const task2JSON: TaskJSON = {
  id: task2Id,
  vbUserId: vbUserId1,
  name: 'taskName2',
  frequency: 'daily',
  tokensPer: 1,
};

const task3JSON: TaskJSON = {
  id: 'task3Id',
  vbUserId: vbUserId2,
  name: 'taskName3',
  frequency: 'daily',
  tokensPer: 1,
};

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

const task1 = Task.fromJSON(task1JSON);
const task2 = Task.fromJSON(task2JSON);
const task3 = Task.fromJSON(task3JSON);

describe('InMemoryTaskService', () => {
  beforeEach(() => {
    uuidv4.mockReset();
  });

  describe('tasks', () => {
    test('returns a copy of the tasks', () => {
      const svc = new InMemoryTaskService({ tasks: [task1, task2] });
      expect(svc.tasks).toEqual({ taskId1: task1, taskId2: task2 });
    });

    test('if there are no tasks, it returns an empty object', () => {
      const svc = new InMemoryTaskService();
      expect(svc.tasks).toEqual({});
    });

    test('revising the tasks object does not revise the stored version', () => {
      const svc = new InMemoryTaskService({ tasks: [task1, task2] });

      const tasks = svc.tasks;
      delete tasks.taskId1;

      expect(tasks).toEqual({ taskId2: task2 });
      expect(svc.tasks).toEqual({ taskId1: task1, taskId2: task2 });
    });
  });

  describe('tasksList', () => {
    test('returns an array of tasks sorted by date', () => {
      const svc = new InMemoryTaskService({ tasks: [task1, task2] });
      expect(svc.tasksList).toEqual([task1, task2]);
    });

    test('if there are no tasks, it returns an empty array', () => {
      const svc = new InMemoryTaskService();
      expect(svc.tasksList).toEqual([]);
    });

    test('revising the tasks array does not revise the stored version', () => {
      const svc = new InMemoryTaskService({ tasks: [task1, task2] });

      const list = svc.tasksList;
      list.pop();

      expect(list).toEqual([task1]);
      expect(svc.tasksList).toEqual([task1, task2]);
    });
  });

  describe('taskDeposits', () => {
    test('returns a copy of the deposits', () => {
      const svc = new InMemoryTaskService({ taskDeposits: [td1, td2, td3] });

      const deposits = svc.taskDeposits;

      expect(deposits).toEqual({ id1: td1, id2: td2, id3: td3 });
    });

    test('if there are no Deposits, it returns an empty object', () => {
      const svc = new InMemoryTaskService();

      const deposits = svc.taskDeposits;

      expect(deposits).toEqual({});
    });

    test('revising the Deposits object does not revise the stored version', () => {
      const svc = new InMemoryTaskService({ taskDeposits: [td1, td2, td3] });

      const deposits = svc.taskDeposits;
      delete deposits.id1;

      expect(deposits).toEqual({ id2: td2, id3: td3 });
      expect(svc.taskDeposits).toEqual({ id1: td1, id2: td2, id3: td3 });
    });
  });

  describe('taskDepositsList', () => {
    test('returns an array of Deposits sorted by date', () => {
      const svc = new InMemoryTaskService({ taskDeposits: [td1, td2, td3] });

      const deposits = svc.taskDepositsList;

      expect(deposits).toEqual([td1, td2, td3]);
    });

    test('if there are no Deposits, it returns an empty array', () => {
      const svc = new InMemoryTaskService();

      expect(svc.taskDepositsList).toEqual([]);
    });

    test('revising the DepositsList array does not revise the stored version', () => {
      const svc = new InMemoryTaskService({ taskDeposits: [td1, td2, td3] });

      const deposits = svc.taskDepositsList;
      deposits.pop();

      expect(deposits).toEqual([td1, td2]);
      expect(svc.taskDepositsList).toEqual([td1, td2, td3]);
    });
  });

  describe('getTasks', () => {
    test('returns an array of tasks for a given user', async () => {
      const svc = new InMemoryTaskService({ tasks: [task1, task2, task3] });

      const result1 = await svc.getTasks({ userId: 'vbUserId1' });

      expect(result1).toEqual([task1, task2]);

      const result2 = await svc.getTasks({ userId: 'vbUserId2' });

      expect(result2).toEqual([task3]);
    });

    test('returns paginated tasks if there are more tasks than the pagination', async () => {
      const tasks: Task[] = [];
      for (let i = 4; i < 15; i++) {
        const task: TaskJSON = {
          id: `id${i}`,
          vbUserId: 'vbUserId1',
          name: `taskName${i.toString().padStart(2, '0')}`,
          frequency: 'daily',
          tokensPer: i,
        };

        tasks.push(Task.fromJSON(task));
      }

      const svc = new InMemoryTaskService({ tasks });

      const t1 = tasks[0];
      const t2 = tasks[1];
      const t3 = tasks[2];
      const t4 = tasks[3];
      const t5 = tasks[4];

      expect(t1).toBeDefined();
      expect(t2).toBeDefined();
      expect(t3).toBeDefined();
      expect(t4).toBeDefined();
      expect(t5).toBeDefined();

      const result = await svc.getTasks({
        userId: 'vbUserId1',
        page: 1,
        pagination: 5,
      });

      expect(result.length).toBe(5);
      expect(result).toEqual([t1, t2, t3, t4, t5]);
    });

    test('goes to the proper page if a page and pagination are provided', async () => {
      const tasks: Task[] = [];
      for (let i = 4; i < 15; i++) {
        const task: TaskJSON = {
          id: `id${i}`,
          vbUserId: 'vbUserId1',
          name: `taskName${i.toString().padStart(2, '0')}`,
          frequency: 'daily',
          tokensPer: i,
        };

        tasks.push(Task.fromJSON(task));
      }

      const svc = new InMemoryTaskService({ tasks });

      const t1 = tasks[5];
      const t2 = tasks[6];
      const t3 = tasks[7];
      const t4 = tasks[8];
      const t5 = tasks[9];

      expect(t1).toBeDefined();
      expect(t2).toBeDefined();
      expect(t3).toBeDefined();
      expect(t4).toBeDefined();
      expect(t5).toBeDefined();

      const result = await svc.getTasks({
        userId: 'vbUserId1',
        page: 2,
        pagination: 5,
      });

      expect(result.length).toBe(5);
      expect(result).toEqual([t1, t2, t3, t4, t5]);
    });

    test('returns an empty array if the page is beyond the range of tasks', async () => {
      const tasks: Task[] = [];
      for (let i = 4; i < 15; i++) {
        const task: TaskJSON = {
          id: `id${i}`,
          vbUserId: 'vbUserId1',
          name: `taskName${i.toString().padStart(2, '0')}`,
          frequency: 'daily',
          tokensPer: i,
        };

        tasks.push(Task.fromJSON(task));
      }

      const svc = new InMemoryTaskService({ tasks });

      const result = await svc.getTasks({
        userId: 'vbUserId1',
        page: 3,
        pagination: 10,
      });

      expect(result.length).toBe(0);
      expect(result).toEqual([]);
    });
  });

  describe('addTask', () => {
    test('adds a new task', async () => {
      const svc = new InMemoryTaskService();

      const newId = 'newId';
      uuidv4.mockReturnValue(newId);

      const result = await svc.addTask(task1);

      expect(result.toJSON()).toEqual({ ...task1.toJSON(), id: newId });
    });
  });

  describe('updateTask', () => {
    test('updates an existing task and returns the old value', async () => {
      const svc = new InMemoryTaskService({ tasks: [task1] });

      const updatedTask = Task.fromJSON({
        ...task1.toJSON(),
        name: 'newName',
      });

      const result = await svc.updateTask(updatedTask);

      expect(result.toJSON()).toEqual(task1.toJSON());

      expect(svc.tasks[task1.id]?.toJSON()).toEqual(updatedTask.toJSON());
    });

    test('throws an error if the task does not exist', async () => {
      const svc = new InMemoryTaskService({ tasks: [] });

      await expect(() => svc.updateTask(task1)).rejects.toThrow(
        `Task with ID ${task1.id} not found`,
      );
    });
  });

  describe('deleteTask', () => {
    test('deletes the task from the list', async () => {
      const svc = new InMemoryTaskService({ tasks: [task1] });

      expect(svc.tasksList).toEqual([task1]);

      const result = await svc.deleteTask(task1.id);

      expect(result).toBe(task1);
      expect(svc.tasksList).toEqual([]);
    });

    test('throws an error if the task does not exist', async () => {
      const svc = new InMemoryTaskService({ tasks: [] });

      await expect(() => svc.deleteTask(task1.id)).rejects.toThrow(
        `Task with ID ${task1.id} not found`,
      );
    });
  });

  describe('getTaskDeposits', () => {
    test('returns an array of Deposits', async () => {
      const svc = new InMemoryTaskService({ taskDeposits: [td1, td2, td3] });

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

      const svc = new InMemoryTaskService({
        taskDeposits: [td1, td2, td3, ...deposits],
      });

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

      const svc = new InMemoryTaskService({
        taskDeposits: [td1, td2, td3, ...deposits],
      });

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

      const svc = new InMemoryTaskService({
        taskDeposits: [td1, td2, td3, ...deposits],
      });

      const result = await svc.getTaskDeposits({
        userId: 'vbUserId1',
        page: 3,
        pagination: 10,
      });

      expect(result.length).toBe(0);
    });

    test('returns an empty array if there are no Deposits', async () => {
      const svc = new InMemoryTaskService();
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

      const svc = new InMemoryTaskService({
        taskDeposits: [td1, td2, td3, ...deposits],
      });

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
      const svc = new InMemoryTaskService({ taskDeposits: [td1, td2, td3] });

      const result = await svc.getTaskDeposits({
        userId: 'vbUserId1',
        startDate: '2024-01-01T00:00:00.000Z',
        endDate: '2024-01-01T00:00:00.000Z',
      });

      expect(result).toEqual([]);
    });

    test('returns a value if the start and end dates are the same', async () => {
      const svc = new InMemoryTaskService({ taskDeposits: [td1, td2, td3] });

      const result = await svc.getTaskDeposits({
        userId: 'vbUserId1',
        startDate: '2024-01-01T00:00:00.000Z',
        endDate: '2024-01-02T00:00:00.000Z',
      });

      expect(result).toEqual([td1]);
    });

    test('dates are ignored if they are invalid', async () => {
      const service = new InMemoryTaskService({
        taskDeposits: [td1, td2, td3],
      });

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
      const service = new InMemoryTaskService({
        taskDeposits: [td1, td2, td3],
      });

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
      const svc = new InMemoryTaskService();
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

      const svc = new InMemoryTaskService({
        taskDeposits: [deposit1, deposit2, deposit3, deposit4],
      });

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

      const svc = new InMemoryTaskService({
        taskDeposits: [deposit1, deposit2, deposit3, deposit4],
      });

      const result = await svc.getDepositsForFrequency(td1, Frequency.Monthly);

      expect(result).toEqual([deposit1, deposit2, deposit3]);
    });

    test('returns a list of daily task deposits if any deposits exist during the same week', async () => {
      const deposit1 = TaskDeposit.fromJSON({ ...td1JSON, id: 'nid1' });
      const deposit2 = TaskDeposit.fromJSON({ ...td1JSON, id: 'nid2' });
      const deposit3 = TaskDeposit.fromJSON({ ...td1JSON, id: 'nid3' });
      const deposit4 = TaskDeposit.fromJSON({ ...td1JSON, id: 'nid4' });

      const svc = new InMemoryTaskService({
        taskDeposits: [deposit1, deposit2, deposit3, deposit4, td2],
      });

      const result = await svc.getDepositsForFrequency(td1, Frequency.Daily);

      expect(result).toEqual([deposit1, deposit2, deposit3, deposit4]);
    });
  });

  describe('addTaskDeposit', () => {
    test('adds a new deposit', async () => {
      const svc = new InMemoryTaskService({
        tasks: [task1, task2],
      });

      const newId = 'newId';
      uuidv4.mockReturnValue(newId);

      const result = await svc.addTaskDeposit(td1);

      expect(result.tokensAdded).toBe(td1.tokensEarned);
      expect(result.taskDeposit.toJSON()).toEqual({
        ...td1.toJSON(),
        id: newId,
      });
    });

    test('Sets the deposit tokens earned to 0 if another deposit exists during frequency period', async () => {
      const svc = new InMemoryTaskService({
        tasks: [task1, task2],
        taskDeposits: [td1],
      });

      const newId = 'newId';
      uuidv4.mockReturnValue(newId);

      expect(td1.tokensEarned).not.toBe(0);

      const result = await svc.addTaskDeposit(td1);

      expect(result.tokensAdded).toBe(0);
      expect(result.taskDeposit.toJSON()).toEqual({
        ...td1.toJSON(),
        id: newId,
        tokensEarned: 0,
      });
    });

    test('throws an error if the task does not exist', async () => {
      const svc = new InMemoryTaskService();

      const newId = 'newId';
      uuidv4.mockReturnValue(newId);

      await expect(() => svc.addTaskDeposit(td1)).rejects.toThrow(
        `Task with ID ${td1.taskId} not found`,
      );
    });
  });

  describe('updateTaskDeposit', () => {
    test('updates an existing deposit and returns the old value', async () => {
      const svc = new InMemoryTaskService({
        tasks: [task1],
        taskDeposits: [td1],
      });

      expect(svc.taskDepositsList.length).toBe(1);

      const updatedDeposit = TaskDeposit.fromJSON({
        ...td1.toJSON(),
        date: td1.date.plus({ minutes: 20 }).toISO(),
      });

      const result = await svc.updateTaskDeposit(updatedDeposit);

      expect(result.tokensAdded).toBe(0);
      expect(result.taskDeposit).toBe(td1);

      expect(svc.taskDepositsList.length).toBe(1);

      const first = svc.taskDepositsList[0];

      if (!first) {
        throw new Error('does not exist');
      }

      expect(first.toJSON()).toEqual(updatedDeposit.toJSON());
    });

    test('throws an error if the deposit does not exist', async () => {
      const svc = new InMemoryTaskService({
        tasks: [task1],
        taskDeposits: [],
      });

      expect(svc.taskDepositsList.length).toBe(0);

      const updatedDeposit = TaskDeposit.fromJSON({
        ...td1.toJSON(),
        date: td1.date.plus({ minutes: 20 }).toISO(),
      });

      await expect(() => svc.updateTaskDeposit(updatedDeposit)).rejects.toThrow(
        `Deposit with ID ${updatedDeposit.id} not found`,
      );
    });

    test('if the updated deposit is on a different date and other deposits exist during that frequency, it sets the tokens earned to 0', async () => {
      const svc = new InMemoryTaskService({
        tasks: [task1],
        taskDeposits: [td1, td2],
      });

      const updatedDeposit = TaskDeposit.fromJSON({
        ...td1.toJSON(),
        date: td2.date.plus({ minutes: 1 }).toISO(),
      });

      const result = await svc.updateTaskDeposit(updatedDeposit);

      const deposit = svc.taskDeposits[updatedDeposit.id];

      if (!deposit) {
        throw new Error('not found');
      }

      expect(result.tokensAdded).toBe(-1 * td1.tokensEarned);
      expect(deposit.tokensEarned).toBe(0);
      expect(updatedDeposit.tokensEarned).not.toBe(0);
    });

    test('if the updated deposit earns zero on one date and earns zero on another date, the earned tokens will be the same', async () => {
      const d1 = TaskDeposit.fromJSON({
        ...td1.toJSON(),
        id: '1',
        tokensEarned: 1,
      });
      const d2 = TaskDeposit.fromJSON({
        ...td1.toJSON(),
        date: d1.date.plus({ minutes: 1 }).toISO(),
        id: '2',
        tokensEarned: 0,
      });
      const d3 = TaskDeposit.fromJSON({
        ...td1.toJSON(),
        date: d1.date.plus({ days: 1 }).toISO(),
        id: '3',
        tokensEarned: 1,
      });

      const d2Update = TaskDeposit.fromJSON({
        ...d2.toJSON(),
        date: d3.date.plus({ minutes: 1 }).toISO(),
      });

      const svc = new InMemoryTaskService({
        tasks: [task1],
        taskDeposits: [d1, d2, d3],
      });

      const result = await svc.updateTaskDeposit(d2Update);

      const deposit = svc.taskDeposits[d2Update.id];

      if (!deposit) {
        throw new Error('not found');
      }

      expect(result.tokensAdded).toBe(0);
    });

    test('if the updated deposit earns zero on one date and earns tokens on another date, the earned tokens will go up', async () => {
      const d1 = TaskDeposit.fromJSON({
        ...td1.toJSON(),
        id: '1',
        tokensEarned: 1,
      });
      const d2 = TaskDeposit.fromJSON({
        ...td1.toJSON(),
        date: d1.date.plus({ minutes: 1 }).toISO(),
        id: '2',
        tokensEarned: 0,
      });

      const d2Update = TaskDeposit.fromJSON({
        ...d2.toJSON(),
        date: d1.date.plus({ days: 1 }).toISO(),
      });

      const svc = new InMemoryTaskService({
        tasks: [task1],
        taskDeposits: [d1, d2],
      });

      const result = await svc.updateTaskDeposit(d2Update);

      const deposit = svc.taskDeposits[d2Update.id];

      if (!deposit) {
        throw new Error('not found');
      }

      expect(result.tokensAdded).toBe(1);
    });

    test('If the updated deposit earns tokens on one date and earns zero on another date, the earned tokens will go down', async () => {
      const d1 = TaskDeposit.fromJSON({
        ...td1.toJSON(),
        id: '1',
        tokensEarned: 1,
      });

      const d3 = TaskDeposit.fromJSON({
        ...td1.toJSON(),
        date: d1.date.plus({ days: 1 }).toISO(),
        id: '3',
        tokensEarned: 1,
      });

      const d1Update = TaskDeposit.fromJSON({
        ...d1.toJSON(),
        date: d3.date.plus({ minutes: 1 }).toISO(),
      });

      const svc = new InMemoryTaskService({
        tasks: [task1],
        taskDeposits: [d1, d3],
      });

      const result = await svc.updateTaskDeposit(d1Update);

      const deposit = svc.taskDeposits[d1Update.id];

      if (!deposit) {
        throw new Error('not found');
      }

      expect(result.tokensAdded).toBe(-1);
    });

    test('If the updated deposit earns tokens on one date and earns tokens on another date, the earned tokens will be the same', async () => {
      const d1 = TaskDeposit.fromJSON({
        ...td1.toJSON(),
        id: '1',
        tokensEarned: 1,
      });

      const d1Update = TaskDeposit.fromJSON({
        ...d1.toJSON(),
        date: d1.date.plus({ minutes: 1 }).toISO(),
      });

      const svc = new InMemoryTaskService({
        tasks: [task1],
        taskDeposits: [d1],
      });

      const result = await svc.updateTaskDeposit(d1Update);

      const deposit = svc.taskDeposits[d1Update.id];

      if (!deposit) {
        throw new Error('not found');
      }

      expect(result.tokensAdded).toBe(0);
    });

    test('if the updated deposit is on a different date and is the only deposit during that frequency, tokens earned is set to the conversion rate', async () => {
      const td4 = TaskDeposit.fromJSON({
        ...td1.toJSON(),
        date: td2.date.plus({ minutes: 1 }).toISO(),
        tokensEarned: 0,
      });

      const svc = new InMemoryTaskService({
        tasks: [task1],
        taskDeposits: [td4, td2],
      });

      const updatedDeposit = TaskDeposit.fromJSON({
        ...td4.toJSON(),
        date: td1.date.toISO(),
      });

      const result = await svc.updateTaskDeposit(updatedDeposit);

      const deposit = svc.taskDeposits[updatedDeposit.id];

      if (!deposit) {
        throw new Error('not found');
      }

      expect(result.tokensAdded).toBe(updatedDeposit.conversionRate);
      expect(deposit.tokensEarned).toBe(updatedDeposit.conversionRate);
    });

    test('if the updated deposit is on the same date and is the only deposit during that frequency, tokens earned is set to the conversion rate', async () => {
      const td4 = TaskDeposit.fromJSON({
        ...td1.toJSON(),
        tokensEarned: 0,
      });

      const svc = new InMemoryTaskService({
        tasks: [task1],
        taskDeposits: [td4],
      });

      const result = await svc.updateTaskDeposit(td4);

      const deposit = svc.taskDeposits[td4.id];

      if (!deposit) {
        throw new Error('not found');
      }

      expect(result.tokensAdded).toBe(td4.conversionRate);
      expect(deposit.tokensEarned).toBe(td4.conversionRate);
    });

    test('if the updated deposit is on the same date and is the only deposit during that frequency, tokens earned is set to the conversion rate even if it is not 0', async () => {
      const td4 = TaskDeposit.fromJSON({
        ...td1.toJSON(),
        tokensEarned: 80,
      });

      const svc = new InMemoryTaskService({
        tasks: [task1],
        taskDeposits: [td4],
      });

      const result = await svc.updateTaskDeposit(td4);

      const deposit = svc.taskDeposits[td4.id];

      if (!deposit) {
        throw new Error('not found');
      }

      expect(result.tokensAdded).toBe(-79);
      expect(deposit.tokensEarned).toBe(td4.conversionRate);
    });

    test('if the updated deposit is on the same date and other deposits exist during that frequency and another deposit has tokens, it sets the tokens earned to 0', async () => {
      const td4 = TaskDeposit.fromJSON({
        ...td1.toJSON(),
        id: 'td4',
        date: td1.date.plus({ minutes: 1 }).toISO(),
        tokensEarned: 80,
      });

      const svc = new InMemoryTaskService({
        tasks: [task1],
        taskDeposits: [td1, td4],
      });

      const result = await svc.updateTaskDeposit(td4);

      const deposit = svc.taskDeposits[td4.id];

      if (!deposit) {
        throw new Error('not found');
      }

      expect(deposit.tokensEarned).toBe(0);
      expect(result.tokensAdded).toBe(-80);
    });

    test('if the updated deposit is on the same date and other deposits exist during that frequency but no other deposits have tokens, it sets the tokens earned to the conversion rate on the earliest deposit', async () => {
      const td4 = TaskDeposit.fromJSON({
        ...td1.toJSON(),
        id: 'td4',
        date: td1.date.plus({ minutes: 1 }).toISO(),
        tokensEarned: 0,
      });
      const td5 = TaskDeposit.fromJSON({
        ...td1.toJSON(),
        id: 'td5',
        date: td1.date.plus({ minutes: 2 }).toISO(),
        tokensEarned: 0,
      });
      const td6 = TaskDeposit.fromJSON({
        ...td1.toJSON(),
        id: 'td6',
        date: td1.date.plus({ minutes: 3 }).toISO(),
        tokensEarned: 0,
      });

      const svc = new InMemoryTaskService({
        tasks: [task1],
        taskDeposits: [td4, td5, td6],
      });

      const result = await svc.updateTaskDeposit(td5);

      expect(result.tokensAdded).toBe(td4.conversionRate);

      expect(svc.taskDepositsList.length).toBe(3);
      expect(svc.taskDepositsList[0]?.tokensEarned).toBe(td4.conversionRate);
      expect(svc.taskDepositsList[0]?.id).toBe(td4.id);
      expect(svc.taskDepositsList[1]?.tokensEarned).toBe(0);
      expect(svc.taskDepositsList[2]?.tokensEarned).toBe(0);
    });
  });

  describe('updateTaskDepositTokens', () => {
    test('sorts all deposits by date and sets the tokens earned to the conversion rate for the earliest deposit and the rest to zero', async () => {
      const td4 = TaskDeposit.fromJSON({
        ...td1.toJSON(),
        id: 'td4',
        date: td1.date.plus({ minutes: 1 }).toISO(),
        tokensEarned: 0,
      });
      const td5 = TaskDeposit.fromJSON({
        ...td1.toJSON(),
        id: 'td5',
        date: td1.date.plus({ minutes: 2 }).toISO(),
        tokensEarned: 9,
      });
      const td6 = TaskDeposit.fromJSON({
        ...td1.toJSON(),
        id: 'td6',
        date: td1.date.plus({ minutes: 3 }).toISO(),
        tokensEarned: 200,
      });

      const svc = new InMemoryTaskService();
      const result = svc.updateTaskDepositTokens([td6, td4, td5]);

      const expectation1 = TaskDeposit.fromJSON({
        ...td4.toJSON(),
        tokensEarned: td4.conversionRate,
      });
      const expectation2 = TaskDeposit.fromJSON({
        ...td5.toJSON(),
        tokensEarned: 0,
      });
      const expectation3 = TaskDeposit.fromJSON({
        ...td6.toJSON(),
        tokensEarned: 0,
      });

      expect(result).toEqual([expectation1, expectation2, expectation3]);
    });

    test('returns an empty array if an empty array is provided', () => {
      const svc = new InMemoryTaskService();
      const result = svc.updateTaskDepositTokens([]);

      expect(result).toEqual([]);
    });

    test("sets the tokens earned to the conversion rate if there's only one value", async () => {
      const td4 = TaskDeposit.fromJSON({
        ...td1.toJSON(),
        id: 'td4',
        date: td1.date.plus({ minutes: 1 }).toISO(),
        tokensEarned: 0,
      });

      const svc = new InMemoryTaskService();
      const result = svc.updateTaskDepositTokens([td4]);

      const expectation = TaskDeposit.fromJSON({
        ...td4.toJSON(),
        tokensEarned: td4.conversionRate,
      });

      expect(result).toEqual([expectation]);
    });
  });

  describe('deleteTaskDeposit', () => {
    test('deletes an existing deposit', async () => {
      const svc = new InMemoryTaskService({
        tasks: [task1],
        taskDeposits: [td1, td2, td3],
      });

      expect(svc.taskDepositsList.length).toBe(3);

      const result = await svc.deleteTaskDeposit(td1.id);

      expect(result.taskDeposit).toBe(td1);
      expect(result.tokensAdded).toBe(0 - td1.tokensEarned);
      expect(svc.taskDepositsList.length).toBe(2);

      const filter = svc.taskDepositsList.filter((d) => d.id === td1.id);

      expect(filter.length).toBe(0);
    });

    test('throws an error if the deposit does not exist', async () => {
      const svc = new InMemoryTaskService({
        tasks: [task1],
        taskDeposits: [td2, td3],
      });

      await expect(() => svc.deleteTaskDeposit(td1.id)).rejects.toThrow(
        `Deposit with ID ${td1.id} not found`,
      );
    });

    test("if other deposits exist during that frequency, it sets the first deposit's tokens to the conversion rate", async () => {
      const td4 = TaskDeposit.fromJSON({
        ...td1.toJSON(),
        id: 'td4',
        date: td1.date.plus({ minutes: 1 }).toISO(),
        tokensEarned: 0,
      });
      const td5 = TaskDeposit.fromJSON({
        ...td1.toJSON(),
        id: 'td5',
        date: td1.date.plus({ minutes: 2 }).toISO(),
        tokensEarned: 0,
      });
      const td6 = TaskDeposit.fromJSON({
        ...td1.toJSON(),
        id: 'td6',
        date: td1.date.plus({ minutes: 3 }).toISO(),
        tokensEarned: 0,
      });

      const svc = new InMemoryTaskService({
        tasks: [task1],
        taskDeposits: [td1, td2, td3, td4, td5, td6],
      });

      expect(svc.taskDepositsList.length).toBe(6);

      const filterA = svc.taskDepositsList.filter((d) => d.id === td4.id);
      expect(filterA[0]?.tokensEarned).toBe(0);

      const result = await svc.deleteTaskDeposit(td1.id);

      expect(result.tokensAdded).toBe(0);
      expect(svc.taskDepositsList.length).toBe(5);

      const filterB = svc.taskDepositsList.filter((d) => d.id === td4.id);
      expect(filterB[0]?.tokensEarned).toBe(td4.conversionRate);
    });
  });
});
