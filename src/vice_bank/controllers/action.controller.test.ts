import { Request } from 'express';

import { Action, ActionJSON } from '@/src/vice_bank/models/action';
import { LoggerService } from '@/src/logger/logger.service';
import { InMemoryActionService } from '@/src/vice_bank/services/action.service.memory';
import { ActionController } from './action.controller';
import { HttpException, HttpStatus } from '@nestjs/common';
import { Deposit, DepositJSON } from '@/src/vice_bank/models/deposit';
import {
  ViceBankUser,
  ViceBankUserJSON,
} from '@/src/vice_bank/models/vice_bank_user';
import { InMemoryViceBankUserService } from '@/src/vice_bank/services/vice_bank_user.service.memory';
import { METIncomingMessage } from '@/src/utils/met_incoming_message';
import { NoAuthModel } from '@/src/models/auth_model';

const userId = 'userId';

const vbUserId1 = 'vbUserId1';
const vbUserId2 = 'vbUserId2';
const vbUserId3 = 'vbUserId3';

const actionJSON1: ActionJSON = {
  id: 'id1',
  vbUserId: vbUserId1,
  name: 'name1',
  conversionUnit: 'conversionUnit1',
  depositsPer: 1,
  tokensPer: 1,
  minDeposit: 1,
};
const actionJSON2: ActionJSON = {
  id: 'id2',
  vbUserId: vbUserId1,
  name: 'name2',
  conversionUnit: 'conversionUnit2',
  depositsPer: 2,
  tokensPer: 2,
  minDeposit: 2,
};
const actionJSON3: ActionJSON = {
  id: 'id3',
  vbUserId: vbUserId3,
  name: 'name3',
  conversionUnit: 'conversionUnit3',
  depositsPer: 3,
  tokensPer: 3,
  minDeposit: 3,
};

const action1 = Action.fromJSON(actionJSON1);
const action2 = Action.fromJSON(actionJSON2);
const action3 = Action.fromJSON(actionJSON3);

const deposit1JSON: DepositJSON = {
  id: 'id1',
  vbUserId: vbUserId1,
  date: '2021-01-01T00:00:00.000-06:00',
  depositQuantity: 1,
  conversionRate: 1,
  actionId: action1.id,
  actionName: action1.name,
  conversionUnit: 'minutes',
};
const deposit2JSON: DepositJSON = {
  id: 'id2',
  vbUserId: vbUserId1,
  date: '2021-01-12T00:00:00.000-06:00',
  depositQuantity: 1,
  conversionRate: 1,
  actionId: action1.id,
  actionName: action1.name,
  conversionUnit: 'minutes',
};
const deposit3JSON: DepositJSON = {
  id: 'id3',
  vbUserId: vbUserId2,
  date: '2021-02-01T00:00:00.000-06:00',
  depositQuantity: 1,
  conversionRate: 1,
  actionId: action1.id,
  actionName: action1.name,
  conversionUnit: 'minutes',
};

const deposit1 = Deposit.fromJSON(deposit1JSON);
const deposit2 = Deposit.fromJSON(deposit2JSON);
const deposit3 = Deposit.fromJSON(deposit3JSON);

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

