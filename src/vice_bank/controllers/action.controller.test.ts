import { Request } from 'express';

import { Action, ActionJSON } from '@/src/models/vice_bank/action';
import { LoggerService } from '@/src/logger/logger.service';
import { InMemoryActionService } from '@/src/vice_bank/services/action.service.memory';
import { ActionController } from './action.controller';
import { HttpException, HttpStatus } from '@nestjs/common';

const actionJSON1: ActionJSON = {
  id: 'id1',
  vbUserId: 'userId1',
  name: 'name1',
  conversionUnit: 'conversionUnit1',
  depositsPer: 1,
  tokensPer: 1,
  minDeposit: 1,
};
const actionJSON2: ActionJSON = {
  id: 'id2',
  vbUserId: 'userId1',
  name: 'name2',
  conversionUnit: 'conversionUnit2',
  depositsPer: 2,
  tokensPer: 2,
  minDeposit: 2,
};
const actionJSON3: ActionJSON = {
  id: 'id3',
  vbUserId: 'userId3',
  name: 'name3',
  conversionUnit: 'conversionUnit3',
  depositsPer: 3,
  tokensPer: 3,
  minDeposit: 3,
};

const action1 = Action.fromJSON(actionJSON1);
const action2 = Action.fromJSON(actionJSON2);
const action3 = Action.fromJSON(actionJSON3);

