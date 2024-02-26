import * as uuid from 'uuid';

import {
  ActionBankUser,
  ActionBankUserJSON,
} from '@/src/models/action_bank/action_bank_user';
import { InMemoryActionBankService } from './action_bank_user.service.memory';
import { isNullOrUndefined } from '@/src/utils/type_guards';

jest.mock('uuid', () => {
  const v4 = jest.fn(() => 'uuidv4');

  return {
    v4,
  };
});

const uuidv4 = uuid.v4 as jest.Mock<unknown, unknown[]>;

const user1JSON: ActionBankUserJSON = {
  id: 'id1',
  name: 'name1',
  currentTokens: 1,
};
const user2JSON: ActionBankUserJSON = {
  id: 'id2',
  name: 'name2',
  currentTokens: 2,
};
const user3JSON: ActionBankUserJSON = {
  id: 'id3',
  name: 'name3',
  currentTokens: 3,
};

const user1 = ActionBankUser.fromJSON(user1JSON);
const user2 = ActionBankUser.fromJSON(user2JSON);
const user3 = ActionBankUser.fromJSON(user3JSON);

describe('InMemoryActionBankService', () => {
  describe('actionBankUsers', () => {
    test('returns a copy of the actionBankUsers', () => {
      const service = new InMemoryActionBankService([user1, user2, user3]);

      const actionBankUsers = service.actionBankUsers;

      expect(actionBankUsers).toEqual({
        id1: user1,
        id2: user2,
        id3: user3,
      });
    });

    test('if there are no users, it returns an empty object', () => {});

    test('revising the actionBankUsers object does not revise the stored version', () => {
      const service = new InMemoryActionBankService([user1, user2, user3]);

      const actionBankUsers = service.actionBankUsers;

      delete actionBankUsers.id1;

      expect(Object.values(actionBankUsers).length).toBe(2);

      expect(service.actionBankUsers).toEqual({
        id1: user1,
        id2: user2,
        id3: user3,
      });
      expect(Object.values(service.actionBankUsers).length).toBe(3);
    });
  });

  describe('actionBankUsersList', () => {
    test('returns an array of actionBankUsers sorted by name', () => {
      const service = new InMemoryActionBankService([user3, user2, user1]);

      const list = service.actionBankUsersList;

      expect(list).toEqual([user1, user2, user3]);
    });

    test('if there are no users, it returns an empty array', () => {
      const service = new InMemoryActionBankService();

      const list = service.actionBankUsersList;

      expect(list).toEqual([]);
    });

    test('revising the actionBankUsersList array does not revise the stored version', () => {
      const service = new InMemoryActionBankService([user1, user2]);

      const list = service.actionBankUsersList;

      list.push(user3);

      expect(Object.values(service.actionBankUsers).length).toBe(2);

      list.pop();
      list.pop();

      expect(Object.values(service.actionBankUsers).length).toBe(2);
    });
  });

  describe('getActionBankUsers', () => {
    test('returns an array of all users if the pagination / page is less than total users', async () => {
      const service = new InMemoryActionBankService([user1, user2, user3]);

      const result = await service.getActionBankUsers();

      expect(result.length).toBe(3);
      expect(result.includes(user1));
      expect(result.includes(user2));
      expect(result.includes(user3));
    });

    test('returns paginated users if there are more users than pages', async () => {
      const users: ActionBankUser[] = [];

      for (let i = 4; i < 10; i++) {
        const json: ActionBankUserJSON = {
          id: `id${i}`,
          name: `name${i}`,
          currentTokens: i,
        };
        const user = ActionBankUser.fromJSON(json);
        users.push(user);
      }

      const service = new InMemoryActionBankService([
        user1,
        user2,
        user3,
        ...users,
      ]);

      const user4 = users[0];
      const user5 = users[1];

      expect(isNullOrUndefined(user4)).toBeFalsy();
      expect(isNullOrUndefined(user5)).toBeFalsy();

      const result = await service.getActionBankUsers({ pagination: 5 });

      expect(result.length).toBe(5);
      expect(result.includes(user1)).toBeTruthy();
      expect(result.includes(user2)).toBeTruthy();
      expect(result.includes(user3)).toBeTruthy();
      expect(result.includes(user4)).toBeTruthy();
      expect(result.includes(user5)).toBeTruthy();
    });

    test('goes to the proper page if a page and pagination are provided', async () => {
      const users: ActionBankUser[] = [];

      for (let i = 4; i < 10; i++) {
        const json: ActionBankUserJSON = {
          id: `id${i}`,
          name: `name${i}`,
          currentTokens: i,
        };
        const user = ActionBankUser.fromJSON(json);
        users.push(user);
      }

      const service = new InMemoryActionBankService([
        user1,
        user2,
        user3,
        ...users,
      ]);

      const user6 = users[2];
      const user7 = users[3];
      const user8 = users[4];
      const user9 = users[5];

      expect(isNullOrUndefined(user6)).toBeFalsy();
      expect(isNullOrUndefined(user7)).toBeFalsy();
      expect(isNullOrUndefined(user8)).toBeFalsy();
      expect(isNullOrUndefined(user9)).toBeFalsy();

      const result = await service.getActionBankUsers({
        pagination: 5,
        page: 2,
      });

      expect(result.includes(user6)).toBeTruthy();
      expect(result.includes(user7)).toBeTruthy();
      expect(result.includes(user8)).toBeTruthy();
      expect(result.includes(user9)).toBeTruthy();
    });

    test('returns an empty array if the page is beyond the range of users', async () => {
      const service = new InMemoryActionBankService([user1, user2, user3]);

      const result = await service.getActionBankUsers({
        page: 2,
      });

      expect(result.length).toBe(0);
    });

    test('returns a single user if an id is provided', async () => {
      const service = new InMemoryActionBankService([user1, user2, user3]);

      const result = await service.getActionBankUsers({
        userId: user1.id,
      });

      expect(result.length).toBe(1);

      expect(result[0]).toBe(user1);
    });

    test('throws an error if the single user does not exist', async () => {
      const service = new InMemoryActionBankService([user1, user2, user3]);

      const invalidId = 'invalid id';

      await expect(() =>
        service.getActionBankUsers({
          userId: invalidId,
        }),
      ).rejects.toThrow(`User with ID ${invalidId} not found`);
    });
  });

  describe('addActionBankUser', () => {
    test('adds a user and returns the user with the new id', async () => {
      const someId = 'someId';
      uuidv4.mockImplementationOnce(() => someId);

      const service = new InMemoryActionBankService([]);

      expect(service.actionBankUsersList.length).toBe(0);

      const result = await service.addActionBankUser(user1);
      expect(result.toJSON()).toEqual({
        id: someId,
        name: user1.name,
        currentTokens: user1.currentTokens,
      });

      expect(service.actionBankUsersList.length).toBe(1);
      expect(service.actionBankUsersList[0]).toBe(result);
    });
  });

  describe('updateActionBankUser', () => {
    test('replaces the user with a new user that is passed in and returns the old user', async () => {
      const service = new InMemoryActionBankService([user1, user2, user3]);

      expect(service.actionBankUsersList.length).toBe(3);

      const newUser = ActionBankUser.fromJSON({
        ...user1.toJSON(),
        currentTokens: 4,
      });

      const result = await service.updateActionBankUser(newUser);

      expect(result).toBe(newUser);
      expect(service.actionBankUsersList.length).toBe(3);
    });

    test('if the existing user does not exist, we throw an error', async () => {
      const service = new InMemoryActionBankService([user1, user2, user3]);

      const newId = 'some invalid user Id';

      const newUser = ActionBankUser.fromJSON({
        ...user1.toJSON(),
        id: newId,
      });

      await expect(() => service.updateActionBankUser(newUser)).rejects.toThrow(
        `User with ID ${newId} not found`,
      );
    });
  });

  describe('deleteActionBankUser', () => {
    test('deletes the user from the service and returns the old user', async () => {
      const service = new InMemoryActionBankService([user1, user2, user3]);

      expect(service.actionBankUsersList.length).toBe(3);
      expect(service.actionBankUsersList.includes(user1)).toBeTruthy();

      const result = await service.deleteActionBankUser(user1.id);

      expect(result).toBe(user1);
      expect(service.actionBankUsersList.length).toBe(2);
      expect(service.actionBankUsersList.includes(user1)).toBeFalsy();
    });

    test('throws an error if the id does not exist in the list of users', async () => {
      const service = new InMemoryActionBankService([user1, user2, user3]);
      expect(service.actionBankUsersList.length).toBe(3);

      const badId = 'bad id';

      await expect(() => service.deleteActionBankUser(badId)).rejects.toThrow(
        `User with ID ${badId} not found`,
      );

      expect(service.actionBankUsersList.length).toBe(3);
    });
  });
});
