import * as uuid from 'uuid';

import { Action, ActionJSON } from '@/src/models/vice_bank/action';
import { InMemoryActionService } from './action.service.memory';
import { isNullOrUndefined } from '@/src/utils/type_guards';

jest.mock('uuid', () => {
  const v4 = jest.fn(() => 'uuidv4');

  return {
    v4,
  };
});

const uuidv4 = uuid.v4 as jest.Mock<unknown, unknown[]>;

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

describe('InMemoryActionsService', () => {
  describe('actions', () => {
    test('returns a copy of the actions', () => {
      const service = new InMemoryActionService([action1, action2, action3]);

      const conversions = service.actions;

      expect(conversions).toEqual({
        id1: action1,
        id2: action2,
        id3: action3,
      });
    });

    test('if there are no actions, it returns an empty object', () => {
      const service = new InMemoryActionService();

      const conversions = service.actions;

      expect(conversions).toEqual({});
      expect(Object.values(conversions).length).toBe(0);
    });

    test('revising the actions object does not revise the stored version', () => {
      const service = new InMemoryActionService([action1, action2, action3]);

      const conversions = service.actions;

      delete conversions.id1;

      expect(Object.values(conversions).length).toBe(2);

      expect(service.actions).toEqual({
        id1: action1,
        id2: action2,
        id3: action3,
      });
      expect(Object.values(service.actions).length).toBe(3);
    });
  });

  describe('actionsList', () => {
    test('returns an array of actions sorted by name', () => {
      const service = new InMemoryActionService([action3, action2, action1]);

      const list = service.actionsList;

      expect(list.length).toBe(3);
      expect(list).toEqual([action1, action2, action3]);
    });

    test('if there are no actions, it returns an empty array', () => {
      const service = new InMemoryActionService();

      const list = service.actionsList;

      expect(list.length).toBe(0);
      expect(list).toEqual([]);
    });

    test('revising the actionsList array does not revise the stored version', () => {
      const service = new InMemoryActionService([action1, action2]);

      const list = service.actionsList;

      list.push(action3);

      expect(list.length).toBe(3);
      expect(service.actionsList).toEqual([action1, action2]);
      expect(service.actionsList.length).toBe(2);

      list.pop();
      list.pop();

      expect(list.length).toBe(1);
      expect(service.actionsList).toEqual([action1, action2]);
      expect(service.actionsList.length).toBe(2);
    });
  });

  describe('getActions', () => {
    test('returns an array of actions', async () => {
      const service = new InMemoryActionService([action1, action2, action3]);

      const result1 = await service.getActions({
        userId: 'userId1',
      });
      expect(result1.length).toBe(2);
      expect(result1).toEqual([action1, action2]);

      const result2 = await service.getActions({
        userId: 'userId3',
      });
      expect(result2.length).toBe(1);
      expect(result2).toEqual([action3]);
    });

    test('returns paginated actions if there are more conversions than the pagination', async () => {
      const conversions: Action[] = [];
      for (let i = 4; i < 10; i++) {
        conversions.push(
          Action.fromJSON({
            id: `id${i}`,
            vbUserId: 'userId1',
            name: `name${i}`,
            conversionUnit: `conversionUnit${i}`,
            depositsPer: i,
            tokensPer: i,
            minDeposit: i,
            maxDeposit: i,
          }),
        );
      }

      const service = new InMemoryActionService([
        action1,
        action2,
        action3,
        ...conversions,
      ]);

      const conversion4 = conversions[0];
      const conversion5 = conversions[1];
      const conversion6 = conversions[2];

      expect(isNullOrUndefined(conversion4)).toBeFalsy();
      expect(isNullOrUndefined(conversion5)).toBeFalsy();
      expect(isNullOrUndefined(conversion6)).toBeFalsy();

      const result = await service.getActions({
        userId: 'userId1',
        pagination: 5,
      });

      expect(result.length).toBe(5);
      expect(result).toEqual([
        action1,
        action2,
        conversion4,
        conversion5,
        conversion6,
      ]);
    });

    test('goes to the proper page if a page and pagination are provided', async () => {
      const conversions: Action[] = [];
      for (let i = 4; i < 10; i++) {
        conversions.push(
          Action.fromJSON({
            id: `id${i}`,
            vbUserId: 'userId1',
            name: `name${i}`,
            conversionUnit: `conversionUnit${i}`,
            depositsPer: i,
            tokensPer: i,
            minDeposit: i,
            maxDeposit: i,
          }),
        );
      }

      const service = new InMemoryActionService([
        action1,
        action2,
        action3,
        ...conversions,
      ]);

      const conversion7 = conversions[3];
      const conversion8 = conversions[4];
      const conversion9 = conversions[5];

      expect(isNullOrUndefined(conversion7)).toBeFalsy();
      expect(isNullOrUndefined(conversion8)).toBeFalsy();
      expect(isNullOrUndefined(conversion9)).toBeFalsy();

      const result = await service.getActions({
        userId: 'userId1',
        pagination: 5,
        page: 2,
      });

      expect(result.length).toBe(3);
      expect(result).toEqual([conversion7, conversion8, conversion9]);
    });

    test('returns an empty array if the page is beyond the range of conversions', async () => {
      const service = new InMemoryActionService([action1, action2, action3]);

      const resultA = await service.getActions({
        userId: 'userId1',
        page: 1,
      });
      expect(resultA.length).toBe(2);

      const resultB = await service.getActions({
        userId: 'userId1',
        page: 2,
      });
      expect(resultB.length).toBe(0);
    });

    test('returns an empty array if there are no conversions', async () => {
      const service = new InMemoryActionService();

      const result = await service.getActions({
        userId: 'userId1',
      });

      expect(result.length).toBe(0);
    });

    test('returns an empty array if the user has no conversions', async () => {
      const service = new InMemoryActionService([action1, action2, action3]);

      const result = await service.getActions({
        userId: 'userId15',
      });

      expect(result.length).toBe(0);
    });
  });

  describe('addAction', () => {
    test('adds a action to the actions', async () => {
      const someId = 'someId';
      uuidv4.mockImplementationOnce(() => someId);

      const service = new InMemoryActionService();
      expect(service.actionsList.length).toBe(0);

      const result = await service.addAction(action1);

      expect(result.toJSON()).toEqual({
        id: someId,
        vbUserId: action1.vbUserId,
        name: action1.name,
        conversionUnit: action1.conversionUnit,
        depositsPer: action1.depositsPer,
        tokensPer: action1.tokensPer,
        minDeposit: action1.minDeposit,
      });
      expect(service.actionsList[0]).toBe(result);
      expect(service.actionsList.length).toBe(1);
    });
  });

  describe('updateAction', () => {
    test('replaces the action with a new action and returns the old conversion', async () => {
      const service = new InMemoryActionService([action1]);

      const newConversion = Action.fromJSON({
        ...action1.toJSON(),
        maxDeposit: 100,
      });

      const result = await service.updateAction(newConversion);

      expect(result).toBe(action1);
      expect(service.actionsList[0]).toBe(newConversion);
      expect(service.actionsList.length).toBe(1);
    });

    test('throws an error if the action does not exist', async () => {
      const service = new InMemoryActionService();

      const newConversion = Action.fromJSON({
        ...action1.toJSON(),
        id: 'invalid id',
      });

      await expect(() => service.updateAction(newConversion)).rejects.toThrow(
        `Action with ID ${newConversion.id} not found`,
      );
    });
  });

  describe('deleteAction', () => {
    test('deletes the action and returns the deleted conversion', async () => {
      const service = new InMemoryActionService([action1, action2, action3]);

      expect(service.actionsList.length).toBe(3);
      expect(service.actionsList.includes(action1)).toBeTruthy();

      const result = await service.deleteAction(action1.id);

      expect(result).toBe(action1);
      expect(service.actionsList.length).toBe(2);
      expect(service.actionsList.includes(action1)).toBeFalsy();
    });

    test('throws an error if the action does not exist', async () => {
      const service = new InMemoryActionService([action1, action2, action3]);

      const badId = 'bad id';

      await expect(() => service.deleteAction(badId)).rejects.toThrow(
        `Action with ID ${badId} not found`,
      );
    });
  });
});