describe('ActionController', () => {
  describe('getActions', () => {
    test('gets actions from the ActionsService', async () => {
      const service = new InMemoryActionService([action1, action2, action3]);
      const loggerService = new LoggerService();

      const controller = new ActionController(service, loggerService);

      const req = {
        query: {
          userId: 'userId1',
        },
      } as unknown as Request;

      const conversions = await controller.getActions(req);
      expect(conversions).toEqual({
        actions: [action1, action2],
      });
    });

    test('throws an error if the userId is not a string', async () => {
      const service = new InMemoryActionService();
      const loggerService = new LoggerService();

      const controller = new ActionController(service, loggerService);

      const req1 = {
        query: {
          userId: 1,
        },
      } as unknown as Request;

      await expect(controller.getActions(req1)).rejects.toThrow(
        new HttpException('Invalid Input', HttpStatus.BAD_REQUEST),
      );

      const req2 = {
        query: {
          userId: true,
        },
      } as unknown as Request;

      await expect(controller.getActions(req2)).rejects.toThrow(
        new HttpException('Invalid Input', HttpStatus.BAD_REQUEST),
      );
    });

    test('throws an error if getActions throws an error', async () => {
      const service = new InMemoryActionService();
      const loggerService = new LoggerService();

      const controller = new ActionController(service, loggerService);

      const req = {
        query: {
          userId: 'userId1',
        },
      } as unknown as Request;

      jest.spyOn(service, 'getActions').mockRejectedValue(new Error('Error'));

      await expect(controller.getActions(req)).rejects.toThrow(
        new HttpException('Server Error', HttpStatus.INTERNAL_SERVER_ERROR),
      );
    });
  });

  describe('addAction', () => {
    test('adds a deposit conversion using the ActionsService', async () => {
      const service = new InMemoryActionService();
      const loggerService = new LoggerService();

      const controller = new ActionController(service, loggerService);

      const req = {
        body: {
          action: actionJSON1,
        },
      } as unknown as Request;

      jest.spyOn(service, 'addAction').mockResolvedValue(action1);

      const action = await controller.addAction(req);
      expect(action).toStrictEqual({ action: action1 });
    });

    test('throws an error if the body is not a record', async () => {
      const service = new InMemoryActionService();
      const loggerService = new LoggerService();

      const controller = new ActionController(service, loggerService);

      const req = {} as unknown as Request;

      await expect(controller.addAction(req)).rejects.toThrow(
        new HttpException('Invalid Input', HttpStatus.BAD_REQUEST),
      );
    });

    test('throws an error if the body cannot be parsed', async () => {
      const service = new InMemoryActionService();
      const loggerService = new LoggerService();

      const controller = new ActionController(service, loggerService);

      const req = {
        body: {},
      } as unknown as Request;

      await expect(controller.addAction(req)).rejects.toThrow(
        new HttpException('Invalid Input', HttpStatus.BAD_REQUEST),
      );
    });

    test('throws an error if addAction throws an error', async () => {
      const service = new InMemoryActionService();
      const loggerService = new LoggerService();

      const controller = new ActionController(service, loggerService);

      const req = {
        body: {
          action: actionJSON1,
        },
      } as unknown as Request;

      jest.spyOn(service, 'addAction').mockRejectedValue(new Error('Error'));

      await expect(controller.addAction(req)).rejects.toThrow(
        new HttpException('Server Error', HttpStatus.INTERNAL_SERVER_ERROR),
      );
    });
  });

  describe('updateAction', () => {
    test('updates a deposit conversion using the ActionsService', async () => {
      const service = new InMemoryActionService([action1]);
      const loggerService = new LoggerService();

      const controller = new ActionController(service, loggerService);

      const actionUpdate = {
        ...actionJSON1,
        name: 'newName',
      };

      const req = {
        body: {
          action: actionUpdate,
        },
      } as unknown as Request;

      const result = await controller.updateAction(req);
      expect(result).toStrictEqual({ action: action1 });
      expect(service.actionsList[0]?.toJSON()).toEqual(actionUpdate);
    });

    test('throws an error if the body is not a record', async () => {
      const service = new InMemoryActionService();
      const loggerService = new LoggerService();

      const controller = new ActionController(service, loggerService);

      const req = {} as unknown as Request;

      await expect(controller.updateAction(req)).rejects.toThrow(
        new HttpException('Invalid Input', HttpStatus.BAD_REQUEST),
      );
    });

    test('throws an error if the body cannot be parsed', async () => {
      const service = new InMemoryActionService();
      const loggerService = new LoggerService();

      const controller = new ActionController(service, loggerService);

      const req = {
        body: {},
      } as unknown as Request;

      await expect(controller.updateAction(req)).rejects.toThrow(
        new HttpException('Invalid Input', HttpStatus.BAD_REQUEST),
      );
    });

    test('throws an error if updateAction throws an error', async () => {
      const service = new InMemoryActionService([action1]);
      const loggerService = new LoggerService();

      const controller = new ActionController(service, loggerService);

      const req = {
        body: {
          action: actionJSON1,
        },
      } as unknown as Request;

      jest.spyOn(service, 'updateAction').mockRejectedValue(new Error('Error'));

      await expect(controller.updateAction(req)).rejects.toThrow(
        new HttpException('Server Error', HttpStatus.INTERNAL_SERVER_ERROR),
      );
    });
  });

  describe('deleteAction', () => {
    test('deletes a deposit conversion using the ActionsService', async () => {
      const service = new InMemoryActionService([action1]);
      const loggerService = new LoggerService();

      const controller = new ActionController(service, loggerService);

      const req = {
        body: {
          actionId: action1.id,
        },
      } as unknown as Request;

      const result = await controller.deleteAction(req);
      expect(result).toStrictEqual({ action: action1 });
      expect(service.actionsList.length).toBe(0);
    });

    test('throws an error if the userId is not a string', async () => {
      const service = new InMemoryActionService();
      const loggerService = new LoggerService();

      const controller = new ActionController(service, loggerService);

      const req1 = {
        body: {
          actionId: 1,
        },
      } as unknown as Request;

      await expect(controller.deleteAction(req1)).rejects.toThrow(
        new HttpException('Invalid Input', HttpStatus.BAD_REQUEST),
      );

      const req2 = {
        body: {
          actionId: true,
        },
      } as unknown as Request;

      await expect(controller.deleteAction(req2)).rejects.toThrow(
        new HttpException('Invalid Input', HttpStatus.BAD_REQUEST),
      );
    });

    test('throws an error if deleteAction throws an error', async () => {
      const service = new InMemoryActionService([action1]);
      const loggerService = new LoggerService();

      const controller = new ActionController(service, loggerService);

      const req = {
        body: {
          actionId: action1.id,
        },
      } as unknown as Request;

      jest.spyOn(service, 'deleteAction').mockRejectedValue(new Error('Error'));

      await expect(controller.deleteAction(req)).rejects.toThrow(
        new HttpException('Server Error', HttpStatus.INTERNAL_SERVER_ERROR),
      );
    });
  });
});
