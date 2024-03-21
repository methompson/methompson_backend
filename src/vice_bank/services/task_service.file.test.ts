import { Task, TaskJSON } from '@/src/models/vice_bank/task';
import {
  TaskDeposit,
  TaskDepositJSON,
} from '@/src/models/vice_bank/task_deposit';
import { FileServiceWriter } from '@/src/utils/file_service_writer';
import { FileTaskService } from './task_service.file';

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

const testError = 'test a;osfdiasdf8y92uhi3rj';

describe('FileTaskService', () => {
  describe('taskString', () => {
    test('returns a stringified version of the tasks and taskDeposits', () => {
      const fsw = new FileServiceWriter('baseName', 'json');
      const service = new FileTaskService(fsw, 'path', {
        tasks: [task1, task2, task3],
        deposits: [td1, td2, td3],
      });

      const data = service.taskString;

      const parsedData = JSON.parse(data);
      expect(parsedData).toEqual({
        tasks: [task1JSON, task2JSON, task3JSON],
        taskDeposits: [td1JSON, td2JSON, td3JSON],
      });
    });

    test('returns empty data if there are no tasks or taskDeposits', () => {
      const fsw = new FileServiceWriter('baseName', 'json');
      const service = new FileTaskService(fsw, 'path');

      const data = service.taskString;

      const parsedData = JSON.parse(data);
      expect(parsedData).toEqual({ tasks: [], taskDeposits: [] });
    });
  });

  describe('addTask', () => {
    test('adds a task and calls writeToFile', async () => {
      const fsw = new FileServiceWriter('baseName', 'json');

      const service = new FileTaskService(fsw, 'path');
      const writeToFileSpy = jest.spyOn(service, 'writeToFile');
      writeToFileSpy.mockImplementationOnce(async () => {});

      expect(service.tasksList.length).toBe(0);

      await service.addTask(task1);

      expect(service.tasksList.length).toBe(1);
      expect(writeToFileSpy).toHaveBeenCalledTimes(1);
    });

    test('throws an error if writeToFile throws an error', async () => {
      const fsw = new FileServiceWriter('baseName', 'json');

      const service = new FileTaskService(fsw, 'path');
      const writeToFileSpy = jest.spyOn(service, 'writeToFile');
      writeToFileSpy.mockImplementationOnce(async () => {
        throw new Error(testError);
      });

      await expect(service.addTask(task1)).rejects.toThrow(testError);

      expect(writeToFileSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('updateTask', () => {
    test('updates a task and calls writeToFile', async () => {});

    test('throws an error if writeToFile throws an error', async () => {
      const fsw = new FileServiceWriter('baseName', 'json');

      const service = new FileTaskService(fsw, 'path');
      const writeToFileSpy = jest.spyOn(service, 'writeToFile');
      writeToFileSpy.mockImplementationOnce(async () => {
        throw new Error(testError);
      });

      await expect(service.updateTask(task1)).rejects.toThrow(testError);

      expect(writeToFileSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('deleteTask', () => {
    test('deletes a task and calls writeToFile', async () => {});

    test('throws an error if writeToFile throws an error', async () => {
      const fsw = new FileServiceWriter('baseName', 'json');

      const service = new FileTaskService(fsw, 'path');
      const writeToFileSpy = jest.spyOn(service, 'writeToFile');
      writeToFileSpy.mockImplementationOnce(async () => {
        throw new Error(testError);
      });

      await expect(service.deleteTask(task1.id)).rejects.toThrow(testError);

      expect(writeToFileSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('addTaskDeposit', () => {
    test('adds a taskDeposit and calls writeToFile', async () => {});

    test('throws an error if writeToFile throws an error', async () => {
      const fsw = new FileServiceWriter('baseName', 'json');

      const service = new FileTaskService(fsw, 'path');
      const writeToFileSpy = jest.spyOn(service, 'writeToFile');
      writeToFileSpy.mockImplementationOnce(async () => {
        throw new Error(testError);
      });

      await expect(service.addTaskDeposit(td1)).rejects.toThrow(testError);

      expect(writeToFileSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('updateTaskDeposit', () => {
    test('updates a taskDeposit and calls writeToFile', async () => {});

    test('throws an error if writeToFile throws an error', async () => {
      const fsw = new FileServiceWriter('baseName', 'json');

      const service = new FileTaskService(fsw, 'path');
      const writeToFileSpy = jest.spyOn(service, 'writeToFile');
      writeToFileSpy.mockImplementationOnce(async () => {
        throw new Error(testError);
      });

      await expect(service.updateTaskDeposit(td1)).rejects.toThrow(testError);

      expect(writeToFileSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('deleteTaskDeposit', () => {
    test('deletes a task and calls writeToFile', async () => {});

    test('throws an error if writeToFile throws an error', async () => {
      const fsw = new FileServiceWriter('baseName', 'json');

      const service = new FileTaskService(fsw, 'path');
      const writeToFileSpy = jest.spyOn(service, 'writeToFile');
      writeToFileSpy.mockImplementationOnce(async () => {
        throw new Error(testError);
      });

      await expect(service.deleteTaskDeposit(td1.id)).rejects.toThrow(
        testError,
      );

      expect(writeToFileSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('writeToFile', () => {
    test('gets the string, runs FileHandleService.writeToFile', async () => {
      const fsw = new FileServiceWriter('baseName', 'json');
      const wtfSpy = jest.spyOn(fsw, 'writeToFile');
      wtfSpy.mockImplementationOnce(async () => {});

      const svc = new FileTaskService(fsw, 'path', {
        tasks: [task1, task2, task3],
        deposits: [td1, td2, td3],
      });

      const str = svc.taskString;

      await svc.writeToFile();

      expect(wtfSpy).toHaveBeenCalledTimes(1);
      expect(wtfSpy).toHaveBeenCalledWith('path', str);
    });

    test('Throws an error if FileServiceWriter.writeToFile throws an error', async () => {
      const fsw = new FileServiceWriter('baseName', 'json');
      const wtfSpy = jest.spyOn(fsw, 'writeToFile');
      wtfSpy.mockImplementationOnce(async () => {
        throw new Error(testError);
      });

      const svc = new FileTaskService(fsw, 'path', {
        tasks: [task1, task2, task3],
        deposits: [td1, td2, td3],
      });

      await expect(() => svc.writeToFile()).rejects.toThrow(testError);
    });
  });

  describe('init', () => {
    test('creates a file handle, reads a file, creates Tasks and TaskDeposit objects and returns a new FileViceBankUserService', async () => {});

    test('Only includes Tasks and Task Deposits that are valid', async () => {});

    test('returns an empty FilePurhcaseService if readFile throws an error', async () => {});

    test('If the data exists, but it is invalid, a backup is written', async () => {});
  });
});
