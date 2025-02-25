import { HttpException, HttpStatus } from '@nestjs/common';

import { TaskController } from './task.controller';

import { Task, TaskJSON } from '@/src/vice_bank/models/task';
import {
  ViceBankUser,
  ViceBankUserJSON,
} from '@/src/vice_bank/models/vice_bank_user';
import {
  TaskDeposit,
  TaskDepositJSON,
} from '@/src/vice_bank/models/task_deposit';
import { NoAuthModel } from '@/src/models/auth_model';

import { InMemoryTaskService } from '@/src/vice_bank/services/task_service.memory';
import { InMemoryViceBankUserService } from '@/src/vice_bank/services/vice_bank_user.service.memory';
import { LoggerService } from '@/src/logger/logger.service';
import { METIncomingMessage } from '@/src/utils/met_incoming_message';

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

const user1JSON: ViceBankUserJSON = {
  id: vbUserId1,
  userId: 'userId',
  name: 'name1',
  currentTokens: 1,
};
const user2JSON: ViceBankUserJSON = {
  id: vbUserId2,
  userId: 'userId',
  name: 'name2',
  currentTokens: 2,
};

const user1 = ViceBankUser.fromJSON(user1JSON);
const user2 = ViceBankUser.fromJSON(user2JSON);

const td1 = TaskDeposit.fromJSON(td1JSON);
const td2 = TaskDeposit.fromJSON(td2JSON);
const td3 = TaskDeposit.fromJSON(td3JSON);

const task1 = Task.fromJSON(task1JSON);
const task2 = Task.fromJSON(task2JSON);
const task3 = Task.fromJSON(task3JSON);