describe('ActionController', () => {
  let vbService = new InMemoryViceBankUserService([user1, user2, user3]);

  beforeEach(() => {
    vbService = new InMemoryViceBankUserService([user1, user2, user3]);
  });

  describe('getActions', () => {
    test('gets actions from the ActionsService', async () => {
      const service = new InMemoryActionService({
        actions: [action1, action2, action3],
      });
      const loggerService = new LoggerService();

      const controller = new ActionController(
        service,
        vbService,
        loggerService,
      );

      const req = {
        query: {
          userId: vbUserId1,
        },
      } as unknown as Request;

      const conversions = await controller.getActions(req);
      expect(conversions).toEqual({
        actions: [actionJSON1, actionJSON2],
      });
    });

    test('throws an error if the userId is not a string', async () => {
      const service = new InMemoryActionService();
      const loggerService = new LoggerService();

      const controller = new ActionController(
        service,
        vbService,
        loggerService,
      );

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

      const controller = new ActionController(
        service,
        vbService,
        loggerService,
      );

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
    test('adds an action using the ActionsService', async () => {
      const service = new InMemoryActionService();
      const loggerService = new LoggerService();

      const controller = new ActionController(
        service,
        vbService,
        loggerService,
      );

      const req = {
        body: {
          action: actionJSON1,
        },
      } as unknown as Request;

      jest.spyOn(service, 'addAction').mockResolvedValue(action1);

      const action = await controller.addAction(req);
      expect(action).toEqual({ action: actionJSON1 });
    });

    test('throws an error if the body is not a record', async () => {
      const service = new InMemoryActionService();
      const loggerService = new LoggerService();

      const controller = new ActionController(
        service,
        vbService,
        loggerService,
      );

      const req = {} as unknown as Request;

      await expect(controller.addAction(req)).rejects.toThrow(
        new HttpException('Invalid Input', HttpStatus.BAD_REQUEST),
      );
    });

    test('throws an error if the body cannot be parsed', async () => {
      const service = new InMemoryActionService();
      const loggerService = new LoggerService();

      const controller = new ActionController(
        service,
        vbService,
        loggerService,
      );

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

      const controller = new ActionController(
        service,
        vbService,
        loggerService,
      );

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
    test('updates an action using the ActionsService', async () => {
      const service = new InMemoryActionService({ actions: [action1] });
      const loggerService = new LoggerService();

      const controller = new ActionController(
        service,
        vbService,
        loggerService,
      );

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
      expect(result).toEqual({ action: actionJSON1 });
      expect(service.actionsList[0]?.toJSON()).toEqual(actionUpdate);
    });

    test('throws an error if the body is not a record', async () => {
      const service = new InMemoryActionService();
      const loggerService = new LoggerService();

      const controller = new ActionController(
        service,
        vbService,
        loggerService,
      );

      const req = {} as unknown as Request;

      await expect(controller.updateAction(req)).rejects.toThrow(
        new HttpException('Invalid Input', HttpStatus.BAD_REQUEST),
      );
    });

    test('throws an error if the body cannot be parsed', async () => {
      const service = new InMemoryActionService();
      const loggerService = new LoggerService();

      const controller = new ActionController(
        service,
        vbService,
        loggerService,
      );

      const req = {
        body: {},
      } as unknown as Request;

      await expect(controller.updateAction(req)).rejects.toThrow(
        new HttpException('Invalid Input', HttpStatus.BAD_REQUEST),
      );
    });

    test('throws an error if updateAction throws an error', async () => {
      const service = new InMemoryActionService({ actions: [action1] });
      const loggerService = new LoggerService();

      const controller = new ActionController(
        service,
        vbService,
        loggerService,
      );

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
    test('deletes an action using the ActionsService', async () => {
      const service = new InMemoryActionService({ actions: [action1] });
      const loggerService = new LoggerService();

      const controller = new ActionController(
        service,
        vbService,
        loggerService,
      );

      const req = {
        body: {
          actionId: action1.id,
        },
      } as unknown as Request;

      const result = await controller.deleteAction(req);
      expect(result).toEqual({ action: actionJSON1 });
      expect(service.actionsList.length).toBe(0);
    });

    test('throws an error if the userId is not a string', async () => {
      const service = new InMemoryActionService();
      const loggerService = new LoggerService();

      const controller = new ActionController(
        service,
        vbService,
        loggerService,
      );

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
      const service = new InMemoryActionService({ actions: [action1] });
      const loggerService = new LoggerService();

      const controller = new ActionController(
        service,
        vbService,
        loggerService,
      );

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

  describe('getDeposits', () => {
    test('gets deposits from the DepositService', async () => {
      const service = new InMemoryActionService({
        deposits: [deposit1, deposit2, deposit3],
      });

      const getSpy = jest.spyOn(service, 'getDeposits');

      const logger = new LoggerService();

      const controller = new ActionController(service, vbService, logger);

      const req = {
        query: {
          userId: vbUserId1,
        },
      } as unknown as Request;

      const deposits = await controller.getDeposits(req);

      expect(deposits).toEqual({ deposits: [deposit1JSON, deposit2JSON] });

      expect(getSpy).toHaveBeenCalledTimes(1);
      expect(getSpy).toHaveBeenCalledWith({
        page: 1,
        pagination: 10,
        userId: vbUserId1,
        startDate: undefined,
        endDate: undefined,
        acitonId: undefined,
      });
    });

    test('start date and end date get passed to the DepositService', async () => {
      const service = new InMemoryActionService({
        deposits: [deposit1, deposit2, deposit3],
      });
      const logger = new LoggerService();

      const controller = new ActionController(service, vbService, logger);

      const req = {
        query: {
          userId: vbUserId1,
          startDate: '2021-01-01',
          endDate: '2021-01-10',
        },
      } as unknown as Request;

      const getSpy = jest.spyOn(service, 'getDeposits');

      const deposits = await controller.getDeposits(req);

      expect(deposits).toEqual({ deposits: [deposit1.toJSON()] });

      expect(getSpy).toHaveBeenCalledTimes(1);
      expect(getSpy).toHaveBeenCalledWith({
        page: 1,
        pagination: 10,
        userId: vbUserId1,
        startDate: '2021-01-01',
        endDate: '2021-01-10',
        actionId: undefined,
      });
    });

    test('throws an error if the query is invalid', async () => {
      const service = new InMemoryActionService();
      const logger = new LoggerService();

      const controller = new ActionController(service, vbService, logger);

      const req = {
        query: 'bad',
      } as unknown as Request;

      await expect(() => controller.getDeposits(req)).rejects.toThrow(
        new HttpException('Invalid Input', HttpStatus.BAD_REQUEST),
      );
    });

    test('throws an error if the user id is invalid', async () => {
      const service = new InMemoryActionService();
      const logger = new LoggerService();

      const controller = new ActionController(service, vbService, logger);

      const req = {
        query: {
          userId: 123,
        },
      } as unknown as Request;

      await expect(() => controller.getDeposits(req)).rejects.toThrow(
        new HttpException('Invalid Input', HttpStatus.BAD_REQUEST),
      );
    });

    test('throws an error if getDeposits throws an error', async () => {
      const service = new InMemoryActionService();
      const logger = new LoggerService();

      const controller = new ActionController(service, vbService, logger);

      const req = {
        query: {
          userId: 'userId1',
        },
      } as unknown as Request;

      jest.spyOn(service, 'getDeposits').mockRejectedValue(new Error('bad'));

      await expect(() => controller.getDeposits(req)).rejects.toThrow(
        new HttpException('Server Error', HttpStatus.INTERNAL_SERVER_ERROR),
      );
    });
  });

  describe('addDeposit', () => {
    test('adds a deposit to the DepositService', async () => {
      const service = new InMemoryActionService({
        actions: [action1],
      });
      const logger = new LoggerService();

      const controller = new ActionController(service, vbService, logger);

      const authModel = new NoAuthModel();
      jest.spyOn(authModel, 'userId', 'get').mockReturnValue('userId');

      const req = {
        authModel,
        body: {
          deposit: deposit1JSON,
        },
      } as unknown as METIncomingMessage;

      jest
        .spyOn(service, 'addDeposit')
        .mockResolvedValue({ deposit: deposit1, tokensAdded: 2 });

      const deposit = await controller.addDeposit(req);

      expect(deposit).toEqual({ deposit: deposit1.toJSON(), currentTokens: 2 });
    });

    test('throws an error if the body is invalid', async () => {
      const service = new InMemoryActionService();
      const logger = new LoggerService();

      const controller = new ActionController(service, vbService, logger);

      const authModel = new NoAuthModel();
      jest.spyOn(authModel, 'userId', 'get').mockReturnValue('userId');

      const req = {
        authModel,
      } as unknown as METIncomingMessage;

      await expect(() => controller.addDeposit(req)).rejects.toThrow(
        new HttpException('Invalid Input', HttpStatus.BAD_REQUEST),
      );
    });

    test('throws an error if the body cannot be parsed', async () => {
      const service = new InMemoryActionService();
      const logger = new LoggerService();

      const controller = new ActionController(service, vbService, logger);

      const authModel = new NoAuthModel();
      jest.spyOn(authModel, 'userId', 'get').mockReturnValue('userId');

      const req = {
        authModel,
        body: {
          deposit: {},
        },
      } as unknown as METIncomingMessage;

      await expect(() => controller.addDeposit(req)).rejects.toThrow(
        new HttpException('Invalid Input', HttpStatus.BAD_REQUEST),
      );
    });

    test('throws an error if addDeposit throws an error', async () => {
      const service = new InMemoryActionService();
      const logger = new LoggerService();

      const controller = new ActionController(service, vbService, logger);

      const authModel = new NoAuthModel();
      jest.spyOn(authModel, 'userId', 'get').mockReturnValue('userId');

      const req = {
        authModel,
        body: {
          deposit: deposit1JSON,
        },
      } as unknown as METIncomingMessage;

      jest.spyOn(service, 'addDeposit').mockRejectedValue(new Error('bad'));

      await expect(() => controller.addDeposit(req)).rejects.toThrow(
        new HttpException('Server Error', HttpStatus.INTERNAL_SERVER_ERROR),
      );
    });
  });

  describe('updateDeposit', () => {
    test('updates a deposit in the DepositService', async () => {
      const service = new InMemoryActionService({
        actions: [action1],
        deposits: [deposit1],
      });
      const logger = new LoggerService();

      const controller = new ActionController(service, vbService, logger);

      const updatedDeposit = { ...deposit1JSON, depositQuantity: 2 };

      const req = {
        body: {
          deposit: updatedDeposit,
        },
      } as unknown as Request;

      const getSpy = jest.spyOn(vbService, 'getViceBankUser');
      const updateSpy = jest.spyOn(vbService, 'updateViceBankUser');

      const result = await controller.updateDeposit(req);

      expect(result.oldDeposit).toEqual(deposit1.toJSON());
      expect(result.deposit).toEqual(updatedDeposit);

      const tokenDiff =
        (updatedDeposit.depositQuantity - deposit1.depositQuantity) *
        action1.tokensPer;
      const currentTokens = user1.currentTokens + tokenDiff;

      expect(result.currentTokens).toBe(currentTokens);

      expect(service.depositsList[0]?.toJSON()).toEqual(updatedDeposit);

      expect(getSpy).toHaveBeenCalledTimes(1);
      expect(getSpy).toHaveBeenCalledWith(vbUserId1);
      expect(updateSpy).toHaveBeenCalledTimes(1);

      const userToUpdate = user1.copyWith({
        currentTokens,
      });
      expect(updateSpy).toHaveBeenCalledWith(userToUpdate);
    });

    test('throws an error if the body is invalid', async () => {
      const service = new InMemoryActionService({
        deposits: [deposit1],
      });
      const logger = new LoggerService();

      const controller = new ActionController(service, vbService, logger);

      const req = {} as unknown as Request;

      await expect(() => controller.updateDeposit(req)).rejects.toThrow(
        new HttpException('Invalid Input', HttpStatus.BAD_REQUEST),
      );
    });

    test('throws an error if the body cannot be parsed', async () => {
      const service = new InMemoryActionService({
        deposits: [deposit1],
      });
      const logger = new LoggerService();

      const controller = new ActionController(service, vbService, logger);

      const req = {
        body: {
          deposit: {},
        },
      } as unknown as Request;

      await expect(() => controller.updateDeposit(req)).rejects.toThrow(
        new HttpException('Invalid Input', HttpStatus.BAD_REQUEST),
      );
    });

    test('throws an error if updateDeposit throws an error', async () => {
      const service = new InMemoryActionService({
        deposits: [deposit1],
      });
      const logger = new LoggerService();

      const controller = new ActionController(service, vbService, logger);

      const req = {
        body: {
          deposit: deposit1JSON,
        },
      } as unknown as Request;

      jest.spyOn(service, 'updateDeposit').mockRejectedValue(new Error('bad'));

      await expect(() => controller.updateDeposit(req)).rejects.toThrow(
        new HttpException('Server Error', HttpStatus.INTERNAL_SERVER_ERROR),
      );
    });
  });

  describe('deleteDeposit', () => {
    test('deletes a deposit from the DepositService', async () => {
      const service = new InMemoryActionService({
        actions: [action1],
        deposits: [deposit1],
      });
      const logger = new LoggerService();

      const controller = new ActionController(service, vbService, logger);

      const req = {
        body: {
          depositId: deposit1.id,
        },
      } as unknown as Request;

      const getSpy = jest.spyOn(vbService, 'getViceBankUser');
      const updateSpy = jest.spyOn(vbService, 'updateViceBankUser');

      const result = await controller.deleteDeposit(req);

      expect(result.deposit).toEqual(deposit1.toJSON());

      const currentTokens = user1.currentTokens + deposit1.tokensEarned * -1;
      expect(result.currentTokens).toBe(currentTokens);

      expect(service.depositsList).toEqual([]);

      expect(getSpy).toHaveBeenCalledTimes(1);
      expect(getSpy).toHaveBeenCalledWith(vbUserId1);
      expect(updateSpy).toHaveBeenCalledTimes(1);

      const userToUpdate = user1.copyWith({
        currentTokens,
      });
      expect(updateSpy).toHaveBeenCalledWith(userToUpdate);
    });

    test('throws an error if the body is invalid', async () => {
      const service = new InMemoryActionService({
        deposits: [deposit1],
      });
      const logger = new LoggerService();

      const controller = new ActionController(service, vbService, logger);

      const req = {} as unknown as Request;

      await expect(() => controller.deleteDeposit(req)).rejects.toThrow(
        new HttpException('Invalid Input', HttpStatus.BAD_REQUEST),
      );
    });

    test('throws an error if the deposit id is not a string', async () => {
      const service = new InMemoryActionService({
        deposits: [deposit1],
      });
      const logger = new LoggerService();

      const controller = new ActionController(service, vbService, logger);

      const req = {
        body: {
          depositId: 123,
        },
      } as unknown as Request;

      await expect(() => controller.deleteDeposit(req)).rejects.toThrow(
        new HttpException('Invalid Input', HttpStatus.BAD_REQUEST),
      );
    });

    test('throws an error if deleteDeposit throws an error', async () => {
      const service = new InMemoryActionService({
        deposits: [deposit1],
      });
      const logger = new LoggerService();

      const controller = new ActionController(service, vbService, logger);

      const req = {
        body: {
          depositId: deposit1.id,
        },
      } as unknown as Request;

      jest.spyOn(service, 'deleteDeposit').mockRejectedValue(new Error('bad'));

      await expect(() => controller.deleteDeposit(req)).rejects.toThrow(
        new HttpException('Server Error', HttpStatus.INTERNAL_SERVER_ERROR),
      );
    });
  });
});