describe('TaskController', () => {
  let vbService = new InMemoryViceBankUserService([user1, user2]);

  beforeEach(() => {
    vbService = new InMemoryViceBankUserService([user1, user2]);
  });

  describe('getTasks', () => {
    test('gets tasks from the TaskService', async () => {
      const logger = new LoggerService();

      const tsvc = new InMemoryTaskService({
        tasks: [task1, task2, task3],
        taskDeposits: [td1, td2, td3],
      });
      const controller = new TaskController(tsvc, vbService, logger);

      const request = {
        query: {
          userId: vbUserId1,
        },
      } as unknown as METIncomingMessage;

      const getSpy = jest.spyOn(tsvc, 'getTasks');

      const result = await controller.getTasks(request);

      expect(result.tasks).toEqual([task1JSON, task2JSON]);

      expect(getSpy).toHaveBeenCalledTimes(1);
      expect(getSpy).toHaveBeenCalledWith({
        userId: vbUserId1,
        page: 1,
        pagination: 10,
      });
    });

    test('throws an error if the query is invalid', async () => {
      const logger = new LoggerService();

      const tsvc = new InMemoryTaskService({
        tasks: [task1, task2, task3],
        taskDeposits: [td1, td2, td3],
      });
      const controller = new TaskController(tsvc, vbService, logger);

      const request = {
        query: [],
      } as unknown as METIncomingMessage;

      const getSpy = jest.spyOn(tsvc, 'getTasks');

      await expect(() => controller.getTasks(request)).rejects.toThrow(
        new HttpException('Invalid Input', HttpStatus.BAD_REQUEST),
      );

      expect(getSpy).not.toHaveBeenCalled();
    });

    test('throws an error if the user id is not a string', async () => {
      const logger = new LoggerService();

      const tsvc = new InMemoryTaskService({
        tasks: [task1, task2, task3],
        taskDeposits: [td1, td2, td3],
      });
      const controller = new TaskController(tsvc, vbService, logger);

      const request = {
        query: {
          userId: 1,
        },
      } as unknown as METIncomingMessage;

      const getSpy = jest.spyOn(tsvc, 'getTasks');

      await expect(() => controller.getTasks(request)).rejects.toThrow(
        new HttpException('Invalid Input', HttpStatus.BAD_REQUEST),
      );

      expect(getSpy).not.toHaveBeenCalled();
    });

    test('throws an error if getTasks throws an error', async () => {
      const logger = new LoggerService();

      const tsvc = new InMemoryTaskService({
        tasks: [task1, task2, task3],
        taskDeposits: [td1, td2, td3],
      });
      const controller = new TaskController(tsvc, vbService, logger);

      const request = {
        query: {
          userId: vbUserId1,
        },
      } as unknown as METIncomingMessage;

      const getSpy = jest.spyOn(tsvc, 'getTasks');
      getSpy.mockRejectedValue(new Error('Test Error'));

      await expect(() => controller.getTasks(request)).rejects.toThrow(
        new HttpException('Server Error', HttpStatus.INTERNAL_SERVER_ERROR),
      );

      expect(getSpy).toHaveBeenCalledTimes(1);
      expect(getSpy).toHaveBeenCalledWith({
        userId: vbUserId1,
        page: 1,
        pagination: 10,
      });
    });
  });

  describe('addTask', () => {
    test('adds a task to the TaskService', async () => {
      const logger = new LoggerService();

      const tsvc = new InMemoryTaskService();
      const controller = new TaskController(tsvc, vbService, logger);
      const authModel = new NoAuthModel();
      jest.spyOn(authModel, 'userId', 'get').mockReturnValue('userId');

      const request = {
        authModel,
        body: {
          task: task1JSON,
        },
      } as unknown as METIncomingMessage;

      const addSpy = jest.spyOn(tsvc, 'addTask');
      addSpy.mockResolvedValueOnce(task1);

      const result = await controller.addTask(request);

      expect(result.task).toEqual(task1.toJSON());

      expect(addSpy).toHaveBeenCalledTimes(1);
    });

    test('throws an error if the body is invalid', async () => {
      const logger = new LoggerService();

      const tsvc = new InMemoryTaskService();
      const controller = new TaskController(tsvc, vbService, logger);
      const authModel = new NoAuthModel();
      jest.spyOn(authModel, 'userId', 'get').mockReturnValue('userId');

      const request = {
        authModel,
        body: [],
      } as unknown as METIncomingMessage;

      const addSpy = jest.spyOn(tsvc, 'addTask');

      await expect(() => controller.addTask(request)).rejects.toThrow(
        new HttpException('Invalid Input', HttpStatus.BAD_REQUEST),
      );

      expect(addSpy).toHaveBeenCalledTimes(0);
    });

    test('throws an error if the body cannot be parsed', async () => {
      const logger = new LoggerService();

      const tsvc = new InMemoryTaskService();
      const controller = new TaskController(tsvc, vbService, logger);
      const authModel = new NoAuthModel();
      jest.spyOn(authModel, 'userId', 'get').mockReturnValue('userId');

      const request = {
        authModel,
        body: {
          task: {},
        },
      } as unknown as METIncomingMessage;

      const addSpy = jest.spyOn(tsvc, 'addTask');

      await expect(() => controller.addTask(request)).rejects.toThrow(
        new HttpException('Invalid Input', HttpStatus.BAD_REQUEST),
      );

      expect(addSpy).toHaveBeenCalledTimes(0);
    });

    test('throws an error if addTask throws an error', async () => {
      const logger = new LoggerService();

      const tsvc = new InMemoryTaskService();
      const controller = new TaskController(tsvc, vbService, logger);
      const authModel = new NoAuthModel();
      jest.spyOn(authModel, 'userId', 'get').mockReturnValue('userId');

      const request = {
        authModel,
        body: {
          task: task1JSON,
        },
      } as unknown as METIncomingMessage;

      const addSpy = jest.spyOn(tsvc, 'addTask');
      addSpy.mockRejectedValue(new Error('Test Error'));

      await expect(() => controller.addTask(request)).rejects.toThrow(
        new HttpException('Server Error', HttpStatus.INTERNAL_SERVER_ERROR),
      );

      expect(addSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('updateTask', () => {
    test('updates a task with the TaskService', async () => {
      const logger = new LoggerService();

      const tsvc = new InMemoryTaskService();
      const controller = new TaskController(tsvc, vbService, logger);
      const authModel = new NoAuthModel();
      jest.spyOn(authModel, 'userId', 'get').mockReturnValue('userId');

      const request = {
        authModel,
        body: {
          task: task1JSON,
        },
      } as unknown as METIncomingMessage;

      const upSpy = jest.spyOn(tsvc, 'updateTask');
      upSpy.mockResolvedValueOnce(task1);

      const result = await controller.updateTask(request);

      expect(result.task).toEqual(task1.toJSON());

      expect(upSpy).toHaveBeenCalledTimes(1);
    });

    test('throws an error if the body is invalid', async () => {
      const logger = new LoggerService();

      const tsvc = new InMemoryTaskService();
      const controller = new TaskController(tsvc, vbService, logger);
      const authModel = new NoAuthModel();
      jest.spyOn(authModel, 'userId', 'get').mockReturnValue('userId');

      const request = {
        authModel,
        body: [],
      } as unknown as METIncomingMessage;

      const upSpy = jest.spyOn(tsvc, 'updateTask');

      await expect(() => controller.updateTask(request)).rejects.toThrow(
        new HttpException('Invalid Input', HttpStatus.BAD_REQUEST),
      );

      expect(upSpy).toHaveBeenCalledTimes(0);
    });

    test('throws an error if the body cannot be parsed', async () => {
      const logger = new LoggerService();

      const tsvc = new InMemoryTaskService();
      const controller = new TaskController(tsvc, vbService, logger);
      const authModel = new NoAuthModel();
      jest.spyOn(authModel, 'userId', 'get').mockReturnValue('userId');

      const request = {
        authModel,
        body: {
          task: {},
        },
      } as unknown as METIncomingMessage;

      const upSpy = jest.spyOn(tsvc, 'updateTask');

      await expect(() => controller.updateTask(request)).rejects.toThrow(
        new HttpException('Invalid Input', HttpStatus.BAD_REQUEST),
      );

      expect(upSpy).toHaveBeenCalledTimes(0);
    });

    test('throws an error if updateTask throws an error', async () => {
      const logger = new LoggerService();

      const tsvc = new InMemoryTaskService();
      const controller = new TaskController(tsvc, vbService, logger);
      const authModel = new NoAuthModel();
      jest.spyOn(authModel, 'userId', 'get').mockReturnValue('userId');

      const request = {
        authModel,
        body: {
          task: task1JSON,
        },
      } as unknown as METIncomingMessage;

      const updateSpy = jest.spyOn(tsvc, 'updateTask');
      updateSpy.mockRejectedValue(new Error('Test Error'));

      await expect(() => controller.updateTask(request)).rejects.toThrow(
        new HttpException('Server Error', HttpStatus.INTERNAL_SERVER_ERROR),
      );

      expect(updateSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('deleteTask', () => {
    test('deletes a task with the TaskService', async () => {
      const logger = new LoggerService();

      const tsvc = new InMemoryTaskService();
      const controller = new TaskController(tsvc, vbService, logger);
      const authModel = new NoAuthModel();
      jest.spyOn(authModel, 'userId', 'get').mockReturnValue('userId');

      const request = {
        authModel,
        body: {
          taskId: task1.id,
        },
      } as unknown as METIncomingMessage;

      const delSpy = jest.spyOn(tsvc, 'deleteTask');
      delSpy.mockResolvedValueOnce(task1);

      const result = await controller.deleteTask(request);

      expect(result.task).toEqual(task1.toJSON());

      expect(delSpy).toHaveBeenCalledTimes(1);
      expect(delSpy).toHaveBeenCalledWith(task1.id);
    });

    test('throws an error if the body is invalid', async () => {
      const logger = new LoggerService();

      const tsvc = new InMemoryTaskService();
      const controller = new TaskController(tsvc, vbService, logger);
      const authModel = new NoAuthModel();
      jest.spyOn(authModel, 'userId', 'get').mockReturnValue('userId');

      const request = {
        authModel,
        body: [],
      } as unknown as METIncomingMessage;

      const delSpy = jest.spyOn(tsvc, 'deleteTask');

      await expect(() => controller.updateTask(request)).rejects.toThrow(
        new HttpException('Invalid Input', HttpStatus.BAD_REQUEST),
      );

      expect(delSpy).toHaveBeenCalledTimes(0);
    });

    test('throws an error if the body cannot be parsed', async () => {
      const logger = new LoggerService();

      const tsvc = new InMemoryTaskService();
      const controller = new TaskController(tsvc, vbService, logger);
      const authModel = new NoAuthModel();
      jest.spyOn(authModel, 'userId', 'get').mockReturnValue('userId');

      const request = {
        authModel,
        body: {
          taskId: 1,
        },
      } as unknown as METIncomingMessage;

      const delSpy = jest.spyOn(tsvc, 'deleteTask');

      await expect(() => controller.updateTask(request)).rejects.toThrow(
        new HttpException('Invalid Input', HttpStatus.BAD_REQUEST),
      );

      expect(delSpy).toHaveBeenCalledTimes(0);
    });

    test('throws an error if deleteTask throws an error', async () => {
      const logger = new LoggerService();

      const tsvc = new InMemoryTaskService();
      const controller = new TaskController(tsvc, vbService, logger);
      const authModel = new NoAuthModel();
      jest.spyOn(authModel, 'userId', 'get').mockReturnValue('userId');

      const request = {
        authModel,
        body: {
          taskId: task1.id,
        },
      } as unknown as METIncomingMessage;

      const delSpy = jest.spyOn(tsvc, 'deleteTask');
      delSpy.mockRejectedValue(new Error('Test Error'));

      await expect(() => controller.deleteTask(request)).rejects.toThrow(
        new HttpException('Server Error', HttpStatus.INTERNAL_SERVER_ERROR),
      );

      expect(delSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('getTaskDeposits', () => {
    test('gets tasks from the TaskService', async () => {
      const logger = new LoggerService();

      const tsvc = new InMemoryTaskService({
        tasks: [task1, task2, task3],
        taskDeposits: [td1, td2, td3],
      });
      const controller = new TaskController(tsvc, vbService, logger);

      const request = {
        query: {
          userId: vbUserId1,
        },
      } as unknown as METIncomingMessage;

      const getSpy = jest.spyOn(tsvc, 'getTaskDeposits');

      const result = await controller.getTaskDeposits(request);

      expect(result.taskDeposits).toEqual([td1, td2]);

      expect(getSpy).toHaveBeenCalledTimes(1);
      expect(getSpy).toHaveBeenCalledWith({
        userId: vbUserId1,
        page: 1,
        pagination: 10,
      });
    });

    test('throws an error if the query is invalid', async () => {
      const logger = new LoggerService();

      const tsvc = new InMemoryTaskService({
        tasks: [task1, task2, task3],
        taskDeposits: [td1, td2, td3],
      });
      const controller = new TaskController(tsvc, vbService, logger);

      const request = {} as unknown as METIncomingMessage;

      const getSpy = jest.spyOn(tsvc, 'getTaskDeposits');

      await expect(() => controller.getTaskDeposits(request)).rejects.toThrow(
        new HttpException('Invalid Input', HttpStatus.BAD_REQUEST),
      );

      expect(getSpy).not.toHaveBeenCalled();
    });

    test('throws an error if the query cannot be parsed', async () => {
      const logger = new LoggerService();

      const tsvc = new InMemoryTaskService({
        tasks: [task1, task2, task3],
        taskDeposits: [td1, td2, td3],
      });
      const controller = new TaskController(tsvc, vbService, logger);

      const request = {
        query: {
          userId: 1,
        },
      } as unknown as METIncomingMessage;

      const getSpy = jest.spyOn(tsvc, 'getTaskDeposits');

      await expect(() => controller.getTaskDeposits(request)).rejects.toThrow(
        new HttpException('Invalid Input', HttpStatus.BAD_REQUEST),
      );

      expect(getSpy).not.toHaveBeenCalled();
    });

    test('throws an error if getTaskDeposits throws an error', async () => {
      const logger = new LoggerService();

      const tsvc = new InMemoryTaskService({
        tasks: [task1, task2, task3],
        taskDeposits: [td1, td2, td3],
      });
      const controller = new TaskController(tsvc, vbService, logger);

      const request = {
        query: {
          userId: vbUserId1,
        },
      } as unknown as METIncomingMessage;

      const getSpy = jest.spyOn(tsvc, 'getTaskDeposits');
      getSpy.mockRejectedValue(new Error('Test Error'));

      await expect(() => controller.getTaskDeposits(request)).rejects.toThrow(
        new HttpException('Server Error', HttpStatus.INTERNAL_SERVER_ERROR),
      );

      expect(getSpy).toHaveBeenCalledTimes(1);
      expect(getSpy).toHaveBeenCalledWith({
        userId: vbUserId1,
        page: 1,
        pagination: 10,
      });
    });
  });

  describe('addTaskDeposit', () => {
    test('adds a taskDeposit with the TaskService', async () => {
      const logger = new LoggerService();

      const tsvc = new InMemoryTaskService({
        tasks: [task1, task2, task3],
      });
      const controller = new TaskController(tsvc, vbService, logger);
      const authModel = new NoAuthModel();
      jest.spyOn(authModel, 'userId', 'get').mockReturnValue('userId');

      const request = {
        authModel,
        body: {
          taskDeposit: td1JSON,
        },
      } as unknown as METIncomingMessage;

      const currentTokens = td1.tokensEarned + user1.currentTokens;

      const addSpy = jest.spyOn(tsvc, 'addTaskDeposit');
      addSpy.mockResolvedValue({
        taskDeposit: td1,
        tokensAdded: td1.tokensEarned,
      });

      const getvbSpy = jest.spyOn(vbService, 'getViceBankUser');
      const upvbSpy = jest.spyOn(vbService, 'updateViceBankUser');

      const result = await controller.addTaskDeposit(request);

      expect(result).toEqual({
        taskDeposit: td1.toJSON(),
        currentTokens,
      });

      expect(addSpy).toHaveBeenCalledTimes(1);

      expect(getvbSpy).toHaveBeenCalledTimes(1);
      expect(getvbSpy).toHaveBeenCalledWith(vbUserId1);

      expect(upvbSpy).toHaveBeenCalledTimes(1);
      expect(upvbSpy).toHaveBeenCalledWith(user1.copyWith({ currentTokens }));
    });

    test('throws an error if the body is invalid', async () => {
      const logger = new LoggerService();

      const tsvc = new InMemoryTaskService({
        tasks: [task1, task2, task3],
      });
      const controller = new TaskController(tsvc, vbService, logger);
      const authModel = new NoAuthModel();
      jest.spyOn(authModel, 'userId', 'get').mockReturnValue('userId');

      const request = {
        authModel,
      } as unknown as METIncomingMessage;

      const addSpy = jest.spyOn(tsvc, 'addTaskDeposit');

      const getvbSpy = jest.spyOn(vbService, 'getViceBankUser');
      const upvbSpy = jest.spyOn(vbService, 'updateViceBankUser');

      await expect(() => controller.addTaskDeposit(request)).rejects.toThrow(
        new HttpException('Invalid Input', HttpStatus.BAD_REQUEST),
      );

      expect(addSpy).toHaveBeenCalledTimes(0);
      expect(getvbSpy).toHaveBeenCalledTimes(0);
      expect(upvbSpy).toHaveBeenCalledTimes(0);
    });

    test('throws an error if the body cannot be parsed', async () => {
      const logger = new LoggerService();

      const tsvc = new InMemoryTaskService({
        tasks: [task1, task2, task3],
      });
      const controller = new TaskController(tsvc, vbService, logger);
      const authModel = new NoAuthModel();
      jest.spyOn(authModel, 'userId', 'get').mockReturnValue('userId');

      const request = {
        authModel,
        body: {
          taskDeposit: {},
        },
      } as unknown as METIncomingMessage;

      const addSpy = jest.spyOn(tsvc, 'addTaskDeposit');

      const getvbSpy = jest.spyOn(vbService, 'getViceBankUser');
      const upvbSpy = jest.spyOn(vbService, 'updateViceBankUser');

      await expect(() => controller.addTaskDeposit(request)).rejects.toThrow();

      expect(addSpy).toHaveBeenCalledTimes(0);
      expect(getvbSpy).toHaveBeenCalledTimes(0);
      expect(upvbSpy).toHaveBeenCalledTimes(0);
    });

    test('throws an error if getViceBankUser throws an error', async () => {
      const logger = new LoggerService();

      const tsvc = new InMemoryTaskService({
        tasks: [task1, task2, task3],
      });
      const controller = new TaskController(tsvc, vbService, logger);
      const authModel = new NoAuthModel();
      jest.spyOn(authModel, 'userId', 'get').mockReturnValue('userId');

      const request = {
        authModel,
        body: {
          taskDeposit: td1JSON,
        },
      } as unknown as METIncomingMessage;

      const addSpy = jest.spyOn(tsvc, 'addTaskDeposit');
      addSpy.mockResolvedValue({
        taskDeposit: td1,
        tokensAdded: td1.tokensEarned,
      });

      const getvbSpy = jest.spyOn(vbService, 'getViceBankUser');
      getvbSpy.mockRejectedValue(new Error('Test Error'));

      const upvbSpy = jest.spyOn(vbService, 'updateViceBankUser');

      await expect(controller.addTaskDeposit(request)).rejects.toThrow(
        new HttpException('Server Error', HttpStatus.INTERNAL_SERVER_ERROR),
      );

      expect(addSpy).toHaveBeenCalledTimes(0);

      expect(getvbSpy).toHaveBeenCalledTimes(1);
      expect(getvbSpy).toHaveBeenCalledWith(vbUserId1);

      expect(upvbSpy).toHaveBeenCalledTimes(0);
    });

    test('throws an error if addTaskDeposit throws an error', async () => {
      const logger = new LoggerService();

      const tsvc = new InMemoryTaskService();
      const controller = new TaskController(tsvc, vbService, logger);
      const authModel = new NoAuthModel();
      jest.spyOn(authModel, 'userId', 'get').mockReturnValue('userId');

      const request = {
        authModel,
        body: {
          taskDeposit: td1JSON,
        },
      } as unknown as METIncomingMessage;

      const addSpy = jest.spyOn(tsvc, 'addTaskDeposit');
      addSpy.mockRejectedValue(new Error('Test Error'));

      await expect(() => controller.addTaskDeposit(request)).rejects.toThrow(
        new HttpException('Server Error', HttpStatus.INTERNAL_SERVER_ERROR),
      );

      expect(addSpy).toHaveBeenCalledTimes(1);
    });

    test('throws an error if updateViceBankuser throws an error', async () => {
      const logger = new LoggerService();

      const tsvc = new InMemoryTaskService({
        tasks: [task1, task2, task3],
      });
      const controller = new TaskController(tsvc, vbService, logger);
      const authModel = new NoAuthModel();
      jest.spyOn(authModel, 'userId', 'get').mockReturnValue('userId');

      const request = {
        authModel,
        body: {
          taskDeposit: td1JSON,
        },
      } as unknown as METIncomingMessage;

      const currentTokens = td1.tokensEarned + user1.currentTokens;

      const addSpy = jest.spyOn(tsvc, 'addTaskDeposit');
      addSpy.mockResolvedValue({
        taskDeposit: td1,
        tokensAdded: td1.tokensEarned,
      });

      const getvbSpy = jest.spyOn(vbService, 'getViceBankUser');
      const upvbSpy = jest.spyOn(vbService, 'updateViceBankUser');
      upvbSpy.mockRejectedValue(new Error('Test Error'));

      await expect(controller.addTaskDeposit(request)).rejects.toThrow(
        new HttpException('Server Error', HttpStatus.INTERNAL_SERVER_ERROR),
      );

      expect(addSpy).toHaveBeenCalledTimes(1);

      expect(getvbSpy).toHaveBeenCalledTimes(1);
      expect(getvbSpy).toHaveBeenCalledWith(vbUserId1);

      expect(upvbSpy).toHaveBeenCalledTimes(1);
      expect(upvbSpy).toHaveBeenCalledWith(user1.copyWith({ currentTokens }));
    });
  });

  describe('updateTaskDeposit', () => {
    test('updates a taskDeposit with the TaskService', async () => {
      const logger = new LoggerService();

      const tsvc = new InMemoryTaskService({
        tasks: [task1, task2, task3],
        taskDeposits: [td1],
      });
      const controller = new TaskController(tsvc, vbService, logger);
      const authModel = new NoAuthModel();
      jest.spyOn(authModel, 'userId', 'get').mockReturnValue('userId');

      const updatedTaskDeposit = {
        ...td1JSON,
        date: td1.date.plus({ days: 1 }).toISO(),
      };

      const request = {
        authModel,
        body: {
          taskDeposit: updatedTaskDeposit,
        },
      } as unknown as METIncomingMessage;

      const upSpy = jest.spyOn(tsvc, 'updateTaskDeposit');
      upSpy.mockResolvedValue({
        taskDeposit: td1,
        tokensAdded: 0,
      });

      const getvbSpy = jest.spyOn(vbService, 'getViceBankUser');
      const upvbSpy = jest.spyOn(vbService, 'updateViceBankUser');

      const result = await controller.updateTaskDeposit(request);

      expect(result).toEqual({
        oldTaskDeposit: td1.toJSON(),
        taskDeposit: updatedTaskDeposit,
        currentTokens: user1.currentTokens,
      });

      expect(upSpy).toHaveBeenCalledTimes(1);

      expect(getvbSpy).toHaveBeenCalledTimes(1);
      expect(getvbSpy).toHaveBeenCalledWith(vbUserId1);

      expect(upvbSpy).toHaveBeenCalledTimes(1);
      expect(upvbSpy).toHaveBeenCalledWith(user1);
    });

    test('throws an error if the body is invalid', async () => {
      const logger = new LoggerService();

      const tsvc = new InMemoryTaskService({
        tasks: [task1, task2, task3],
        taskDeposits: [td1],
      });
      const controller = new TaskController(tsvc, vbService, logger);
      const authModel = new NoAuthModel();
      jest.spyOn(authModel, 'userId', 'get').mockReturnValue('userId');

      const request = {
        authModel,
      } as unknown as METIncomingMessage;

      const upSpy = jest.spyOn(tsvc, 'updateTaskDeposit');
      upSpy.mockResolvedValue({
        taskDeposit: td1,
        tokensAdded: 0,
      });

      const getvbSpy = jest.spyOn(vbService, 'getViceBankUser');
      const upvbSpy = jest.spyOn(vbService, 'updateViceBankUser');

      await expect(() => controller.updateTaskDeposit(request)).rejects.toThrow(
        new HttpException('Invalid Input', HttpStatus.BAD_REQUEST),
      );

      expect(upSpy).toHaveBeenCalledTimes(0);
      expect(getvbSpy).toHaveBeenCalledTimes(0);
      expect(upvbSpy).toHaveBeenCalledTimes(0);
    });

    test('throws an error if the body cannot be parsed', async () => {
      const logger = new LoggerService();

      const tsvc = new InMemoryTaskService({
        tasks: [task1, task2, task3],
        taskDeposits: [td1],
      });
      const controller = new TaskController(tsvc, vbService, logger);
      const authModel = new NoAuthModel();
      jest.spyOn(authModel, 'userId', 'get').mockReturnValue('userId');

      const request = {
        authModel,
        body: {
          taskDeposit: {},
        },
      } as unknown as METIncomingMessage;

      const upSpy = jest.spyOn(tsvc, 'updateTaskDeposit');
      upSpy.mockResolvedValue({
        taskDeposit: td1,
        tokensAdded: 0,
      });

      const getvbSpy = jest.spyOn(vbService, 'getViceBankUser');
      const upvbSpy = jest.spyOn(vbService, 'updateViceBankUser');

      await expect(() => controller.updateTaskDeposit(request)).rejects.toThrow(
        new HttpException('Invalid Input', HttpStatus.BAD_REQUEST),
      );

      expect(upSpy).toHaveBeenCalledTimes(0);
      expect(getvbSpy).toHaveBeenCalledTimes(0);
      expect(upvbSpy).toHaveBeenCalledTimes(0);
    });

    test('throws an error if getViceBankUser throws an error', async () => {
      const logger = new LoggerService();

      const tsvc = new InMemoryTaskService({
        tasks: [task1, task2, task3],
        taskDeposits: [td1],
      });
      const controller = new TaskController(tsvc, vbService, logger);
      const authModel = new NoAuthModel();
      jest.spyOn(authModel, 'userId', 'get').mockReturnValue('userId');

      const request = {
        authModel,
        body: {
          taskDeposit: td1JSON,
        },
      } as unknown as METIncomingMessage;

      const upSpy = jest.spyOn(tsvc, 'updateTaskDeposit');
      upSpy.mockResolvedValue({
        taskDeposit: td1,
        tokensAdded: 0,
      });

      const getvbSpy = jest.spyOn(vbService, 'getViceBankUser');
      getvbSpy.mockRejectedValue(new Error('Test Error'));
      const upvbSpy = jest.spyOn(vbService, 'updateViceBankUser');

      await expect(() => controller.updateTaskDeposit(request)).rejects.toThrow(
        new HttpException('Server Error', HttpStatus.INTERNAL_SERVER_ERROR),
      );
      expect(getvbSpy).toHaveBeenCalledTimes(1);
      expect(getvbSpy).toHaveBeenCalledWith(vbUserId1);
      expect(upSpy).toHaveBeenCalledTimes(0);
      expect(upvbSpy).toHaveBeenCalledTimes(0);
    });

    test('throws an error if updateTaskDeposit throws an error', async () => {
      const logger = new LoggerService();

      const tsvc = new InMemoryTaskService();
      const controller = new TaskController(tsvc, vbService, logger);
      const authModel = new NoAuthModel();
      jest.spyOn(authModel, 'userId', 'get').mockReturnValue('userId');

      const request = {
        authModel,
        body: {
          taskDeposit: td1JSON,
        },
      } as unknown as METIncomingMessage;

      const updateSpy = jest.spyOn(tsvc, 'updateTaskDeposit');
      updateSpy.mockRejectedValue(new Error('Test Error'));

      await expect(() => controller.updateTaskDeposit(request)).rejects.toThrow(
        new HttpException('Server Error', HttpStatus.INTERNAL_SERVER_ERROR),
      );

      expect(updateSpy).toHaveBeenCalledTimes(1);
    });

    test('throws an error if updateViceBankUser throws an error', async () => {
      const logger = new LoggerService();

      const tsvc = new InMemoryTaskService({
        tasks: [task1, task2, task3],
        taskDeposits: [td1],
      });
      const controller = new TaskController(tsvc, vbService, logger);
      const authModel = new NoAuthModel();
      jest.spyOn(authModel, 'userId', 'get').mockReturnValue('userId');

      const request = {
        authModel,
        body: {
          taskDeposit: td1JSON,
        },
      } as unknown as METIncomingMessage;

      const upSpy = jest.spyOn(tsvc, 'updateTaskDeposit');
      upSpy.mockResolvedValue({
        taskDeposit: td1,
        tokensAdded: 0,
      });

      const getvbSpy = jest.spyOn(vbService, 'getViceBankUser');
      const upvbSpy = jest.spyOn(vbService, 'updateViceBankUser');
      upvbSpy.mockRejectedValue(new Error('Test Error'));

      await expect(() => controller.updateTaskDeposit(request)).rejects.toThrow(
        new HttpException('Server Error', HttpStatus.INTERNAL_SERVER_ERROR),
      );

      expect(upSpy).toHaveBeenCalledTimes(1);

      expect(getvbSpy).toHaveBeenCalledTimes(1);
      expect(getvbSpy).toHaveBeenCalledWith(vbUserId1);

      expect(upvbSpy).toHaveBeenCalledTimes(1);
      expect(upvbSpy).toHaveBeenCalledWith(user1);
    });
  });

  describe('deleteTaskDeposit', () => {
    test('deletes a taskDeposit with the TaskService', async () => {
      const logger = new LoggerService();

      const tsvc = new InMemoryTaskService({
        tasks: [task1, task2, task3],
        taskDeposits: [td1],
      });
      const controller = new TaskController(tsvc, vbService, logger);
      const authModel = new NoAuthModel();
      jest.spyOn(authModel, 'userId', 'get').mockReturnValue('userId');

      const request = {
        authModel,
        body: {
          taskDepositId: td1.id,
        },
      } as unknown as METIncomingMessage;

      const delSpy = jest.spyOn(tsvc, 'deleteTaskDeposit');
      delSpy.mockResolvedValue({
        taskDeposit: td1,
        tokensAdded: -1,
      });

      const getvbSpy = jest.spyOn(vbService, 'getViceBankUser');
      const upvbSpy = jest.spyOn(vbService, 'updateViceBankUser');

      const result = await controller.deleteTaskDeposit(request);

      expect(result).toEqual({
        taskDeposit: td1.toJSON(),
        currentTokens: 0,
      });

      expect(delSpy).toHaveBeenCalledTimes(1);
      expect(delSpy).toHaveBeenCalledWith(td1.id);

      expect(getvbSpy).toHaveBeenCalledTimes(1);
      expect(getvbSpy).toHaveBeenCalledWith(vbUserId1);

      expect(upvbSpy).toHaveBeenCalledTimes(1);
      expect(upvbSpy).toHaveBeenCalledWith(
        user1.copyWith({ currentTokens: 0 }),
      );
    });

    test('throws an error if the body is invalid', async () => {
      const logger = new LoggerService();

      const tsvc = new InMemoryTaskService({
        tasks: [task1, task2, task3],
        taskDeposits: [td1],
      });
      const controller = new TaskController(tsvc, vbService, logger);
      const authModel = new NoAuthModel();
      jest.spyOn(authModel, 'userId', 'get').mockReturnValue('userId');

      const request = {
        authModel,
      } as unknown as METIncomingMessage;

      const delSpy = jest.spyOn(tsvc, 'deleteTaskDeposit');
      delSpy.mockResolvedValue({
        taskDeposit: td1,
        tokensAdded: -1,
      });

      const getvbSpy = jest.spyOn(vbService, 'getViceBankUser');
      const upvbSpy = jest.spyOn(vbService, 'updateViceBankUser');

      await expect(() => controller.deleteTaskDeposit(request)).rejects.toThrow(
        new HttpException('Invalid Input', HttpStatus.BAD_REQUEST),
      );

      expect(delSpy).toHaveBeenCalledTimes(0);
      expect(getvbSpy).toHaveBeenCalledTimes(0);
      expect(upvbSpy).toHaveBeenCalledTimes(0);
    });

    test('throws an error if the body cannot be parsed', async () => {
      const logger = new LoggerService();

      const tsvc = new InMemoryTaskService({
        tasks: [task1, task2, task3],
        taskDeposits: [td1],
      });
      const controller = new TaskController(tsvc, vbService, logger);
      const authModel = new NoAuthModel();
      jest.spyOn(authModel, 'userId', 'get').mockReturnValue('userId');

      const request = {
        authModel,
        body: {
          taskDepositId: 1,
        },
      } as unknown as METIncomingMessage;

      const delSpy = jest.spyOn(tsvc, 'deleteTaskDeposit');
      delSpy.mockResolvedValue({
        taskDeposit: td1,
        tokensAdded: -1,
      });

      const getvbSpy = jest.spyOn(vbService, 'getViceBankUser');
      const upvbSpy = jest.spyOn(vbService, 'updateViceBankUser');

      await expect(() => controller.deleteTaskDeposit(request)).rejects.toThrow(
        new HttpException('Invalid Input', HttpStatus.BAD_REQUEST),
      );

      expect(delSpy).toHaveBeenCalledTimes(0);
      expect(getvbSpy).toHaveBeenCalledTimes(0);
      expect(upvbSpy).toHaveBeenCalledTimes(0);
    });

    test('throws an error if deleteTaskDeposit throws an error', async () => {
      const logger = new LoggerService();

      const tsvc = new InMemoryTaskService();
      const controller = new TaskController(tsvc, vbService, logger);
      const authModel = new NoAuthModel();
      jest.spyOn(authModel, 'userId', 'get').mockReturnValue('userId');

      const request = {
        authModel,
        body: {
          taskDepositId: td1.id,
        },
      } as unknown as METIncomingMessage;

      const delSpy = jest.spyOn(tsvc, 'deleteTaskDeposit');
      delSpy.mockRejectedValue(new Error('Test Error'));

      const getvbSpy = jest.spyOn(vbService, 'getViceBankUser');
      const upvbSpy = jest.spyOn(vbService, 'updateViceBankUser');

      await expect(() => controller.deleteTaskDeposit(request)).rejects.toThrow(
        new HttpException('Server Error', HttpStatus.INTERNAL_SERVER_ERROR),
      );

      expect(delSpy).toHaveBeenCalledTimes(1);
      expect(delSpy).toHaveBeenCalledWith(td1.id);

      expect(getvbSpy).toHaveBeenCalledTimes(0);
      expect(upvbSpy).toHaveBeenCalledTimes(0);
    });

    test('throws an error if getViceBankUser throws an error', async () => {
      const logger = new LoggerService();

      const tsvc = new InMemoryTaskService({
        tasks: [task1, task2, task3],
        taskDeposits: [td1],
      });
      const controller = new TaskController(tsvc, vbService, logger);
      const authModel = new NoAuthModel();
      jest.spyOn(authModel, 'userId', 'get').mockReturnValue('userId');

      const request = {
        authModel,
        body: {
          taskDepositId: td1.id,
        },
      } as unknown as METIncomingMessage;

      const delSpy = jest.spyOn(tsvc, 'deleteTaskDeposit');
      delSpy.mockResolvedValue({
        taskDeposit: td1,
        tokensAdded: -1,
      });

      const getvbSpy = jest.spyOn(vbService, 'getViceBankUser');
      getvbSpy.mockRejectedValue(new Error('Test Error'));
      const upvbSpy = jest.spyOn(vbService, 'updateViceBankUser');

      await expect(() => controller.deleteTaskDeposit(request)).rejects.toThrow(
        new HttpException('Server Error', HttpStatus.INTERNAL_SERVER_ERROR),
      );

      expect(delSpy).toHaveBeenCalledTimes(1);

      expect(getvbSpy).toHaveBeenCalledTimes(1);
      expect(getvbSpy).toHaveBeenCalledWith(vbUserId1);
      expect(upvbSpy).toHaveBeenCalledTimes(0);
    });

    test('throws an error if updateViceBankUser throws an error', async () => {
      const logger = new LoggerService();

      const tsvc = new InMemoryTaskService({
        tasks: [task1, task2, task3],
        taskDeposits: [td1],
      });
      const controller = new TaskController(tsvc, vbService, logger);
      const authModel = new NoAuthModel();
      jest.spyOn(authModel, 'userId', 'get').mockReturnValue('userId');

      const request = {
        authModel,
        body: {
          taskDepositId: td1.id,
        },
      } as unknown as METIncomingMessage;

      const delSpy = jest.spyOn(tsvc, 'deleteTaskDeposit');
      delSpy.mockResolvedValue({
        taskDeposit: td1,
        tokensAdded: -1,
      });

      const getvbSpy = jest.spyOn(vbService, 'getViceBankUser');
      const upvbSpy = jest.spyOn(vbService, 'updateViceBankUser');
      upvbSpy.mockRejectedValue(new Error('Test Error'));

      await expect(() => controller.deleteTaskDeposit(request)).rejects.toThrow(
        new HttpException('Server Error', HttpStatus.INTERNAL_SERVER_ERROR),
      );

      expect(delSpy).toHaveBeenCalledTimes(1);

      expect(getvbSpy).toHaveBeenCalledTimes(1);
      expect(getvbSpy).toHaveBeenCalledWith(vbUserId1);

      expect(upvbSpy).toHaveBeenCalledTimes(1);
      expect(upvbSpy).toHaveBeenCalledWith(
        user1.copyWith({ currentTokens: 0 }),
      );
    });
  });
});
